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
import { OneRepMaxPrompt } from "./components/OneRepMaxPrompt";
import { Login } from "./components/Login";
import { Signup } from "./components/Signup";
import { Loader2 } from "lucide-react";
import { EXERCISE_DATABASE } from "./lib/constants";
import { ROUTES, getTemplateDetailsRoute } from "./lib/routes";
import { XP_REWARDS } from "./lib/gamification";
import { parseReps } from "./lib/parseReps";

import { WorkoutProvider, useWorkout } from "./context/WorkoutContext";

// Wrapper component for WorkoutPlanner to handle route state
function WorkoutPlannerWrapper({ userProfile, updateUserProfileInFirestore }) {
  const navigate = useNavigate();
  const { workoutPlan, recalculateWorkout } = useWorkout();
  const [workoutData, setWorkoutData] = useState(null);
  // Session log is managed here to persist across WorkoutPlanner re-renders/re-mounts
  const [sessionLog, setSessionLog] = useState({ user: {}, partner: {} });

  useEffect(() => {
    // Get workout data from sessionStorage (set before navigating here)
    const storedData = sessionStorage.getItem('currentWorkoutDay');
    if (!storedData) {
      navigate(ROUTES.DASHBOARD);
      return;
    }

    const parsedWorkoutData = JSON.parse(storedData);
    setWorkoutData(parsedWorkoutData);

    // Try to restore sessionLog if it exists, otherwise initialize it
    const storedSessionLog = sessionStorage.getItem('currentSessionLog');
    if (storedSessionLog) {
      setSessionLog(JSON.parse(storedSessionLog));
    } else {
      // Initialize sessionLog from workout data
      const initialLog = { user: {}, partner: {} };
      parsedWorkoutData.exercises.forEach((ex, exIndex) => {
        const setsData = (Array.isArray(ex.sets) ? ex.sets : []).map((set) => {
          const parsedReps = parseReps(set.reps);
          return {
            reps: parsedReps.value,
            weight: set.weight,
            completed: false,
            targetReps: parsedReps.value,
            targetWeight: set.weight,
            isAMRAP: parsedReps.isAMRAP,
          };
        });
        initialLog.user[exIndex] = setsData;

        // Initialize partner with their own weights from partner's workout plan
        if (userProfile.partner && userProfile.partner.workoutPlan) {
          const partnerDayData = userProfile.partner.workoutPlan[parsedWorkoutData.dayIdentifier];
          const partnerExercise = partnerDayData?.exercises?.[exIndex];
          if (partnerExercise && Array.isArray(partnerExercise.sets)) {
            initialLog.partner[exIndex] = partnerExercise.sets.map((set) => {
              const parsedReps = parseReps(set.reps);
              return {
                reps: parsedReps.value,
                weight: set.weight,
                completed: false,
                targetReps: parsedReps.value,
                targetWeight: set.weight,
                isAMRAP: parsedReps.isAMRAP,
              };
            });
          } else {
            // Fallback to user's data if partner doesn't have this exercise
            initialLog.partner[exIndex] = JSON.parse(JSON.stringify(setsData));
          }
        }
      });
      setSessionLog(initialLog);
      sessionStorage.setItem('currentSessionLog', JSON.stringify(initialLog));
    }
  }, [navigate, userProfile.partner]);

  // Ensure partner session log is initialized when partner is added mid-session
  useEffect(() => {
    if (!workoutData || !userProfile.partner || !userProfile.partner.workoutPlan) return;

    setSessionLog(prevLog => {
      // Check if partner log is already populated
      const hasPartnerLog = Object.keys(prevLog.partner || {}).length > 0;
      if (hasPartnerLog) return prevLog;

      // Initialize partner log from partner's workout plan
      const newLog = { ...prevLog, partner: {} };
      const partnerDayData = userProfile.partner.workoutPlan[workoutData.dayIdentifier];

      workoutData.exercises.forEach((ex, exIndex) => {
        if (!newLog.partner[exIndex]) {
          const partnerExercise = partnerDayData?.exercises?.[exIndex];
          if (partnerExercise && Array.isArray(partnerExercise.sets)) {
            newLog.partner[exIndex] = partnerExercise.sets.map((set) => {
              const parsedReps = parseReps(set.reps);
              return {
                reps: parsedReps.value,
                weight: set.weight,
                completed: false,
                targetReps: parsedReps.value,
                targetWeight: set.weight,
                isAMRAP: parsedReps.isAMRAP,
              };
            });
          } else {
            // Fallback to user's data
            newLog.partner[exIndex] = (Array.isArray(ex.sets) ? ex.sets : []).map((set) => {
              const parsedReps = parseReps(set.reps);
              return {
                reps: parsedReps.value,
                weight: set.weight,
                completed: false,
                targetReps: parsedReps.value,
                targetWeight: set.weight,
                isAMRAP: parsedReps.isAMRAP,
              };
            });
          }
        }
      });

      sessionStorage.setItem('currentSessionLog', JSON.stringify(newLog));
      return newLog;
    });
  }, [workoutData, userProfile.partner]);

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
      sessionStorage.removeItem('currentSessionLog'); // Clear session log for next workout
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

  // Ref to track current sessionLog for synchronous access
  const sessionLogRef = React.useRef(sessionLog);
  React.useEffect(() => {
    sessionLogRef.current = sessionLog;
  }, [sessionLog]);

  // Wrapped setSessionLog that also persists to sessionStorage synchronously
  const handleSetSessionLog = useCallback((update) => {
    // Compute the new value synchronously
    const newValue = typeof update === 'function' ? update(sessionLogRef.current) : update;
    // Save to sessionStorage BEFORE any async operation that might cause remount
    sessionStorage.setItem('currentSessionLog', JSON.stringify(newValue));
    // Then update React state
    setSessionLog(newValue);
  }, []);

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
      sessionLog={sessionLog}
      setSessionLog={handleSetSessionLog}
    />
  );
}

