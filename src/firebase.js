import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyBhCUmqRYWl-JCAq9I0Dy1rfug-jkl35A8",
  authDomain: "glow-up-d9847.firebaseapp.com",
  projectId: "glow-up-d9847",
  storageBucket: "glow-up-d9847.firebasestorage.app",
  messagingSenderId: "1056800261849",
  appId: "1:1056800261849:web:cbe8a7f9fbf991c45a60c8"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const provider = new GoogleAuthProvider();
export const db = getFirestore(app);
