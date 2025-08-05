import React, { useState, useCallback } from "react";
import { FormField } from "./ui/FormField";
import { Plus, Trash2, Save } from "lucide-react";

const initialExerciseState = {
  name: "",
  sets: "3",
  reps: "10",
  weight: "135",
  type: "other", // 'barbell' or 'other'
};

const daysOfWeek = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
];

export const CreateWorkout = ({ onSave, onBack }) => {
  const [dayOfWeek, setDayOfWeek] = useState("Monday");
  const [workoutName, setWorkoutName] = useState("My Custom Workout");
  const [exercises, setExercises] = useState([]);
  const [currentExercise, setCurrentExercise] = useState(initialExerciseState);
  const [message, setMessage] = useState("");

  const handleInputChange = useCallback((e) => {
    const { name, value, type, checked } = e.target;
    if (name === "isBarbell") {
      setCurrentExercise((prev) => ({
        ...prev,
        type: checked ? "barbell" : "other",
      }));
    } else {
      setCurrentExercise((prev) => ({ ...prev, [name]: value }));
    }
  }, []);

  const handleAddExercise = useCallback(() => {
    if (
      !currentExercise.name ||
      !currentExercise.sets ||
      !currentExercise.reps
    ) {
      setMessage("Please fill out all exercise fields.");
      return;
    }
    setExercises((prev) => [...prev, { ...currentExercise, id: Date.now() }]);
    setCurrentExercise(initialExerciseState);
    setMessage("");
  }, [currentExercise]);

  const handleRemoveExercise = useCallback((id) => {
    setExercises((prev) => prev.filter((ex) => ex.id !== id));
  }, []);

  const handleSaveWorkout = useCallback(() => {
    if (exercises.length === 0) {
      setMessage("Please add at least one exercise to the workout.");
      return;
    }
    // The object to save now includes the day of the week
    const workoutToSave = {
      day: dayOfWeek,
      name: workoutName,
      exercises: exercises.map(({ id, ...rest }) => rest), // Remove temporary id
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

        {/* Workout Details Form */}
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
              placeholder="e.g., Chest & Triceps"
            />
          </div>
        </div>

        {/* Added Exercises List */}
        <div className="bg-gray-800 p-6 rounded-2xl shadow-lg mb-8">
          <h2 className="text-2xl font-semibold mb-4">Exercises</h2>
          {exercises.length > 0 ? (
            <div className="space-y-3">
              {exercises.map((ex) => (
                <div
                  key={ex.id}
                  className="bg-gray-700 p-3 rounded-lg flex justify-between items-center"
                >
                  <div>
                    <p className="font-bold text-white">{ex.name}</p>
                    <p className="text-sm text-gray-300">
                      {ex.sets} sets of {ex.reps} reps @ {ex.weight} lbs
                    </p>
                  </div>
                  <button
                    onClick={() => handleRemoveExercise(ex.id)}
                    className="text-red-400 hover:text-red-300 p-2"
                  >
                    <Trash2 size={20} />
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-center py-4">
              No exercises added yet.
            </p>
          )}
        </div>

        {/* Add New Exercise Form */}
        <div className="bg-gray-800 p-6 rounded-2xl shadow-lg">
          <h2 className="text-2xl font-semibold mb-4">Add New Exercise</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              label="Exercise Name"
              id="name"
              name="name"
              value={currentExercise.name}
              onChange={handleInputChange}
            />
            <FormField
              label="Sets"
              id="sets"
              name="sets"
              type="number"
              value={currentExercise.sets}
              onChange={handleInputChange}
            />
            <FormField
              label="Reps"
              id="reps"
              name="reps"
              value={currentExercise.reps}
              onChange={handleInputChange}
              placeholder="e.g., 8-12"
            />
            <FormField
              label="Weight (lbs)"
              id="weight"
              name="weight"
              type="number"
              value={currentExercise.weight}
              onChange={handleInputChange}
            />
          </div>
          <div className="mt-4 flex items-center">
            <input
              type="checkbox"
              id="isBarbell"
              name="isBarbell"
              checked={currentExercise.type === "barbell"}
              onChange={handleInputChange}
              className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <label
              htmlFor="isBarbell"
              className="ml-2 block text-sm text-gray-300"
            >
              This is a barbell exercise
            </label>
          </div>
          {message && (
            <p className="text-red-400 text-center mt-4">{message}</p>
          )}
          <button
            onClick={handleAddExercise}
            className="w-full mt-6 bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 rounded-lg flex items-center justify-center gap-2"
          >
            <Plus size={20} /> Add Exercise to Workout
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
