import { initializeApp, getApps } from "firebase/app";
import { getDatabase } from "firebase/database";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyDJL5HF4Tn_3-1-Nrz98q16m4XXsgRQcP0",
  authDomain: "antriku-a5d8a.firebaseapp.com",
  databaseURL: "https://antriku-a5d8a-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "antriku-a5d8a",
  storageBucket: "antriku-a5d8a.firebasestorage.app",
  messagingSenderId: "351799204242",
  appId: "1:351799204242:web:c1b9d3c3b05f67b7ef894b",
  measurementId: "G-1V38M0515G"    
};

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
const db = getDatabase(app);
const auth = getAuth(app);

export { db, auth };