// Import necessary Firebase functions and objects from firebase.js
import { auth, db, onAuthStateChanged, doc, updateDoc, addDoc, getDoc, collection, onSnapshot } from './firebase.js';
import { getStorage, ref, uploadBytes, getDownloadURL } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-storage.js";

document.addEventListener('DOMContentLoaded', () => {
    const storage = getStorage();

    // Handling the creation of new hobby tags
    const addHobbyTagForm = document.getElementById('addHobbyTagForm');
    if (addHobbyTagForm) {
        addHobbyTagForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const newHobbyTag = document.getElementById('newHobbyTag').value;
            try {
                await addDoc(collection(db, 'hobbyTags'), { tag: newHobbyTag });
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
        if (hobbyTagsList && hobbyTagsContainer) {
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
    }

    // Handle new hobby submission
    const addHobbyForm = document.getElementById('addHobbyForm');
    if (addHobbyForm) {
        addHobbyForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const name = document.getElementById('hobbyName').value;
            const description = document.getElementById('hobbyDescription').value;
            const imageFile = document.getElementById('hobbyImage').files[0];
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
                const imageRef = ref(storage, `hobbies/${imageFile.name}`);
                const snapshot = await uploadBytes(imageRef, imageFile);
                const imageUrl = await getDownloadURL(snapshot.ref);

                const currentHobbyId = null; // Reset or initialize hobby ID variable as needed
                if (currentHobbyId) {
                    const hobbyRef = doc(db, 'hobbies', currentHobbyId);
                    await updateDoc(hobbyRef, {
                        name: name,
                        description: description,
                        image: imageUrl,
                        tags: selectedTags
                    });
                    alert('Hobby updated successfully!');
                } else {
                    await addDoc(collection(db, 'hobbies'), {
                        name: name,
                        description: description,
                        image: imageUrl,
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

    function loadHobbies() {
        const hobbiesList = document.getElementById('hobbiesList');
        if (hobbiesList) {
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

                document.querySelectorAll('.edit-hobby-btn').forEach(button => {
                    button.addEventListener('click', async (e) => {
                        const hobbyId = e.target.dataset.id;
                        const hobbyRef = doc(db, 'hobbies', hobbyId);
                        const hobbyDoc = await getDoc(hobbyRef);

                        if (hobbyDoc.exists()) {
                            const hobbyData = hobbyDoc.data();
                            document.getElementById('hobbyName').value = hobbyData.name;
                            document.getElementById('hobbyDescription').value = hobbyData.description;
                            currentHobbyId = hobbyId;
                            loadHobbyTagsForHobbiesForm(hobbyData.tags);
                        } else {
                            alert('Hobby not found!');
                        }
                    });
                });
            });
        }
    }

    function loadUsers() {
        const usersList = document.getElementById('usersList');
        if (usersList) {
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

    // Load hobby tags, hobbies, and users on page load with real-time listeners
    loadHobbyTags(); // Load hobby tags with real-time updates
    loadHobbies(); // Load hobbies with real-time updates
    loadUsers(); // Load users with real-time updates
});
