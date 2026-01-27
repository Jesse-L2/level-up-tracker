import React, { createContext, useContext, useState, useCallback, useEffect } from "react";

const WorkoutContext = createContext();

export const useWorkout = () => useContext(WorkoutContext);

export const WorkoutProvider = ({
  children,
  userProfile,
  handleUpdateProfile,
}) => {
  const [workoutPlan, setWorkoutPlan] = useState(userProfile?.workoutPlan);

  // Independent timer states for user and partner
  const [timers, setTimers] = useState({
    user: { isActive: false, duration: 0, setIndex: null },
    partner: { isActive: false, duration: 0, setIndex: null },
  });

  // Sync workoutPlan state with userProfile.workoutPlan when it changes from Firebase
  useEffect(() => {
    if (userProfile?.workoutPlan) {
      setWorkoutPlan(userProfile.workoutPlan);
    }
  }, [userProfile?.workoutPlan]);


  const handleRecalculateWorkout = useCallback(() => {
    if (!userProfile || !workoutPlan) return;

    const newWorkoutPlan = { ...workoutPlan };

    for (const dayKey in newWorkoutPlan) {
      const workoutDay = newWorkoutPlan[dayKey];
      const updatedExercises = workoutDay.exercises.map((exercise) => {
        const libraryExercise = userProfile.exerciseLibrary.find(
          (e) => e.name === exercise.name
        );

        if (!libraryExercise) return exercise;

        const oneRepMax = libraryExercise.oneRepMax;
        const updatedSets = exercise.sets.map((set) => ({
          ...set,
          weight: Math.round((oneRepMax * set.percentage) / 2.5) * 2.5,
        }));

        return {
          ...exercise,
          oneRepMax: oneRepMax,
          sets: updatedSets,
        };
      });

      newWorkoutPlan[dayKey] = {
        ...workoutDay,
        exercises: updatedExercises,
      };
    }

    setWorkoutPlan(newWorkoutPlan);
    handleUpdateProfile({ workoutPlan: newWorkoutPlan });
  }, [userProfile, workoutPlan, handleUpdateProfile]);

  // Start timer for a specific user type (user or partner)
  const startTimer = (duration, userType, setIndex) => {
    setTimers((prev) => ({
      ...prev,
      [userType]: { isActive: true, duration, setIndex },
    }));
  };

  // Stop timer for a specific user type
  const stopTimer = (userType) => {
    setTimers((prev) => ({
      ...prev,
      [userType]: { isActive: false, duration: 0, setIndex: null },
    }));
  };

  // Stop all timers (used when navigating between exercises)
  const stopAllTimers = () => {
    setTimers({
      user: { isActive: false, duration: 0, setIndex: null },
      partner: { isActive: false, duration: 0, setIndex: null },
    });
  };

  const value = {
    workoutPlan,
    recalculateWorkout: handleRecalculateWorkout,
    timers,
    startTimer,
    stopTimer,
    stopAllTimers,
    updateUserProfileInFirestore: handleUpdateProfile,
  };

  return (
    <WorkoutContext.Provider value={value}>{children}</WorkoutContext.Provider>
  );
};
