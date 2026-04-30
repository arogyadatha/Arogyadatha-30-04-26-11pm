import { db } from './firebase';
import { collection, doc, setDoc, serverTimestamp, getDocs, query, where } from 'firebase/firestore';

const defaultTests = [
  {
    testName: 'Complete Blood Count (CBC)',
    category: 'Blood Tests',
    parameters: '28 parameters',
    price: 300,
    duration: '6 hours',
    method: 'Automated Analyzer'
  },
  {
    testName: 'Lipid Profile',
    category: 'Blood Tests',
    parameters: '8 parameters',
    price: 450,
    duration: '1 day',
    method: 'ELISA'
  },
  {
    testName: 'Blood Sugar Fasting',
    category: 'Blood Tests',
    parameters: '1 parameter',
    price: 150,
    duration: '2 hours',
    method: 'Glucose Oxidase'
  },
  {
    testName: 'HbA1c',
    category: 'Blood Tests',
    parameters: '1 parameter',
    price: 500,
    duration: '1 day',
    method: 'HPLC'
  },
  {
    testName: 'Kidney Function Test (KFT)',
    category: 'Blood Tests',
    parameters: '6 parameters',
    price: 400,
    duration: '6 hours',
    method: 'Automated'
  }
];

const defaultMedicines = [
  {
    medicineName: 'Paracetamol 500mg',
    composition: 'Acetaminophen 500mg',
    mrp: 50,
    manufacturer: 'GSK'
  },
  {
    medicineName: 'Cetirizine 10mg',
    composition: 'Cetirizine HCl 10mg',
    mrp: 100,
    manufacturer: 'Cipla'
  },
  {
    medicineName: 'Azithromycin 500mg',
    composition: 'Azithromycin 500mg',
    mrp: 250,
    manufacturer: 'Sun Pharma'
  }
];

export async function seedLabTests(labId: string) {
  for (const test of defaultTests) {
    const testId = test.testName.toLowerCase().replace(/\s/g, '_');
    await setDoc(
      doc(db, 'labs', labId, 'tests', testId),
      {
        ...test,
        createdAt: serverTimestamp()
      }
    );
  }
  console.log(`✅ Default tests added to lab: ${labId}`);
}

export async function seedPharmacyMedicines(pharmacyId: string) {
  for (const medicine of defaultMedicines) {
    const medId = medicine.medicineName.toLowerCase().replace(/\s/g, '_');
    await setDoc(
      doc(db, 'pharmacies', pharmacyId, 'medicines', medId),
      {
        ...medicine,
        createdAt: serverTimestamp()
      }
    );
  }
  console.log(`✅ Default medicines added to pharmacy: ${pharmacyId}`);
}

export async function seedAllLabsAndPharmacies() {
  const usersRef = collection(db, 'users');
  
  // 1. Ensure at least some labs exist
  const labsQuery = query(usersRef, where('role', '==', 'lab'));
  const labSnap = await getDocs(labsQuery);
  
  if (labSnap.empty) {
    console.log("No labs found, creating dummy labs...");
    const dummyLabs = [
      { uid: 'lab_dummy_1', fullName: 'Guntur City Lab', labName: 'Guntur City Lab', role: 'lab', city: 'Guntur', email: 'lab1@test.com' },
      { uid: 'lab_dummy_2', fullName: 'Apollo Diagnostics', labName: 'Apollo Diagnostics', role: 'lab', city: 'Guntur', email: 'lab2@test.com' }
    ];
    for (const lab of dummyLabs) {
      await setDoc(doc(db, 'users', lab.uid), { ...lab, createdAt: serverTimestamp() });
      await seedLabTests(lab.uid);
    }
  } else {
    for (const labDoc of labSnap.docs) {
      await seedLabTests(labDoc.id);
    }
  }

  // 2. Ensure at least some pharmacies exist
  const pharmacyQuery = query(usersRef, where('role', '==', 'pharmacy'));
  const pharmacySnap = await getDocs(pharmacyQuery);
  
  if (pharmacySnap.empty) {
    console.log("No pharmacies found, creating dummy pharmacies...");
    const dummyPharmas = [
      { uid: 'pharm_dummy_1', fullName: 'HealthFirst Pharmacy', pharmacyName: 'HealthFirst Pharmacy', role: 'pharmacy', city: 'Guntur', email: 'pharm1@test.com' },
      { uid: 'pharm_dummy_2', fullName: 'MedPlus Store', pharmacyName: 'MedPlus Store', role: 'pharmacy', city: 'Guntur', email: 'pharm2@test.com' }
    ];
    for (const pharm of dummyPharmas) {
      await setDoc(doc(db, 'users', pharm.uid), { ...pharm, createdAt: serverTimestamp() });
      await seedPharmacyMedicines(pharm.uid);
    }
  } else {
    for (const pharmDoc of pharmacySnap.docs) {
      await seedPharmacyMedicines(pharmDoc.id);
    }
  }
}
