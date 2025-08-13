import React, { useState, useCallback } from "react";
import { useFirebaseUser } from "./hooks/useFirebaseUser";
import { Dashboard } from "./components/Dashboard";
import { SettingsPage } from "./components/SettingsPage";
import { PlateCalculator } from "./components/PlateCalculator";
import { WorkoutPlanner } from "./components/WorkoutPlanner";
import { CreateWorkout } from "./components/CreateWorkout";
import { ExerciseLibrary } from "./components/ExerciseLibrary";
import ProgramTemplates from "./components/ProgramTemplates";
import ProgramTemplateDetails from "./components/ProgramTemplateDetails";
import { Loader2 } from "lucide-react";

export default function App() {
  const [currentPage, setCurrentPage] = useState("dashboard");
  const [workoutData, setWorkoutData] = useState(null);
  const [programTemplateId, setProgramTemplateId] = useState(null);
  const { userProfile, isLoading, error, updateUserProfileInFirestore } =
    useFirebaseUser();

  const handleNavigate = useCallback((page, data = null, id = null) => {
    if (page === "planner") {
      setWorkoutData(data);
    } else if (page === "program_template_details") {
      setProgramTemplateId(id);
    }
    setCurrentPage(page);
  }, []);

  const handleUpdateProfile = useCallback(
    async (updatedData) => {
      await updateUserProfileInFirestore(updatedData);
    },
    [updateUserProfileInFirestore]
  );

  const handleSaveCustomWorkout = useCallback(
    (customWorkout) => {
      if (!userProfile) return;
      const { day, ...workoutDetails } = customWorkout;

      const newPlan = {
        ...(userProfile.workoutPlan || {}),
        [day]: workoutDetails,
      };

      handleUpdateProfile({ workoutPlan: newPlan });
      setCurrentPage("dashboard");
    },
    [userProfile, handleUpdateProfile]
  );

  const handleUpdateLibrary = useCallback(
    (exerciseName, newOneRepMax) => {
      if (!userProfile) return;

      const newLibrary = userProfile.exerciseLibrary.map((ex) => {
        if (ex.name === exerciseName) {
          const oldOneRepMax = ex.oneRepMax;
          const lastUpdated = ex.lastUpdated ? new Date(ex.lastUpdated) : new Date(0); // Default to epoch if not set
          const now = new Date();
          const daysSinceLastUpdate = Math.floor((now - lastUpdated) / (1000 * 60 * 60 * 24));
          const weeksSinceLastUpdate = daysSinceLastUpdate / 7;

          let cappedNewOneRepMax = newOneRepMax;

          // Only apply cap if 1RM is increasing and it's a weighted exercise
          if (newOneRepMax > oldOneRepMax && ex.type === "weighted") {
            const maxIncreaseAllowed = weeksSinceLastUpdate * 5; // 5 lbs per week
            const actualIncrease = newOneRepMax - oldOneRepMax;

            if (actualIncrease > maxIncreaseAllowed) {
              cappedNewOneRepMax = oldOneRepMax + maxIncreaseAllowed;
              console.warn(`1RM increase for ${exerciseName} capped to ${cappedNewOneRepMax} (max ${maxIncreaseAllowed} lbs increase allowed).`);
            }
          }

          return { ...ex, oneRepMax: cappedNewOneRepMax, lastUpdated: now.toISOString() };
        }
        return ex;
      });
      handleUpdateProfile({ exerciseLibrary: newLibrary });
    },
    [userProfile, handleUpdateProfile]
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
      if (!userProfile || !workoutData || !workoutData.dayIdentifier) return;

      const newPlan = JSON.parse(JSON.stringify(userProfile.workoutPlan));
      const dayToUpdate = workoutData.dayIdentifier;

      if (newPlan[dayToUpdate]) {
        newPlan[dayToUpdate].exercises[exerciseIndex] = updatedExercise;
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
            onSave={() => {
              handleUpdateProfile(userProfile);
              setCurrentPage("dashboard");
            }}
            onBack={() => setCurrentPage("dashboard")}
            updateUserProfile={handleUpdateProfile}
          />
        );
      case "create_workout":
        return (
          <CreateWorkout
            userProfile={userProfile}
            onSave={handleSaveCustomWorkout}
            onBack={() => setCurrentPage("dashboard")}
          />
        );
      case "exercise_library":
        return (
          <ExerciseLibrary
            userProfile={userProfile}
            onSave={handleUpdateProfile}
            onBack={() => setCurrentPage("dashboard")}
          />
        );
      case "planner":
        return (
          <WorkoutPlanner
            workoutDay={workoutData}
            onFinish={handleFinishWorkout}
            onUpdateExercise={handleUpdateExercise}
            onUpdateLibrary={handleUpdateLibrary}
            availablePlates={userProfile.availablePlates}
          />
        );
      case "calculator":
        return (
          <PlateCalculator
            availablePlates={userProfile.availablePlates}
            onBack={() => setCurrentPage("dashboard")}
          />
        );
      case "program_templates":
        return (
          <ProgramTemplates onNavigate={handleNavigate} />
        );
      case "program_template_details":
        return (
          <ProgramTemplateDetails id={programTemplateId} onBack={() => setCurrentPage("program_templates")} onNavigate={handleNavigate} />
        );
      case "dashboard":
      default:
        return (
          <Dashboard userProfile={userProfile} onNavigate={handleNavigate} />
        );
    }
  };

  return (
    <div className="bg-gray-900 min-h-screen font-sans text-white">
      {renderPage()}
    </div>
  );
}
