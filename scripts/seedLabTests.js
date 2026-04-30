const admin = require('firebase-admin');

// NOTE: You must provide a valid serviceAccountKey.json downloaded from Firebase Console
// for this script to work.
let serviceAccount;
try {
  serviceAccount = require('./serviceAccountKey.json');
} catch (error) {
  console.error("Please place 'serviceAccountKey.json' in the scripts folder.");
  process.exit(1);
}

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

const dummyTests = [
  {
    name: "Complete Blood Count (CBC)",
    category: "Hematology",
    description: "Evaluates overall health and detects a wide range of disorders, including anemia, infection and leukemia.",
    basePrice: 350,
    tags: ["Routine", "Blood"]
  },
  {
    name: "Lipid Profile",
    category: "Cardiology",
    description: "Checks levels of cholesterol and triglycerides to assess risk of cardiovascular disease.",
    basePrice: 600,
    tags: ["Heart", "Cholesterol"]
  },
  {
    name: "Thyroid Profile (T3, T4, TSH)",
    category: "Endocrinology",
    description: "Evaluates thyroid gland function and helps diagnose thyroid disorders.",
    basePrice: 800,
    tags: ["Thyroid", "Hormones"]
  },
  {
    name: "HbA1c (Glycosylated Hemoglobin)",
    category: "Diabetology",
    description: "Measures average blood sugar levels over the past 2-3 months.",
    basePrice: 400,
    tags: ["Diabetes", "Blood Sugar"]
  },
  {
    name: "Liver Function Test (LFT)",
    category: "Gastroenterology",
    description: "Checks how well the liver is working by measuring levels of proteins, liver enzymes, and bilirubin.",
    basePrice: 700,
    tags: ["Liver", "Enzymes"]
  }
];

async function seedData() {
  console.log("Seeding dummy lab tests...");
  const batch = db.batch();
  
  for (const test of dummyTests) {
    const docRef = db.collection('labTests').doc();
    batch.set(docRef, {
      ...test,
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    });
  }
  
  await batch.commit();
  console.log("Seeding complete!");
  process.exit(0);
}

seedData();
