import { initializeApp } from "firebase/app";
import {
  getAuth,
  connectAuthEmulator,
  setPersistence,
  indexedDBLocalPersistence,
} from "firebase/auth";
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
const appId = typeof __app_id !== "undefined" ? __app_id : "default-app-id";

// --- SET PERSISTENCE ---
if (typeof window !== "undefined") {
  setPersistence(auth, indexedDBLocalPersistence);
}

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
  await updateDoc(userDocRef, {
    "partner.workoutHistory": arrayUnion(workout),
  });
};
