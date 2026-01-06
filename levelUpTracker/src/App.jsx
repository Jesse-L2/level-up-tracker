import React, { useState, useCallback, useEffect } from "react";
import { BrowserRouter, Routes, Route, Navigate, useNavigate, useParams, useLocation } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { Toaster, toast } from "sonner";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "./firebase";
import { useFirebaseUser } from "./hooks/useFirebaseUser";
import { Dashboard } from "./components/Dashboard";
import { SettingsPage } from "./components/SettingsPage";
import { PlateCalculator } from "./components/PlateCalculator";
import { WorkoutPlanner } from "./components/WorkoutPlanner";
import { CreateWorkout } from "./components/CreateWorkout";
import { ExerciseLibrary } from "./components/ExerciseLibrary";
import { WorkoutHistory } from "./components/WorkoutHistory";
import ProgramTemplates from "./components/ProgramTemplates";
import ProgramTemplateDetails from "./components/ProgramTemplateDetails";
import { Login } from "./components/Login";
import { Signup } from "./components/Signup";
import { Loader2 } from "lucide-react";
import { EXERCISE_DATABASE } from "./lib/constants";
import { ROUTES, getTemplateDetailsRoute } from "./lib/routes";
import { XP_REWARDS } from "./lib/gamification";

import { WorkoutProvider, useWorkout } from "./context/WorkoutContext";

// Wrapper component for WorkoutPlanner to handle route state
function WorkoutPlannerWrapper({ userProfile, updateUserProfileInFirestore }) {
  const navigate = useNavigate();
  const { workoutPlan, recalculateWorkout } = useWorkout();
  const [workoutData, setWorkoutData] = useState(null);

  useEffect(() => {
    // Get workout data from sessionStorage (set before navigating here)
    const storedData = sessionStorage.getItem('currentWorkoutDay');
    if (storedData) {
      setWorkoutData(JSON.parse(storedData));
    } else {
      navigate(ROUTES.DASHBOARD);
    }
  }, [navigate]);

  const handleFinishWorkout = useCallback(
    (completedWorkout) => {
      if (!userProfile) return;

      const xpGained = XP_REWARDS.WORKOUT_COMPLETION;
      const currentXp = userProfile.xp || 0;
      const newXp = currentXp + xpGained;

      const updatedHistory = [
        ...(userProfile.workoutHistory || []),
        completedWorkout,
      ];

      updateUserProfileInFirestore({
        workoutHistory: updatedHistory,
        xp: newXp
      });

      toast.success(`Workout Complete! +${xpGained} XP`);

      sessionStorage.removeItem('currentWorkoutDay');
      navigate(ROUTES.DASHBOARD);
    },
    [userProfile, updateUserProfileInFirestore, navigate]
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
      if (!userProfile) return;

      const newWorkoutPlan = {
        ...userProfile.workoutPlan,
        [updatedWorkoutDay.dayIdentifier]: updatedWorkoutDay,
      };

      updateUserProfileInFirestore({ workoutPlan: newWorkoutPlan });

      // Immediately update the local state so the UI reflects the change
      setWorkoutData(updatedWorkoutDay);
      sessionStorage.setItem('currentWorkoutDay', JSON.stringify(updatedWorkoutDay));
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
        if (workoutData) {
          const dayIdentifier = workoutData.dayIdentifier;
          const updatedWorkoutDay = newWorkoutPlan[dayIdentifier];
          setWorkoutData({ ...updatedWorkoutDay, dayIdentifier });
          sessionStorage.setItem('currentWorkoutDay', JSON.stringify({ ...updatedWorkoutDay, dayIdentifier }));
        }
      });
    },
    [userProfile, updateUserProfileInFirestore, workoutData]
  );

  const handleNavigate = useCallback((page) => {
    if (page === "dashboard") {
      navigate(ROUTES.DASHBOARD);
    }
  }, [navigate]);

  if (!workoutData) {
    return (
      <div className="flex flex-col justify-center items-center h-screen text-white">
        <Loader2 size={64} className="animate-spin text-blue-500" />
        <p className="mt-4 text-xl">Loading workout...</p>
      </div>
    );
  }

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
}

// Wrapper for ProgramTemplateDetails to handle route params
function ProgramTemplateDetailsWrapper({ userProfile, updateUserProfileInFirestore }) {
  const { id } = useParams();
  const navigate = useNavigate();

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
      navigate(ROUTES.DASHBOARD);
    },
    [userProfile, updateUserProfileInFirestore, navigate]
  );

  const handleNavigate = useCallback((page, data = null, templateId = null) => {
    if (page === "program_templates") {
      navigate(ROUTES.PROGRAM_TEMPLATES);
    } else if (page === "program_template_details" && templateId) {
      navigate(getTemplateDetailsRoute(templateId));
    }
  }, [navigate]);

  return (
    <ProgramTemplateDetails
      id={id}
      onBack={() => navigate(ROUTES.PROGRAM_TEMPLATES)}
      onNavigate={handleNavigate}
      onSelectProgram={handleSelectProgramTemplate}
    />
  );
}

