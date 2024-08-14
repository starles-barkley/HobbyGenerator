import { auth, db, onAuthStateChanged, collection, query, where, getDocs, updateDoc, getDoc, doc, signOut } from './firebase.js';

document.addEventListener('DOMContentLoaded', () => {
    const hobbySearchResults = document.getElementById('hobbySearchResults');
    const hobbyModal = document.getElementById('hobbyModal');
    const modalContent = hobbyModal.querySelector('#modalContent');
    const closeModal = hobbyModal.querySelector('.close');
    const navBar = document.querySelector('.nav-bar');

    onAuthStateChanged(auth, async (user) => {
        if (user) {
            console.log("User signed in:", user.uid);

            // Update the navbar to show the home icon and sign-out button
            navBar.innerHTML = `
            <h1 class="m-0">HobbyMate</h1>
            <div id="authButtons" class="d-flex align-items-center">
                <a href="userpage.html" class="btn ms-3" style="background-color: #BFEFFF; color: #091747;">
                    <i class="fas fa-home"></i>
                </a>
                <button id="signOutBtn" class="btn ms-3" style="background-color: #BFEFFF; color: #091747;">
                    <i class="fas fa-sign-out-alt"></i> Sign Out
                </button>
            </div>
        `;

            document.getElementById('signOutBtn').addEventListener('click', async () => {
                try {
                    await signOut(auth);
                    window.location.href = "index.html";
                } catch (error) {
                    console.error('Sign Out Error', error);
                }
            });

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

                    loadHobbies(userData.hobbyTags || [], userDoc.id);
                } else {
                    console.error("No user document found!");
                }
            } catch (error) {
                console.error("Error fetching user data:", error);
            }
        } else {
            // No user is signed in, redirect to the index page
            console.error("No user is signed in!");
            window.location.href = "index.html";
        }
    });

    async function loadHobbies(hobbyTags, userId) {
        hobbySearchResults.innerHTML = ''; 
    
        try {
            const userRef = doc(db, 'users', userId);
            const userDoc = await getDoc(userRef);
            let currentHobbies = [];
    
            if (userDoc.exists()) {
                const userData = userDoc.data();
                currentHobbies = userData.currentHobbies || [];
            }
    
            const hobbiesQuery = query(collection(db, 'hobbies'), where('tags', 'array-contains-any', hobbyTags));
            const querySnapshot = await getDocs(hobbiesQuery);
    
            if (querySnapshot.empty) {
                hobbySearchResults.innerHTML = '<p>No hobbies found matching your interests.</p>';
                return;
            }
    
            const hobbiesWithTagCount = [];
    
            querySnapshot.forEach((doc) => {
                const hobby = doc.data();
                const matchingTagsCount = hobby.tags.filter(tag => hobbyTags.includes(tag)).length;
    
                hobbiesWithTagCount.push({ ...hobby, matchingTagsCount, id: doc.id });
            });
    
            hobbiesWithTagCount.sort((a, b) => b.matchingTagsCount - a.matchingTagsCount);
    
            hobbiesWithTagCount.forEach(hobby => {
                const hobbyCard = document.createElement('div');
                hobbyCard.classList.add('col-lg-3', 'col-md-4', 'col-sm-6', 'mb-4', 'hobby-card');
            
                // Check if this hobby is already saved to the user's profile
                const isSaved = currentHobbies.includes(hobby.id);
                if (isSaved) {
                    hobbyCard.classList.add('saved-hobby'); // Add a class to indicate it's saved
                }
            
                // Generate the stars for difficulty
                const maxStars = 5;
                let starsHtml = '';
                for (let i = 1; i <= maxStars; i++) {
                    if (i <= hobby.difficulty) {
                        starsHtml += '<i class="fas fa-star"></i>';
                    } else {
                        starsHtml += '<i class="far fa-star"></i>';
                    }
                }
            
                hobbyCard.innerHTML = `
                    <div class="card">
                        <img src="${hobby.image}" class="card-img-top" alt="${hobby.name}" style="max-width: 100%; max-height: 250px; min-height:250px; object-fit: cover;">
                        <div class="card-body">
                            <h5 class="card-title">${hobby.name}</h5>
                            <div class="hobby-difficulty mb-2">
                                <strong>Difficulty:</strong> ${starsHtml} <!-- Difficulty stars -->
                            </div>
                            <div class="hobby-tags mb-2">
                                ${hobby.tags.map(tag => `<span class="badge bg-secondary">${tag}</span>`).join(' ')}
                            </div>
                        </div>
                    </div>
                `;
            
                const card = hobbyCard.querySelector('.card');

                // Show the modal on card click
                card.addEventListener('click', () => {
                    // Build the modal content
                    const modalContentHtml = `
                        <div class="card">
                            <img src="${hobby.image}" class="card-img-top" alt="${hobby.name}" style="width: 100%; height: auto;">
                            <div class="card-body">
                                <h5 class="card-title">${hobby.name}</h5>
                                <div class="hobby-difficulty mb-2">
                                    <strong>Difficulty:</strong> ${starsHtml} <!-- Difficulty stars -->
                                </div>
                                <div class="hobby-tags mb-2">
                                    ${hobby.tags.map(tag => `<span class="badge bg-secondary">${tag}</span>`).join(' ')}
                                </div>
                                <div class="hobby-description">
                                    <p class="card-text">${hobby.description || 'No description available.'}</p>
                                    <div class="wikipedia-summary">
                                        <p><strong>Wikipedia Summary:</strong> Loading...</p>
                                        <a href="${hobby.wikipediaLink || '#'}" target="_blank">${hobby.wikipediaLink ? 'View more on Wikipedia' : ''}</a>
                                    </div>
                                    <button id="saveToProfileBtn" class="btn" style="background-color: #BFEFFF; color: black;" ${isSaved ? 'disabled' : ''}>
                                        ${isSaved ? 'Already Saved' : 'Add to my Profile'}
                                    </button>
                                </div>
                            </div>
                        </div>
                    `;

                    modalContent.innerHTML = modalContentHtml;
                    hobbyModal.style.display = 'block'; 

                    const saveToProfileBtn = hobbyModal.querySelector('#saveToProfileBtn');
                    saveToProfileBtn.addEventListener('click', async () => {
                        if (!isSaved) {
                            try {
                                currentHobbies.push(hobby.id);
                                await updateDoc(userRef, { currentHobbies });

                                saveToProfileBtn.textContent = 'Already Saved';
                                saveToProfileBtn.classList.add('btn-secondary');
                                saveToProfileBtn.classList.remove('btn-primary');
                                saveToProfileBtn.disabled = true;

                            } catch (error) {
                                console.error('Error adding hobby to profile:', error);
                                alert('Error adding hobby to profile: ' + error.message);
                            }
                        }
                    });

                    // Fetch Wikipedia summary and update the card
                    if (hobby.wikipediaLink) {
                        const wikiTitle = hobby.wikipediaLink.split('/').pop();
                        fetchWikipediaSummary(wikiTitle).then(summary => {
                            const modalWikiSummary = hobbyModal.querySelector('.wikipedia-summary p');
                            modalWikiSummary.innerHTML = `<strong>Wikipedia Summary:</strong> ${summary}`;
                        }).catch(error => {
                            const modalWikiSummary = hobbyModal.querySelector('.wikipedia-summary p');
                            modalWikiSummary.innerHTML = '<strong>Wikipedia Summary:</strong> Could not load Wikipedia summary.';
                        });
                    }
                });

                hobbySearchResults.appendChild(hobbyCard);
            });
    
        } catch (error) {
            console.error("Error loading hobbies:", error);
            hobbySearchResults.innerHTML = '<p>Error loading hobbies. Please try again later.</p>';
        }
    }

    // Fetch Wikipedia summary for a given title
    async function fetchWikipediaSummary(title) {
        const response = await fetch(`https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(title)}`);
        if (!response.ok) {
            throw new Error('Failed to fetch Wikipedia summary');
        }
        const data = await response.json();
        return data.extract || 'No summary available.';
    }

    closeModal.onclick = function() {
        hobbyModal.style.display = "none";
    }
    window.onclick = function(event) {
        if (event.target == hobbyModal) {
            hobbyModal.style.display = "none";
        }
    }
});
