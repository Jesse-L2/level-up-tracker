import React, { useState, useEffect, useCallback } from "react";
import { savePartnerWorkout } from "../firebase";
import { FormField } from "./ui/FormField";
import { Edit, Save, X } from "lucide-react";
import { MiniPlateDisplay } from "./ui/MiniPlateDisplay";
import { Timer } from "./ui/Timer";

export const WorkoutPlanner = ({
  workoutDay,
  onFinish,
  onUpdateExercise,
  onUpdateLibrary,
  availablePlates,
  onNavigate,
  userProfile,
}) => {
  const [currentExerciseIndex, setCurrentExerciseIndex] = useState(0);
  const [sessionLog, setSessionLog] = useState({ user: {}, partner: {} });
  const [suggested1RM, setSuggested1RM] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState({ oneRepMax: "" });
  const [message, setMessage] = useState(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isTimerActive, setIsTimerActive] = useState(false);
  const [lastCompletedSetIndex, setLastCompletedSetIndex] = useState(null);
  const [isPartnerView, setIsPartnerView] = useState(false);

  const currentExercise = workoutDay.exercises[currentExerciseIndex];
  const sets = Array.isArray(currentExercise?.sets) ? currentExercise.sets : [];

  const handleToggle = () => {
    setIsPartnerView((prev) => userProfile.partner && !prev);
  };

  useEffect(() => {
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
  }, [workoutDay, userProfile.partner]);

  const handleStartEditOneRepMax = () => {
    setIsEditing(true);
    setEditValue({ oneRepMax: currentExercise.oneRepMax });
  };

  const handleSaveOneRepMax = () => {
    const newOneRepMax = parseFloat(editValue.oneRepMax);
    if (newOneRepMax > 0) {
      onUpdateLibrary(currentExercise.name, newOneRepMax);
      setIsEditing(false);
      currentExercise.oneRepMax = newOneRepMax;
    } else {
      setMessage("Please enter a valid 1 Rep Max.");
    }
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
      if (feedback === "easy") {
        currentExercise.oneRepMax =
          Math.round((originalMax * 1.025) / 2.5) * 2.5;
      } else if (feedback === "hard") {
        currentExercise.oneRepMax =
          Math.round((originalMax * 0.975) / 2.5) * 2.5;
      }

      if (currentExerciseIndex < workoutDay.exercises.length - 1) {
        setCurrentExerciseIndex(currentExerciseIndex + 1);
      } else {
        handleFinishWorkout();
      }
    },
    [
      currentExercise,
      currentExerciseIndex,
      workoutDay.exercises.length,
      handleFinishWorkout,
    ]
  );

  const handleSetComplete = useCallback((exIndex, setIndex, userType) => {
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
    setLastCompletedSetIndex(setIndex);
    setIsTimerActive(true);
  }, []);

  const handleTimerComplete = () => setIsTimerActive(false);

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
              <div className="flex flex-col items-center justify-center gap-2 mt-2">
                <p className="text-gray-400">
                  Old 1RM: {currentExercise.oneRepMax} lbs
                </p>
                <div className="flex items-center gap-2">
                  <FormField
                    id="newOneRepMax"
                    type="number"
                    value={editValue.oneRepMax}
                    onChange={(e) =>
                      setEditValue({ ...editValue, oneRepMax: e.target.value })
                    }
                    className="w-24"
                  />
                  <button
                    onClick={handleSaveOneRepMax}
                    className="bg-green-600 hover:bg-green-500 text-white font-bold py-1 px-3 rounded-lg"
                  >
                    <Save size={18} />
                  </button>
                  <button
                    onClick={() => setIsEditing(false)}
                    className="bg-gray-600 hover:bg-gray-500 text-white font-bold py-1 px-3 rounded-lg"
                  >
                    <X size={18} />
                  </button>
                </div>
              </div>
            ) : (
              <button
                onClick={handleStartEditOneRepMax}
                className="text-blue-400 hover:text-blue-300 mt-1"
              >
                Edit 1RM
              </button>
            )}
          </div>
          <div
            className={`mt-6 grid ${
              isPartnerView ? "grid-cols-1 md:grid-cols-2" : "grid-cols-1"
            } gap-4`}
          >
            {/* Column Headers */}
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
}) => {
  const log = sessionLog[userType]?.[exIndex]?.[setIndex];
  if (!log) return null;

  return (
    <div
      className={`flex items-center justify-between p-4 rounded-lg ${
        log.completed ? "bg-green-800/50" : "bg-gray-700"
      }`}
    >
      <div className="flex items-center gap-4">
        <div
          className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-lg ${
            log.completed ? "bg-green-500" : "bg-gray-600"
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
            className="w-20 bg-gray-800"
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
  );
};
