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

  // Authentication Emulator (default port 9099)
  connectAuthEmulator(auth, "http://localhost:9099");

  // Firestore Emulator (default port 8080)
  connectFirestoreEmulator(db, "localhost", 8080);

  // Storage Emulator (default port 9199)
  connectStorageEmulator(storage, "localhost", 9199);

  // Functions Emulator (default port 5001)
  // Note: For callable functions, you'll generally use the default region
  // but the host/port is for the emulator
  connectFunctionsEmulator(functions, "localhost", 5001);

  // You can also connect to other emulators if you set them up (e.g., Realtime Database)
  // If you plan to use Realtime Database, uncomment the line below:
  // connectDatabaseEmulator(rtdb, "localhost", 9000);
}
