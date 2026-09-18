import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyCgJcXr5wB93HkwpXQL6DAe1X88cGyS6Ao",
  authDomain: "ridedriver-d6786.firebaseapp.com",
  projectId: "ridedriver-d6786",
  storageBucket: "ridedriver-d6786.firebasestorage.app",
  messagingSenderId: "493663690320",
  appId: "1:493663690320:web:e7ef0f6ceaf597982ebb55",
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);