import { initializeApp } from "firebase/app";
import { getAuth, connectAuthEmulator } from "firebase/auth";
import { getFirestore, connectFirestoreEmulator } from "firebase/firestore";
import { getStorage, connectStorageEmulator } from "firebase/storage";
import { getFunctions, connectFunctionsEmulator } from "firebase/functions";
import { getDatabase, connectDatabaseEmulator } from "firebase/database";

// Your web app's Firebase configuration (from Firebase Console)
const firebaseConfig =
  typeof __firebase_config !== "undefined"
    ? JSON.parse(__firebase_config)
    : {
        // --- IMPORTANT: Use import.meta.env.VITE_ instead of process.env ---
        apiKey: import.meta.env.VITE_API_KEY,
        authDomain: import.meta.env.VITE_AUTH_DOMAIN,
        projectId: import.meta.env.VITE_PROJECT_ID,
        storageBucket: import.meta.env.VITE_STORAGE_BUCKET,
        messagingSenderId: import.meta.env.VITE_MESSAGING_SENDER_ID,
        appId: import.meta.env.VITE_APP_ID,
        measurementId: import.meta.env.VITE_MEASUREMENT_ID,
      };

// --- Firebase Initialization ---
export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
export const functions = getFunctions(app);
export const rtdb = getDatabase(app);

// --- CONNECT TO EMULATORS IN DEVELOPMENT ---
// Check if we are running on localhost (common for React dev servers)
if (window.location.hostname === "localhost") {
  console.log("Connecting to Firebase Emulators...");

  connectAuthEmulator(auth, "http://localhost:9099");

  connectFirestoreEmulator(db, "localhost", 8080);

  connectStorageEmulator(storage, "localhost", 9199);

  connectFunctionsEmulator(functions, "localhost", 5001);
}
