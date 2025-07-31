import React, { useState, useEffect, useCallback } from "react";
import { FormField } from "./ui/FormField";
import { Edit, Save, X } from "lucide-react";

const roundWeight = (weight, increment = 2.5) => {
  return Math.round(weight / increment) * increment;
};

export const WorkoutPlanner = ({ workoutDay, onFinish, onUpdateExercise }) => {
  const [currentExerciseIndex, setCurrentExerciseIndex] = useState(0);
  const [sessionLog, setSessionLog] = useState({});
  const [isEditing, setIsEditing] = useState(null);
  const [editValue, setEditValue] = useState({ reps: "", weight: "" });
  const [message, setMessage] = useState(null);

  const currentExercise = workoutDay.exercises[currentExerciseIndex];

  useEffect(() => {
    const initialLog = {};
    workoutDay.exercises.forEach((ex, exIndex) => {
      initialLog[exIndex] = Array(ex.sets).fill({
        reps: "",
        weight: "",
        completed: false,
      });
    });
    setSessionLog(initialLog);
  }, [workoutDay]);

  const handleFinishWorkout = useCallback(() => {
    const completedWorkout = {
      date: new Date().toISOString(),
      dayName: workoutDay.name,
      exercises: workoutDay.exercises.map((ex, exIndex) => ({
        name: ex.name,
        sets: (sessionLog[exIndex] || [])
          .filter((s) => s.completed)
          .map((s) => ({
            reps: s.reps || ex.reps,
            weight: s.weight || ex.weight,
          })),
      })),
    };
    onFinish(completedWorkout);
  }, [workoutDay, sessionLog, onFinish]);

  const handleFeedback = useCallback(
    (feedback) => {
      setMessage(null);
      const updatedWorkoutDay = JSON.parse(JSON.stringify(workoutDay));
      const exerciseToUpdate =
        updatedWorkoutDay.exercises[currentExerciseIndex];
      let newWeight = parseFloat(exerciseToUpdate.weight);

      if (feedback === "easy") {
        newWeight *= 1.05;
      } else if (feedback === "hard") {
        newWeight *= 0.95;
      }

      exerciseToUpdate.weight = roundWeight(newWeight, 2.5);

      onUpdateExercise(currentExerciseIndex, exerciseToUpdate);

      if (currentExerciseIndex < workoutDay.exercises.length - 1) {
        setCurrentExerciseIndex(currentExerciseIndex + 1);
        setEditValue({ reps: "", weight: "" });
        setIsEditing(null);
      } else {
        handleFinishWorkout();
      }
    },
    [workoutDay, currentExerciseIndex, onUpdateExercise, handleFinishWorkout]
  );

  const handleSetComplete = useCallback(
    (exIndex, setIndex) => {
      setMessage(null);
      setSessionLog((prevLog) => {
        const newLog = { ...prevLog };
        const currentSet = newLog[exIndex][setIndex];
        const exercise = workoutDay.exercises[exIndex];

        const reps = parseInt(currentSet.reps || exercise.reps, 10);
        const weight = parseFloat(currentSet.weight || exercise.weight);

        if (isNaN(reps) || reps <= 0 || isNaN(weight) || weight < 0) {
          setMessage(
            "Please enter valid positive numbers for reps and weight before completing."
          );
          return prevLog;
        }

        newLog[exIndex][setIndex] = {
          reps: String(reps),
          weight: String(weight),
          completed: true,
        };
        return newLog;
      });
    },
    [workoutDay.exercises]
  );

  const handleStartEdit = useCallback(
    (exerciseIndex, setIndex) => {
      setMessage(null);
      const currentLog = sessionLog[exerciseIndex]?.[setIndex];
      const exercise = workoutDay.exercises[exerciseIndex];
      setEditValue({
        reps: String(currentLog?.reps || exercise.reps),
        weight: String(currentLog?.weight || exercise.weight),
      });
      setIsEditing({ exerciseIndex, setIndex });
    },
    [sessionLog, workoutDay.exercises]
  );

  const handleSaveEdit = useCallback(() => {
    if (!isEditing) return;
    const { exerciseIndex, setIndex } = isEditing;

    const reps = parseInt(editValue.reps, 10);
    const weight = parseFloat(editValue.weight);

    if (isNaN(reps) || reps <= 0 || isNaN(weight) < 0) {
      setMessage("Please enter valid positive numbers for reps and weight.");
      return;
    }

    setSessionLog((prevLog) => {
      const newLog = { ...prevLog };
      newLog[exerciseIndex][setIndex] = {
        ...newLog[exerciseIndex][setIndex],
        reps: String(reps),
        weight: String(weight),
      };
      return newLog;
    });
    setIsEditing(null);
    setMessage(null);
  }, [isEditing, editValue]);

  const handleCancelEdit = useCallback(() => {
    setIsEditing(null);
    setMessage(null);
    setEditValue({ reps: "", weight: "" });
  }, []);

  if (!currentExercise) {
    return (
      <div className="flex justify-center items-center h-screen text-gray-400">
        <p>No exercises for this workout day. Please generate a new plan.</p>
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
          <p className="text-center text-gray-400 mb-4">
            Exercise {currentExerciseIndex + 1} of {workoutDay.exercises.length}
          </p>
          <div className="w-full bg-gray-700 rounded-full h-2.5">
            <div
              className="bg-blue-600 h-2.5 rounded-full"
              style={{
                width: `${
                  ((currentExerciseIndex + 1) / workoutDay.exercises.length) *
                  100
                }%`,
              }}
            ></div>
          </div>
        </div>

        <div className="bg-gray-800 rounded-2xl shadow-lg p-6">
          <h2 className="text-4xl font-bold mb-2 text-center text-blue-400">
            {currentExercise.name}
          </h2>
          <p className="text-xl text-gray-300 text-center mb-6">
            Target: {currentExercise.sets} sets of {currentExercise.reps} reps @{" "}
            {currentExercise.weight} lbs
          </p>

          {message && (
            <p className="text-red-400 text-center mb-4">{message}</p>
          )}

          <div className="space-y-3">
            {Array.from({ length: currentExercise.sets }).map((_, setIndex) => (
              <div
                key={setIndex}
                className={`flex items-center justify-between p-4 rounded-lg transition-all ${
                  sessionLog[currentExerciseIndex]?.[setIndex]?.completed
                    ? "bg-green-800/50"
                    : "bg-gray-700"
                }`}
              >
                <div className="flex items-center gap-4">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-lg ${
                      sessionLog[currentExerciseIndex]?.[setIndex]?.completed
                        ? "bg-green-500 text-white"
                        : "bg-gray-600"
                    }`}
                  >
                    {setIndex + 1}
                  </div>
                  <div>
                    {isEditing &&
                    isEditing.exerciseIndex === currentExerciseIndex &&
                    isEditing.setIndex === setIndex ? (
                      <div className="flex gap-2">
                        <FormField
                          type="number"
                          value={editValue.reps}
                          onChange={(e) =>
                            setEditValue({ ...editValue, reps: e.target.value })
                          }
                          className="w-20 p-1 rounded bg-gray-900"
                          placeholder="Reps"
                          aria-label={`Edit reps for set ${setIndex + 1}`}
                        />
                        <FormField
                          type="number"
                          value={editValue.weight}
                          onChange={(e) =>
                            setEditValue({
                              ...editValue,
                              weight: e.target.value,
                            })
                          }
                          className="w-20 p-1 rounded bg-gray-900"
                          placeholder="Weight"
                          aria-label={`Edit weight for set ${setIndex + 1}`}
                        />
                      </div>
                    ) : (
                      <p className="font-semibold">
                        {sessionLog[currentExerciseIndex]?.[setIndex]?.reps ||
                          currentExercise.reps}{" "}
                        reps @{" "}
                        {sessionLog[currentExerciseIndex]?.[setIndex]?.weight ||
                          currentExercise.weight}{" "}
                        lbs
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex gap-2">
                  {isEditing &&
                  isEditing.exerciseIndex === currentExerciseIndex &&
                  isEditing.setIndex === setIndex ? (
                    <>
                      <button
                        onClick={handleSaveEdit}
                        className="p-2 bg-blue-600 rounded-md hover:bg-blue-500"
                        aria-label="Save edited set"
                      >
                        <Save size={20} className="text-white" />
                      </button>
                      <button
                        onClick={handleCancelEdit}
                        className="p-2 bg-red-600 rounded-md hover:bg-red-500"
                        aria-label="Cancel edit"
                      >
                        <X size={20} className="text-white" />
                      </button>
                    </>
                  ) : (
                    <button
                      onClick={() =>
                        handleStartEdit(currentExerciseIndex, setIndex)
                      }
                      className="p-2 bg-gray-600 rounded-md hover:bg-gray-500"
                      aria-label="Edit set"
                    >
                      <Edit size={20} className="text-white" />
                    </button>
                  )}
                  {!sessionLog[currentExerciseIndex]?.[setIndex]?.completed &&
                    !isEditing && (
                      <button
                        onClick={() =>
                          handleSetComplete(currentExerciseIndex, setIndex)
                        }
                        className="bg-green-600 hover:bg-green-500 text-white font-bold py-2 px-4 rounded-lg transition-colors"
                        aria-label={`Mark set ${setIndex + 1} complete`}
                      >
                        Complete
                      </button>
                    )}
                </div>
              </div>
            ))}
          </div>

          <div className="mt-8 pt-6 border-t border-gray-700">
            <h3 className="text-lg font-semibold text-center mb-4">
              How did that feel? (This will adjust your next workout)
            </h3>
            <div className="grid grid-cols-3 gap-4">
              <button
                onClick={() => handleFeedback("hard")}
                className="bg-red-600 hover:bg-red-500 p-4 rounded-lg font-bold text-lg transition-transform transform hover:scale-105"
              >
                Too Hard
              </button>
              <button
                onClick={() => handleFeedback("just_right")}
                className="bg-yellow-500 hover:bg-yellow-400 p-4 rounded-lg font-bold text-lg transition-transform transform hover:scale-105"
              >
                Just Right
              </button>
              <button
                onClick={() => handleFeedback("easy")}
                className="bg-green-600 hover:bg-green-500 p-4 rounded-lg font-bold text-lg transition-transform transform hover:scale-105"
              >
                Too Easy
              </button>
            </div>
          </div>
        </div>
        <div className="mt-6 flex justify-center">
          <button
            onClick={handleFinishWorkout}
            className="bg-gray-600 hover:bg-red-700 text-white font-bold py-3 px-8 rounded-lg transition-colors"
          >
            Finish Workout Early
          </button>
        </div>
      </div>
    </div>
  );
};
