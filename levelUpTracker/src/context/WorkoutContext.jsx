import React, { createContext, useContext, useState, useCallback } from "react";

const WorkoutContext = createContext();

export const useWorkout = () => useContext(WorkoutContext);

export const WorkoutProvider = ({
  children,
  userProfile,
  handleUpdateProfile,
}) => {
  const [workoutPlan, setWorkoutPlan] = useState(userProfile.workoutPlan);

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

  const value = {
    workoutPlan,
    recalculateWorkout: handleRecalculateWorkout,
  };

  return (
    <WorkoutContext.Provider value={value}>{children}</WorkoutContext.Provider>
  );
};
