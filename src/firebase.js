// src/firebase.js
// Firebase Web SDK initialization for Bachelor's Bite (Node / CommonJS compatible)
const { initializeApp, getApps, getApp } = require('firebase/app');
const { getAuth } = require('firebase/auth');

const firebaseConfig = {
  apiKey: process.env.FIREBASE_API_KEY || "AIzaSyBachelorBite2619KeyPlaceholder",
  projectId: "bachelor-bite-2619",
  authDomain: "bachelor-bite-2619.firebaseapp.com",
  storageBucket: "bachelor-bite-2619.appspot.com",
  appId: "1:bachelor-bite-2619:web:auth"
};

// Initialize Firebase (guard against duplicate initialization)
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
const auth = getAuth(app);

module.exports = {
  app,
  auth,
  firebaseConfig
};
