import express from 'express';
import cors from 'cors';
import fs from 'fs';
import admin from 'firebase-admin';

const app = express();
app.use(cors());
app.use(express.json());

let isFirebaseAdminInitialized = false;

try {
    if (fs.existsSync('./serviceAccountKey.json')) {
        const serviceAccount = JSON.parse(fs.readFileSync('./serviceAccountKey.json', 'utf8'));
        admin.initializeApp({
            credential: admin.credential.cert(serviceAccount)
        });
        isFirebaseAdminInitialized = true;
        console.log("✅ Firebase Admin successfully initialized using serviceAccountKey.json");
    } else {
        console.warn("⚠️ WARNING: serviceAccountKey.json not found! Auth deletion will not work without it.");
    }
} catch (e) {
    console.error("❌ Error initializing Firebase Admin:", e);
}

app.post('/api/delete-users', async (req, res) => {
    const { uids } = req.body;
    
    if (!isFirebaseAdminInitialized) {
        return res.status(500).json({ 
            error: "Firebase Admin is not configured. Please download serviceAccountKey.json from Firebase Console -> Project Settings -> Service Accounts, and place it in the project root." 
        });
    }

    if (!uids || !Array.isArray(uids) || uids.length === 0) {
        return res.status(400).json({ error: 'No UIDs provided' });
    }

    try {
        console.log(`Attempting to delete ${uids.length} users from Authentication...`);
        const result = await admin.auth().deleteUsers(uids);
        
        console.log(`Successfully deleted ${result.successCount} users.`);
        if (result.failureCount > 0) {
            console.warn(`Failed to delete ${result.failureCount} users. Errors:`, result.errors);
        }
        
        res.json({ success: true, message: `Deleted ${result.successCount} users from Auth.`, failures: result.failureCount });
    } catch (error) {
        console.error("Firebase Admin Deletion Error:", error);
        res.status(500).json({ error: error.message });
    }
});

