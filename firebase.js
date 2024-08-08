// Import the functions you need from the SDKs you need
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-app.js";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-auth.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-analytics.js";
import { getAuth, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-auth.js";


// Initialize Firebase
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
const analytics = getAnalytics(app);

// Initialize Firebase Auth
const auth = getAuth(app);

// Login
document.getElementById('loginForm').addEventListener('submit', (e) => {
  e.preventDefault();
  const email = document.getElementById('loginEmail').value;
  const password = document.getElementById('loginPassword').value;
  signInWithEmailAndPassword(auth, email, password)
    .then((userCredential) => {
      // Logged in successfully
      const user = userCredential.user;
      alert('Login successful!');
      // Reset the form
      document.getElementById('loginForm').reset();
      // Close the modal
      $('#loginModal').modal('hide');
    })
    .catch((error) => {
      const errorCode = error.code;
      const errorMessage = error.message;
      alert(errorMessage);
    });
});

// Sign Up
document.getElementById('signupForm').addEventListener('submit', (e) => {
  e.preventDefault();
  const email = document.getElementById('signupEmail').value;
  const password = document.getElementById('signupPassword').value;
  createUserWithEmailAndPassword(auth, email, password)
    .then((userCredential) => {
      // Signed up successfully
      const user = userCredential.user;
      alert('Sign up successful!');
      // Reset the form and close the modal
      document.getElementById('signupForm').reset();
      $('#signupModal').modal('hide');
    })
    .catch((error) => {
      const errorCode = error.code;
      const errorMessage = error.message;
      alert(errorMessage);
    });
});

// Observe authentication state changes, for debugging purposes. 

onAuthStateChanged(auth, (user) => {
  if (user) {
    console.log('User just logged in:', user);
  } else {
    console.log('User has just logged out. Goodbye!');
  }
});


// ======== Database Logicc ========

db.collection('hobbies').get().then((snapshot) => {
  snapshot.docs.forEach(doc => {
    renderHobby(doc);
  });
});