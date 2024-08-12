// Import necessary Firebase functions and objects from firebase.js
import { auth, db, createUserWithEmailAndPassword, signInWithEmailAndPassword, onAuthStateChanged, signOut } from './firebase.js';
import { collection, addDoc, onSnapshot, getDocs, doc, updateDoc, getDoc } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js";
import { getStorage, ref, uploadBytes, getDownloadURL } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-storage.js";

document.addEventListener('DOMContentLoaded', () => {
  const storage = getStorage();

  // The auth state is a huge WIP, the functionality will probably change a lot before 
  // this is all said and done. 

    // There is a issue when loading current hobby to edit it, the 
    // tags are not loading as well, but when selecting tags it saves correctly.

  onAuthStateChanged(auth, async (user) => {
    if (user) {
        // User is signed in
        $("#loginBtn").hide();
        $("#signOutBtn").show();
  
        console.log("User signed in:", user.uid); // Debugging output to confirm user is logged in

        try {
            // Query the users collection where the uid field matches the current user's UID
            const usersQuery = collection(db, 'users');
            const querySnapshot = await getDocs(usersQuery);

            let userDocData = null;

            // Loop through the documents to find the matching UID
            querySnapshot.forEach((doc) => {
                const userData = doc.data();
                console.log(`Document found: ${doc.id} =>`, userData); // Log all documents for debugging

                if (userData.uid === user.uid) {
                    userDocData = userData;
                }
            });

            if (userDocData) {
                console.log("User data:", userDocData); // Debugging output to see user data

                // Redirect logic - Only perform the redirect if the user is on a specific page (like the index page)
                // This prevents the redirect from happening on every page load, because
                // I found that out the hard way...
                const currentPage = window.location.pathname;

                if (currentPage === '/' || currentPage === '/index.html') {
                    if (userDocData.isAdmin) {
                        console.log("Redirecting to admin page...");
                        window.location.href = "adminpage.html"; // Redirect to admin page
                    } else {
                        console.log("Redirecting to hobby search page...");
                        window.location.href = "userpage.html"; // Redirect to hobby search page
                    }
                }
            } else {
                console.error("No user document matches the UID!");
            }
        } catch (error) {
            console.error("Error fetching user data:", error);
        }
    } else {
        // User is not signed in, show the login button and hide the sign-out button
        $("#loginBtn").show();
        $("#signOutBtn").hide();
    }
});

$("#signOutBtn").click(function() {
    signOut(auth).then(() => {
        alert("Signed out successfully!");
        window.location.href = "index.html"; // Redirect to index page after sign out
    }).catch((error) => {
        alert("Error signing out: " + error.message);
    });
});
const loginForm = document.getElementById('loginForm');
  const signupForm = document.getElementById('signupForm');
  let currentHobbyId = null; // Track the hobby being edited

  if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const email = document.getElementById('loginEmail').value;
      const password = document.getElementById('loginPassword').value;
  
      try {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;
        console.log("User signed in:", user);
      } catch (error) {
        console.error('Error signing in: ', error);
        alert('Error signing in: ' + error.message);
      }
    });
  }

  if (signupForm) {
    signupForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const email = document.getElementById('signupEmail').value;
      const password = document.getElementById('signupPassword').value;
  
      try {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        await addDoc(collection(db, 'users'), {
          uid: userCredential.user.uid,
          email: userCredential.user.email,
        });
        alert('User signed up successfully!');
        
        // Redirect to userprofile.html after signup
        window.location.href = 'userpage.html';
      } catch (error) {
        console.error('Error signing up: ', error);
        alert('Error: ' + error.message);
      }
    });
  }

  // Handling the creation of new hobby tags
  const addHobbyTagForm = document.getElementById('addHobbyTagForm');
  if (addHobbyTagForm) {
    addHobbyTagForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const newHobbyTag = document.getElementById('newHobbyTag').value;
      try {
        await addDoc(collection(db, 'hobbyTags'), {
          tag: newHobbyTag
        });
        alert('Hobby tag added successfully!');
        document.getElementById('newHobbyTag').value = ''; // Clear the input field
      } catch (error) {
        console.error('Error adding hobby tag:', error);
        alert('Error adding hobby tag: ' + error.message);
      }
    });
  }

  // Load hobby tags and listen to real-time updates
  function loadHobbyTags() {
    const hobbyTagsList = document.getElementById('hobbyTagsList');
    const hobbyTagsContainer = document.getElementById('hobbyTags');
    const unsubscribe = onSnapshot(collection(db, 'hobbyTags'), (querySnapshot) => {
      hobbyTagsList.innerHTML = ''; // Clear existing buttons
      hobbyTagsContainer.innerHTML = ''; // Clear existing buttons in hobby creation form
      querySnapshot.forEach((doc) => {
        const tagButtonList = document.createElement('button');
        tagButtonList.type = 'button';
        tagButtonList.className = 'btn btn-outline-secondary m-1';
        tagButtonList.textContent = doc.data().tag;
        hobbyTagsList.appendChild(tagButtonList);

        const tagButtonForm = document.createElement('button');
        tagButtonForm.type = 'button';
        tagButtonForm.className = 'btn btn-outline-primary m-1';
        tagButtonForm.textContent = doc.data().tag;
        tagButtonForm.dataset.tag = doc.data().tag;
        tagButtonForm.addEventListener('click', () => {
          tagButtonForm.classList.toggle('active');
          tagButtonForm.classList.toggle('btn-primary');
          tagButtonForm.classList.toggle('btn-outline-primary');
        });
        hobbyTagsContainer.appendChild(tagButtonForm);
      });
    });
  }

  // Handle new hobby submission
  const addHobbyForm = document.getElementById('addHobbyForm');
  if (addHobbyForm) {
    addHobbyForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const name = document.getElementById('hobbyName').value;
      const description = document.getElementById('hobbyDescription').value;
      const imageFile = document.getElementById('hobbyImage').files[0]; // Get the uploaded file
      const selectedTags = Array.from(document.getElementById('hobbyTags').children)
                              .filter(btn => btn.classList.contains('active'))
                              .map(btn => btn.dataset.tag);
      
      if (selectedTags.length === 0) {
        alert('Please select at least one tag for the hobby.');
        return;
      }

      if (!imageFile) {
        alert('Please upload an image.');
        return;
      }

      try {
        // Upload the image to Firebase Storage
        const imageRef = ref(storage, `hobbies/${imageFile.name}`);
        const snapshot = await uploadBytes(imageRef, imageFile);
        const imageUrl = await getDownloadURL(snapshot.ref);

        if (currentHobbyId) {
          // Update existing hobby
          const hobbyRef = doc(db, 'hobbies', currentHobbyId);
          await updateDoc(hobbyRef, {
            name: name,
            description: description,
            image: imageUrl, // Save the image URL
            tags: selectedTags
          });
          alert('Hobby updated successfully!');
          currentHobbyId = null; // Reset the current hobby ID
        } else {
          // Add new hobby
          await addDoc(collection(db, 'hobbies'), {
            name: name,
            description: description,
            image: imageUrl, // Save the image URL
            tags: selectedTags
          });
          alert('Hobby added successfully!');
        }
        document.getElementById('addHobbyForm').reset();
      } catch (error) {
        console.error('Error saving hobby:', error);
        alert('Error saving hobby: ' + error.message);
      }
    });
  }

  // Function to load and listen to hobbies in real-time
  function loadHobbies() {
    const hobbiesList = document.getElementById('hobbiesList');
    const unsubscribe = onSnapshot(collection(db, 'hobbies'), (querySnapshot) => {
      hobbiesList.innerHTML = ''; // Clear existing list
      querySnapshot.forEach((doc) => {
        const hobbyItem = document.createElement('div');
        hobbyItem.classList.add('col-lg-3', 'col-md-4', 'col-sm-6', 'mb-4');
        hobbyItem.innerHTML = `
          <div class="card">
            <img src="${doc.data().image}" class="card-img-top" alt="${doc.data().name}" style="max-width: 100%; max-height: 250px; object-fit: cover;">
            <div class="card-body">
              <h5 class="card-title">${doc.data().name}</h5>
              <p class="card-text">${doc.data().description}</p>
              <p><strong>Tags:</strong> ${doc.data().tags.map(tag => `<span class="badge bg-secondary m-1">${tag}</span>`).join('')}</p>
              <button class="btn btn-sm btn-warning edit-hobby-btn" data-id="${doc.id}">Edit</button>
            </div>
          </div>
        `;
        hobbiesList.appendChild(hobbyItem);
      });

      // Add event listeners for edit buttons
      document.querySelectorAll('.edit-hobby-btn').forEach(button => {
        button.addEventListener('click', async (e) => {
          const hobbyId = e.target.dataset.id;
          const hobbyRef = doc(db, 'hobbies', hobbyId);
          const hobbyDoc = await getDoc(hobbyRef);

          if (hobbyDoc.exists()) {
            const hobbyData = hobbyDoc.data();
            document.getElementById('hobbyName').value = hobbyData.name;
            document.getElementById('hobbyDescription').value = hobbyData.description;
            currentHobbyId = hobbyId; // Set the current hobby ID for editing
            loadHobbyTagsForHobbiesForm(hobbyData.tags); // Load the tags into the form
          } else {
            alert('Hobby not found!');
          }
        });
      });
    });
  }

  // Function to load and listen to users in real-time
  function loadUsers() {
    const usersList = document.getElementById('usersList');
    const unsubscribe = onSnapshot(collection(db, 'users'), (querySnapshot) => {
      usersList.innerHTML = ''; // Clear existing list
      querySnapshot.forEach((doc) => {
        const userData = doc.data();
        const userItem = document.createElement('div');
        userItem.classList.add('col-lg-3', 'col-md-4', 'col-sm-6', 'mb-4');
        userItem.innerHTML = `
          <div class="card">
            <div class="card-body">
              <h5 class="card-title">${userData.email}</h5>
              <p class="card-text"><strong>First Name:</strong> ${userData.firstname || 'N/A'}</p>
              <p class="card-text"><strong>Last Name:</strong> ${userData.lastname || 'N/A'}</p>
              <p class="card-text">
                <strong>Admin:</strong> 
                <input type="checkbox" class="form-check-input" ${userData.isAdmin ? 'checked' : ''} data-id="${doc.id}">
              </p>
              <button class="btn btn-sm btn-primary update-admin-btn" data-id="${doc.id}">Update</button>
            </div>
          </div>
        `;
        usersList.appendChild(userItem);
      });

      // Add event listeners for update buttons
      document.querySelectorAll('.update-admin-btn').forEach(button => {
        button.addEventListener('click', async (e) => {
          const userId = e.target.dataset.id;
          const isAdmin = document.querySelector(`input[data-id="${userId}"]`).checked;
          const userRef = doc(db, 'users', userId);
          
          try {
            await updateDoc(userRef, {
              isAdmin: isAdmin
            });
            alert('User updated successfully!');
          } catch (error) {
            console.error('Error updating user:', error);
            alert('Error updating user: ' + error.message);
          }
        });
      });
    });
  }

  // Load hobby tags, hobbies, and users on page load with real-time listeners
  loadHobbyTags(); // Load hobby tags with real-time updates
  loadHobbies(); // Load hobbies with real-time updates
  loadUsers(); // Load users with real-time updates
});