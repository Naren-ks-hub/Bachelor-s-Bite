// src/firebaseConfig.js
// Firebase Web SDK configuration for Bachelor's Bite
import { initializeApp, getApps, getApp } from 'firebase/app';

const firebaseConfig = {
  projectId: "bachelor-bite-2619",
  authDomain: "bachelor-bite-2619.firebaseapp.com",
  storageBucket: "bachelor-bite-2619.appspot.com"
};

// Initialize Firebase (guard against duplicate initialization)
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

export { app, firebaseConfig };
export default app;
