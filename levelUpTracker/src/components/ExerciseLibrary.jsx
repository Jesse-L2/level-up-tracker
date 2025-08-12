import React, { useState, useCallback } from "react";
import { FormField } from "./ui/FormField";
import { Plus, Trash2, Save } from "lucide-react";

const initialExerciseState = { name: "", oneRepMax: "", type: "weighted" };

export const ExerciseLibrary = ({ userProfile, onSave, onBack }) => {
  const [library, setLibrary] = useState(userProfile.exerciseLibrary || []);
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
      newExercise.type === "weighted" &&
      (!newExercise.oneRepMax || parseFloat(newExercise.oneRepMax) <= 0)
    ) {
      setMessage("Weighted lifts must have a 1 Rep Max greater than 0.");
      return;
    }

    const exerciseToSave = {
      name: newExercise.name,
      type: newExercise.type,
      oneRepMax:
        newExercise.type === "weighted" ? parseFloat(newExercise.oneRepMax) : 0,
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
    onSave({ exerciseLibrary: library });
    onBack(); // Go back to dashboard after saving
  };

  return (
    <div className="p-4 md:p-8 text-white animate-fade-in">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-4xl font-bold">Exercise Library</h1>
          <button
            onClick={onBack}
            className="bg-gray-700 hover:bg-gray-600 text-white font-bold py-2 px-4 rounded-lg"
          >
            Back
          </button>
        </div>

        <div className="bg-gray-800 p-6 rounded-2xl shadow-lg mb-8">
          <h2 className="text-2xl font-semibold mb-4">Your Lifts</h2>
          {library.length > 0 ? (
            <div className="space-y-3">
              {library.map((ex) => (
                <div
                  key={ex.name}
                  className="bg-gray-700 p-3 rounded-lg flex justify-between items-center"
                >
                  <div>
                    <p className="font-bold text-white">{ex.name}</p>
                    <p className="text-sm text-gray-300">
                      {ex.type === "weighted"
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
            <p className="text-gray-500 text-center py-4">
              Your library is empty. Add a lift to get started.
            </p>
          )}
        </div>

        <div className="bg-gray-800 p-6 rounded-2xl shadow-lg">
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
            </FormField>
          </div>
          {newExercise.type === "weighted" && (
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
              className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 rounded-lg flex items-center justify-center gap-2"
            >
              {editingExercise ? (
                <Save size={20} />
              ) : (
                <Plus size={20} />
              )}{" "}
              {editingExercise ? "Save Changes" : "Add to Library"}
            </button>
            {editingExercise && (
              <button
                onClick={handleCancelEdit}
                className="w-full bg-gray-600 hover:bg-gray-500 text-white font-bold py-3 rounded-lg flex items-center justify-center gap-2"
              >
                <X size={20} /> Cancel
              </button>
            )}
          </div>
        </div>

        <div className="mt-8 flex justify-end">
          <button
            onClick={handleSaveLibrary}
            className="bg-green-600 hover:bg-green-500 text-white font-bold py-3 px-8 rounded-lg flex items-center gap-2"
          >
            <Save size={20} /> Save Library
          </button>
        </div>
      </div>
    </div>
  );
};
