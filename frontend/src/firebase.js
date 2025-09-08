// Import the functions you need from the SDKs
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyCKBhI2f6W-u3UcOE1BdCvoAJoauboF1_U",
  authDomain: "swap-chat-4d21c.firebaseapp.com",
  projectId: "swap-chat-4d21c",
  storageBucket: "swap-chat-4d21c.appspot.com", // 👈 small fix here (use .appspot.com)
  messagingSenderId: "905071243934",
  appId: "1:905071243934:web:1f8226170896658696c18f",
  measurementId: "G-4E5MNVTGVH"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Export Firestore and Auth for use in your app
export const db = getFirestore(app);
export const auth = getAuth(app);