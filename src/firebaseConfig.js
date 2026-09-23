// src/firebaseConfig.js
// Firebase Web SDK configuration for Bachelor's Bite
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';

const firebaseConfig = {
  apiKey: "AIzaSyCSd-ejb82ej2VDI6PpHomRnZ3AFLTCEj0",
  authDomain: "bachelor-bite-2619d.firebaseapp.com",
  projectId: "bachelor-bite-2619d",
  storageBucket: "bachelor-bite-2619d.firebasestorage.app",
  messagingSenderId: "717778624787",
  appId: "1:717778624787:web:bfc46dc256b15a4d6bbae6"
};

// Initialize Firebase (guard against duplicate initialization)
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
const auth = getAuth(app);

export { app, auth, firebaseConfig };
export default app;
