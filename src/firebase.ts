import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// Check if environment variables are present and not placeholder values
const isEnvValid = 
  import.meta.env.VITE_FIREBASE_API_KEY && 
  import.meta.env.VITE_FIREBASE_API_KEY !== "YOUR_FIREBASE_API_KEY" &&
  import.meta.env.VITE_FIREBASE_API_KEY.startsWith("AIzaSy");

const firebaseConfig = {
  apiKey: isEnvValid 
    ? import.meta.env.VITE_FIREBASE_API_KEY 
    : "AIzaSyFakeKeyJustForInitializingApp12345",
  authDomain: isEnvValid 
    ? import.meta.env.VITE_FIREBASE_AUTH_DOMAIN 
    : "tawazon-app.firebaseapp.com",
  projectId: isEnvValid 
    ? import.meta.env.VITE_FIREBASE_PROJECT_ID 
    : "tawazon-app",
  storageBucket: isEnvValid 
    ? import.meta.env.VITE_FIREBASE_STORAGE_BUCKET 
    : "tawazon-app.appspot.com",
  messagingSenderId: isEnvValid 
    ? import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID 
    : "123456789012",
  appId: isEnvValid 
    ? import.meta.env.VITE_FIREBASE_APP_ID 
    : "1:123456789012:web:1234567890123456789012",
};

// Initialize Firebase app safely
const app = initializeApp(firebaseConfig);

// Firebase Auth
export const auth = getAuth(app);
auth.languageCode = "ar";

// Firestore Database (for admin user activity logs)
export const db = getFirestore(app);

