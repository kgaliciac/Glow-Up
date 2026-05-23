import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyDM5ikuZ_z3cUmkuWAqCUTltrELKN5TvAU",
  authDomain: "glowup-33df7.firebaseapp.com",
  projectId: "glowup-33df7",
  storageBucket: "glowup-33df7.firebasestorage.app",
  messagingSenderId: "538377398549",
  appId: "1:538377398549:web:91a6d83bb8acb4c4e9611c"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const provider = new GoogleAuthProvider();
export const db = getFirestore(app);