// src/firebase.js
// Firebase Web SDK initialization for Bachelor's Bite (Node / CommonJS compatible)
const { initializeApp, getApps, getApp } = require('firebase/app');

const firebaseConfig = {
  projectId: "bachelor-bite-2619",
  authDomain: "bachelor-bite-2619.firebaseapp.com",
  storageBucket: "bachelor-bite-2619.appspot.com"
};

// Initialize Firebase (guard against duplicate initialization)
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

module.exports = {
  app,
  firebaseConfig
};
