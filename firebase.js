// Import the functions you need from the SDKs you need
import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

// Your web app's Firebase configuration
// Получите эту конфигурацию из Firebase Console -> Project Settings -> General -> Your apps -> Web app
const firebaseConfig = {
  apiKey: "AIzaSyDKZDCh4mg0SLGEXubNz7qQACHBivJm8Es",
  authDomain: "gruz-cc95d.firebaseapp.com",
  projectId: "gruz-cc95d",
  storageBucket: "gruz-cc95d.firebasestorage.app",
  messagingSenderId: "705540512171",
  appId: "1:705540512171:web:429a8cbc9bfa010d5bdaee"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Cloud Firestore and get a reference to the service
export const db = getFirestore(app);

// Initialize Firebase Auth
export const auth = getAuth(app);