// src/firebaseConfig.js
// Firebase Web SDK configuration for Bachelor's Bite
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';

// ====================================================================
// 🔑 FIREBASE API KEY & CONFIGURATION (PASTE YOUR API KEY ON LINE 10)
// ====================================================================
const firebaseConfig = {
  apiKey: "AIzaSyCSd-ejb82ej2VDI6PpHomRnZ3AFLTCEj0", // <-- [LINE 10: PASTE YOUR FIREBASE API KEY HERE]
  authDomain: "bachelor-bite-2619d.firebaseapp.com",
  projectId: "bachelor-bite-2619d",
  storageBucket: "bachelor-bite-2619d.firebasestorage.app",
  messagingSenderId: "717778624787",
  appId: "1:717778624787:web:bfc46dc256b15a4d6bbae6"
};

// ====================================================================
// 👤 USER REGISTRATION & AUTHENTICATION VARIABLES SCHEMA
// ====================================================================
export const userCredentials = {
  name: "",         // Stores User's Full Name (e.g. "John Doe")
  emailId: "",      // Stores User's Email Address (e.g. "john@example.com")
  password: "",     // Stores User's Password
  phoneNumber: ""   // Stores User's Phone Number (e.g. "+91 98765 43210")
};

// Initialize Firebase (guard against duplicate initialization)
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
const auth = getAuth(app);

export { app, auth, firebaseConfig };
export default app;