function AppContent() {
  const navigate = useNavigate();
  const { userProfile, isLoading, error, updateUserProfileInFirestore, deleteWorkout } =
    useFirebaseUser(auth.currentUser ? auth.currentUser.uid : null);
  const { workoutPlan } = useWorkout();

  const handleNavigate = useCallback((page, data = null, id = null) => {
    if (page === "planner" && data) {
      sessionStorage.setItem('currentWorkoutDay', JSON.stringify(data));
      navigate(ROUTES.PLANNER);
    } else if (page === "program_template_details" && id) {
      navigate(getTemplateDetailsRoute(id));
    } else {
      const routeMap = {
        dashboard: ROUTES.DASHBOARD,
        settings: ROUTES.SETTINGS,
        create_workout: ROUTES.CREATE_WORKOUT,
        exercise_library: ROUTES.EXERCISE_LIBRARY,
        calculator: ROUTES.CALCULATOR,
        program_templates: ROUTES.PROGRAM_TEMPLATES,
        history: ROUTES.HISTORY,
      };
      navigate(routeMap[page] || ROUTES.DASHBOARD);
    }
  }, [navigate]);

  const handleSaveCustomWorkout = useCallback(
    (customWorkout) => {
      if (!userProfile) return;
      const { day, ...workoutDetails } = customWorkout;

      const newPlan = {
        ...(userProfile.workoutPlan || {}),
        [day]: workoutDetails,
      };

      updateUserProfileInFirestore({ workoutPlan: newPlan });
      navigate(ROUTES.DASHBOARD);
    },
    [userProfile, updateUserProfileInFirestore, navigate]
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

  return (
    <Routes>
      <Route
        path={ROUTES.DASHBOARD}
        element={
          <Dashboard
            userProfile={{ ...userProfile, workoutPlan }}
            onNavigate={handleNavigate}
            deleteWorkout={deleteWorkout}
          />
        }
      />
      <Route
        path={ROUTES.SETTINGS}
        element={
          <SettingsPage
            userProfile={userProfile}
            onBack={() => navigate(ROUTES.DASHBOARD)}
            updateUserProfileInFirestore={updateUserProfileInFirestore}
            onUpdateWorkoutPlan={handleUpdateWorkoutPlan}
          />
        }
      />
      <Route
        path={ROUTES.CREATE_WORKOUT}
        element={
          <CreateWorkout
            userProfile={userProfile}
            onSave={handleSaveCustomWorkout}
            onBack={() => navigate(ROUTES.DASHBOARD)}
          />
        }
      />
      <Route
        path={ROUTES.EXERCISE_LIBRARY}
        element={
          <ExerciseLibrary
            userProfile={userProfile}
            onBack={() => navigate(ROUTES.DASHBOARD)}
          />
        }
      />
      <Route
        path={ROUTES.PLANNER}
        element={
          <WorkoutPlannerWrapper
            userProfile={userProfile}
            updateUserProfileInFirestore={updateUserProfileInFirestore}
          />
        }
      />
      <Route
        path={ROUTES.CALCULATOR}
        element={
          <PlateCalculator
            availablePlates={userProfile.availablePlates}
            onBack={() => navigate(ROUTES.DASHBOARD)}
          />
        }
      />
      <Route
        path={ROUTES.PROGRAM_TEMPLATES}
        element={<ProgramTemplates onNavigate={handleNavigate} />}
      />
      <Route
        path={ROUTES.PROGRAM_TEMPLATE_DETAILS}
        element={
          <ProgramTemplateDetailsWrapper
            userProfile={userProfile}
            updateUserProfileInFirestore={updateUserProfileInFirestore}
          />
        }
      />
      <Route
        path={ROUTES.HISTORY}
        element={
          <WorkoutHistory userProfile={userProfile} deleteWorkout={deleteWorkout} />
        }
      />
      <Route path="*" element={<Navigate to={ROUTES.DASHBOARD} replace />} />
    </Routes>
  );
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
    } else {
      document.title = "Level Up Tracker";
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
    <BrowserRouter>
      <div className="bg-gray-900 min-h-screen font-sans text-white">
        <Toaster
          position="top-right"
          toastOptions={{
            style: {
              background: '#1f2937',
              color: '#fff',
              border: '1px solid #374151',
            },
          }}
        />
        {renderPage()}
      </div>
    </BrowserRouter>
  );
}
