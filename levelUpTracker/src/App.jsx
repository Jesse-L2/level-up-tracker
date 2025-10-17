import React, { useState, useCallback, useEffect } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "./firebase";
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

import { WorkoutProvider, useWorkout } from "./context/WorkoutContext";

function AppContent() {
  const [currentPage, setCurrentPage] = useState("dashboard");
  const [programTemplateId, setProgramTemplateId] = useState(null);
  const { userProfile, isLoading, error, updateUserProfileInFirestore } =
    useFirebaseUser(auth.currentUser ? auth.currentUser.uid : null);
  const { workoutPlan, recalculateWorkout } = useWorkout();
  const [workoutData, setWorkoutData] = useState(null);

  useEffect(() => {
    switch (currentPage) {
      case "dashboard":
        document.title = "Dashboard";
        break;
      case "settings":
        document.title = "Settings";
        break;
      case "create_workout":
        document.title = "Create Workout";
        break;
      case "exercise_library":
        document.title = "Exercise Library";
        break;
      case "planner":
        document.title = "Workout Planner";
        break;
      case "calculator":
        document.title = "Plate Calculator";
        break;
      case "program_templates":
        document.title = "Program Templates";
        break;
      case "program_template_details":
        document.title = "Program Template Details";
        break;
      default:
        document.title = "LevelUp Workout Tracker";
    }
  }, [currentPage]);

  const handleNavigate = useCallback((page, data = null, id = null) => {
    if (page === "planner") {
      setWorkoutData(data);
    } else if (page === "program_template_details") {
      setProgramTemplateId(id);
    }
    setCurrentPage(page);
  }, []);



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
              id: exerciseName,
              name: exerciseName,
              type: exerciseType,
              oneRepMax: oneRepMax,
              sets: sets,
            });
          }
  
          newWorkoutPlan[dayKey] = { exercises };
        });
  
        updateUserProfileInFirestore({ workoutPlan: newWorkoutPlan });
        setCurrentPage("dashboard");
      },
      [userProfile, updateUserProfileInFirestore]
    );
  
    const handleSaveCustomWorkout = useCallback(
      (customWorkout) => {
        if (!userProfile) return;
        const { day, ...workoutDetails } = customWorkout;
  
        const newPlan = {
          ...(userProfile.workoutPlan || {}),
          [day]: workoutDetails,
        };
  
        updateUserProfileInFirestore({ workoutPlan: newPlan });
        setCurrentPage("dashboard");
      },
      [userProfile, updateUserProfileInFirestore]
    );
  
    const handleFinishWorkout = useCallback(
      (completedWorkout) => {
        if (!userProfile) return;
        const updatedHistory = [
          ...(userProfile.workoutHistory || []),
          completedWorkout,
        ];
        updateUserProfileInFirestore({ workoutHistory: updatedHistory });
        setCurrentPage("dashboard");
      },
      [userProfile, updateUserProfileInFirestore]
    );
  
      const handleUpdatePartnerWorkoutData = useCallback(
        (exerciseId, newOneRepMax) => {
          if (!userProfile || !userProfile.partner) return;
    
          const newPartnerMaxes = {
            ...userProfile.partner.maxes,
            [exerciseId]: newOneRepMax,
          };
    
          const newPartnerWorkoutPlan = JSON.parse(
            JSON.stringify(userProfile.partner.workoutPlan)
          );
          for (const day in newPartnerWorkoutPlan) {
            const dayExercises = newPartnerWorkoutPlan[day].exercises;
            const exerciseIndex = dayExercises.findIndex(
              (ex) => ex.id === exerciseId
            );
            if (exerciseIndex > -1) {
              const exercise = dayExercises[exerciseIndex];
              exercise.sets = exercise.sets.map((set) => ({
                ...set,
                weight: Math.round((newOneRepMax * set.percentage) / 2.5) * 2.5,
              }));
            }
          }
    
          updateUserProfileInFirestore({
            "partner.maxes": newPartnerMaxes,
            "partner.workoutPlan": newPartnerWorkoutPlan,
          });
        },
        [userProfile, updateUserProfileInFirestore]
      );
    
      const handleUpdateWorkoutDay = useCallback(
        (updatedWorkoutDay) => {
          console.log("handleUpdateWorkoutDay", updatedWorkoutDay);
          if (!userProfile) return;
    
          const newWorkoutPlan = {
            ...userProfile.workoutPlan,
            [updatedWorkoutDay.dayIdentifier]: updatedWorkoutDay,
          };
    
          updateUserProfileInFirestore({ workoutPlan: newWorkoutPlan });
        },
        [userProfile, updateUserProfileInFirestore]
      );

      const handleUpdateLibrary = useCallback(
        (exerciseName, newOneRepMax) => {
          if (!userProfile) return;

          const newExerciseLibrary = userProfile.exerciseLibrary.map((ex) => {
            if (ex.name === exerciseName) {
              return { ...ex, oneRepMax: newOneRepMax };
            }
            return ex;
          });

          const newWorkoutPlan = JSON.parse(JSON.stringify(userProfile.workoutPlan));
          for (const day in newWorkoutPlan) {
            const dayExercises = newWorkoutPlan[day].exercises;
            const exerciseIndex = dayExercises.findIndex(
              (ex) => ex.name === exerciseName
            );
            if (exerciseIndex > -1) {
              const exercise = dayExercises[exerciseIndex];
              exercise.oneRepMax = newOneRepMax;
              exercise.sets = exercise.sets.map((set) => ({
                ...set,
                weight: Math.round((newOneRepMax * set.percentage) / 2.5) * 2.5,
              }));
            }
          }

          updateUserProfileInFirestore({
            exerciseLibrary: newExerciseLibrary,
            workoutPlan: newWorkoutPlan,
          }).then(() => {
            const dayIdentifier = workoutData.dayIdentifier;
            const updatedWorkoutDay = newWorkoutPlan[dayIdentifier];
            setWorkoutData({ ...updatedWorkoutDay, dayIdentifier });
          });
        },
        [userProfile, updateUserProfileInFirestore, workoutData]
      );

      const handleUpdateWorkoutPlan = useCallback(
        (newWorkoutPlan) => {
          if (!userProfile) return;

          updateUserProfileInFirestore({ workoutPlan: newWorkoutPlan });
        },
        [userProfile, updateUserProfileInFirestore]
      );

  if (isLoading) {
    return (
      <div className="flex flex-col justify-center items-center h-screen text-white">
        <Loader2 size={64} className="animate-spin text-blue-500" />
        <p className="mt-4 text-xl">Loading...</p>
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

  switch (currentPage) {
    case "settings":
      return (
        <SettingsPage
          userProfile={userProfile}
          onBack={() => setCurrentPage("dashboard")}
          updateUserProfileInFirestore={updateUserProfileInFirestore}
          onUpdateWorkoutPlan={handleUpdateWorkoutPlan}
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
          onBack={() => setCurrentPage("dashboard")}
        />
      );
    case "planner":
      return (
        <WorkoutPlanner
          workoutDay={workoutData}
          onFinish={handleFinishWorkout}
          onUpdatePartnerWorkoutData={handleUpdatePartnerWorkoutData}
          onUpdateWorkoutDay={handleUpdateWorkoutDay}
          onUpdateLibrary={handleUpdateLibrary}
          availablePlates={userProfile.availablePlates}
          onNavigate={handleNavigate}
          userProfile={userProfile}
          partner={userProfile.partner}
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
        <Dashboard
          userProfile={{ ...userProfile, workoutPlan }}
          onNavigate={handleNavigate}
        />
      );
  }
}

export default function App() {
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [isLoginView, setIsLoginView] = useState(true);
  const { userProfile, isLoading, error, updateUserProfileInFirestore } =
    useFirebaseUser(user ? user.uid : null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      setAuthLoading(false);
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!user) {
      document.title = isLoginView ? "Login" : "Signup";
    }
  }, [isLoginView, user]);

  const handleUpdateProfile = useCallback(
    async (updatedData) => {
      await updateUserProfileInFirestore(updatedData);
    },
    [updateUserProfileInFirestore]
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

    return (
      <WorkoutProvider
        userProfile={userProfile}
        handleUpdateProfile={handleUpdateProfile}
      >
        <AppContent />
      </WorkoutProvider>
    );
  };

  return (
    <div className="bg-gray-900 min-h-screen font-sans text-white">
      {renderPage()}
    </div>
  );
}
