import React, { useState, useEffect, useCallback } from "react";
import { savePartnerWorkout } from "../firebase";
import { FormField } from "./ui/FormField";
import { Edit, Save, X, Plus, Minus } from "lucide-react";
import { MiniPlateDisplay } from "./ui/MiniPlateDisplay";
import { Timer } from "./ui/Timer";
import { useWorkout } from "../context/WorkoutContext";

export const WorkoutPlanner = ({
  workoutDay,
  onFinish,
  onUpdateLibrary,
  availablePlates,
  onNavigate,
  userProfile,
  onUpdatePartnerWorkoutData,
  onUpdateWorkoutDay,
}) => {
  const {
    isTimerActive,
    timerDuration,
    startTimer,
    stopTimer,
    lastCompletedSet,
  } = useWorkout();
  const [currentExerciseIndex, setCurrentExerciseIndex] = useState(0);
  const [sessionLog, setSessionLog] = useState({ user: {}, partner: {} });
  const [isRecalculating, setIsRecalculating] = useState(false);
  const [suggested1RM, setSuggested1RM] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState({ oneRepMax: "" });
  const [isEditingPartner, setIsEditingPartner] = useState(false);
  const [partnerEditValue, setPartnerEditValue] = useState({ oneRepMax: "" });
  const [message, setMessage] = useState(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isPartnerView, setIsPartnerView] = useState(false);

  // Set page title
  useEffect(() => {
    document.title = "Level Up Tracker - Workout";
    return () => {
      document.title = "Level Up Tracker";
    };
  }, []);

  const currentExercise = workoutDay.exercises[currentExerciseIndex];
  const sets = Array.isArray(currentExercise?.sets) ? currentExercise.sets : [];

  const handleToggle = () => {
    setIsPartnerView((prev) => userProfile.partner && !prev);
  };

  useEffect(() => {
    // Initialize session log
    const initialLog = { user: {}, partner: {} };
    workoutDay.exercises.forEach((ex, exIndex) => {
      const setsData = (Array.isArray(ex.sets) ? ex.sets : []).map((set) => ({
        reps: "",
        weight: "",
        completed: false,
        targetReps: set.reps,
        targetWeight: set.weight,
      }));
      initialLog.user[exIndex] = JSON.parse(JSON.stringify(setsData));
      if (userProfile.partner) {
        initialLog.partner[exIndex] = JSON.parse(JSON.stringify(setsData));
      }
    });
    setSessionLog(initialLog);

    // Auto-fix: Check for snake_case names and fix them against the library
    let hasChanges = false;
    const updatedExercises = workoutDay.exercises.map(ex => {
      if (ex.name.includes('_')) {
        // Convert snake_case to Title Case (e.g., bench_press -> Bench Press)
        const formatName = (n) => n.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
        const fixedName = formatName(ex.name);

        // Find existing data in library
        const libraryEntry = userProfile.exerciseLibrary?.find(
          libEx => libEx.name.toLowerCase() === fixedName.toLowerCase()
        );

        if (libraryEntry) {
          hasChanges = true;
          const newMax = libraryEntry.oneRepMax;
          return {
            ...ex,
            name: fixedName,
            oneRepMax: newMax,
            sets: ex.sets.map(s => ({
              ...s,
              weight: Math.round((newMax * s.percentage) / 2.5) * 2.5
            }))
          };
        } else {
          // Just fix the name format even if not in library
          hasChanges = true;
          return { ...ex, name: fixedName };
        }
      }
      return ex;
    });

    if (hasChanges) {
      const newWorkoutDay = { ...workoutDay, exercises: updatedExercises };
      // Delay update slightly to avoid render loop interruption, though direct call is usually safe
      // Calling onUpdateWorkoutDay will propagate changes back to parent/Firestore
      onUpdateWorkoutDay(newWorkoutDay);
    }

  }, [workoutDay, userProfile.partner, userProfile.exerciseLibrary, onUpdateWorkoutDay]);

  const handleStartEditOneRepMax = () => {
    setIsEditing(true);
    setEditValue({ oneRepMax: String(currentExercise.oneRepMax || "") });
  };

  const handleSaveOneRepMax = () => {
    const rawValue = parseFloat(editValue.oneRepMax);
    // Validate 1RM: must be between 1 and 2000 lbs
    if (isNaN(rawValue) || rawValue <= 0 || rawValue > 2000) {
      setMessage("Please enter a valid 1 Rep Max (1-2000 lbs).");
      return;
    }
    const newOneRepMax = Math.max(1, Math.min(2000, rawValue));

    // Update the exercise library in Firebase
    onUpdateLibrary(currentExercise.name, newOneRepMax);

    // Immediately update the local workout day state so the UI reflects the change
    const updatedExercises = workoutDay.exercises.map((ex, index) => {
      if (index === currentExerciseIndex) {
        return {
          ...ex,
          oneRepMax: newOneRepMax,
          sets: ex.sets.map((set) => ({
            ...set,
            weight: Math.round((newOneRepMax * set.percentage) / 2.5) * 2.5,
          })),
        };
      }
      return ex;
    });

    const updatedWorkoutDay = {
      ...workoutDay,
      exercises: updatedExercises,
    };

    onUpdateWorkoutDay(updatedWorkoutDay);
    setIsEditing(false);
  };

  const handleOneRepMaxChange = (delta) => {
    const currentValue = parseFloat(editValue.oneRepMax) || 0;
    const newValue = Math.max(0, currentValue + delta);
    setEditValue({ oneRepMax: newValue.toString() });
  };

  const handleStartEditPartnerOneRepMax = () => {
    setIsEditingPartner(true);
    setPartnerEditValue({
      oneRepMax: String(userProfile.partner.maxes[currentExercise.id] || ""),
    });
  };

  const handlePartnerOneRepMaxChange = (delta) => {
    const currentValue = parseFloat(partnerEditValue.oneRepMax) || 0;
    const newValue = Math.max(0, currentValue + delta);
    setPartnerEditValue({ oneRepMax: newValue.toString() });
  };

  const handleSavePartnerOneRepMax = () => {
    const rawValue = parseFloat(partnerEditValue.oneRepMax);
    // Validate partner 1RM: must be between 1 and 2000 lbs
    if (isNaN(rawValue) || rawValue <= 0 || rawValue > 2000) {
      setMessage("Please enter a valid 1 Rep Max (1-2000 lbs).");
      return;
    }
    const newOneRepMax = Math.max(1, Math.min(2000, rawValue));
    onUpdatePartnerWorkoutData(currentExercise.id, newOneRepMax);
    setIsEditingPartner(false);
  };

  const handleFinishWorkout = useCallback(() => {
    const userWorkout = {
      date: new Date().toISOString(),
      dayName: workoutDay.name,
      exercises: workoutDay.exercises.map((ex, exIndex) => ({
        name: ex.name,
        sets: (sessionLog.user[exIndex] || [])
          .filter((s) => s.completed)
          .map((s) => ({
            reps: s.reps || s.targetReps,
            weight: s.weight || s.targetWeight,
          })),
      })),
    };
    onFinish(userWorkout);

    if (userProfile.partner) {
      const partnerWorkout = {
        date: new Date().toISOString(),
        dayName: workoutDay.name,
        exercises: workoutDay.exercises.map((ex, exIndex) => ({
          name: ex.name,
          sets: (sessionLog.partner[exIndex] || [])
            .filter((s) => s.completed)
            .map((s) => ({
              reps: s.reps || s.targetReps,
              weight: s.weight || s.targetWeight,
            })),
        })),
      };
      savePartnerWorkout(userProfile.uid, partnerWorkout);
    }
  }, [workoutDay, sessionLog, onFinish, userProfile]);

  const handleFeedback = useCallback(
    (feedback) => {
      const originalMax = currentExercise.oneRepMax;
      let newOneRepMax;
      if (feedback === "easy") {
        newOneRepMax = originalMax + 5;
      } else if (feedback === "just_right") {
        newOneRepMax = originalMax + 2.5;
      } else if (feedback === "hard") {
        newOneRepMax = originalMax - 5;
      }

      const updatedExercises = workoutDay.exercises.map((ex, index) => {
        if (index === currentExerciseIndex) {
          return { ...ex, oneRepMax: newOneRepMax };
        }
        return ex;
      });

      const updatedWorkoutDay = {
        ...workoutDay,
        exercises: updatedExercises,
      };

      onUpdateWorkoutDay(updatedWorkoutDay);

      if (currentExerciseIndex < workoutDay.exercises.length - 1) {
        setCurrentExerciseIndex(currentExerciseIndex + 1);
      } else {
        handleFinishWorkout();
      }
    },
    [
      currentExercise,
      currentExerciseIndex,
      workoutDay,
      handleFinishWorkout,
      onUpdateWorkoutDay,
    ]
  );

  const handleSetComplete = useCallback(
    (exIndex, setIndex, userType) => {
      setSessionLog((prevLog) => {
        const newLog = JSON.parse(JSON.stringify(prevLog));
        const currentSetLog = newLog[userType][exIndex][setIndex];
        newLog[userType][exIndex][setIndex] = {
          ...currentSetLog,
          reps: currentSetLog.reps || currentSetLog.targetReps,
          weight: currentSetLog.weight || currentSetLog.targetWeight,
          completed: true,
        };

        const updatedWorkoutDay = {
          ...workoutDay,
          dayIdentifier: workoutDay.dayIdentifier,
          exercises: workoutDay.exercises.map((ex, i) => {
            if (i === exIndex) {
              const newSets = ex.sets.map((set, j) => {
                if (j === setIndex) {
                  return {
                    ...set,
                    completed: true,
                    completedReps:
                      newLog[userType][exIndex][setIndex].reps ||
                      newLog[userType][exIndex][setIndex].targetReps,
                  };
                }
                return set;
              });
              return { ...ex, sets: newSets };
            }
            return ex;
          }),
        };
        onUpdateWorkoutDay(updatedWorkoutDay);
        return newLog;
      });
      startTimer(userProfile.restTimer || 120, userType, setIndex);
    },
    [startTimer, userProfile.restTimer, workoutDay, onUpdateWorkoutDay]
  );

  const handleSelectExercise = (index) => {
    setCurrentExerciseIndex(index);
    setIsMenuOpen(false);
  };

  if (!currentExercise) {
    return (
      <div className="text-center p-8">
        Workout complete or no exercises found.
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 text-white animate-fade-in">
      <div className="max-w-4xl mx-auto">
        <div className="bg-gray-800 rounded-2xl shadow-lg p-6 mb-6 flex justify-between items-center">
          <div className="flex-1"></div>
          <h1 className="text-3xl font-bold text-center mb-1 flex-1">
            {workoutDay.name}
          </h1>
          <div className="flex-1 flex justify-end items-center gap-4">
            {userProfile.partner && (
              <div className="flex items-center gap-2">
                <span className="text-white">{userProfile.displayName}</span>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    className="sr-only peer"
                    checked={isPartnerView}
                    onChange={handleToggle}
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                </label>
                <span className="text-white">{userProfile.partner.name}</span>
              </div>
            )}
            <button
              onClick={() => onNavigate("dashboard")}
              className="bg-gray-700 hover:bg-gray-600 text-white font-bold py-2 px-4 rounded-lg transition-colors"
            >
              Return to Dashboard
            </button>
          </div>
        </div>

        <div className="bg-gray-800 rounded-2xl shadow-lg p-6">
          <div className="relative text-center">
            <h2
              className="text-4xl font-bold mb-2 text-center text-blue-400 cursor-pointer"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
              {currentExercise.name}
            </h2>
            <p className="text-2xl font-bold text-white mb-2">
              {currentExercise.oneRepMax} lbs
            </p>
            {isPartnerView && userProfile.partner && (
              <p className="text-xl font-bold text-white mb-2">
                {userProfile.partner.name}'s 1RM:{" "}
                {userProfile.partner.maxes[currentExercise.id] || "N/A"} lbs
              </p>
            )}
            <p className="text-gray-400 mb-4">
              Exercise {currentExerciseIndex + 1} of{" "}
              {workoutDay.exercises.length}
            </p>
            {isMenuOpen && (
              <div className="absolute z-10 top-full left-1/2 -translate-x-1/2 bg-gray-900 border border-gray-700 rounded-lg shadow-lg mt-2">
                <ul className="py-2">
                  {workoutDay.exercises.map((ex, index) => (
                    <li
                      key={index}
                      onClick={() => handleSelectExercise(index)}
                      className="px-4 py-2 hover:bg-gray-700 cursor-pointer"
                    >
                      {ex.name}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          <div className="text-center mb-4">
            {isEditing ? (
              <div className="flex flex-col items-center gap-2 p-4 bg-gray-700 rounded-lg">
                <h4 className="font-semibold">Update 1 Rep Max</h4>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    value={editValue.oneRepMax}
                    onChange={(e) =>
                      setEditValue({ oneRepMax: e.target.value })
                    }
                    className="w-24 text-center bg-gray-800 border border-gray-600 rounded-md p-2"
                  />
                  <button
                    onClick={() => handleOneRepMaxChange(-2.5)}
                    className="p-2 rounded-full bg-blue-600 text-white hover:bg-blue-500"
                  >
                    <Minus size={16} />
                  </button>
                  <button
                    onClick={() => handleOneRepMaxChange(2.5)}
                    className="p-2 rounded-full bg-blue-600 text-white hover:bg-blue-500"
                  >
                    <Plus size={16} />
                  </button>
                </div>
                <div className="flex gap-2 mt-2">
                  <button
                    onClick={handleSaveOneRepMax}
                    className="bg-green-600 hover:bg-green-500 text-white font-bold py-2 px-4 rounded-lg flex items-center gap-2"
                  >
                    <Save size={18} /> Save
                  </button>
                  <button
                    onClick={() => setIsEditing(false)}
                    className="bg-gray-600 hover:bg-gray-500 text-white font-bold py-2 px-4 rounded-lg flex items-center gap-2"
                  >
                    <X size={18} /> Cancel
                  </button>
                </div>
              </div>
            ) : (
              <button
                onClick={handleStartEditOneRepMax}
                className="text-blue-400 hover:text-blue-300 mt-1 flex items-center gap-1 mx-auto"
              >
                <Edit size={16} /> Edit 1RM
              </button>
            )}

            {isPartnerView && isEditingPartner ? (
              <div className="flex flex-col items-center gap-2 p-4 bg-gray-700 rounded-lg mt-4">
                <h4 className="font-semibold">
                  Update {userProfile.partner.name}'s 1 Rep Max
                </h4>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    value={partnerEditValue.oneRepMax}
                    onChange={(e) =>
                      setPartnerEditValue({ oneRepMax: e.target.value })
                    }
                    className="w-24 text-center bg-gray-800 border border-gray-600 rounded-md p-2"
                  />
                  <button
                    onClick={() => handlePartnerOneRepMaxChange(-2.5)}
                    className="p-2 rounded-full bg-blue-600 text-white hover:bg-blue-500"
                  >
                    <Minus size={16} />
                  </button>
                  <button
                    onClick={() => handlePartnerOneRepMaxChange(2.5)}
                    className="p-2 rounded-full bg-blue-600 text-white hover:bg-blue-500"
                  >
                    <Plus size={16} />
                  </button>
                </div>
                <div className="flex gap-2 mt-2">
                  <button
                    onClick={handleSavePartnerOneRepMax}
                    className="bg-green-600 hover:bg-green-500 text-white font-bold py-2 px-4 rounded-lg flex items-center gap-2"
                  >
                    <Save size={18} /> Save
                  </button>
                  <button
                    onClick={() => setIsEditingPartner(false)}
                    className="bg-gray-600 hover:bg-gray-500 text-white font-bold py-2 px-4 rounded-lg flex items-center gap-2"
                  >
                    <X size={18} /> Cancel
                  </button>
                </div>
              </div>
            ) : (
              isPartnerView && (
                <button
                  onClick={handleStartEditPartnerOneRepMax}
                  className="text-blue-400 hover:text-blue-300 mt-1 flex items-center gap-1 mx-auto"
                >
                  <Edit size={16} /> Edit {userProfile.partner.name}'s 1RM
                </button>
              )
            )}
          </div>
          <div
            className={`mt-6 grid ${isPartnerView ? "grid-cols-1 md:grid-cols-2" : "grid-cols-1"
              } gap-4`}
          >
            {/* Column Headers TODO: userProfile.displayName does not currently exist (create it)*/}
            <div className="text-xl font-semibold text-center mb-2 h-14 flex items-center justify-center">
              {userProfile.displayName}
            </div>
            {isPartnerView && (
              <div className="text-xl font-semibold text-center mb-2 h-14 flex items-center justify-center">
                {userProfile.partner.name}
              </div>
            )}

            {/* Sets rendered in sequence to fill the grid */}
            {sets.map((set, setIndex) => {
              const partnerSet = isPartnerView
                ? userProfile.partner.workoutPlan[workoutDay.dayIdentifier]
                  ?.exercises[currentExerciseIndex]?.sets[setIndex]
                : null;
              return (
                <React.Fragment key={setIndex}>
                  <SetCard
                    set={set}
                    setIndex={setIndex}
                    exIndex={currentExerciseIndex}
                    userType="user"
                    sessionLog={sessionLog}
                    handleSetComplete={handleSetComplete}
                    availablePlates={availablePlates}
                    setSessionLog={setSessionLog}
                    lastCompletedSet={lastCompletedSet}
                  />
                  {isPartnerView && (
                    <SetCard
                      set={partnerSet || set}
                      setIndex={setIndex}
                      exIndex={currentExerciseIndex}
                      userType="partner"
                      sessionLog={sessionLog}
                      handleSetComplete={handleSetComplete}
                      availablePlates={availablePlates}
                      setSessionLog={setSessionLog}
                      lastCompletedSet={lastCompletedSet}
                    />
                  )}
                </React.Fragment>
              );
            })}
          </div>

          <div className="mt-8 pt-6 border-t border-gray-700">
            <h3 className="text-lg font-semibold text-center mb-4">
              How did that exercise feel overall?
            </h3>
            <div className="grid grid-cols-3 gap-4">
              <button
                onClick={() => handleFeedback("hard")}
                className="bg-red-600 hover:bg-red-500 p-4 rounded-lg font-bold"
              >
                Too Hard
              </button>
              <button
                onClick={() => handleFeedback("just_right")}
                className="bg-yellow-500 hover:bg-yellow-400 p-4 rounded-lg font-bold"
              >
                Just Right
              </button>
              <button
                onClick={() => handleFeedback("easy")}
                className="bg-green-600 hover:bg-green-500 p-4 rounded-lg font-bold"
              >
                Too Easy
              </button>
            </div>
          </div>
        </div>

        <div className="mt-6 flex justify-center">
          <button
            onClick={handleFinishWorkout}
            className="bg-gray-600 hover:bg-red-700 text-white font-bold py-3 px-8 rounded-lg"
          >
            Finish Workout Early
          </button>
        </div>
      </div>
    </div>
  );
};

const SetCard = ({
  set,
  setIndex,
  exIndex,
  userType,
  sessionLog,
  handleSetComplete,
  availablePlates,
  setSessionLog,
  lastCompletedSet,
}) => {
  const { isTimerActive, timerDuration, stopTimer } = useWorkout();
  const log = sessionLog[userType]?.[exIndex]?.[setIndex];
  if (!log) return null;

  const isCurrentCompletedSet =
    lastCompletedSet &&
    lastCompletedSet.userType === userType &&
    lastCompletedSet.setIndex === setIndex;

  return (
    <div>
      <div
        className={`flex items-center justify-between p-4 rounded-lg h-32 ${log.completed ? "bg-green-800/50" : "bg-gray-700"
          }`}
      >
        <div className="flex items-center gap-4">
          <div
            className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-lg ${log.completed ? "bg-green-500" : "bg-gray-600"
              }`}
          >
            {setIndex + 1}
          </div>
          <div>
            <p className="font-semibold">
              Target: {set.reps} reps @ {set.weight} lbs
            </p>
            {set.weight > 0 && (
              <MiniPlateDisplay
                targetWeight={set.weight}
                availablePlates={availablePlates}
              />
            )}
          </div>
        </div>
        {!log.completed ? (
          <div className="flex items-center gap-2">
            <FormField
              id={`reps-${userType}-${setIndex}`}
              type="number"
              placeholder="Reps"
              className="w-16 bg-gray-800"
              onChange={(e) => {
                const reps = e.target.value;
                setSessionLog((prevLog) => {
                  const newLog = JSON.parse(JSON.stringify(prevLog));
                  newLog[userType][exIndex][setIndex].reps = reps;
                  return newLog;
                });
              }}
            />
            <button
              onClick={() => handleSetComplete(exIndex, setIndex, userType)}
              className="bg-green-600 hover:bg-green-500 text-white font-bold py-2 px-4 rounded-lg"
            >
              Save
            </button>
          </div>
        ) : (
          <p className="text-lg">{log.reps} reps</p>
        )}
      </div>
      {isTimerActive && isCurrentCompletedSet && (
        <div className="flex justify-center py-2">
          <Timer duration={timerDuration} onComplete={stopTimer} />
        </div>
      )}
    </div>
  );
};
