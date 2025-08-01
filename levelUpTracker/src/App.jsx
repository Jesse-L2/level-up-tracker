import React, { useState, useCallback } from "react";
import { useFirebaseUser } from "./hooks/useFirebaseUser";
import { Dashboard } from "./components/Dashboard";
import { SettingsPage } from "./components/SettingsPage";
import { PlateCalculator } from "./components/PlateCalculator";
import { WorkoutGenerator } from "./components/WorkoutGenerator";
import { WorkoutPlanner } from "./components/WorkoutPlanner";
import { Loader2 } from "lucide-react";

export default function App() {
  const [currentPage, setCurrentPage] = useState("dashboard");
  const [workoutData, setWorkoutData] = useState(null);
  const { userProfile, isLoading, error, updateUserProfileInFirestore } =
    useFirebaseUser();

  const handleNavigate = useCallback((page, data = null) => {
    if (page === "player") {
      setWorkoutData(data);
    }
    setCurrentPage(page);
  }, []);

  const handleUpdateProfile = useCallback(
    async (updatedData) => {
      await updateUserProfileInFirestore(updatedData);
    },
    [updateUserProfileInFirestore]
  );

  const handleGenerateWorkout = useCallback(
    (newPlan) => {
      handleUpdateProfile({ workoutPlan: newPlan });
      setCurrentPage("dashboard");
    },
    [handleUpdateProfile]
  );

  const handleFinishWorkout = useCallback(
    (completedWorkout) => {
      if (!userProfile) return;
      const updatedHistory = [
        ...(userProfile.workoutHistory || []),
        completedWorkout,
      ];
      handleUpdateProfile({ workoutHistory: updatedHistory });
      setCurrentPage("dashboard");
    },
    [userProfile, handleUpdateProfile]
  );

  const handleUpdateExercise = useCallback(
    (exerciseIndex, updatedExercise) => {
      if (!userProfile || !workoutData) return;
      const newPlan = JSON.parse(JSON.stringify(userProfile.workoutPlan));
      const dayIndex = newPlan.findIndex(
        (day) => day.name === workoutData.name
      );
      if (dayIndex !== -1) {
        newPlan[dayIndex].exercises[exerciseIndex] = updatedExercise;
        handleUpdateProfile({ workoutPlan: newPlan });
      }
    },
    [userProfile, workoutData, handleUpdateProfile]
  );

  const renderPage = () => {
    if (isLoading) {
      return (
        <div className="flex flex-col justify-center items-center h-screen text-white">
          <Loader2 size={64} className="animate-spin text-blue-500" />
          <p className="mt-4 text-xl">Loading Your Workout Data...</p>
        </div>
      );
    }

    if (error) {
      return (
        <div className="flex justify-center items-center h-screen text-red-400">
          <p>Error: {error}</p>
        </div>
      );
    }

    if (!userProfile) {
      return (
        <div className="flex flex-col justify-center items-center h-screen text-white">
          <Loader2 size={64} className="animate-spin text-blue-500" />
          <p className="mt-4 text-xl">Initializing Your Profile...</p>
        </div>
      );
    }

    switch (currentPage) {
      case "settings":
        return (
          <SettingsPage
            userProfile={userProfile}
            onSave={() => setCurrentPage("dashboard")}
            onBack={() => setCurrentPage("dashboard")}
            updateUserProfile={handleUpdateProfile}
          />
        );
      case "generator":
        return (
          <WorkoutGenerator
            userProfile={userProfile}
            onGenerate={handleGenerateWorkout}
            onBack={() => setCurrentPage("dashboard")}
          />
        );
      case "player":
        return (
          <WorkoutPlayer
            workoutDay={workoutData}
            onFinish={handleFinishWorkout}
            onUpdateExercise={handleUpdateExercise}
          />
        );
      case "calculator":
        return (
          <PlateCalculator
            availablePlates={userProfile.availablePlates}
            onBack={() => setCurrentPage("dashboard")}
          />
        );
      case "dashboard":
      default:
        return (
          <Dashboard userProfile={userProfile} onNavigate={handleNavigate} />
        );
    }
  };

  return (
    <div className="bg-gray-900 min-h-screen font-sans">{renderPage()}</div>
  );
}
