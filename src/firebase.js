// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth, connectAuthEmulator } from "firebase/auth";
import { getFirestore, connectFirestoreEmulator } from "firebase/firestore";
import { getStorage, connectStorageEmulator } from "firebase/storage";

// TODO: Replace the following with your app's Firebase project configuration
const firebaseConfig = {
  apiKey: "AIzaSyDuGeYKhrRVP6LjSl3O6zfvO7lKdc47bIc",
  authDomain: "ps-finder-123.firebaseapp.com",
  projectId: "ps-finder-123",
  storageBucket: "ps-finder-123.appspot.com",
  messagingSenderId: "890081571804",
  appId: "1:890081571804:web:a47fb6d27e7101ed2b9519",
  measurementId: "G-DEMWD5SCND"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

// Configure auth for production
auth.useDeviceLanguage();
auth.settings.appVerificationDisabledForTesting = false;

// Add better error handling for authentication
auth.onAuthStateChanged((user) => {
  if (user) {
    console.log('User is signed in:', user.email);
  } else {
    console.log('User is signed out');
  }
}, (error) => {
  console.error('Auth state change error:', error);
}); 