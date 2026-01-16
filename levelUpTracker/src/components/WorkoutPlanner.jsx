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
  sessionLog,
  setSessionLog,
}) => {
  const {
    isTimerActive,
    timerDuration,
    startTimer,
    stopTimer,
    lastCompletedSet,
  } = useWorkout();
  const [currentExerciseIndex, setCurrentExerciseIndex] = useState(0);
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

  // Ref to track if snake_case names have been fixed
  const hasFixedNamesRef = React.useRef(false);

  // Handle snake_case name fix - only run once on mount
  useEffect(() => {
    if (hasFixedNamesRef.current) return;

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
      hasFixedNamesRef.current = true;
      const newWorkoutDay = { ...workoutDay, exercises: updatedExercises };
      onUpdateWorkoutDay(newWorkoutDay);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
      // Update the session log only - no Firebase update to avoid page refresh
      setSessionLog((prevLog) => {
        const newLog = JSON.parse(JSON.stringify(prevLog));
        const currentSetLog = newLog[userType][exIndex][setIndex];
        newLog[userType][exIndex][setIndex] = {
          ...currentSetLog,
          reps: currentSetLog.reps || currentSetLog.targetReps,
          weight: currentSetLog.weight || currentSetLog.targetWeight,
          completed: true,
        };
        return newLog;
      });
      startTimer(userProfile.restTimer || 120, userType, setIndex);
    },
    [startTimer, userProfile.restTimer, setSessionLog]
  );

  // Function to mark a set as not complete (undo completion)
  const handleSetUncomplete = useCallback(
    (exIndex, setIndex, userType) => {
      setSessionLog((prevLog) => {
        const newLog = JSON.parse(JSON.stringify(prevLog));
        newLog[userType][exIndex][setIndex] = {
          ...newLog[userType][exIndex][setIndex],
          completed: false,
        };
        return newLog;
      });
      // Stop the timer if it's running
      stopTimer();
    },
    [setSessionLog, stopTimer]
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
            className={`mt-6 grid ${isPartnerView ? "grid-cols-2" : "grid-cols-1"
              } gap-2 sm:gap-4`}
          >
            {/* Column Headers */}
            <div className={`font-semibold text-center mb-2 flex items-center justify-center ${isPartnerView ? "text-sm sm:text-xl h-10 sm:h-14" : "text-xl h-14"}`}>
              {userProfile.displayName}
            </div>
            {isPartnerView && (
              <div className="text-sm sm:text-xl font-semibold text-center mb-2 h-10 sm:h-14 flex items-center justify-center">
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
                    handleSetUncomplete={handleSetUncomplete}
                    availablePlates={availablePlates}
                    setSessionLog={setSessionLog}
                    lastCompletedSet={lastCompletedSet}
                    isPartnerView={isPartnerView}
                  />
                  {isPartnerView && (
                    <SetCard
                      set={partnerSet || set}
                      setIndex={setIndex}
                      exIndex={currentExerciseIndex}
                      userType="partner"
                      sessionLog={sessionLog}
                      handleSetComplete={handleSetComplete}
                      handleSetUncomplete={handleSetUncomplete}
                      availablePlates={availablePlates}
                      setSessionLog={setSessionLog}
                      lastCompletedSet={lastCompletedSet}
                      isPartnerView={isPartnerView}
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
  handleSetUncomplete,
  availablePlates,
  setSessionLog,
  lastCompletedSet,
  isPartnerView = false,
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
        className={`flex flex-col rounded-lg ${isPartnerView ? "p-2 gap-1" : "p-3 sm:p-4 gap-2"} ${log.completed ? "bg-green-800/50" : "bg-gray-700"}`}
      >
        {/* Partner View - Compact layout */}
        {isPartnerView ? (
          <div className="flex flex-col gap-2">
            {/* Badge */}
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm flex-shrink-0 mx-auto ${log.completed ? "bg-green-500" : "bg-gray-600"}`}
            >
              {setIndex + 1}
            </div>

            {/* Compact inputs - stays same dark color when completed */}
            <div className={`flex items-center rounded-lg overflow-hidden border transition-colors bg-gray-800 ${log.completed ? "border-gray-600" : "border-gray-600 focus-within:border-blue-500"}`}>
              <div className="flex items-center flex-1 justify-center px-1">
                <input
                  id={`reps-${userType}-${setIndex}`}
                  type="number"
                  value={log.reps ?? ''}
                  disabled={log.completed}
                  className={`w-10 h-9 bg-transparent text-center text-sm font-semibold focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none text-white`}
                  onChange={(e) => {
                    const reps = e.target.value;
                    setSessionLog((prevLog) => {
                      const newLog = JSON.parse(JSON.stringify(prevLog));
                      newLog[userType][exIndex][setIndex].reps = reps;
                      return newLog;
                    });
                  }}
                />
                {log.isAMRAP && (
                  <span
                    className="w-3 h-3 rounded-full bg-gray-600 text-white text-sm font-bold flex items-center justify-center flex-shrink-0 -ml-3 -mt-3"
                    title="As Many Reps As Possible"
                  >
                    +
                  </span>
                )}
                <span className="text-xs text-gray-400 ml-3">reps</span>
              </div>
              {/* Centered divider */}
              <div className="w-px h-6 bg-gray-600"></div>
              <div className="flex items-center flex-1 justify-center px-1">
                <input
                  id={`weight-${userType}-${setIndex}`}
                  type="number"
                  value={log.weight ?? ''}
                  disabled={log.completed}
                  className={`w-12 h-9 bg-transparent text-center text-sm font-semibold focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none text-white`}
                  onChange={(e) => {
                    const weight = e.target.value;
                    setSessionLog((prevLog) => {
                      const newLog = JSON.parse(JSON.stringify(prevLog));
                      newLog[userType][exIndex][setIndex].weight = weight;
                      return newLog;
                    });
                  }}
                />
                <span className="text-xs text-gray-400">lbs</span>
              </div>
            </div>

            {/* Toggle button */}
            <button
              onClick={() => log.completed
                ? handleSetUncomplete(exIndex, setIndex, userType)
                : handleSetComplete(exIndex, setIndex, userType)
              }
              className={`font-bold h-8 rounded-lg transition-colors text-sm shadow-md w-full flex items-center justify-center ${log.completed
                ? "bg-gray-700 hover:bg-gray-600 text-white"
                : "bg-green-600 hover:bg-green-500 text-white"
                }`}
            >
              {log.completed ? <X size={16} /> : "✓"}
            </button>

            {/* Plate display for partner view - fixed height for consistent card size */}
            <div className="flex justify-center items-end h-14">
              {set.weight > 0 && (
                <MiniPlateDisplay
                  targetWeight={set.weight}
                  availablePlates={availablePlates}
                />
              )}
            </div>
          </div>
        ) : (
          /* Non-Partner View - Clean horizontal layout */
          <>
            {/* Main row with badge and inputs */}
            <div className="flex items-center gap-3 sm:gap-4 w-full">
              {/* Set number badge */}
              <div
                className={`w-11 h-11 sm:w-10 sm:h-10 rounded-full flex items-center justify-center font-bold text-lg flex-shrink-0 ${log.completed ? "bg-green-500" : "bg-gray-600"}`}
              >
                {setIndex + 1}
              </div>

              {/* Input controls */}
              {!log.completed ? (
                <div className="flex items-center gap-2 flex-1">
                  {/* Unified input group */}
                  <div className="flex items-center bg-gray-800 rounded-xl overflow-hidden border border-gray-600 focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-500/30 transition-colors duration-200 flex-1">
                    {/* Reps input group */}
                    <div className="flex items-center flex-1 justify-center px-1">
                      <div className="relative">
                        <input
                          id={`reps-${userType}-${setIndex}`}
                          type="number"
                          value={log.reps ?? ''}
                          className="w-14 sm:w-16 h-12 bg-transparent text-white text-center text-xl sm:text-lg font-semibold focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none selection:bg-blue-500/40 relative z-10 peer"
                          onChange={(e) => {
                            const reps = e.target.value;
                            setSessionLog((prevLog) => {
                              const newLog = JSON.parse(JSON.stringify(prevLog));
                              newLog[userType][exIndex][setIndex].reps = reps;
                              return newLog;
                            });
                          }}
                        />
                        <div className="absolute inset-1 bg-gray-600/50 rounded opacity-0 peer-focus:opacity-100 transition-opacity pointer-events-none"></div>
                      </div>
                      {log.isAMRAP && (
                        <span
                          className="w-4 h-4 rounded-full bg-gray-600 text-white text-base font-bold flex items-center justify-center flex-shrink-0 shadow-md -ml-5 -mt-5"
                          title="As Many Reps As Possible"
                        >
                          +
                        </span>
                      )}
                      <span className="text-gray-400 text-xs sm:text-sm ml-4">reps</span>
                    </div>

                    {/* Centered divider */}
                    <div className="w-px h-8 bg-gray-600"></div>

                    {/* Weight input group */}
                    <div className="flex items-center flex-1 justify-center px-1">
                      <div className="relative">
                        <input
                          id={`weight-${userType}-${setIndex}`}
                          type="number"
                          value={log.weight ?? ''}
                          className="w-16 sm:w-20 h-12 bg-transparent text-white text-center text-xl sm:text-lg font-semibold focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none selection:bg-blue-500/40 relative z-10 peer"
                          onChange={(e) => {
                            const weight = e.target.value;
                            setSessionLog((prevLog) => {
                              const newLog = JSON.parse(JSON.stringify(prevLog));
                              newLog[userType][exIndex][setIndex].weight = weight;
                              return newLog;
                            });
                          }}
                        />
                        <div className="absolute inset-1 bg-gray-600/50 rounded opacity-0 peer-focus:opacity-100 transition-opacity pointer-events-none"></div>
                      </div>
                      <span className="text-gray-400 text-xs sm:text-sm">lbs</span>
                    </div>
                  </div>

                  <button
                    onClick={() => handleSetComplete(exIndex, setIndex, userType)}
                    className="bg-green-600 hover:bg-green-500 text-white font-bold h-12 px-4 sm:px-5 rounded-xl transition-colors text-base shadow-lg hover:shadow-green-500/25 flex-shrink-0"
                  >
                    Save
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-4 flex-1">
                  <div className="flex items-center gap-2 bg-green-700/30 px-5 py-3 rounded-xl border border-green-600/50 flex-1 justify-center">
                    <span className="text-sm sm:text-lg font-semibold text-green-300">{log.reps}</span>
                    {log.isAMRAP && (
                      <span
                        className="w-4 h-4 rounded-full bg-gray-600 text-white text-base font-bold flex items-center justify-center flex-shrink-0 shadow-md -ml-2 -mt-5"
                        title="As Many Reps As Possible"
                      >
                        +
                      </span>
                    )}
                    <span className="text-sm sm:text-lg font-semibold text-green-300 ml-3">reps</span>
                    <span className="text-green-500 text-sm">@</span>
                    <span className="text-sm sm:text-lg font-semibold text-green-300">{log.weight} lbs</span>
                  </div>
                  <button
                    onClick={() => handleSetUncomplete(exIndex, setIndex, userType)}
                    className="w-8 h-8 flex items-center justify-center rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-300 hover:text-white border border-gray-600 transition-all shadow-md flex-shrink-0"
                    title="Mark as not complete"
                  >
                    <X size={16} />
                  </button>
                </div>
              )}
            </div>

            {/* Plate display - below inputs */}
            {set.weight > 0 && (
              <div className="flex justify-center mt-1">
                <MiniPlateDisplay
                  targetWeight={set.weight}
                  availablePlates={availablePlates}
                />
              </div>
            )}
          </>
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

