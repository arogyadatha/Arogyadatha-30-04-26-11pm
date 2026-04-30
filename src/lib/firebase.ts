import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyD5sTxlmdPFr2qjms3uganXKdgjizTlPpk",
  authDomain: "arogyadatha-app.firebaseapp.com",
  projectId: "arogyadatha-app",
  storageBucket: "arogyadatha-app.firebasestorage.app",
  messagingSenderId: "543960283236",
  appId: "1:543960283236:web:9dc3311071bb7454f78771",
  measurementId: "G-XPKY2DEWER"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
export const googleProvider = new GoogleAuthProvider();

export default app;
