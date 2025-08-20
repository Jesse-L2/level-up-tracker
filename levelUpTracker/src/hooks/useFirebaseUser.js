// src/hooks/useFirebaseUser.js
import { useState, useEffect, useCallback } from "react";
import { db, auth } from "../firebase.js";
import { doc, setDoc, onSnapshot, updateDoc } from "firebase/firestore";
import {
  signInAnonymously,
  signInWithCustomToken,
  onAuthStateChanged,
} from "firebase/auth";
import programTemplates from "../../public/program-templates.json";

export const useFirebaseUser = () => {
  // A custom React Hook to handle user auth and profile data w/ firebase
  const [userId, setUserId] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isAuthReady, setIsAuthReady] = useState(false);

  const appId = typeof __app_id !== "undefined" ? __app_id : "default-app-id";

  useEffect(() => {
    const setupFirebase = async () => {
      try {
        if (
          typeof __initial_auth_token !== "undefined" &&
          __initial_auth_token
        ) {
          await signInWithCustomToken(auth, __initial_auth_token);
        } else {
          await signInAnonymously(auth);
        }
      } catch (err) {
        console.error("Firebase Auth Error:", err);
        setError(err.message);
        setIsLoading(false);
      }
    };

    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      if (user) {
        setUserId(user.uid);
        setIsAuthReady(true);
      } else {
        setUserId(null);
        setUserProfile(null);
        setIsLoading(false);
        setIsAuthReady(true);
      }
    });

    setupFirebase();

    return () => unsubscribeAuth();
  }, []);

  useEffect(() => {
    let unsubscribeFirestore = () => {};

    if (isAuthReady && userId) {
      const userDocRef = doc(
        db,
        `artifacts/${appId}/users/${userId}/profile`,
        "userProfile"
      );

      unsubscribeFirestore = onSnapshot(
        userDocRef,
        (docSnap) => {
          if (docSnap.exists()) {
            setUserProfile(docSnap.data());
          } else {
            const custom531Program = programTemplates.programs.custom_531;
            const lifts = programTemplates.lifts;

            const exerciseLibrary = Object.keys(custom531Program)
              .filter((key) => key.startsWith("day_"))
              .flatMap((day) => Object.keys(custom531Program[day]))
              .reduce((acc, exerciseId) => {
                if (!acc.find((ex) => ex.id === exerciseId)) {
                  const lift = lifts[exerciseId];
                  acc.push({
                    id: exerciseId,
                    name: lift ? lift.name : exerciseId.replace(/_/g, " ").replace(/\b\w/g, l => l.toUpperCase()),
                    oneRepMax: 100, // Default 1RM
                    lastUpdated: new Date().toISOString(),
                    type: "weighted", // Assuming all are weighted for now
                  });
                }
                return acc;
              }, []);

            const workoutPlan = Object.keys(custom531Program)
              .filter((key) => key.startsWith("day_"))
              .reduce((acc, day) => {
                const dayExercises = custom531Program[day];
                acc[day] = {
                  name: day.replace(/_/g, " ").replace(/\b\w/g, l => l.toUpperCase()),
                  exercises: Object.keys(dayExercises).map((exerciseId) => {
                    const exercise = dayExercises[exerciseId];
                    const lift = lifts[exerciseId];
                    return {
                      id: exerciseId,
                      name: lift ? lift.name : exerciseId.replace(/_/g, " ").replace(/\b\w/g, l => l.toUpperCase()),
                      sets: exercise.sets,
                      reps: exercise.reps.map(rep => typeof rep === 'string' ? parseInt(rep.replace('+', '')) : rep),
                      percentages: exercise.percentages,
                    };
                  }),
                };
                return acc;
              }, {});

            const defaultProfile = {
              goal: "strength",
              level: "intermediate",
              availableEquipment: [],
              availablePlates: [],
              exerciseLibrary,
              workoutPlan,
              workoutHistory: [],
            };
            setDoc(userDocRef, defaultProfile)
              .then(() => setUserProfile(defaultProfile))
              .catch((err) => {
                console.error("Error setting default profile:", err);
                setError(err.message);
              });
          }
          setIsLoading(false);
        },
        (err) => {
          console.error("Firestore snapshot error:", err);
          setError(err.message);
          setIsLoading(false);
        }
      );
    } else if (isAuthReady && !userId) {
      setIsLoading(false);
    }

    return () => unsubscribeFirestore();
  }, [isAuthReady, userId, appId]);

  const updateUserProfileInFirestore = useCallback(
    async (updatedData) => {
      if (!userId) {
        console.error("Cannot update profile: User not authenticated.");
        setError("User not authenticated. Please try again.");
        return;
      }
      setIsLoading(true);
      setError(null);
      try {
        const userDocRef = doc(
          db,
          `artifacts/${appId}/users/${userId}/profile`,
          "userProfile"
        );
        await updateDoc(userDocRef, updatedData);
      } catch (err) {
        console.error("Error updating user profile:", err);
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    },
    [userId, appId]
  );

  return {
    userId,
    userProfile,
    isLoading,
    error,
    updateUserProfileInFirestore,
  };
};
