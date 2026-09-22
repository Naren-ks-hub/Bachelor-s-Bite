// src/firebaseConfig.js
// Firebase Web SDK configuration for Bachelor's Bite
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';

const firebaseConfig = {
  apiKey: "AIzaSyBachelorBite2619KeyPlaceholder",
  projectId: "bachelor-bite-2619",
  authDomain: "bachelor-bite-2619.firebaseapp.com",
  storageBucket: "bachelor-bite-2619.appspot.com",
  appId: "1:bachelor-bite-2619:web:auth"
};

// Initialize Firebase (guard against duplicate initialization)
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
const auth = getAuth(app);

export { app, auth, firebaseConfig };
export default app;