// Wrapper for ProgramTemplateDetails to handle route params
function ProgramTemplateDetailsWrapper({ userProfile, updateUserProfileInFirestore }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const [showOneRepMaxPrompt, setShowOneRepMaxPrompt] = useState(false);
  const [missingExercises, setMissingExercises] = useState([]);
  const [pendingProgram, setPendingProgram] = useState(null);
  const [lifts, setLifts] = useState({});
  const [program, setProgram] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch all data once
  useEffect(() => {
    fetch('/program-templates.json')
      .then(res => {
        if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
        return res.json();
      })
      .then(data => {
        setLifts(data.lifts || {});
        const foundProgram = data.programs[id];
        if (foundProgram) {
          setProgram(foundProgram);
        } else {
          setError(new Error("Program not found."));
        }
        setLoading(false);
      })
      .catch(err => {
        console.error("Error fetching program templates:", err);
        setError(err);
        setLoading(false);
      });
  }, [id]);

  // Get all exercise IDs from a program
  const getAllProgramExercises = useCallback((prog) => {
    const metaKeys = ['id', 'name', 'description', 'structure'];
    const workoutKeys = Object.keys(prog).filter(k => !metaKeys.includes(k));
    const exerciseIds = new Set();
    workoutKeys.forEach(key => {
      Object.keys(prog[key]).forEach(liftId => exerciseIds.add(liftId));
    });
    return Array.from(exerciseIds);
  }, []);

  // Find exercises not in user's library
  const findMissingExercises = useCallback((prog) => {
    if (!userProfile?.exerciseLibrary) return [];
    const programExercises = getAllProgramExercises(prog);
    const userLibraryNames = userProfile.exerciseLibrary.map(ex => ex.name.toLowerCase());

    return programExercises.filter(liftId => {
      const liftInfo = lifts[liftId];
      const liftName = liftInfo?.name || liftId;
      return !userLibraryNames.includes(liftName.toLowerCase());
    });
  }, [userProfile, lifts, getAllProgramExercises]);

  const applyProgram = useCallback((prog, additionalExercises = []) => {
    if (!userProfile) return;

    // Merge additional exercises into the library
    const newExerciseLibrary = [...(userProfile.exerciseLibrary || []), ...additionalExercises];

    const newWorkoutPlan = {};
    const metaKeys = ['id', 'name', 'description', 'structure'];
    const workoutDays = Object.keys(prog).filter(k => !metaKeys.includes(k));

    workoutDays.forEach((dayKey) => {
      const workoutDay = prog[dayKey];
      const exercises = [];

      for (const liftId in workoutDay) {
        const exerciseDetails = workoutDay[liftId];
        const liftInfo = lifts[liftId];

        // Helper to format snake_case to Title Case (fallback if liftInfo is missing)
        const formatIdToName = (id) => id.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
        const liftName = liftInfo?.name || formatIdToName(liftId);

        const libraryExercise = newExerciseLibrary.find(
          (e) => e.name.toLowerCase() === liftName.toLowerCase()
        );
        const oneRepMax = libraryExercise ? libraryExercise.oneRepMax : 100;

        const exerciseInfo = Object.values(EXERCISE_DATABASE)
          .flat()
          .find((ex) => ex.name.toLowerCase() === liftName.toLowerCase());
        const exerciseType = exerciseInfo ? exerciseInfo.type : "weighted";

        const sets = exerciseDetails.reps.map((rep, index) => {
          // Use specific percentage or fallback to the last defined percentage
          const rawPercentage = exerciseDetails.percentages[index] ?? exerciseDetails.percentages[exerciseDetails.percentages.length - 1];
          const percentage = rawPercentage / 100;
          return {
            reps: rep,
            percentage: percentage,
            weight: Math.round((oneRepMax * percentage) / 2.5) * 2.5,
          };
        });

        exercises.push({
          id: liftId,
          name: liftName,
          type: exerciseType,
          oneRepMax: oneRepMax,
          sets: sets,
        });
      }

      newWorkoutPlan[dayKey] = { exercises };
    });

    updateUserProfileInFirestore({
      workoutPlan: newWorkoutPlan,
      exerciseLibrary: newExerciseLibrary,
    });
    navigate(ROUTES.DASHBOARD);
  }, [userProfile, updateUserProfileInFirestore, navigate, lifts]);

  const handleSelectProgramTemplate = useCallback(
    (prog) => {
      if (!userProfile) return;

      const missing = findMissingExercises(prog);
      if (missing.length > 0) {
        setMissingExercises(missing);
        setPendingProgram(prog);
        setShowOneRepMaxPrompt(true);
      } else {
        applyProgram(prog);
      }
    },
    [userProfile, findMissingExercises, applyProgram]
  );

  const handleSaveOneRepMaxes = useCallback((newExercises) => {
    setShowOneRepMaxPrompt(false);
    if (pendingProgram) {
      applyProgram(pendingProgram, newExercises);
    }
    setPendingProgram(null);
    setMissingExercises([]);
  }, [pendingProgram, applyProgram]);

  const handleCancelOneRepMaxPrompt = useCallback(() => {
    setShowOneRepMaxPrompt(false);
    setPendingProgram(null);
    setMissingExercises([]);
  }, []);

  const handleNavigate = useCallback((page, data = null, templateId = null) => {
    if (page === "program_templates") {
      navigate(ROUTES.PROGRAM_TEMPLATES);
    } else if (page === "program_template_details" && templateId) {
      navigate(getTemplateDetailsRoute(templateId));
    }
  }, [navigate]);

  return (
    <>
      <ProgramTemplateDetails
        id={id}
        program={program}
        lifts={lifts}
        loading={loading}
        error={error}
        onBack={() => navigate(ROUTES.PROGRAM_TEMPLATES)}
        onNavigate={handleNavigate}
        onSelectProgram={handleSelectProgramTemplate}
      />
      {showOneRepMaxPrompt && (
        <OneRepMaxPrompt
          missingExercises={missingExercises}
          lifts={lifts}
          onSave={handleSaveOneRepMaxes}
          onCancel={handleCancelOneRepMaxPrompt}
        />
      )}
    </>
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
