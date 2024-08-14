import { auth, db, onAuthStateChanged, collection, query, where, getDocs, updateDoc, getDoc, doc } from './firebase.js';

document.addEventListener('DOMContentLoaded', () => {
    const hobbySearchResults = document.getElementById('hobbySearchResults');

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

                    loadHobbies(userData.hobbyTags || [], userDoc.id);
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
    
                hobbyCard.innerHTML = `
                    <div class="card">
                        <img src="${hobby.image}" class="card-img-top" alt="${hobby.name}" style="height: 200px; object-fit: cover;">
                        <div class="card-body">
                            <h5 class="card-title">${hobby.name}</h5>
                            <div class="hobby-tags mb-2">
                                ${hobby.tags.map(tag => `<span class="badge bg-secondary">${tag}</span>`).join(' ')}
                            </div>
                            <div class="hobby-description">
                                <p class="card-text">${hobby.description || 'No description available.'}</p>
                                <button class="btn btn-primary add-to-profile-btn" ${isSaved ? 'disabled' : ''}>
                                    ${isSaved ? 'Already Saved' : 'Add to my Profile'}
                                </button>
                            </div>
                        </div>
                    </div>
                `;
    
                const card = hobbyCard.querySelector('.card');
                const description = hobbyCard.querySelector('.hobby-description');
                const addButton = hobbyCard.querySelector('.add-to-profile-btn');
    
                // Expand the card on click
                card.addEventListener('click', () => {
                    description.classList.toggle('expanded');
                });
    
                // Add hobby to profile
                addButton.addEventListener('click', async (e) => {
                    e.stopPropagation(); 
    
                    if (isSaved) {
                        return; // Do nothing if the hobby is already saved
                    }
    
                    try {
                        currentHobbies.push(hobby.id);
                        await updateDoc(userRef, { currentHobbies });
    
                        // Update the UI to reflect the hobby is saved
                        hobbyCard.classList.add('saved-hobby');
                        addButton.textContent = 'Already Saved';
                        addButton.classList.add('btn-secondary');
                        addButton.classList.remove('btn-primary');
                        addButton.disabled = true; // Disable the button
    
                    } catch (error) {
                        console.error('Error adding hobby to profile:', error);
                        alert('Error adding hobby to profile: ' + error.message);
                    }
                });
    
                hobbySearchResults.appendChild(hobbyCard);
            });
    
        } catch (error) {
            console.error("Error loading hobbies:", error);
            hobbySearchResults.innerHTML = '<p>Error loading hobbies. Please try again later.</p>';
        }
    }
    
    
});
