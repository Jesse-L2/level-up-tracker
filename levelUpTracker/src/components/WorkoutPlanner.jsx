import React, { useState, useEffect, useCallback } from "react";
import { FormField } from "./ui/FormField";
import { Edit, Save, X } from "lucide-react";
import { MiniPlateDisplay } from "./ui/MiniPlateDisplay";

export const WorkoutPlanner = ({
  workoutDay,
  onFinish,
  onUpdateExercise,
  onUpdateLibrary,
  availablePlates,
}) => {
  const [currentExerciseIndex, setCurrentExerciseIndex] = useState(0);
  const [sessionLog, setSessionLog] = useState({});
  const [suggested1RM, setSuggested1RM] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState({ oneRepMax: "" });
  const [message, setMessage] = useState(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const currentExercise = workoutDay.exercises[currentExerciseIndex];

  useEffect(() => {
    const initialLog = {};
    workoutDay.exercises.forEach((ex, exIndex) => {
      initialLog[exIndex] = (Array.isArray(ex.sets) ? ex.sets : []).map((set) => ({
        reps: "",
        weight: "",
        completed: false,
        targetReps: set.reps,
        targetWeight: set.weight,
      }));
    });
    setSessionLog(initialLog);
  }, [workoutDay]);

  const handleStartEditOneRepMax = () => {
    setIsEditing(true);
    setEditValue({ oneRepMax: currentExercise.oneRepMax });
  };

  const handleSaveOneRepMax = () => {
    const newOneRepMax = parseFloat(editValue.oneRepMax);
    if (newOneRepMax > 0) {
      onUpdateLibrary(currentExercise.name, newOneRepMax);
      setIsEditing(false);
      // Optimistically update the UI
      currentExercise.oneRepMax = newOneRepMax;
    } else {
      setMessage("Please enter a valid 1 Rep Max.");
    }
  };

  const handleFinishWorkout = useCallback(() => {
    const completedWorkout = {
      date: new Date().toISOString(),
      dayName: workoutDay.name,
      exercises: workoutDay.exercises.map((ex, exIndex) => ({
        name: ex.name,
        sets: (sessionLog[exIndex] || [])
          .filter((s) => s.completed)
          .map((s) => ({
            reps: s.reps || s.targetReps,
            weight: s.weight || s.targetWeight,
          })),
      })),
    };
    onFinish(completedWorkout);
  }, [workoutDay, sessionLog, onFinish]);

  const handleFeedback = useCallback(
    (feedback) => {
      const originalMax = currentExercise.oneRepMax;
      let newMax = originalMax;

      if (feedback === "easy") {
        newMax = Math.round((originalMax * 1.025) / 2.5) * 2.5; // Suggest ~2.5% increase
      } else if (feedback === "hard") {
        newMax = Math.round((originalMax * 0.975) / 2.5) * 2.5; // Suggest ~2.5% decrease
      }

      if (newMax !== originalMax) {
        // Instead of window.confirm, set state to show inline update form
        // For now, we'll just progress and let the user manually update if they wish
        // This will be handled by the new UI for 1RM update
      }

      // Always progress to the next exercise after feedback
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
      onUpdateLibrary,
      handleFinishWorkout,
    ]
  );

  const handleSetComplete = useCallback((exIndex, setIndex) => {
    setSessionLog((prevLog) => {
      const newLog = JSON.parse(JSON.stringify(prevLog));
      const currentSetLog = newLog[exIndex][setIndex];

      newLog[exIndex][setIndex] = {
        ...currentSetLog,
        reps: currentSetLog.reps || currentSetLog.targetReps,
        weight: currentSetLog.weight || currentSetLog.targetWeight,
        completed: true,
      };
      return newLog;
    });
  }, []);

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
        <div className="bg-gray-800 rounded-2xl shadow-lg p-6 mb-6">
          <h1 className="text-3xl font-bold text-center mb-1">
            {workoutDay.name}
          </h1>
          <div className="relative text-center">
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="text-gray-400 mb-4"
            >
              Exercise {currentExerciseIndex + 1} of{" "}
              {workoutDay.exercises.length} (Click to select)
            </button>
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
        </div>

        <div className="bg-gray-800 rounded-2xl shadow-lg p-6">
          <h2 className="text-4xl font-bold mb-2 text-center text-blue-400">
            {currentExercise.name}
          </h2>
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
          <div className="space-y-3 mt-6">
            {(Array.isArray(currentExercise.sets) ? currentExercise.sets : []).map((set, setIndex) => (
              <div
                key={setIndex}
                className={`flex items-center justify-between p-4 rounded-lg ${
                  sessionLog[currentExerciseIndex]?.[setIndex]?.completed
                    ? "bg-green-800/50"
                    : "bg-gray-700"
                }`}
              >
                <div className="flex items-center gap-4">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-lg ${
                      sessionLog[currentExerciseIndex]?.[setIndex]?.completed
                        ? "bg-green-500"
                        : "bg-gray-600"
                    }`}
                  >
                    {setIndex + 1}
                  </div>
                  <div>
                    <p className="font-semibold">
                      Target: {set.reps} reps @ {set.weight} lbs
                    </p>
                    {currentExercise.type === "barbell" && set.weight > 0 && (
                      <MiniPlateDisplay
                        targetWeight={set.weight}
                        availablePlates={availablePlates}
                      />
                    )}
                  </div>
                </div>
                {!sessionLog[currentExerciseIndex]?.[setIndex]?.completed ? (
                  <div className="flex items-center gap-2">
                    <FormField
                      id={`reps-${setIndex}`}
                      type="number"
                      placeholder="Reps"
                      className="w-20 bg-gray-800"
                      onChange={(e) => {
                        const reps = e.target.value;
                        setSessionLog((prevLog) => {
                          const newLog = JSON.parse(JSON.stringify(prevLog));
                          newLog[currentExerciseIndex][setIndex].reps = reps;
                          return newLog;
                        });
                      }}
                    />
                    <button
                      onClick={() =>
                        handleSetComplete(currentExerciseIndex, setIndex)
                      }
                      className="bg-green-600 hover:bg-green-500 text-white font-bold py-2 px-4 rounded-lg"
                    >
                      Save
                    </button>
                  </div>
                ) : (
                  <p className="text-lg">
                    {sessionLog[currentExerciseIndex]?.[setIndex]?.reps} reps
                  </p>
                )}
              </div>
            ))}
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
