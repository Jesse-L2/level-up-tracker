import React, { useState, useEffect, useCallback } from "react";
import { ALL_EQUIPMENT } from "../lib/constants";
import { addPartner, removePartner, updatePartnerName } from "../firebase";
import { FormField } from "./ui/FormField";
import { Save, Plus, Trash2, Loader2 } from "lucide-react";

export const SettingsPage = ({ userProfile, onSave, onBack }) => {
  const [profile, setProfile] = useState(userProfile);
  const [newWeight, setNewWeight] = useState({ value: "", quantity: 2 });
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState(null);
  const [partnerName, setPartnerName] = useState("");
  const [partnerMessage, setPartnerMessage] = useState(null);

  useEffect(() => {
    if (userProfile) {
      setProfile({
        ...userProfile,
        restTimer: userProfile.restTimer || 120, // Set default rest timer
      });
      if (userProfile.partner) {
        setPartnerName(userProfile.partner.name);
        setPartnerMessage(null);
      } else {
        setPartnerName("");
        setPartnerMessage(null);
      }
    }
  }, [userProfile]);

  useEffect(() => {
    const fetchPlateData = async () => {
      if (profile && (!profile.availablePlates || profile.availablePlates.length === 0)) {
        try {
          const response = await fetch('/plate-data.json');
          const data = await response.json();
          const plates = data.map(p => ({ weight: p.weight, count: p.quantity }));
          setProfile(prevProfile => ({
            ...prevProfile,
            availablePlates: plates.sort((a, b) => b.weight - a.weight),
          }));
        } catch (error) {
          console.error("Failed to fetch plate data:", error);
        }
      }
    };

    if (profile) {
      fetchPlateData();
    }
  }, [profile]);

  const handleAddPartner = async () => {
    if (partnerName.trim() === "") {
      setPartnerMessage("Please enter a partner name.");
      return;
    }
    try {
      if (userProfile.partner) {
        await updatePartnerName(userProfile.uid, partnerName);
        setPartnerMessage("Partner name updated successfully.");
      } else {
        await addPartner(userProfile.uid, partnerName);
        setPartnerMessage("Partner added successfully.");
      }
    } catch (error) {
      console.error("Failed to add partner:", error);
      setPartnerMessage("Failed to add partner. Please try again.");
    }
  };

  const handleRemovePartner = async () => {
    if (window.confirm("Are you sure you want to remove your partner? This action cannot be undone.")) {
      try {
        await removePartner(userProfile.uid);
        setPartnerName("");
        setPartnerMessage("Partner removed successfully.");
      } catch (error) {
        console.error("Failed to remove partner:", error);
        setPartnerMessage("Failed to remove partner. Please try again.");
      }
    }
  };


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

    setNewWeight({ value: "", quantity: 2 });
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

  const handleOneRepMaxChange = useCallback((exerciseId, newOneRepMax) => {
    setProfile((prevProfile) => ({
      ...prevProfile,
      exerciseLibrary: prevProfile.exerciseLibrary.map((ex) =>
        ex.id === exerciseId ? { ...ex, oneRepMax: newOneRepMax } : ex
      ),
    }));
  }, []);

  const handleResetProgress = async () => {
    if (window.confirm("Are you sure you want to reset all your progress? This action cannot be undone.")) {
      try {
        await onSave({ ...profile, workoutHistory: [] });
        setMessage("Your progress has been successfully reset.");
      } catch (error) {
        console.error("Failed to reset progress:", error);
        setMessage("Failed to reset progress. Please try again.");
      }
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    setMessage(null);
    try {
      await onSave(profile);
      onBack();
    } catch (error) {
      console.error("Failed to save profile:", error);
      setMessage("Failed to save settings. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  if (!profile) {
    return (
      <div className="flex justify-center items-center h-screen">
        <Loader2 className="animate-spin text-white" size={48} />
      </div>
    );
  }

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
            Partner Settings
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              label="Partner's Name"
              id="partnerName"
              type="text"
              value={partnerName}
              onChange={(e) => {
                setPartnerName(e.target.value);
                setPartnerMessage(null);
              }}
            />
            <div className="flex items-end gap-4">
              <button
                onClick={handleAddPartner}
                className="bg-blue-600 hover:bg-blue-500 text-white font-bold py-2 px-4 rounded-lg transition-colors flex items-center gap-2"
              >
                <Plus size={20} className="text-white" /> {userProfile.partner ? "Update" : "Add"} Partner
              </button>
              {userProfile.partner && (
                <button
                  onClick={handleRemovePartner}
                  className="bg-red-800 hover:bg-red-700 text-white font-bold py-2 px-4 rounded-lg transition-colors flex items-center gap-2"
                >
                  <Trash2 size={20} className="text-white" /> Remove Partner
                </button>
              )}
            </div>
          </div>
          {partnerMessage && (
            <p className="text-red-400 text-center mt-4">{partnerMessage}</p>
          )}
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
            <FormField
              label="Default Rest Timer (seconds)"
              id="restTimer"
              type="number"
              value={profile.restTimer}
              onChange={(e) =>
                setProfile({ ...profile, restTimer: parseInt(e.target.value) })
              }
            />
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

        <div className="bg-gray-800 p-6 rounded-2xl shadow-lg mb-8">
          <h2 className="text-2xl font-semibold mb-4 border-b border-gray-700 pb-2">
            Your Max Lifts (1RM)
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {profile.exerciseLibrary.map((ex) => (
              <FormField
                key={ex.id}
                label={ex.name}
                id={`1rm-${ex.id}`}
                type="number"
                value={ex.oneRepMax}
                onChange={(e) => handleOneRepMaxChange(ex.id, parseFloat(e.target.value) || 0)}
              />
            ))}
          </div>
        </div>

        <div className="bg-gray-800 p-6 rounded-2xl shadow-lg mb-8">
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
                min="2"
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

        <div className="bg-gray-800 p-6 rounded-2xl shadow-lg mb-8">
          <h2 className="text-2xl font-semibold mb-4 border-b border-gray-700 pb-2">
            Reset Progress
          </h2>
          <div className="flex justify-between items-center">
            <div>
              <h3 className="font-semibold text-lg">Clear Workout History</h3>
              <p className="text-gray-400">
                This will permanently delete all of your workout history. This action cannot be undone.
              </p>
            </div>
            <button
              onClick={handleResetProgress}
              className="bg-red-800 hover:bg-red-700 text-white font-bold py-2 px-4 rounded-lg transition-colors"
            >
              Reset Progress
            </button>
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
