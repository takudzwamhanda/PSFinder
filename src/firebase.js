// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

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