// Firebase initialization — Phone Authentication for OTP (no DLT needed).
// These config values are public by design (safe to ship in frontend code).
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';

const firebaseConfig = {
  apiKey: 'AIzaSyCJmrQsys-nExAYyEE105vLjuI2AADzYm8',
  authDomain: 'rahicab-9475c.firebaseapp.com',
  projectId: 'rahicab-9475c',
  storageBucket: 'rahicab-9475c.firebasestorage.app',
  messagingSenderId: '653846520337',
  appId: '1:653846520337:web:011ab4eb3736ea3eca07b0',
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
