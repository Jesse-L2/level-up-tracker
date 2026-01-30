import React, { useState, useCallback, useEffect } from "react";
import { FormField } from "./ui/FormField";
import { Plus, Trash2, Save, Edit, X } from "lucide-react";
import { useWorkout } from "../context/WorkoutContext";

const initialExerciseState = { name: "", oneRepMax: "", type: "weighted" };

export const ExerciseLibrary = ({ userProfile, onBack }) => {
  const { updateUserProfileInFirestore } = useWorkout();
  const [templateExercises, setTemplateExercises] = useState([]);
  const [library, setLibrary] = useState(userProfile.exerciseLibrary || []);

  // Set page title
  useEffect(() => {
    document.title = "Level Up Tracker - Exercise Library";
    return () => {
      document.title = "Level Up Tracker";
    };
  }, []);

  useEffect(() => {
    fetch("/program-templates.json")
      .then((response) => response.json())
      .then((data) => {
        const allTemplateLifts = new Set();
        Object.values(data.programs).forEach((template) => {
          Object.keys(template)
            .filter(
              (key) => key.startsWith("day_") || key.startsWith("workout_")
            )
            .forEach((dayKey) => {
              const day = template[dayKey];
              Object.keys(day).forEach((liftId) => {
                if (data.lifts[liftId]) {
                  allTemplateLifts.add(data.lifts[liftId].name);
                }
              });
            });
        });
        const formattedTemplateExercises = Array.from(allTemplateLifts).map(
          (liftName) => ({
            name: liftName,
            oneRepMax: 0, // Default for template exercises
            type: "weighted", // Assuming most template lifts are weighted
            isTemplate: true, // Mark as template exercise
          })
        );
        setTemplateExercises(formattedTemplateExercises);
      })
      .catch((error) =>
        console.error("Error fetching program templates for library:", error)
      );
  }, []); // Empty dependency array means this runs once on mount
  const [newExercise, setNewExercise] = useState(initialExerciseState);
  const [message, setMessage] = useState("");
  const [editingExercise, setEditingExercise] = useState(null);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewExercise((prev) => ({ ...prev, [name]: value }));
  };

  const handleEditExercise = useCallback((exercise) => {
    setEditingExercise(exercise);
    setNewExercise({
      name: exercise.name,
      oneRepMax: exercise.oneRepMax,
      type: exercise.type,
    });
    setMessage("");
  }, []);

  const handleAddExercise = useCallback(() => {
    if (!newExercise.name) {
      setMessage("Please provide an exercise name.");
      return;
    }
    if (
      (newExercise.type === "weighted" || newExercise.type === "barbell") &&
      (!newExercise.oneRepMax || parseFloat(newExercise.oneRepMax) <= 0)
    ) {
      setMessage(
        "Weighted and barbell lifts must have a 1 Rep Max greater than 0."
      );
      return;
    }

    const exerciseToSave = {
      id: newExercise.name.toLowerCase().replace(/\s+/g, '_'),
      name: newExercise.name,
      type: newExercise.type,
      oneRepMax:
        newExercise.type === "weighted" || newExercise.type === "barbell"
          ? parseFloat(newExercise.oneRepMax)
          : 0,
      lastUpdated: new Date().toISOString(), // Add lastUpdated timestamp
    };

    if (editingExercise) {
      // Update existing exercise
      setLibrary((prev) =>
        prev.map((ex) =>
          ex.name === editingExercise.name ? exerciseToSave : ex
        )
      );
      setEditingExercise(null);
    } else {
      // Add new exercise
      setLibrary((prev) => [...prev, exerciseToSave]);
    }
    setNewExercise(initialExerciseState);
    setMessage("");
  }, [newExercise, editingExercise]);

  const handleCancelEdit = useCallback(() => {
    setEditingExercise(null);
    setNewExercise(initialExerciseState);
    setMessage("");
  }, []);

  const handleRemoveExercise = useCallback((nameToRemove) => {
    // FIX: Filter by name to prevent deleting all exercises.
    setLibrary((prev) => prev.filter((ex) => ex.name !== nameToRemove));
  }, []);

  const handleSaveLibrary = () => {
    updateUserProfileInFirestore({ exerciseLibrary: library });
    onBack(); // Go back to dashboard after saving
  };

  return (
    <div className="p-4 md:p-8 text-theme-primary animate-fade-in">
      <div className="max-w-4xl mx-auto">
        <div className="flex flex-col sm:flex-row items-center justify-between mb-6 sm:mb-8 gap-4 sm:gap-0">
          <h1 className="text-3xl sm:text-4xl font-bold text-center sm:text-left">Exercise Library</h1>
          <button
            onClick={onBack}
            className="btn-modern font-bold py-2 px-4 rounded-lg text-theme-primary w-full sm:w-auto"
          >
            Back to Dashboard
          </button>
        </div>

        <div className="card-physical p-6 rounded-2xl mb-8">
          <h2 className="text-2xl font-semibold mb-4">Your Lifts</h2>
          {library.length > 0 ? (
            <div className="space-y-3">
              {library.map((ex) => (
                <div
                  key={ex.name}
                  className="card-inner p-3 rounded-lg flex justify-between items-center"
                >
                  <div>
                    <p className="font-bold text-theme-primary">{ex.name}</p>
                    <p className="text-sm text-theme-secondary">
                      {ex.type === "weighted" || ex.type === "barbell"
                        ? `1RM: ${ex.oneRepMax} lbs`
                        : "Bodyweight"}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleEditExercise(ex)}
                      className="text-blue-400 hover:text-blue-300 p-2"
                    >
                      <Edit size={20} />
                    </button>
                    <button
                      onClick={() => handleRemoveExercise(ex.name)}
                      className="text-red-400 hover:text-red-300 p-2"
                    >
                      <Trash2 size={20} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-theme-secondary text-center py-4">
              Your library is empty. Add a lift to get started.
            </p>
          )}
        </div>

        <div className="card-physical p-6 rounded-2xl mb-8">
          <h2 className="text-2xl font-semibold mb-4">
            {editingExercise ? "Edit Lift" : "Add New Lift"}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              label="Exercise Name"
              id="name"
              name="name"
              value={newExercise.name}
              onChange={handleInputChange}
            />
            <FormField
              label="Exercise Type"
              id="type"
              name="type"
              type="select"
              value={newExercise.type}
              onChange={handleInputChange}
            >
              <option value="weighted">Weighted</option>
              <option value="bodyweight">Bodyweight</option>
              <option value="barbell">Barbell</option>
            </FormField>
          </div>
          {(newExercise.type === "weighted" ||
            newExercise.type === "barbell") && (
              <div className="mt-4">
                <FormField
                  label="Theoretical 1 Rep Max (lbs)"
                  id="oneRepMax"
                  name="oneRepMax"
                  type="number"
                  value={newExercise.oneRepMax}
                  onChange={handleInputChange}
                />
              </div>
            )}
          {message && (
            <p className="text-red-400 text-center mt-4">{message}</p>
          )}
          <div className="flex gap-2 mt-6">
            <button
              onClick={handleAddExercise}
              className="w-full btn-modern btn-modern-primary text-white font-bold py-3 rounded-lg flex items-center justify-center gap-2"
            >
              {editingExercise ? <Save size={20} /> : <Plus size={20} />}{" "}
              {editingExercise ? "Save Changes" : "Add to Library"}
            </button>
            {editingExercise && (
              <button
                onClick={handleCancelEdit}
                className="w-full btn-modern bg-gray-600 hover:bg-gray-500 text-white font-bold py-3 rounded-lg flex items-center justify-center gap-2"
              >
                <X size={20} /> Cancel
              </button>
            )}
          </div>
        </div>

        <div className="card-physical p-6 rounded-2xl">
          <h2 className="text-2xl font-semibold mb-4">Template Exercises</h2>
          {templateExercises.length > 0 ? (
            <div className="space-y-3">
              {templateExercises.map((ex) => (
                <div
                  key={ex.name}
                  className="card-inner p-3 rounded-lg flex justify-between items-center"
                >
                  <div>
                    <p className="font-bold text-theme-primary">{ex.name}</p>
                    <p className="text-sm text-theme-secondary">
                      {ex.type === "weighted" || ex.type === "barbell"
                        ? `1RM: ${ex.oneRepMax} lbs`
                        : "Bodyweight"}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-theme-secondary text-center py-4">
              No template exercises found.
            </p>
          )}
        </div>

        <div className="mt-8 flex justify-end">
          <button
            onClick={handleSaveLibrary}
            className="btn-modern btn-modern-green text-white font-bold py-3 px-8 rounded-lg flex items-center gap-2"
          >
            <Save size={20} /> Save Library
          </button>
        </div>
      </div>
    </div>
  );
};
