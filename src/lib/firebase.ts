
import { initializeApp, getApps, FirebaseApp } from 'firebase/app';
import { getAuth, Auth } from 'firebase/auth';
import { getFirestore, Firestore } from 'firebase/firestore';
import { getAnalytics, Analytics } from "firebase/analytics";

// User's provided Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyD9WLYfYABgP3mbj4n4LXy7dxq9ZqHvkqA",
  authDomain: "movie-recs-a417b.firebaseapp.com",
  projectId: "movie-recs-a417b",
  storageBucket: "movie-recs-a417b.firebasestorage.app",
  messagingSenderId: "678467783006",
  appId: "1:678467783006:web:dd881ffaa46a3cbeb8e7cf",
  measurementId: "G-7F6E49ZV34" // Optional but included by user
};

let app: FirebaseApp;
if (!getApps().length) {
  app = initializeApp(firebaseConfig);
} else {
  app = getApps()[0];
}

const auth: Auth = getAuth(app);
const db: Firestore = getFirestore(app);

let analytics: Analytics | undefined;
// Initialize Analytics only on the client side
if (typeof window !== 'undefined') {
  // Firebase JS SDK's getAnalytics function is idempotent for the same app instance.
  analytics = getAnalytics(app);
}

export { app, auth, db, analytics };
