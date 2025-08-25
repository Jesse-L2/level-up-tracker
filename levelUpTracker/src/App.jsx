import React, { useState, useCallback, useEffect } from "react";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { useFirebaseUser } from "./hooks/useFirebaseUser";
import { Dashboard } from "./components/Dashboard";
import { SettingsPage } from "./components/SettingsPage";
import { PlateCalculator } from "./components/PlateCalculator";
import { WorkoutPlanner } from "./components/WorkoutPlanner";
import { CreateWorkout } from "./components/CreateWorkout";
import { ExerciseLibrary } from "./components/ExerciseLibrary";
import ProgramTemplates from "./components/ProgramTemplates";
import ProgramTemplateDetails from "./components/ProgramTemplateDetails";
import { Login } from "./components/Login";
import { Signup } from "./components/Signup";
import { Loader2 } from "lucide-react";
import { EXERCISE_DATABASE } from "./lib/constants";

export default function App() {
  const [currentPage, setCurrentPage] = useState("dashboard");
  const [workoutData, setWorkoutData] = useState(null);
  const [programTemplateId, setProgramTemplateId] = useState(null);
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [isLoginView, setIsLoginView] = useState(true);

  useEffect(() => {
    const auth = getAuth();
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      setAuthLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const { userProfile, isLoading, error, updateUserProfileInFirestore } =
    useFirebaseUser(user ? user.uid : null);

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

  const handleSelectProgramTemplate = useCallback(
    (program) => {
      if (!userProfile) return;

      const newWorkoutPlan = {};
      const workoutDays = Object.keys(program).filter(
        (k) =>
          k.startsWith("workout_") || k.startsWith("day_") || k.endsWith("_day")
      );

      workoutDays.forEach((dayKey) => {
        const workoutDay = program[dayKey];
        const exercises = [];

        for (const exerciseName in workoutDay) {
          const exerciseDetails = workoutDay[exerciseName];
          const libraryExercise = userProfile.exerciseLibrary.find(
            (e) => e.name === exerciseName
          );
          const oneRepMax = libraryExercise ? libraryExercise.oneRepMax : 100;

          const exerciseInfo = Object.values(EXERCISE_DATABASE)
            .flat()
            .find((ex) => ex.name === exerciseName);
          const exerciseType = exerciseInfo ? exerciseInfo.type : "weighted";

          const sets = exerciseDetails.reps.map((rep, index) => {
            const percentage = exerciseDetails.percentages[index] / 100;
            return {
              reps: rep,
              percentage: percentage,
              weight: Math.round((oneRepMax * percentage) / 2.5) * 2.5,
            };
          });

          exercises.push({
            name: exerciseName,
            type: exerciseType,
            oneRepMax: oneRepMax,
            sets: sets,
          });
        }

        newWorkoutPlan[dayKey] = { exercises };
      });

      handleUpdateProfile({ workoutPlan: newWorkoutPlan });
      setCurrentPage("dashboard");
    },
    [userProfile, handleUpdateProfile]
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
          const lastUpdated = ex.lastUpdated
            ? new Date(ex.lastUpdated)
            : new Date(0); // Default to epoch if not set
          const now = new Date();
          const daysSinceLastUpdate = Math.floor(
            (now - lastUpdated) / (1000 * 60 * 60 * 24)
          );
          const weeksSinceLastUpdate = daysSinceLastUpdate / 7;

          let cappedNewOneRepMax = newOneRepMax;

          // Only apply cap if 1RM is increasing and it's a weighted exercise
          if (newOneRepMax > oldOneRepMax && ex.type === "weighted") {
            const maxIncreaseAllowed = weeksSinceLastUpdate * 5; // 5 lbs per week
            const actualIncrease = newOneRepMax - oldOneRepMax;

            if (actualIncrease > maxIncreaseAllowed) {
              cappedNewOneRepMax = oldOneRepMax + maxIncreaseAllowed;
              console.warn(
                `1RM increase for ${exerciseName} capped to ${cappedNewOneRepMax} (max ${maxIncreaseAllowed} lbs increase allowed).`
              );
            }
          }

          return {
            ...ex,
            oneRepMax: cappedNewOneRepMax,
            lastUpdated: now.toISOString(),
          };
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
    if (authLoading || isLoading) {
      return (
        <div className="flex flex-col justify-center items-center h-screen text-white">
          <Loader2 size={64} className="animate-spin text-blue-500" />
          <p className="mt-4 text-xl">Loading...</p>
        </div>
      );
    }

    if (!user) {
      return isLoginView ? (
        <Login onSwitchToSignup={() => setIsLoginView(false)} />
      ) : (
        <Signup onSwitchToLogin={() => setIsLoginView(true)} />
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
        return <ProgramTemplates onNavigate={handleNavigate} />;
      case "program_template_details":
        return (
          <ProgramTemplateDetails
            id={programTemplateId}
            onBack={() => setCurrentPage("program_templates")}
            onNavigate={handleNavigate}
            onSelectProgram={handleSelectProgramTemplate}
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
    <div className="bg-gray-900 min-h-screen font-sans text-white">
      {renderPage()}
    </div>
  );
}
