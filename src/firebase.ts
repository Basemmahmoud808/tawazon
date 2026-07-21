import { initializeApp } from "firebase/app";
import { getAuth, type Auth } from "firebase/auth";
import { getFirestore, type Firestore } from "firebase/firestore";

const isConfigured =
  !!import.meta.env.VITE_FIREBASE_API_KEY &&
  import.meta.env.VITE_FIREBASE_API_KEY !== "YOUR_FIREBASE_API_KEY" &&
  import.meta.env.VITE_FIREBASE_API_KEY.startsWith("AIzaSy") &&
  !!import.meta.env.VITE_FIREBASE_AUTH_DOMAIN &&
  !import.meta.env.VITE_FIREBASE_AUTH_DOMAIN.includes("YOUR_FIREBASE_PROJECT_ID") &&
  !!import.meta.env.VITE_FIREBASE_PROJECT_ID &&
  !import.meta.env.VITE_FIREBASE_PROJECT_ID.includes("YOUR_FIREBASE_PROJECT_ID") &&
  !!import.meta.env.VITE_FIREBASE_STORAGE_BUCKET &&
  !import.meta.env.VITE_FIREBASE_STORAGE_BUCKET.includes("YOUR_FIREBASE_PROJECT_ID") &&
  !!import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID &&
  !import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID.includes("YOUR_MESSAGING_SENDER_ID") &&
  !!import.meta.env.VITE_FIREBASE_APP_ID &&
  !import.meta.env.VITE_FIREBASE_APP_ID.includes("YOUR_FIREBASE_APP_ID");

const firebaseConfig = isConfigured
  ? {
      apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
      authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
      projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
      storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
      messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
      appId: import.meta.env.VITE_FIREBASE_APP_ID,
    }
  : null;

export const isFirebaseConfigured = isConfigured;

const app = firebaseConfig ? initializeApp(firebaseConfig) : null;

// Firebase Auth
export const auth: Auth | null = app ? getAuth(app) : null;
if (auth) {
  auth.languageCode = "ar";
}

// Firestore Database (for admin user activity logs)
export const db: Firestore | null = app ? getFirestore(app) : null;

