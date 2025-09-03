import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyBhJqpSqM9FeikBFGYVF__RZUwo8Phu1GY",
  authDomain: "macfashion.firebaseapp.com",
  projectId: "macfashion",
  storageBucket: "macfashion.firebasestorage.app",
  messagingSenderId: "499167712149",
  appId: "1:499167712149:web:8449a30e4352c642fddc9c",
  measurementId: "G-H87MFL60DW"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
