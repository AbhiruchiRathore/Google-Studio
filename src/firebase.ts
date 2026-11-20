import { initializeApp, getApps, getApp, FirebaseApp } from "firebase/app";
import "firebase/auth";
import "firebase/firestore";
import { getAuth, initializeAuth, browserLocalPersistence, Auth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import firebaseConfig from "../firebase-applet-config.json";

function initSafeAuth(firebaseApp: FirebaseApp): Auth {
  try {
    return getAuth(firebaseApp);
  } catch {
    return initializeAuth(firebaseApp, {
      persistence: browserLocalPersistence,
    });
  }
}

// Initialize Firebase using the provisioned firebase-applet-config.json and named Firestore databaseId
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
export const auth = initSafeAuth(app);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);

// Secondary isolated auth instance for registering email/password users
// without triggering the primary onAuthStateChanged listener unexpectedly.
const secondaryApp =
  getApps().find((existing) => existing.name === 'signup-helper') ||
  initializeApp(firebaseConfig, 'signup-helper');
export const secondaryAuth = initSafeAuth(secondaryApp);
export const secondaryDb = getFirestore(secondaryApp, firebaseConfig.firestoreDatabaseId);
