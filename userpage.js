import { auth, db, onAuthStateChanged, doc, getDoc, updateDoc, collection, query, where, getDocs } from './firebase.js';
import { getStorage, ref, uploadBytes, getDownloadURL } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-storage.js";

document.addEventListener('DOMContentLoaded', () => {
    const profilePhotoInput = document.getElementById('profilePhotoInput');
    const profilePhoto = document.querySelector('img[alt="Profile Photo"]');
    const userHobbyTagsContainer = document.getElementById('userHobbyTags');
    const discoverHobbiesContainer = document.getElementById('discoverHobbies');
    const currentHobbiesContainer = document.getElementById('currentHobbies');

    onAuthStateChanged(auth, async (user) => {
        if (user) {
            console.log("User signed in:", user.uid);
    
            try {
                const usersQuery = query(collection(db, 'users'), where('uid', '==', user.uid));
                const querySnapshot = await getDocs(usersQuery);
                let userDoc = null;
    
                querySnapshot.forEach((doc) => {
                    userDoc = doc;
                });
    
                if (userDoc && userDoc.exists()) {
                    const userData = userDoc.data();
                    console.log("User data found:", userData);
    
                    // Populate the page with user data
                    document.getElementById('firstName').value = userData.firstName || '';
                    document.getElementById('lastName').value = userData.lastName || '';
                    document.getElementById('email').value = userData.email || '';

                    // Display user full name
                    const fullName = `${userData.firstName || ''} ${userData.lastName || ''}`;
                    document.querySelector('#userFullName h5').textContent = fullName;

                    // Set profile photo or fallback image
                    if (userData.profilePhotoUrl) {
                        profilePhoto.src = userData.profilePhotoUrl;
                    } else {
                        profilePhoto.src = "images/fallout_vault_boy.jpeg";
                    }
    
                    // Display user hobby tags
                    displayHobbyTags(userData.hobbyTags || []);
                    
                    // Load current hobbies
                    loadCurrentHobbies(userData.currentHobbies || []);
                    
                    // Load discover hobbies
                    loadDiscoverHobbies(userData.hobbyTags || []);
                } else {
                    console.error("No user document found!");
                }
            } catch (error) {
                console.error("Error fetching user data:", error);
            }
        } else {
            console.error("No user is signed in!");
            window.location.href = "index.html";
        }
    });

    // Handle profile photo upload
    profilePhotoInput.addEventListener('change', async (e) => {
        const file = e.target.files[0];
        if (file) {
            const storage = getStorage();
            const storageRef = ref(storage, `profilePhotos/${auth.currentUser.uid}/${file.name}`);
            try {
                console.log("Uploading file to Firebase Storage...");
                await uploadBytes(storageRef, file);
                console.log("File uploaded successfully, retrieving URL...");
                const downloadURL = await getDownloadURL(storageRef);
                console.log("Download URL:", downloadURL);
    
                // Fetch the user's document based on UID
                const usersQuery = query(collection(db, 'users'), where('uid', '==', auth.currentUser.uid));
                const querySnapshot = await getDocs(usersQuery);
                let userDocId = null;
    
                querySnapshot.forEach((doc) => {
                    userDocId = doc.id;  // Capture the correct document ID
                });
    
                if (userDocId) {
                    // Update the user's profile photo URL in Firestore using the correct document ID
                    const userRef = doc(db, 'users', userDocId);
                    await updateDoc(userRef, { profilePhotoUrl: downloadURL });
                    console.log("Firestore updated with new profile photo URL");
    
                    // Update the profile photo on the page
                    profilePhoto.src = downloadURL;
                } else {
                    console.error("No user document found to update!");
                }
            } catch (error) {
                console.error("Error uploading profile photo:", error);
            }
        }
    });
    
    

    // Handle profile updates
    document.getElementById('userInfoForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        const firstname = document.getElementById('firstName').value;
        const lastname = document.getElementById('lastName').value;
    
        try {
            const usersQuery = query(collection(db, 'users'), where('uid', '==', auth.currentUser.uid));
            const querySnapshot = await getDocs(usersQuery);
            let userDoc = null;
    
            querySnapshot.forEach((doc) => {
                userDoc = doc;  // Assume there is only one document matching the UID
            });
    
            if (userDoc) {
                const userRef = doc(db, 'users', userDoc.id);
                await updateDoc(userRef, {
                    firstName: firstname,
                    lastName: lastname
                });
                alert('Profile updated successfully!');
            } else {
                console.error("No user document found!");
            }
        } catch (error) {
            console.error('Error updating profile:', error);
            alert('Error updating profile: ' + error.message);
        }
    });

    async function loadDiscoverHobbies(userHobbyTags) {
        discoverHobbiesContainer.innerHTML = ''; // Clear previous tags
    
        try {
            const querySnapshot = await getDocs(collection(db, 'hobbyTags'));
            querySnapshot.forEach((doc) => {
                const tag = doc.data().tag;
    
                const tagButton = document.createElement('button');
                tagButton.type = 'button';
                tagButton.className = 'btn btn-outline-primary m-1 custom-discover-tag';
                tagButton.textContent = tag;
                tagButton.dataset.tag = tag;
    
                // Highlight the button if the user has already selected the tag
                if (userHobbyTags.includes(tag)) {
                    tagButton.classList.add('active', 'btn-primary');
                    tagButton.classList.remove('btn-outline-primary');
                }
    
                // Toggle selection of hobby tags
                tagButton.addEventListener('click', () => {
                    tagButton.classList.toggle('active');
                    tagButton.classList.toggle('btn-primary');
                    tagButton.classList.toggle('btn-outline-primary');
                });
    
                discoverHobbiesContainer.appendChild(tagButton);
            });
    
            // Add a div with class w-100 to break the line
            const lineBreak = document.createElement('div');
            lineBreak.className = 'w-100';
            discoverHobbiesContainer.appendChild(lineBreak);
    
            // Add a wrapper div to center the button
            const buttonWrapper = document.createElement('div');
            buttonWrapper.className = 'd-flex justify-content-center w-100';
    
            // Add "Find New Hobbies" button
            const findButton = document.createElement('button');
            findButton.className = 'btn mt-3 custom-button';
            findButton.textContent = 'Find Hobbies';
            findButton.style.marginTop = '20px';  
            findButton.style.backgroundColor = 'orange';
            findButton.style.color = 'black';
            findButton.style.borderRadius = '20px';
            findButton.style.padding = '10px 20px';
            findButton.style.border = 'none';
    
            findButton.addEventListener('click', async () => {
                const selectedTags = Array.from(discoverHobbiesContainer.children)
                    .filter(btn => btn.classList.contains('active'))
                    .map(btn => btn.dataset.tag);
    
                try {
                    const allTagsSnapshot = await getDocs(collection(db, 'hobbyTags'));
                    const allTags = [];
                    allTagsSnapshot.forEach(doc => allTags.push(doc.data().tag));
    
                    const userSelectedAllTags = allTags.length === selectedTags.length &&
                                                allTags.every(tag => selectedTags.includes(tag));
    
                    if (userSelectedAllTags) {
                        window.location.href = "https://www.youtube.com/watch?v=dQw4w9WgXcQ";
                    } else {
                        const usersQuery = query(collection(db, 'users'), where('uid', '==', auth.currentUser.uid));
                        const querySnapshot = await getDocs(usersQuery);
                        let userDoc = null;
    
                        querySnapshot.forEach((doc) => {
                            userDoc = doc;
                        });
    
                        if (userDoc) {
                            const userRef = doc(db, 'users', userDoc.id);
                            await updateDoc(userRef, { hobbyTags: selectedTags });

                            displayHobbyTags(selectedTags);
    
                            window.location.href = "hobbysearch.html";
                        } else {
                            console.error("No user document found!");
                        }
                    }
                } catch (error) {
                    console.error('Error saving hobbies:', error);
                    alert('Error saving hobbies: ' + error.message);
                }
            });
    
            buttonWrapper.appendChild(findButton);
            discoverHobbiesContainer.appendChild(buttonWrapper);
        } catch (error) {
            console.error("Error loading hobbies:", error);
        }
    }
    

    // Function to display user-selected hobby tags
    function displayHobbyTags(hobbyTags) {
        userHobbyTagsContainer.innerHTML = '';
    
        if (Array.isArray(hobbyTags)) {
            hobbyTags.forEach(tag => {
                const tagBadge = document.createElement('span');
                tagBadge.className = 'badge bg-secondary m-1 custom-hobby-tag';
                tagBadge.textContent = tag;
                userHobbyTagsContainer.appendChild(tagBadge);
            });
        } else {
            console.error("hobbyTags is not an array:", hobbyTags);
        }
    }

    // Load and display the user's current hobbies in card format
    async function loadCurrentHobbies(hobbyIds) {
        currentHobbiesContainer.innerHTML = ''; // Clear previous hobbies
    
        if (!hobbyIds.length) {
            console.log('No current hobbies to load.');
            currentHobbiesContainer.innerHTML = '<p>No current hobbies found, select some tags to find a new Hobby!</p>';
            return;
        }
    
        try {
            console.log('Loading hobbies by IDs:', hobbyIds); // Log the IDs being used to fetch hobbies
    
            const rowDiv = document.createElement('div');
            rowDiv.className = 'row'; // Create a row div
    
            for (const hobbyId of hobbyIds) {
                const hobbyDoc = await getDoc(doc(db, 'hobbies', hobbyId));
    
                if (hobbyDoc.exists()) {
                    const hobby = hobbyDoc.data();
                    console.log('Hobby found:', hobby); // Log each hobby found
    
                    const hobbyCard = document.createElement('div');
                    hobbyCard.classList.add('col-md-4', 'mb-4');
    
                    const maxStars = 5;
                    let starsHtml = '';
                    for (let i = 1; i <= maxStars; i++) {
                        if (i <= hobby.difficulty) {
                            starsHtml += `<i class="fas fa-star" style="color: #091747;"></i>`;
                        } else {
                            starsHtml += `<i class="far fa-star" style="color: #091747;"></i>`;
                        }
                    }
    
                    hobbyCard.innerHTML = `
                        <div class="card h-100">
                            <div class="d-flex justify-content-center">
                                <img src="${hobby.image}" class="card-img-top" alt="${hobby.name}" style="height: 200px; object-fit: cover;">
                            </div>
                            <div class="card-body text-center">
                                <h5 class="card-title">${hobby.name}</h5>
                                <div class="hobby-difficulty mb-2">
                                    <strong>Difficulty:</strong> ${starsHtml} <!-- Difficulty stars -->
                                </div>
                                <p class="card-text">${hobby.description}</p>
                                <p><strong>Tags:</strong> ${hobby.tags.map(tag => `<span class="badge bg-secondary m-1">${tag}</span>`).join('')}</p>
                            </div>
                        </div>
                    `;
    
                    rowDiv.appendChild(hobbyCard);
                } else {
                    console.log(`Hobby with ID ${hobbyId} not found.`);
                }
            }
    
            currentHobbiesContainer.appendChild(rowDiv);
        } catch (error) {
            console.error("Error loading current hobbies:", error);
            currentHobbiesContainer.innerHTML = '<p>Error loading hobbies. Please try again later.</p>';
        }
    }
    
    
    

    // Sign out button handler
    document.getElementById('signOutBtn').addEventListener('click', () => {
        auth.signOut().then(() => {
            window.location.href = "index.html";
        }).catch((error) => {
            console.error("Error signing out:", error);
        });
    });
});
