
# HobbyMate

HobbyMate is a web application that helps users discover and manage their hobbies based on their interests. Users can explore hobbies, save their favorite ones, and manage their profile with hobby tags and personalized projects.

Max: If you want to see the Admin side, let us know when you make an account and we can grant you admin access.

## Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Firebase Setup](#firebase-setup)
- [Project Structure](#project-structure)
- [Database Design](#database-design)
- [Authentication](#authentication)
- [Hobby Management](#hobby-management)
- [Admin Page](#admin-page)
- [User Profile](#user-profile)
- [Hobby Discovery](#hobby-discovery)
- [Real-Time Updates](#real-time-updates)
- [Easter Egg Count](#Easter-egg-count)
- [Notes](#notes)
- [Authors](#authors)

## Features

- **User Authentication**: Sign up, log in, and manage profiles using Firebase Authentication.
- **Hobby Management**: Add, edit, and view hobbies with associated tags, images, and difficulty ratings.
- **Tagging System**: Users can select tags and use these tags to filter and discover new hobbies.
- **Real-Time Updates**: All changes to hobbies and user profiles are reflected in real-time across all users.
- **Admin Dashboard**: Manage users and hobbies, with the ability to grant admin privileges.

## Tech Stack

- **Frontend**: HTML, CSS, Bootstrap, JavaScript, jQuery
- **Backend**: Firebase (Authentication, Firestore, Storage)
- **Hosting**: Cloudflare Hosting

## Firebase Setup

### Firebase Configuration

```javascript
const firebaseConfig = {
  apiKey: "API_KEY",
  authDomain: "PROJECT_ID.firebaseapp.com",
  projectId: "PROJECT_ID",
  storageBucket: "PROJECT_ID.appspot.com",
  messagingSenderId: "SENDER_ID",
  appId: "APP_ID",
  measurementId: "MEASUREMENT_ID"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);
```

### Firebase Services

- **Authentication**: For user sign-up, login, and authentication state management.
- **Firestore**: For storing and managing user data, hobbies, and hobby tags.
- **Firebase Storage**: For storing user-uploaded images, such as profile pictures and hobby images.

## Project Structure

```plaintext
├── index.html
├── adminpage.html
├── userpage.html
├── hobbysearch.html
├── styles.css
├── firebase.js
├── admin.js
├── userpage.js
├── hobbysearch.js
└── images/
    ├── profile_photos/
    └── hobbies/
```

## Database Design

### Firestore Collections

- **users**
  - `uid`: String (User ID)
  - `email`: String (User email)
  - `firstName`: String (User first name)
  - `lastName`: String (User last name)
  - `profilePhotoUrl`: String (URL to user's profile photo)
  - `hobbyTags`: Array[String] (Tags selected by the user)
  - `currentHobbies`: Array[String] (IDs of hobbies saved by the user)
  - `isAdmin`: Boolean (Admin status)

- **hobbies**
  - `name`: String (Hobby name)
  - `description`: String (Hobby description)
  - `image`: String (URL to hobby image)
  - `tags`: Array[String] (Tags associated with the hobby)
  - `difficulty`: Integer (Difficulty rating 1-5)
  - `wikipediaLink`: String (Link to Wikipedia)

- **hobbyTags**
  - `tag`: String (Tag name)

## Authentication

- **User Sign-Up**: Users can sign up with an email and password. Upon successful registration, they are redirected to their profile page.
- **User Login**: Users can log in with their email and password. Upon successful login, they are redirected to their profile page or the admin page if they have admin privileges.

## Hobby Management

- **Add Hobby**: Admin's can add new hobbies, providing a name, description, image, difficulty rating, tags, and an optional Wikipedia link.
- **Edit Hobby**: Admin's can edit existing hobbies, with changes reflected in real-time.
- **Tagging**: Admin's can select tags associated with a hobby, which are used for filtering and discovering new hobbies.

## Admin Page

- **User Management**: Admins can view all users and update their admin status. 
- **Hobby Management**: Admins can add, edit, and view all hobbies, with real-time updates.

## User Profile

- **Profile Photo**: Users can upload a profile photo, which is stored in Firebase Storage and displayed on their profile page.
- **Hobby Tags**: Users can manage their hobby tags, which are used to filter and discover new hobbies.
- **Current Hobbies**: Users can view their saved hobbies in a card format with difficulty ratings and tags.

## Hobby Discovery

- **Tag-Based Filtering**: Users can discover new hobbies based on the tags they have selected.
- **Real-Time Discovery**: Hobbies are loaded and displayed in real-time, sorted by the number of matching tags.

## Real-Time Updates

- **Firestore OnSnapshot**: Real-time listeners are implemented across the application to ensure all data (hobbies, users, tags) are updated in real-time.
- **Live Hobby Updates**: When a user adds or edits a hobby, the changes are reflected immediately for all users without requiring a page refresh.

## Easter-Egg Count
1

## Notes
We wanted to add a `Projects` section to the user profile that would allow them to create projects under each hobby they have added to their profile to give the WebApp more depth, but we never got around to it. 

Additionally, there are a few extra files in this repository that aren't required / used for the final product. We've left them in the repository to show the growing & learning pains we've had along the way. In production, it would have been cleaned up. Also, the cloudflare project directory exists only to make it easy to upload and track the changes to the Cloudflare pages as changes are made.


### Authors
- [Benjamin Carter](https://www.github.com/bcart01v)
- [Starlee Jiles](https://github.com/starles-barkley)
