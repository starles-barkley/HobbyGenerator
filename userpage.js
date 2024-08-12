import { auth, db, onAuthStateChanged, doc, getDoc, updateDoc, collection, query, where, getDocs } from './firebase.js';
import { getStorage, ref, uploadBytes, getDownloadURL } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-storage.js";

document.addEventListener('DOMContentLoaded', () => {
    const profilePhotoInput = document.getElementById('profilePhotoInput');
    const userHobbyTagsContainer = document.getElementById('userHobbyTags');
    const discoverHobbiesContainer = document.getElementById('discoverHobbies');
    const currentHobbiesContainer = document.getElementById('currentHobbies');

    onAuthStateChanged(auth, async (user) => {
        if (user) {
            console.log("User signed in:", user.uid);

            try {
                // Query the users collection to find the document with the correct uid
                const usersQuery = query(collection(db, 'users'), where('uid', '==', user.uid));
                const querySnapshot = await getDocs(usersQuery);
                let userDoc = null;

                querySnapshot.forEach((doc) => {
                    userDoc = doc;  // Assume there is only one document matching the UID
                });

                if (userDoc && userDoc.exists()) {
                    const userData = userDoc.data();
                    console.log("User data found:", userData);

                    // Populate the page with user data
                    document.getElementById('firstName').value = userData.firstName || '';
                    document.getElementById('lastName').value = userData.lastName || '';
                    document.getElementById('email').value = userData.email || '';

                    // Display user hobby tags
                    displayHobbyTags(userData.hobbyTags || []);

                    // Load current hobbies
                    console.log('Loading current hobbies:', userData.currentHobbies || []); // Log the current hobbies
                    loadCurrentHobbies(userData.currentHobbies || []);

                    // Load all hobby tags and display them in the Discover New Hobbies section
                    loadDiscoverHobbies(userData.hobbyTags || []);
                } else {
                    console.error("No user document found!");
                }
            } catch (error) {
                console.error("Error fetching user data:", error);
            }
        } else {
            console.error("No user is signed in!");
        }
    });

    // Handle profile photo upload
    profilePhotoInput.addEventListener('change', async (e) => {
        const file = e.target.files[0];
        if (file) {
            const storage = getStorage();
            const storageRef = ref(storage, `profilePhotos/${auth.currentUser.uid}/${file.name}`);
            try {
                await uploadBytes(storageRef, file);
                const downloadURL = await getDownloadURL(storageRef);

                // Update user's profile photo URL in Firestore
                const userRef = doc(db, 'users', auth.currentUser.uid);
                await updateDoc(userRef, { profilePhotoUrl: downloadURL });

                // Update the profile photo on the page
                document.querySelector('img[alt="Profile Photo"]').src = downloadURL;

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
            // Fetch the user's document based on UID
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

    // Load all available hobby tags and display them in the Discover New Hobbies section
    async function loadDiscoverHobbies(userHobbyTags) {
        discoverHobbiesContainer.innerHTML = ''; // Clear previous tags

        try {
            const querySnapshot = await getDocs(collection(db, 'hobbyTags'));
            querySnapshot.forEach((doc) => {
                const tag = doc.data().tag;

                const tagButton = document.createElement('button');
                tagButton.type = 'button';
                tagButton.className = 'btn btn-outline-primary m-1';
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

            // Add "Find New Hobbies" button
            const findButton = document.createElement('button');
            findButton.className = 'btn btn-success mt-3';
            findButton.textContent = 'Find New Hobbies';
            findButton.addEventListener('click', async () => {
                const selectedTags = Array.from(discoverHobbiesContainer.children)
                    .filter(btn => btn.classList.contains('active'))
                    .map(btn => btn.dataset.tag);

                try {
                    // Fetch the user's document based on UID
                    const usersQuery = query(collection(db, 'users'), where('uid', '==', auth.currentUser.uid));
                    const querySnapshot = await getDocs(usersQuery);
                    let userDoc = null;

                    querySnapshot.forEach((doc) => {
                        userDoc = doc;  // Assume there is only one document matching the UID
                    });

                    if (userDoc) {
                        const userRef = doc(db, 'users', userDoc.id);
                        await updateDoc(userRef, { hobbyTags: selectedTags });

                        // Update the displayed user hobby tags without refreshing the page
                        displayHobbyTags(selectedTags);

                        // Redirect to hobbysearch.html
                        window.location.href = "hobbysearch.html";
                    } else {
                        console.error("No user document found!");
                    }
                } catch (error) {
                    console.error('Error saving hobbies:', error);
                    alert('Error saving hobbies: ' + error.message);
                }
            });
            discoverHobbiesContainer.appendChild(findButton);
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
                tagBadge.className = 'badge bg-secondary m-1';
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
    
            for (const hobbyId of hobbyIds) {
                const hobbyDoc = await getDoc(doc(db, 'hobbies', hobbyId));
    
                if (hobbyDoc.exists()) {
                    const hobby = hobbyDoc.data();
                    console.log('Hobby found:', hobby); // Log each hobby found
    
                    const hobbyCard = document.createElement('div');
                    hobbyCard.classList.add('card', 'mb-3');
                    hobbyCard.innerHTML = `
                        <img src="${hobby.image}" class="card-img-top" alt="${hobby.name}" style="height: 200px; object-fit: cover;">
                        <div class="card-body">
                            <h5 class="card-title">${hobby.name}</h5>
                            <p class="card-text">${hobby.description}</p>
                            <p><strong>Tags:</strong> ${hobby.tags.map(tag => `<span class="badge bg-secondary m-1">${tag}</span>`).join('')}</p>
                        </div>
                    `;
    
                    currentHobbiesContainer.appendChild(hobbyCard);
                } else {
                    console.log(`Hobby with ID ${hobbyId} not found.`);
                }
            }
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
