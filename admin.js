// Import necessary Firebase functions and objects from firebase.js
import { auth, db, onAuthStateChanged, doc, updateDoc, addDoc, getDoc, collection, onSnapshot } from './firebase.js';
import { getStorage, ref, uploadBytes, getDownloadURL } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-storage.js";

document.addEventListener('DOMContentLoaded', () => {
    const storage = getStorage();
    let currentHobbyId = null; // Track the hobby being edited
    let currentImageUrl = null; // Track the current image URL

    // Handling the creation of new hobby tags
    const addHobbyTagForm = document.getElementById('addHobbyTagForm');
    if (addHobbyTagForm) {
        addHobbyTagForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const newHobbyTag = document.getElementById('newHobbyTag').value;
            try {
                await addDoc(collection(db, 'hobbyTags'), { tag: newHobbyTag });
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
        if (hobbyTagsList && hobbyTagsContainer) {
            const unsubscribe = onSnapshot(collection(db, 'hobbyTags'), (querySnapshot) => {
                hobbyTagsList.innerHTML = '';
                hobbyTagsContainer.innerHTML = '';
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

                    const tagButtonFormWrapper = document.createElement('div');
                    tagButtonFormWrapper.className = 'col-auto';
                    tagButtonFormWrapper.appendChild(tagButtonForm);

                    hobbyTagsContainer.appendChild(tagButtonFormWrapper);
                });
            });
        }
    }

    // Function to load and highlight tags for the hobbies form when editing
    function loadHobbyTagsForHobbiesForm(selectedTags) {
        const hobbyTagsContainer = document.getElementById('hobbyTags');

        // Load all tags from Firestore
        onSnapshot(collection(db, 'hobbyTags'), (querySnapshot) => {
            // Clear any existing buttons to avoid duplicates
            hobbyTagsContainer.innerHTML = '';

            // Array to hold the tag buttons for delayed highlighting
            const tagButtons = [];

            querySnapshot.forEach((doc) => {
                const tagButtonForm = document.createElement('button');
                tagButtonForm.type = 'button';
                tagButtonForm.className = 'btn btn-outline-primary m-1';
                tagButtonForm.textContent = doc.data().tag;
                tagButtonForm.dataset.tag = doc.data().tag;

                // Store buttons in an array for later processing
                tagButtons.push(tagButtonForm);

                const tagButtonFormWrapper = document.createElement('div');
                tagButtonFormWrapper.className = 'col-auto';
                tagButtonFormWrapper.appendChild(tagButtonForm);

                // Add event listener for toggling tag selection
                tagButtonForm.addEventListener('click', () => {
                    tagButtonForm.classList.toggle('active');
                    tagButtonForm.classList.toggle('btn-primary');
                    tagButtonForm.classList.toggle('btn-outline-primary');
                });

                hobbyTagsContainer.appendChild(tagButtonFormWrapper);
            });

            // Highlight selected tags after all buttons are added
            tagButtons.forEach(button => {
                if (selectedTags.includes(button.dataset.tag)) {
                    button.classList.add('active', 'btn-primary');
                    button.classList.remove('btn-outline-primary');
                }
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
            const imageFile = document.getElementById('hobbyImage').files[0];
            const difficulty = parseInt(document.getElementById('hobbyDifficulty').value);
            const wikipediaLink = document.getElementById('hobbyWikipediaLink').value;
            const selectedTags = Array.from(document.getElementById('hobbyTags').children)
                .filter(btn => btn.firstChild.classList.contains('active'))
                .map(btn => btn.firstChild.dataset.tag);
            
            console.log(difficulty); // Why aren't you saving?!

            if (selectedTags.length === 0) {
                alert('Please select at least one tag for the hobby.');
                return;
            }

            try {
                let imageUrl = currentImageUrl;

                // Only upload a new image if one was provided, but one should always be provided...
                if (imageFile) {
                    const imageRef = ref(storage, `hobbies/${imageFile.name}`);
                    const snapshot = await uploadBytes(imageRef, imageFile);
                    imageUrl = await getDownloadURL(snapshot.ref);
                }

                if (currentHobbyId) {
                    const hobbyRef = doc(db, 'hobbies', currentHobbyId);
                    await updateDoc(hobbyRef, {
                        name: name,
                        description: description,
                        image: imageUrl,
                        tags: selectedTags,
                        difficulty: difficulty,
                        wikipediaLink: wikipediaLink
                    });
                    currentHobbyId = null;
                    currentImageUrl = null;
                } else {
                    await addDoc(collection(db, 'hobbies'), {
                        name: name,
                        description: description,
                        image: imageUrl,
                        tags: selectedTags,
                        difficulty: difficulty,
                        wikipediaLink: wikipediaLink
                    });
                }
                document.getElementById('addHobbyForm').reset();

                // Hide the image preview after submission
                const imgPreview = document.getElementById('imagePreview');
                if (imgPreview) {
                    imgPreview.style.display = 'none';
                }
            } catch (error) {
                console.error('Error saving hobby:', error);
                alert('Error saving hobby: ' + error.message);
            }
        });
    }

    // Function to load and display hobbies
    function loadHobbies() {
        const hobbiesList = document.getElementById('hobbiesList');
        if (hobbiesList) {
            const unsubscribe = onSnapshot(collection(db, 'hobbies'), (querySnapshot) => {
                hobbiesList.innerHTML = '';
                querySnapshot.forEach((doc) => {
                    const hobbyData = doc.data();
                    const hobbyItem = document.createElement('div');
                    hobbyItem.classList.add('col-lg-3', 'col-md-4', 'col-sm-6', 'mb-4');
    
                    // Generate the stars for difficulty
                    const maxStars = 5;
                    let starsHtml = '';
                    for (let i = 1; i <= maxStars; i++) {
                        if (i <= hobbyData.difficulty) {
                            starsHtml += '<i class="fas fa-star"></i>';
                        } else {
                            starsHtml += '<i class="far fa-star"></i>';
                        }
                    }
    
                    hobbyItem.innerHTML = `
                        <div class="card">
                            <img src="${hobbyData.image}" class="card-img-top" alt="${hobbyData.name}" style="max-width: 100%; max-height: 250px; object-fit: cover;">
                            <div class="card-body">
                                <h5 class="card-title">${hobbyData.name}</h5>
                                <p class="card-text">${hobbyData.description}</p>
                                <p><strong>Tags:</strong> ${hobbyData.tags.map(tag => `<span class="badge bg-secondary m-1">${tag}</span>`).join('')}</p>
                                <p><strong>Difficulty:</strong> ${starsHtml}</p> <!-- Display difficulty rating as stars -->
                                <p><a href="${hobbyData.wikipediaLink}" target="_blank">Learn more on Wikipedia</a></p> <!-- Wikipedia link -->
                                <button class="btn btn-sm btn-warning edit-hobby-btn" data-id="${doc.id}">Edit</button>
                            </div>
                        </div>
                    `;
                    hobbiesList.appendChild(hobbyItem);
                });
    
                document.querySelectorAll('.edit-hobby-btn').forEach(button => {
                    button.addEventListener('click', async (e) => {
                        const hobbyId = e.target.dataset.id;
                        const hobbyRef = doc(db, 'hobbies', hobbyId);
                        const hobbyDoc = await getDoc(hobbyRef);
    
                        if (hobbyDoc.exists()) {
                            const hobbyData = hobbyDoc.data();
                            document.getElementById('hobbyName').value = hobbyData.name;
                            document.getElementById('hobbyDescription').value = hobbyData.description;
                            document.getElementById('hobbyDifficulty').value = hobbyData.difficulty;
                            document.getElementById('hobbyWikipediaLink').value = hobbyData.wikipediaLink;
                            currentImageUrl = hobbyData.image;
    
                            const imgPreview = document.getElementById('imagePreview');
                            if (imgPreview) {
                                imgPreview.src = currentImageUrl;
                                imgPreview.style.display = 'block';
                            }
    
                            loadHobbyTagsForHobbiesForm(hobbyData.tags);
    
                            currentHobbyId = hobbyId;
                        } else {
                            alert('Hobby not found!');
                        }
                    });
                });
            });
        }
    }

    // Function to load and display users
    function loadUsers() {
        const usersList = document.getElementById('usersList');
        if (usersList) {
            const unsubscribe = onSnapshot(collection(db, 'users'), (querySnapshot) => {
                usersList.innerHTML = ''; // Clear existing list, otherwise you get repeats on updates
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

                document.querySelectorAll('.update-admin-btn').forEach(button => {
                    button.addEventListener('click', async (e) => {
                        const userId = e.target.dataset.id;
                        const isAdmin = document.querySelector(`input[data-id="${userId}"]`).checked;
                        const userRef = doc(db, 'users', userId);

                        try {
                            await updateDoc(userRef, { isAdmin: isAdmin });
                            alert('User updated successfully!');
                        } catch (error) {
                            console.error('Error updating user:', error);
                            alert('Error updating user: ' + error.message);
                        }
                    });
                });
            });
        }
    }


    loadHobbyTags(); // Load hobby tags with real-time updates
    loadHobbies(); // Load hobbies with real-time updates
    loadUsers(); // Load users with real-time updates
});
