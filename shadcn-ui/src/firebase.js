// Firebase configuration
import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyBhazkyYi0E3pgp5Uwe12q5IZJ4l8O3fb8",
  authDomain: "money-lense.firebaseapp.com",
  projectId: "money-lense",
  storageBucket: "money-lense.appspot.com",
  messagingSenderId: "709038576402",
  appId: "1:709038576402:web:b9epc0ahbkltnhqjob0f13c6u8jrvca1",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase Auth and get a reference to the service
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

// Initialize Cloud Firestore and get a reference to the service
export const db = getFirestore(app);

export default app;
