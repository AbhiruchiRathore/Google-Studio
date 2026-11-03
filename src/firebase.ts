import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyCVwIvNC34zuWCejJs-uTrxCijC0Q7nxlk",
  authDomain: "rathore-rishtey.firebaseapp.com",
  projectId: "rathore-rishtey",
  storageBucket: "rathore-rishtey.firebasestorage.app",
  messagingSenderId: "883603986537",
  appId: "1:883603986537:web:b36d8f1b59a041ab64aaf8",
  measurementId: "G-GFYLBBQXHG"
};

// Initialize Firebase (prevents duplicate initialization errors in Next.js/Vite)
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
export const auth = getAuth(app);
