// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyBLZml1BxnYdqjWgXGYERNVqGQa5IdD_LE",
  authDomain: "nuva-app-e5c42.firebaseapp.com",
  projectId: "nuva-app-e5c42",
  storageBucket: "nuva-app-e5c42.firebasestorage.app",
  messagingSenderId: "947823294964",
  appId: "1:947823294964:web:a840b284716ececb3e21a1",
  measurementId: "G-SME23BFFV1"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);
export const analytics = getAnalytics(app);

export default app;