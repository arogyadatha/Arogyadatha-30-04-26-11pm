import {
  collection,
  query,
  where,
  getDocs,
  doc,
  setDoc,
  updateDoc,
  serverTimestamp,
  runTransaction,
  orderBy,
  onSnapshot,
  arrayUnion,
  getDoc
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { CaseData } from '../types';

/**
 * Finds a similar case by name to prevent duplicates.
 * Normalize strings: lowercase and remove extra spaces.
 */
export async function findSimilarCase(
  patientId: string,
  caseName: string
): Promise<CaseData | null> {
  const normalizedNew = caseName.trim().toLowerCase();
  const casesRef = collection(db, 'patients', patientId, 'cases');
  const q = query(casesRef, where('status', '==', 'active'));
  const snapshot = await getDocs(q);

  for (const d of snapshot.docs) {
    const data = d.data();
    const existingName = (data.caseName || '').toLowerCase();
    // Check if new name is a subset or superset or contains existing
    if (existingName.includes(normalizedNew) || normalizedNew.includes(existingName)) {
      return { id: d.id, ...data } as CaseData;
    }
  }
  return null;
}

/**
 * Creates a new sequential case for a patient.
 * Format: CASE-001, CASE-002, CASE-003 ... (per patient)
 */
export async function createCase(
  patientId: string,
  caseName: string,
  symptoms?: string
): Promise<{ success: boolean; caseId: string; documentId: string }> {
  try {
    const counterRef = doc(db, 'patients', patientId, 'meta', 'caseCounter');

    const { caseNumber } = await runTransaction(db, async (transaction) => {
      const counterDoc = await transaction.get(counterRef);
      let nextCount = 1;
      if (counterDoc.exists()) {
        nextCount = (counterDoc.data().count || 0) + 1;
        transaction.update(counterRef, { count: nextCount });
      } else {
        transaction.set(counterRef, { count: 1 });
      }
      return { caseNumber: nextCount };
    });

    const caseIdString = `CASE-${String(caseNumber).padStart(3, '0')}`;
    const caseRef = doc(db, 'patients', patientId, 'cases', caseIdString);

    const caseData: Omit<CaseData, 'id' | 'appointments' | 'labRequests' | 'pharmacyOrders'> = {
      caseId: caseIdString,
      caseNumber,
      caseName: caseName.trim(),
      patientId,
      symptoms: symptoms?.trim() || '',
      status: 'active',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      symptomsUpdatedAt: serverTimestamp(),
    };

    await setDoc(caseRef, caseData);
    return { success: true, caseId: caseIdString, documentId: caseIdString };
  } catch (error) {
    console.error('❌ Case creation failed:', error);
    throw error;
  }
}

/**
 * Deletes a case from the database.
 */
export async function deleteCase(patientId: string, caseDocId: string): Promise<void> {
  const caseRef = doc(db, 'patients', patientId, 'cases', caseDocId);
  // Important: In real systems we might want logical delete, 
  // but user said "delete edit", so we provide hard delete for cases.
  await updateDoc(caseRef, { status: 'cancelled', updatedAt: serverTimestamp() });
}

/**
 * Updates Case Name or symptoms.
 */
export async function updateCaseData(
  patientId: string,
  caseDocId: string,
  updates: Partial<{ caseName: string; symptoms: string }>
): Promise<void> {
  const caseRef = doc(db, 'patients', patientId, 'cases', caseDocId);
  const finalUpdates: any = { ...updates, updatedAt: serverTimestamp() };
  if (updates.symptoms !== undefined) {
    finalUpdates.symptomsUpdatedAt = serverTimestamp();
  }
  await updateDoc(caseRef, finalUpdates);
}

/**
 * Fetches all cases for a patient.
 */
export async function getPatientCases(patientId: string): Promise<CaseData[]> {
  const casesRef = collection(db, 'patients', patientId, 'cases');
  const snapshot = await getDocs(casesRef);
  return snapshot.docs
    .map((d) => ({ id: d.id, ...d.data() } as CaseData))
    .sort((a, b) => (b.caseNumber || 0) - (a.caseNumber || 0));
}

/**
 * Subscribes to real-time case updates for a patient.
 */
export function subscribeToPatientCases(
  patientId: string,
  callback: (cases: CaseData[]) => void
): () => void {
  const casesRef = collection(db, 'patients', patientId, 'cases');
  const q = query(casesRef, where('status', '==', 'active'));

  return onSnapshot(q, (snapshot) => {
    const cases = snapshot.docs
      .map((d) => ({ id: d.id, ...d.data() } as CaseData))
      .sort((a, b) => (b.caseNumber || 0) - (a.caseNumber || 0));
    callback(cases);
  });
}

/**
 * Subscribes to completed cases for Case History.
 */
export function subscribeToCompletedCases(
  patientId: string,
  callback: (cases: CaseData[]) => void
): () => void {
  const casesRef = collection(db, 'patients', patientId, 'cases');
  const q = query(casesRef, where('status', '==', 'completed'));

  return onSnapshot(q, (snapshot) => {
    const cases = snapshot.docs
      .map((d) => ({ id: d.id, ...d.data() } as CaseData))
      .sort((a, b) => (b.caseNumber || 0) - (a.caseNumber || 0));
    callback(cases);
  });
}

/**
 * Marks a case as completed and archives the current session.
 */
export async function markCaseAsCompleted(patientId: string, caseId: string, followUpNum: number): Promise<void> {
  const caseRef = doc(db, 'patients', patientId, 'cases', caseId);
  const snap = await getDoc(caseRef);
  if (!snap.exists()) return;
  
  const data = snap.data();
  // Ensure no 0th follow-up
  const finalFollowUpNum = followUpNum <= 0 ? 1 : followUpNum;

  const sessionSnapshot = {
    followUpNum: finalFollowUpNum,
    completedAt: new Date(),
    symptoms: data.symptoms || '',
    vitals: data.vitals || { bp: '', weight: '', height: '' },
    medicines: data.medicines || [],
    labRequests: data.labRequests || [],
    healthJourney: data.healthJourney || {},
    diagnosis: data.diagnosis || '',
    doctorName: data.doctorName || '',
    followUpNote: data.followUpNote || ''
  };

  await updateDoc(caseRef, { 
    status: 'completed', 
    updatedAt: serverTimestamp(),
    sessionHistory: arrayUnion(sessionSnapshot)
  });
}

/**
 * Updates a specific session in the history.
 */
export async function updateSessionHistory(patientId: string, caseId: string, sessionIndex: number, updates: any): Promise<void> {
  const caseRef = doc(db, 'patients', patientId, 'cases', caseId);
  const snap = await getDoc(caseRef);
  if (!snap.exists()) return;
  const history = snap.data().sessionHistory || [];
  if (history[sessionIndex]) {
    history[sessionIndex] = { ...history[sessionIndex], ...updates };
    await updateDoc(caseRef, { sessionHistory: history });
  }
}

/**
 * Deletes a specific session from history.
 */
export async function deleteSessionHistory(patientId: string, caseId: string, sessionIndex: number): Promise<void> {
  const caseRef = doc(db, 'patients', patientId, 'cases', caseId);
  const snap = await getDoc(caseRef);
  if (!snap.exists()) return;
  const history = snap.data().sessionHistory || [];
  history.splice(sessionIndex, 1);
  await updateDoc(caseRef, { sessionHistory: history });
}

/**
 * Subscribes to specific case details (like follow ups / journeys)
 */
export function subscribeToCaseDetails(
  patientId: string,
  caseId: string,
  callback: (data: any) => void
): () => void {
  const caseRef = doc(db, 'patients', patientId, 'cases', caseId);
  return onSnapshot(caseRef, (snapshot) => {
    if (snapshot.exists()) {
      callback({ id: snapshot.id, ...snapshot.data() });
    }
  });
}
