// Import necessary Firebase modules
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-app.js";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-analytics.js";

// Firebase configuration object
const firebaseConfig = {
  apiKey: "AIzaSyDQ6rLHfA4qo-9H-LF4hNXMhFAgdYbkqoY",
  authDomain: "hobbfinder-c2859.firebaseapp.com",
  projectId: "hobbfinder-c2859",
  storageBucket: "hobbfinder-c2859.appspot.com",
  messagingSenderId: "710124711765",
  appId: "1:710124711765:web:34f281368533927f4dc9dc",
  measurementId: "G-T3XRMPGYGB"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase Analytics (optional)
const analytics = getAnalytics(app);

// Initialize Firestore

const db = getFirestore(app, 'hobbfinder');

// Initialize Firebase Auth
const auth = getAuth(app);

// Export the necessary objects and functions for use in other files
export { auth, db, createUserWithEmailAndPassword, signInWithEmailAndPassword, onAuthStateChanged, signOut };
