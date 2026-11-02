import { initializeApp } from "firebase/app";
import { getAuth, type Auth } from "firebase/auth";
import { getFirestore, type Firestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyC_r1TovTlWjUKiY_8RV5o8Xh1DlD_OFDA",
  authDomain: "tawazan-1ec87.firebaseapp.com",
  projectId: "tawazan-1ec87",
  storageBucket: "tawazan-1ec87.firebasestorage.app",
  messagingSenderId: "246981284629",
  appId: "1:246981284629:web:9cc95d7413a43faca3cf1c",
};

const isConfigured =
  firebaseConfig.apiKey.startsWith("AIzaSy") &&
  !firebaseConfig.authDomain.includes("YOUR_FIREBASE_PROJECT_ID");

export const isFirebaseConfigured = isConfigured;

const app = initializeApp(firebaseConfig);

// Firebase Auth
export const auth: Auth | null = app ? getAuth(app) : null;
if (auth) {
  auth.languageCode = "ar";
}

// Firestore Database (for admin user activity logs)
export const db: Firestore | null = app ? getFirestore(app) : null;
