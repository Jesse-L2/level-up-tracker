import React, { useState, useEffect } from 'react';
import { X, Save } from 'lucide-react';
import { FormField } from './ui/FormField';

/**
 * Modal component that prompts the user to enter 1RM values for exercises
 * that are missing from their library but required by a selected program.
 */
export const OneRepMaxPrompt = ({
    missingExercises,
    lifts,
    onSave,
    onCancel
}) => {
    const [oneRepMaxValues, setOneRepMaxValues] = useState({});

    useEffect(() => {
        // Initialize with empty values for each missing exercise
        const initialValues = {};
        missingExercises.forEach((liftId) => {
            initialValues[liftId] = '';
        });
        setOneRepMaxValues(initialValues);
    }, [missingExercises]);

    const handleChange = (liftId, value) => {
        setOneRepMaxValues((prev) => ({
            ...prev,
            [liftId]: value,
        }));
    };

    const handleSave = () => {
        // Convert to array of exercise objects to save to library
        const exercisesToSave = missingExercises.map((liftId) => {
            const liftInfo = lifts[liftId];
            return {
                name: liftInfo?.name || liftId,
                type: 'weighted',
                oneRepMax: parseFloat(oneRepMaxValues[liftId]) || 0,
                lastUpdated: new Date().toISOString(),
            };
        }).filter(ex => ex.oneRepMax > 0); // Only save exercises with valid 1RM

        onSave(exercisesToSave);
    };

    const allFilled = missingExercises.every(
        (liftId) => parseFloat(oneRepMaxValues[liftId]) > 0
    );

    return (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
            <div className="card-physical bg-gray-900 rounded-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
                <div className="p-6 border-b border-gray-700 flex justify-between items-center">
                    <h2 className="text-xl font-bold text-white">Set Your 1 Rep Maxes</h2>
                    <button
                        onClick={onCancel}
                        className="text-gray-400 hover:text-white p-1"
                    >
                        <X size={24} />
                    </button>
                </div>

                <div className="p-6">
                    <p className="text-gray-300 mb-6">
                        This program includes exercises not in your library. Please enter
                        your estimated 1 Rep Max (1RM) for each to calculate your working
                        weights.
                    </p>

                    <div className="space-y-4">
                        {missingExercises.map((liftId) => {
                            const liftInfo = lifts[liftId];
                            const liftName = liftInfo?.name || liftId;
                            return (
                                <div key={liftId} className="bg-gray-700/50 p-4 rounded-lg">
                                    <FormField
                                        label={`${liftName} - Theoretical 1RM (lbs)`}
                                        id={`1rm-${liftId}`}
                                        type="number"
                                        value={oneRepMaxValues[liftId] || ''}
                                        onChange={(e) => handleChange(liftId, e.target.value)}
                                        placeholder="e.g., 225"
                                    />
                                </div>
                            );
                        })}
                    </div>
                </div>

                <div className="p-6 border-t border-gray-700 flex gap-4">
                    <button
                        onClick={onCancel}
                        className="flex-1 btn-modern bg-gray-600 hover:bg-gray-500 text-white font-bold py-3 rounded-lg"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={!allFilled}
                        className={`flex-1 font-bold py-3 rounded-lg flex items-center justify-center gap-2 btn-modern ${allFilled
                            ? 'bg-green-600 hover:bg-green-500 text-white'
                            : 'bg-gray-600 text-gray-400 cursor-not-allowed'
                            }`}
                    >
                        <Save size={20} />
                        Save & Continue
                    </button>
                </div>
            </div>
        </div>
    );
};

export default OneRepMaxPrompt;
