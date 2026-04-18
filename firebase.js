// Import the functions you need from the SDKs you need
import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { initializeAuth, getReactNativePersistence } from 'firebase/auth';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyDKZDCh4mg0SLGEXubNz7qQACHBivJm8Es",
  authDomain: "gruz-cc95d.firebaseapp.com",
  projectId: "gruz-cc95d",
  storageBucket: "gruz-cc95d.firebasestorage.app",
  messagingSenderId: "705540512171",
  appId: "1:705540512171:web:429a8cbc9bfa010d5bdaee",
  measurementId: "G-LQ0T742CPN"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Cloud Firestore and get a reference to the service
export const db = getFirestore(app);

// Initialize Firebase Auth with React Native persistence
export const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(AsyncStorage),
});