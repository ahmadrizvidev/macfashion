import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyBhJqpSqM9FeikBFGYVF__RZUwo8Phu1GY",
  authDomain: "macfashion.firebaseapp.com",
  projectId: "macfashion",
  storageBucket: "macfashion.firebasestorage.app",
  messagingSenderId: "499167712149",
  appId: "1:499167712149:web:8449a30e4352c642fddc9c",
  measurementId: "G-H87MFL60DW"
};

// ✅ Prevent re-init in Next.js
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

// ✅ Firestore + Auth
const db = getFirestore(app);
const auth = getAuth(app);

// ✅ Export both
export { app, db, auth };
