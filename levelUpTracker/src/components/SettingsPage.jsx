import React, { useState, useEffect, useCallback } from "react";
import { ALL_EQUIPMENT } from "../lib/constants";
import { FormField } from "./ui/FormField";
import { Save, Plus, Trash2, Loader2 } from "lucide-react";

export const SettingsPage = ({
  userProfile,
  onSave,
  onBack,
  updateUserProfile,
}) => {
  const [profile, setProfile] = useState(userProfile);
  const [newWeight, setNewWeight] = useState({ value: "", quantity: 1 });
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState(null);

  useEffect(() => {
    setProfile(userProfile);
  }, [userProfile]);

  const handleEquipmentChange = useCallback((equipmentId) => {
    setProfile((prevProfile) => {
      const newEquipment = prevProfile.availableEquipment.includes(equipmentId)
        ? prevProfile.availableEquipment.filter((id) => id !== equipmentId)
        : [...prevProfile.availableEquipment, equipmentId];
      return { ...prevProfile, availableEquipment: newEquipment };
    });
  }, []);

  const handleAddWeight = useCallback(() => {
    const weightValue = parseFloat(newWeight.value);
    const plateQuantity = parseInt(newWeight.quantity, 10);

    if (
      isNaN(weightValue) ||
      weightValue <= 0 ||
      isNaN(plateQuantity) ||
      plateQuantity <= 0
    ) {
      setMessage("Please enter a valid positive weight and quantity.");
      return;
    }

    setProfile((prevProfile) => {
      const existingWeightIndex = prevProfile.availablePlates.findIndex(
        (p) => p.weight === weightValue
      );
      let newPlates;

      if (existingWeightIndex > -1) {
        newPlates = prevProfile.availablePlates.map((p, index) =>
          index === existingWeightIndex
            ? { ...p, count: p.count + plateQuantity }
            : p
        );
      } else {
        newPlates = [
          ...prevProfile.availablePlates,
          { weight: weightValue, count: plateQuantity },
        ];
      }
      return {
        ...prevProfile,
        availablePlates: newPlates.sort((a, b) => b.weight - a.weight),
      };
    });

    setNewWeight({ value: "", quantity: 1 });
    setMessage(null);
  }, [newWeight]);

  const handleRemoveWeight = useCallback((weightValue) => {
    setProfile((prevProfile) => ({
      ...prevProfile,
      availablePlates: prevProfile.availablePlates.filter(
        (p) => p.weight !== weightValue
      ),
    }));
  }, []);

  const handleSave = async () => {
    setIsSaving(true);
    setMessage(null);
    try {
      await updateUserProfile(profile);
      onSave();
    } catch (error) {
      console.error("Failed to save profile:", error);
      setMessage("Failed to save settings. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="p-4 md:p-8 text-white animate-fade-in">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-4xl font-bold">Settings</h1>
          <button
            onClick={onBack}
            className="bg-gray-700 hover:bg-gray-600 text-white font-bold py-2 px-4 rounded-lg transition-colors"
          >
            Back to Dashboard
          </button>
        </div>

        <div className="bg-gray-800 p-6 rounded-2xl shadow-lg mb-8">
          <h2 className="text-2xl font-semibold mb-4 border-b border-gray-700 pb-2">
            Your Profile
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              label="Fitness Goal"
              id="fitnessGoal"
              type="select"
              value={profile.goal}
              onChange={(e) => setProfile({ ...profile, goal: e.target.value })}
            >
              <option value="strength">Strength</option>
              <option value="hypertrophy">Hypertrophy (Muscle Growth)</option>
              <option value="endurance">Endurance</option>
            </FormField>
            <FormField
              label="Fitness Level"
              id="fitnessLevel"
              type="select"
              value={profile.level}
              onChange={(e) =>
                setProfile({ ...profile, level: e.target.value })
              }
            >
              <option value="beginner">Beginner</option>
              <option value="intermediate">Intermediate</option>
              <option value="advanced">Advanced</option>
            </FormField>
          </div>
        </div>

        <div className="bg-gray-800 p-6 rounded-2xl shadow-lg mb-8">
          <h2 className="text-2xl font-semibold mb-4 border-b border-gray-700 pb-2">
            Available Equipment
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {ALL_EQUIPMENT.map((equip) => (
              <button
                key={equip.id}
                onClick={() => handleEquipmentChange(equip.id)}
                className={`p-4 rounded-lg text-center transition-all duration-200 ${
                  profile.availableEquipment.includes(equip.id)
                    ? "bg-blue-600 text-white ring-2 ring-blue-400"
                    : "bg-gray-700 hover:bg-gray-600"
                }`}
              >
                {equip.name}
              </button>
            ))}
          </div>
        </div>

        <div className="bg-gray-800 p-6 rounded-2xl shadow-lg">
          <h2 className="text-2xl font-semibold mb-4 border-b border-gray-700 pb-2">
            Your Weight Plates (lbs)
          </h2>
          <p className="text-gray-400 mb-4">
            Enter the weight of one plate and how many you have.
          </p>
          <div className="flex flex-wrap gap-4 items-end mb-6">
            <div className="flex-grow">
              <FormField
                label="Plate Weight (lbs)"
                id="plateWeight"
                type="number"
                placeholder="e.g., 45"
                value={newWeight.value}
                onChange={(e) =>
                  setNewWeight({ ...newWeight, value: e.target.value })
                }
              />
            </div>
            <div className="flex-grow">
              <FormField
                label="Quantity"
                id="plateQuantity"
                type="number"
                placeholder="e.g., 2"
                value={newWeight.quantity}
                min="1"
                onChange={(e) =>
                  setNewWeight({
                    ...newWeight,
                    quantity: parseInt(e.target.value, 10),
                  })
                }
              />
            </div>
            <button
              onClick={handleAddWeight}
              className="bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 px-6 rounded-lg transition-colors flex items-center gap-2"
            >
              <Plus size={20} className="text-white" /> Add Plates
            </button>
          </div>
          {message && (
            <p className="text-red-400 text-center mb-4">{message}</p>
          )}
          <div className="space-y-2">
            {profile.availablePlates.length > 0 ? (
              profile.availablePlates.map((plate) => (
                <div
                  key={plate.weight}
                  className="flex justify-between items-center bg-gray-700 p-3 rounded-lg"
                >
                  <span className="font-semibold">
                    {plate.weight} lbs x {plate.count}
                  </span>
                  <button
                    onClick={() => handleRemoveWeight(plate.weight)}
                    className="text-red-400 hover:text-red-300"
                    aria-label={`Remove ${plate.weight} lbs plates`}
                  >
                    <Trash2 size={20} className="text-white" />
                  </button>
                </div>
              ))
            ) : (
              <p className="text-gray-500 text-center py-4">
                No plates added yet.
              </p>
            )}
          </div>
        </div>

        <div className="mt-8 flex justify-end">
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="bg-green-600 hover:bg-green-500 text-white font-bold py-3 px-8 rounded-lg transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSaving ? (
              <>
                <Loader2 size={20} className="animate-spin text-white" />{" "}
                Saving...
              </>
            ) : (
              <>
                <Save size={20} className="text-white" /> Save All Changes
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
