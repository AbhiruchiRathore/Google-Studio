import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyCVwIvNC34zuWCejJs-uTrxCijC0Q7nxlk",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "rathore-rishtey.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "rathore-rishtey",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "rathore-rishtey.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "883603986537",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:883603986537:web:b36d8f1b59a041ab64aaf8",
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || "G-GFYLBBQXHG"
};

// Initialize Firebase (prevents duplicate initialization errors in Next.js/Vite)
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
export const auth = getAuth(app);
export const db = getFirestore(app);

// Secondary isolated auth instance for registering email/password users
// without triggering the primary onAuthStateChanged listener unexpectedly.
const secondaryApp =
  getApps().find((existing) => existing.name === 'signup-helper') ||
  initializeApp(firebaseConfig, 'signup-helper');
export const secondaryAuth = getAuth(secondaryApp);
export const secondaryDb = getFirestore(secondaryApp);
