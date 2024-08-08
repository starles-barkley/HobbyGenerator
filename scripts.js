import { getAuth, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-auth.js";

document.addEventListener('DOMContentLoaded', () => {
  $(document).ready(function() {
    $("#headerPlaceholder").load("header.html", function() {
      const auth = getAuth();
      
      onAuthStateChanged(auth, user => {
        if (user) {
          // User is signed in
          $("#loginBtn").hide();
          $("#signOutBtn").show();
          $("#adminBtn").show();
        } else {
          // No user is signed in
          $("#loginBtn").show();
          $("#signOutBtn").hide();
          $("#adminBtn").hide();
        }
      });

      // Sign out
      $("#signOutBtn").click(function() {
        signOut(auth).then(() => {
          alert("Signed out successfully!");
        }).catch((error) => {
          alert("Error signing out: " + error.message);
        });
      });
    });
  });

  const fetchHobbyBtn = document.getElementById('fetchHobbyBtn');
  const hobbyElement = document.getElementById('hobby');
  const wordButtons = document.querySelectorAll('.word-btn');
  let selectedWords = [];

  document.getElementById('signupForm').addEventListener('submit', (e) => {
    e.preventDefault();
    const email = document.getElementById('signupEmail').value;
    const password = document.getElementById('signupPassword').value;
    console.log('Email:', email);
    console.log('Password:', password);
    $('#authModal').modal('hide');
  });

  wordButtons.forEach(button => {
    button.addEventListener('click', () => {
      const word = button.textContent;

      if (button.classList.contains('active')) {
        button.classList.remove('active');
        button.classList.add('btn-outline-secondary');
        button.classList.remove('btn-primary');
        selectedWords = selectedWords.filter(selectedWord => selectedWord !== word);
      } else {
        button.classList.add('active');
        button.classList.remove('btn-outline-secondary');
        button.classList.add('btn-primary');
        selectedWords.push(word);
      }

      console.log('Selected Words:', selectedWords);
    });
  });

  fetchHobbyBtn.addEventListener('click', async () => {
    try {
      const response = await fetch('https://www.boredapi.com/api/activity');
      const data = await response.json();
      hobbyElement.textContent = `Your Hobby: ${data.activity}`;
    } catch (error) {
      console.error('Error fetching hobby:', error);
    }
  });
});
