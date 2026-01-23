// src/hooks/useFirebaseUser.js
import { useState, useEffect, useCallback } from "react";
import { db } from "../firebase.js";
import { doc, setDoc, onSnapshot, updateDoc } from "firebase/firestore";
import programTemplates from "../../public/program-templates.json";
import { EXERCISE_DATABASE } from "../lib/constants";

const appId = import.meta.env.VITE_APP_ID || (typeof __app_id !== "undefined" ? __app_id : "default-app-id");

/**
 * Creates a default user profile when a new user signs up.
 * This is separated from the main hook for clarity.
 */
async function initializeUserProfile(userId, userDocRef) {
  const [defaultMaxes, plateData] = await Promise.all([
    fetch("/default-maxes.json").then(res => res.json()).catch(() => ({})),
    fetch("/plate-data.json").then(res => res.json()).catch(() => []),
  ]);

  const custom531Program = programTemplates.programs.custom_531;
  const lifts = programTemplates.lifts;

  const exerciseLibrary = Object.keys(custom531Program)
    .filter((key) => key.startsWith("day_"))
    .flatMap((day) => Object.keys(custom531Program[day]))
    .reduce((acc, exerciseId) => {
      if (!acc.find((ex) => ex.id === exerciseId)) {
        const lift = lifts[exerciseId];
        const exerciseInfo = Object.values(EXERCISE_DATABASE)
          .flat()
          .find((ex) => ex.name === (lift ? lift.name : exerciseId.replace(/_/g, " ").replace(/\b\w/g, l => l.toUpperCase())));
        const exerciseType = exerciseInfo ? exerciseInfo.type : "weighted";
        acc.push({
          id: exerciseId,
          name: lift ? lift.name : exerciseId.replace(/_/g, " ").replace(/\b\w/g, l => l.toUpperCase()),
          oneRepMax: defaultMaxes[exerciseId] || 100,
          lastUpdated: new Date().toISOString(),
          type: exerciseType,
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
          const oneRepMax = (exerciseLibrary.find(e => e.id === exerciseId) || {}).oneRepMax || 100;

          const exerciseInfo = Object.values(EXERCISE_DATABASE)
            .flat()
            .find((ex) => ex.name === (lift ? lift.name : exerciseId.replace(/_/g, " ").replace(/\b\w/g, l => l.toUpperCase())));
          const exerciseType = exerciseInfo ? exerciseInfo.type : "weighted";

          const sets = exercise.reps.map((rep, index) => {
            const percentage = exercise.percentages[index] / 100;
            return {
              reps: rep,
              percentage: percentage,
              weight: Math.round((oneRepMax * percentage) / 2.5) * 2.5,
            };
          });

          return {
            id: exerciseId,
            name: lift ? lift.name : exerciseId.replace(/_/g, " ").replace(/\b\w/g, l => l.toUpperCase()),
            type: exerciseType,
            sets: sets,
          };
        }),
      };
      return acc;
    }, {});

  const defaultProfile = {
    goal: "strength",
    level: "intermediate",
    availableEquipment: [],
    availablePlates: plateData.map((p) => ({ weight: p.weight, count: p.quantity })),
    exerciseLibrary,
    workoutPlan,
    workoutHistory: [],
    xp: 0,
    level: 1,
  };

  await setDoc(userDocRef, defaultProfile);
  return { ...defaultProfile, uid: userId };
}

/**
 * Migrates missing fields on existing user profiles.
 * Called when we detect the profile exists but has missing data.
 */
async function migrateUserProfile(userId, userProfileData, userDocRef) {
  const updates = {};
  let needsUpdate = false;

  // Add exercise types if missing
  if (userProfileData.workoutPlan) {
    const newWorkoutPlan = JSON.parse(JSON.stringify(userProfileData.workoutPlan));
    for (const day in newWorkoutPlan) {
      const exercises = newWorkoutPlan[day].exercises;
      for (const exercise of exercises) {
        if (!exercise.type) {
          const exerciseInfo = Object.values(EXERCISE_DATABASE)
            .flat()
            .find((ex) => ex.name === exercise.name);
          if (exerciseInfo) {
            exercise.type = exerciseInfo.type;
            needsUpdate = true;
          }
        }
      }
    }
    if (needsUpdate) {
      updates.workoutPlan = newWorkoutPlan;
    }
  }

  // Add default plates if missing
  if (!userProfileData.availablePlates || userProfileData.availablePlates.length === 0) {
    try {
      const plateData = await fetch("/plate-data.json").then(res => res.json());
      updates.availablePlates = plateData.map((p) => ({ weight: p.weight, count: p.quantity }));
      needsUpdate = true;
    } catch (err) {
      console.error("Error fetching plate data:", err);
    }
  }

  // Initialize partner workout plan if partner exists but plan is missing
  if (userProfileData.partner && !userProfileData.partner.workoutPlan && userProfileData.workoutPlan) {
    try {
      const defaultMaxes = await fetch("/partner_default_maxes.json").then(res => res.json());
      const partnerWorkoutPlan = JSON.parse(JSON.stringify(userProfileData.workoutPlan));
      for (const day in partnerWorkoutPlan) {
        for (const exercise of partnerWorkoutPlan[day].exercises) {
          const newOneRepMax = defaultMaxes[exercise.id] || 50;
          exercise.sets.forEach(set => {
            set.weight = Math.round((newOneRepMax * set.percentage) / 2.5) * 2.5;
          });
        }
      }
      updates["partner.workoutPlan"] = partnerWorkoutPlan;
      updates["partner.maxes"] = defaultMaxes;
      needsUpdate = true;
    } catch (err) {
      console.error("Error initializing partner data:", err);
    }
  }

  if (needsUpdate) {
    await updateDoc(userDocRef, updates);
  }

  return { ...userProfileData, ...updates, uid: userId };
}

/**
 * Hook to manage Firebase user profile data.
 * Handles fetching, real-time updates, and profile initialization.
 */
export const useFirebaseUser = (userId) => {
  const [userProfile, setUserProfile] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!userId) {
      setUserProfile(null);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    const userDocRef = doc(
      db,
      `artifacts/${appId}/users/${userId}/profile`,
      "userProfile"
    );

    const unsubscribe = onSnapshot(
      userDocRef,
      async (docSnap) => {
        try {
          if (docSnap.exists()) {
            const data = docSnap.data();
            const profile = await migrateUserProfile(userId, data, userDocRef);
            setUserProfile(profile);
          } else {
            const profile = await initializeUserProfile(userId, userDocRef);
            setUserProfile(profile);
          }
        } catch (err) {
          console.error("Error processing user profile:", err);
          setError(err.message);
        } finally {
          setIsLoading(false);
        }
      },
      (err) => {
        console.error("Firestore snapshot error:", err);
        setError(err.message);
        setIsLoading(false);
      }
    );

    return () => unsubscribe();
  }, [userId]);

  const updateUserProfileInFirestore = useCallback(
    async (updatedData) => {
      if (!userId) {
        console.error("Cannot update profile: User not authenticated.");
        setError("User not authenticated. Please try again.");
        return;
      }
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
      }
    },
    [userId]
  );

  const deleteWorkout = useCallback(
    async (workoutIndex) => {
      if (!userProfile) return;

      const newHistory = [...userProfile.workoutHistory];
      newHistory.splice(workoutIndex, 1);

      await updateUserProfileInFirestore({ workoutHistory: newHistory });
    },
    [userProfile, updateUserProfileInFirestore]
  );

  return {
    userProfile,
    isLoading,
    error,
    updateUserProfileInFirestore,
    deleteWorkout,
  };
};