app.get('/api/list-auth-users', async (req, res) => {
    if (!isFirebaseAdminInitialized) {
        return res.status(500).json({ 
            error: "Firebase Admin is not configured. Please download serviceAccountKey.json from Firebase Console -> Project Settings -> Service Accounts, and place it in the project root." 
        });
    }

    try {
        console.log("Fetching all users from Firebase Authentication...");
        const userRecords = [];
        let nextPageToken;

        // Fetch users in batches
        do {
            const listUsersResult = await admin.auth().listUsers(1000, nextPageToken);
            userRecords.push(...listUsersResult.users.map(user => ({
                uid: user.uid,
                email: user.email,
                displayName: user.displayName,
                photoURL: user.photoURL,
                lastSignInTime: user.metadata.lastSignInTime,
                creationTime: user.metadata.creationTime,
                disabled: user.disabled
            })));
            nextPageToken = listUsersResult.pageToken;
        } while (nextPageToken);

        console.log(`Successfully fetched ${userRecords.length} users from Auth.`);
        res.json({ success: true, users: userRecords });
    } catch (error) {
        console.error("Error listing auth users:", error);
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/bulk-upload', async (req, res) => {
    const { data, targetTab } = req.body;

    if (!isFirebaseAdminInitialized) {
        return res.status(500).json({ error: "Firebase Admin not configured." });
    }

    if (!data || !Array.isArray(data) || !targetTab) {
        return res.status(400).json({ error: "Invalid data or targetTab." });
    }

    const db = admin.firestore();
    const auth = admin.auth();
    const results = { created: 0, updated: 0, errors: [] };

    try {
        console.log(`Starting bulk upload for ${data.length} ${targetTab}...`);

        // 1. Setup Counter Transaction to get starting point
        const counterRef = db.collection('counters').doc('stats'); // Defaulting to 'stats' or whatever exists
        // Check if stats exists, if not use the first one
        const countersSnap = await db.collection('counters').limit(1).get();
        const activeCounterRef = !countersSnap.empty ? countersSnap.docs[0].ref : counterRef;

        const resultBatch = await db.runTransaction(async (transaction) => {
            const counterDoc = await transaction.get(activeCounterRef);
            let currentCount = 0;
            const counterField = `${targetTab}Count`;

            if (counterDoc.exists) {
                currentCount = counterDoc.data()[counterField] || 0;
            } else {
                transaction.set(activeCounterRef, { [counterField]: 0 });
            }

            const processedItems = [];
            let newItemsCount = 0;

            for (const record of data) {
                const email = String(record.email || record.Email || record["Email Address"] || "").toLowerCase().trim();
                if (!email) continue;

                const codeField = targetTab === 'hospitals' ? 'hospitalCode' : targetTab === 'doctors' ? 'regNumber' : 'licenseNumber';
                const codeValue = record[codeField] || record["Hospital Code"] || record["Registration Number"] || record["License #"];

                // Check for existing by email (Primary)
                const existingByEmail = await db.collection(targetTab).where('email', '==', email).limit(1).get();
                let existingDoc = existingByEmail.empty ? null : existingByEmail.docs[0];

                // Check for existing by code (Secondary) if not found by email
                if (!existingDoc && codeValue) {
                    const existingByCode = await db.collection(targetTab).where(codeField, '==', codeValue).limit(1).get();
                    if (!existingByCode.empty) existingDoc = existingByCode.docs[0];
                }

                if (existingDoc) {
                    // Update Logic
                    const existingData = existingDoc.data();
                    const updates = {};
                    
                    // Only update if current data is empty/null
                    Object.keys(record).forEach(key => {
                        if (!existingData[key] || existingData[key] === "") {
                            updates[key] = record[key];
                        }
                    });

                    if (Object.keys(updates).length > 0) {
                        transaction.update(existingDoc.ref, { ...updates, updatedAt: admin.firestore.FieldValue.serverTimestamp() });
                        results.updated++;
                    }
                } else {
                    // Create New Logic
                    newItemsCount++;
                    const sequentialId = currentCount + newItemsCount;
                    const prefix = targetTab === 'hospitals' ? 'HOS' : targetTab === 'doctors' ? 'DOC' : targetTab === 'labs' ? 'LAB' : 'PHA';
                    const arogyadathaId = `${prefix}-${String(sequentialId).padStart(3, '0')}`;
                    
                    processedItems.push({
                        email,
                        record,
                        arogyadathaId
                    });
                }
            }

            // Update global counter
            transaction.update(activeCounterRef, { [counterField]: admin.firestore.FieldValue.increment(newItemsCount) });
            return processedItems;
        });

        // 2. Process Auth and Final Storage outside transaction for speed
        const batch = db.batch();
        for (const item of resultBatch) {
            try {
                // Check if user already exists in Auth
                let userRecord;
                try {
                    userRecord = await auth.getUserByEmail(item.email);
                } catch (e) {
                    // Create new user if not found
                    const rawName = (item.record.hospitalName || item.record.fullName || item.record.labName || item.record.pharmacyName || 'User').split(' ')[0].replace(/[^a-zA-Z]/g, '');
                    userRecord = await auth.createUser({
                        email: item.email,
                        password: `${rawName}@123`,
                        displayName: item.record.hospitalName || item.record.fullName
                    });
                }

                const uid = userRecord.uid;
                const role = targetTab.slice(0, -1);
                
                const finalPayload = {
                    ...item.record,
                    uid,
                    hospitalId: uid, // for legacy support
                    arogyadathaId: item.arogyadathaId,
                    role,
                    isActive: true,
                    isVerified: true,
                    visibility: 'active',
                    createdAt: admin.firestore.FieldValue.serverTimestamp(),
                    updatedAt: admin.firestore.FieldValue.serverTimestamp()
                };

                // Split departments if string
                if (typeof finalPayload.departments === 'string') {
                    finalPayload.departments = finalPayload.departments.split(',').map(d => d.trim()).filter(Boolean);
                }

                batch.set(db.collection('users').doc(uid), { 
                    uid, 
                    email: item.email, 
                    fullName: finalPayload.hospitalName || finalPayload.fullName, 
                    role, 
                    arogyadathaId: item.arogyadathaId, 
                    createdAt: admin.firestore.FieldValue.serverTimestamp() 
                });
                
                batch.set(db.collection(targetTab).doc(uid), finalPayload);
                results.created++;
            } catch (err) {
                console.error(`Error processing ${item.email}:`, err);
                results.errors.push({ email: item.email, error: err.message });
            }
        }

        await batch.commit();
        res.json({ success: true, ...results });

    } catch (error) {
        console.error("Bulk Upload Master Error:", error);
        res.status(500).json({ error: error.message });
    }
});

app.listen(3001, () => {
    console.log('✅ Local Admin API running on http://localhost:3001');
    console.log('Listening for Auth Deletion requests from AdminDashboard...');
});
