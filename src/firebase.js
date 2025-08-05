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

// Configure auth for production with better error handling
auth.useDeviceLanguage();
auth.settings.appVerificationDisabledForTesting = false;

// Add comprehensive error handling for authentication
auth.onAuthStateChanged((user) => {
  if (user) {
    console.log('✅ User is signed in:', user.email);
    console.log('📧 Email verified:', user.emailVerified);
  } else {
    console.log('👤 User is signed out');
  }
}, (error) => {
  console.error('❌ Auth state change error:', error);
  
  // Log specific error details for debugging
  if (error.code) {
    console.error('Error code:', error.code);
    console.error('Error message:', error.message);
  }
});

// Add error handling for password reset and email operations
export const handleAuthError = (error) => {
  console.error('Authentication error:', error);
  
  switch (error.code) {
    case 'auth/network-request-failed':
      return 'Network connection failed. Please check your internet connection.';
    case 'auth/too-many-requests':
      return 'Too many requests. Please wait a few minutes before trying again.';
    case 'auth/quota-exceeded':
      return 'Service quota exceeded. Please try again later.';
    case 'auth/operation-not-allowed':
      return 'This operation is not allowed. Please contact support.';
    case 'auth/user-not-found':
      return 'No account found with this email address.';
    case 'auth/invalid-email':
      return 'Please enter a valid email address.';
    case 'auth/weak-password':
      return 'Password is too weak. Please choose a stronger password.';
    case 'auth/email-already-in-use':
      return 'An account with this email already exists.';
    default:
      return 'An unexpected error occurred. Please try again or contact support.';
  }
};

// Export a function to check if Firebase is properly configured
export const checkFirebaseConfig = () => {
  try {
    if (!firebaseConfig.apiKey || firebaseConfig.apiKey === 'YOUR_API_KEY') {
      console.error('❌ Firebase API key is not configured properly');
      return false;
    }
    if (!firebaseConfig.authDomain) {
      console.error('❌ Firebase auth domain is not configured');
      return false;
    }
    console.log('✅ Firebase configuration looks good');
    return true;
  } catch (error) {
    console.error('❌ Firebase configuration error:', error);
    return false;
  }
}; 