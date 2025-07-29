// Firebase configuration
export const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

// Initialize Firebase
export const initializeFirebase = () => {
  if (!window.firebase) {
    throw new Error('Firebase SDK not loaded');
  }

  if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
  }

  return {
    auth: firebase.auth(),
    db: firebase.firestore(),
  };
};
