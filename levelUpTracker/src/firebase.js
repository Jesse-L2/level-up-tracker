import { initializeApp } from "firebase/app";
import {
  getAuth,
  connectAuthEmulator,
  setPersistence,
  indexedDBLocalPersistence,
  GoogleAuthProvider,
  signInWithRedirect,
  getRedirectResult,
} from "firebase/auth";

// Utility to detect mobile devices for authentication flow selection
export const isMobileDevice = () => {
  if (typeof window === "undefined" || typeof navigator === "undefined") {
    return false;
  }
  return (
    /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
      navigator.userAgent
    ) || window.innerWidth <= 768
  );
};

// Re-export redirect functions for use in components
export { signInWithRedirect, getRedirectResult };
import {
  getFirestore,
  connectFirestoreEmulator,
  doc,
  updateDoc,
  arrayUnion,
} from "firebase/firestore";
import { getStorage, connectStorageEmulator } from "firebase/storage";
import { getFunctions, connectFunctionsEmulator } from "firebase/functions";
import { getDatabase, connectDatabaseEmulator } from "firebase/database";

// Your web app's Firebase configuration (from Firebase Console)
// TODO: Replace this with your own Firebase project configuration.
const firebaseConfig =
  typeof __firebase_config !== "undefined"
    ? JSON.parse(__firebase_config)
    : {
      apiKey: import.meta.env.VITE_API_KEY,
      authDomain: import.meta.env.VITE_AUTH_DOMAIN,
      databaseURL: import.meta.env.VITE_DATABASE_URL,
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
const appId = import.meta.env.VITE_APP_ID || (typeof __app_id !== "undefined" ? __app_id : "default-app-id");

// --- SET PERSISTENCE ---
if (typeof window !== "undefined") {
  setPersistence(auth, indexedDBLocalPersistence);
}

// --- Social Auth Providers ---
export const googleProvider = new GoogleAuthProvider();

export const addPartner = async (userId, partnerName) => {
  const userDocRef = doc(
    db,
    `artifacts/${appId}/users/${userId}/profile`,
    "userProfile"
  );
  await updateDoc(userDocRef, {
    partner: {
      name: partnerName,
      workoutHistory: [],
      maxes: {},
    },
  });
};

export const updatePartnerName = async (userId, newPartnerName) => {
  const userDocRef = doc(
    db,
    `artifacts/${appId}/users/${userId}/profile`,
    "userProfile"
  );
  await updateDoc(userDocRef, {
    "partner.name": newPartnerName,
  });
};

export const removePartner = async (userId) => {
  const userDocRef = doc(
    db,
    `artifacts/${appId}/users/${userId}/profile`,
    "userProfile"
  );
  await updateDoc(userDocRef, {
    partner: null,
  });
};

export const savePartnerWorkout = async (userId, workout) => {
  const userDocRef = doc(
    db,
    `artifacts/${appId}/users/${userId}/profile`,
    "userProfile"
  );

  // Sanitize data to remove any undefined values which Firestore rejects
  const sanitizedWorkout = JSON.parse(JSON.stringify(workout));

  await updateDoc(userDocRef, {
    "partner.workoutHistory": arrayUnion(sanitizedWorkout),
  });
};
