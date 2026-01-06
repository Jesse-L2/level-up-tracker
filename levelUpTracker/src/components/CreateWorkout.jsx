import React, { useState, useCallback, useMemo, useEffect } from "react";
import { FormField } from "./ui/FormField";
import { Plus, Trash2, Save } from "lucide-react";
import { getPercentageForReps } from "../lib/rep_scheme";

const daysOfWeek = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
];

const initialWeightedSet = { reps: "5", percentage: getPercentageForReps(5) };
const initialBodyweightSet = { reps: "10", addedWeight: "0" };

export const CreateWorkout = ({ userProfile, onSave, onBack }) => {
  const [dayOfWeek, setDayOfWeek] = useState("Monday");
  const [workoutName, setWorkoutName] = useState("My Custom Workout");
  const [exercises, setExercises] = useState([]);
  const [selectedLibraryExerciseName, setSelectedLibraryExerciseName] =
    useState("");
  const [sets, setSets] = useState([]);
  const [message, setMessage] = useState("");

  // Set page title
  useEffect(() => {
    document.title = "Level Up Tracker - Create Workout";
    return () => {
      document.title = "Level Up Tracker";
    };
  }, []);

  const library = useMemo(
    () => userProfile.exerciseLibrary || [],
    [userProfile.exerciseLibrary]
  );
  const selectedExercise = useMemo(
    () => library.find((ex) => ex.name === selectedLibraryExerciseName),
    [library, selectedLibraryExerciseName]
  );

  useEffect(() => {
    if (selectedExercise) {
      if (selectedExercise.type === "weighted") {
        setSets([initialWeightedSet]);
      } else {
        setSets([initialBodyweightSet]);
      }
    } else {
      setSets([]);
    }
  }, [selectedExercise]);

  const handleSetChange = (index, field, value) => {
    const newSets = [...sets];
    newSets[index][field] = value;
    if (selectedExercise.type === "weighted" && field === "reps") {
      newSets[index].percentage = getPercentageForReps(value);
    }
    setSets(newSets);
  };

  const addSet = () => {
    if (!selectedExercise) return;
    const newSet =
      selectedExercise.type === "weighted"
        ? initialWeightedSet
        : initialBodyweightSet;
    setSets((prev) => [...prev, { ...newSet }]);
  };

  const removeSet = (index) =>
    setSets((prev) => prev.filter((_, i) => i !== index));

  const handleAddExercise = useCallback(() => {
    if (!selectedExercise) {
      setMessage("Please select an exercise from your library.");
      return;
    }

    let finalSets;
    if (selectedExercise.type === "weighted") {
      finalSets = sets.map((set) => ({
        reps: set.reps,
        percentage: set.percentage,
        weight:
          Math.round((selectedExercise.oneRepMax * set.percentage) / 2.5) * 2.5,
      }));
    } else {
      // Bodyweight
      finalSets = sets.map((set) => ({
        reps: set.reps,
        addedWeight: parseFloat(set.addedWeight) || 0,
      }));
    }

    const newExercise = {
      id: selectedExercise.name,
      name: selectedExercise.name,
      type: selectedExercise.type,
      oneRepMax: selectedExercise.oneRepMax, // Keep for reference
      sets: finalSets,
    };

    setExercises((prev) => [...prev, newExercise]);
    setSelectedLibraryExerciseName("");
    setSets([]);
    setMessage("");
  }, [selectedExercise, sets]);

  const handleRemoveExercise = useCallback((id) => {
    setExercises((prev) => prev.filter((ex) => ex.id !== id));
  }, []);

  const handleSaveWorkout = useCallback(() => {
    if (exercises.length === 0) {
      setMessage("Please add at least one exercise to the workout.");
      return;
    }
    const workoutToSave = {
      day: dayOfWeek,
      name: workoutName,
      exercises: exercises,
      isCustom: true,
    };
    onSave(workoutToSave);
  }, [exercises, workoutName, dayOfWeek, onSave]);

  return (
    <div className="p-4 md:p-8 text-white animate-fade-in">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-4xl font-bold">Build Your Workout</h1>
          <button
            onClick={onBack}
            className="bg-gray-700 hover:bg-gray-600 text-white font-bold py-2 px-4 rounded-lg"
          >
            Back
          </button>
        </div>

        <div className="bg-gray-800 p-6 rounded-2xl shadow-lg mb-8">
          <h2 className="text-2xl font-semibold mb-4">Workout Details</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              label="Day of the Week"
              id="dayOfWeek"
              type="select"
              value={dayOfWeek}
              onChange={(e) => setDayOfWeek(e.target.value)}
            >
              {daysOfWeek.map((day) => (
                <option key={day} value={day}>
                  {day}
                </option>
              ))}
            </FormField>
            <FormField
              label="Workout Name"
              id="workoutName"
              value={workoutName}
              onChange={(e) => setWorkoutName(e.target.value)}
              placeholder="e.g., Heavy Bench Day"
            />
          </div>
        </div>

        <div className="bg-gray-800 p-6 rounded-2xl shadow-lg mb-8">
          <h2 className="text-2xl font-semibold mb-4">Added Exercises</h2>
          {exercises.length > 0 ? (
            <div className="space-y-3">
              {exercises.map((ex) => (
                <div key={ex.id} className="bg-gray-700 p-4 rounded-lg">
                  <div className="flex justify-between items-center">
                    <p className="font-bold text-white">
                      {ex.name}{" "}
                      <span className="text-sm text-gray-400">
                        {ex.type === "weighted"
                          ? `(1RM: ${ex.oneRepMax} lbs)`
                          : "(Bodyweight)"}
                      </span>
                    </p>
                    <button
                      onClick={() => handleRemoveExercise(ex.id)}
                      className="text-red-400 hover:text-red-300 p-2"
                    >
                      <Trash2 size={20} />
                    </button>
                  </div>
                  <ul className="mt-2 space-y-1 text-sm">
                    {ex.sets.map((s, i) => (
                      <li key={i} className="text-gray-300">
                        Set {i + 1}: {s.reps} reps @{" "}
                        {ex.type === "weighted"
                          ? `${s.weight} lbs (${s.percentage * 100}%)`
                          : `Bodyweight + ${s.addedWeight} lbs`}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-center py-4">
              No exercises added yet.
            </p>
          )}
        </div>

        <div className="bg-gray-800 p-6 rounded-2xl shadow-lg">
          <h2 className="text-2xl font-semibold mb-4">
            Add Exercise to Workout
          </h2>
          <FormField
            label="Select from Library"
            id="libraryExercise"
            type="select"
            value={selectedLibraryExerciseName}
            onChange={(e) => setSelectedLibraryExerciseName(e.target.value)}
          >
            <option value="">-- Choose a Lift --</option>
            {library.map((ex) => (
              <option key={ex.name} value={ex.name}>
                {ex.name}
              </option>
            ))}
          </FormField>

          {selectedExercise && (
            <div className="mt-4">
              <h3 className="text-lg font-semibold mb-2">
                Set Scheme for {selectedExercise.name}
              </h3>
              {sets.map((set, index) => (
                <div
                  key={index}
                  className="flex items-center gap-2 mb-2 p-2 bg-gray-700/50 rounded-md"
                >
                  <span className="text-gray-400">Set {index + 1}:</span>
                  {selectedExercise.type === "weighted" ? (
                    <>
                      <FormField
                        label=""
                        id={`reps-${index}`}
                        type="text"
                        inputMode="numeric"
                        value={set.reps}
                        onChange={(e) =>
                          handleSetChange(index, "reps", e.target.value)
                        }
                        className="w-20"
                      />
                      <FormField
                        label=""
                        id={`perc-${index}`}
                        type="text"
                        inputMode="decimal"
                        step="0.01"
                        value={set.percentage}
                        onChange={(e) =>
                          handleSetChange(index, "percentage", e.target.value)
                        }
                        className="w-24"
                      />
                      <span className="text-gray-400">%</span>
                    </>
                  ) : (
                    <>
                      <FormField
                        label=""
                        id={`reps-${index}`}
                        type="number"
                        value={set.reps}
                        onChange={(e) =>
                          handleSetChange(index, "reps", e.target.value)
                        }
                        className="w-20"
                      />
                      <span className="text-gray-400">reps with</span>
                      <FormField
                        label=""
                        id={`addedWeight-${index}`}
                        type="number"
                        value={set.addedWeight}
                        onChange={(e) =>
                          handleSetChange(index, "addedWeight", e.target.value)
                        }
                        className="w-24"
                      />
                      <span className="text-gray-400">lbs added</span>
                    </>
                  )}
                  <button
                    onClick={() => removeSet(index)}
                    className="text-red-400 hover:text-red-300 p-2 ml-auto"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              ))}
              <button
                onClick={addSet}
                className="text-blue-400 hover:text-blue-300 flex items-center gap-1 mt-2"
              >
                <Plus size={16} /> Add Set
              </button>
            </div>
          )}

          {message && (
            <p className="text-red-400 text-center mt-4">{message}</p>
          )}
          <button
            onClick={handleAddExercise}
            className="w-full mt-6 bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 rounded-lg flex items-center justify-center gap-2"
          >
            <Plus size={20} /> Add Exercise to Day
          </button>
        </div>

        <div className="mt-8 flex justify-end">
          <button
            onClick={handleSaveWorkout}
            className="bg-green-600 hover:bg-green-500 text-white font-bold py-3 px-8 rounded-lg flex items-center gap-2"
          >
            <Save size={20} /> Save Workout Day
          </button>
        </div>
      </div>
    </div>
  );
};
