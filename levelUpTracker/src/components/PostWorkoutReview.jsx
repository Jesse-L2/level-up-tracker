import React, { useState, useCallback } from "react";
import { ChevronUp, ChevronDown } from "lucide-react";

/**
 * PostWorkoutReview Component
 * 
 * Displays a review screen after a workout is completed.
 * Allows the user (and partner, if applicable) to review and adjust 1RMs
 * before saving the workout.
 */
export const PostWorkoutReview = ({
    completedWorkout,
    partnerWorkout,
    userProfile,
    onSave,
    onCancel,
}) => {
    const hasPartner = userProfile.partner && partnerWorkout;

    // Initialize adjustments state with current 1RMs from the exercise library
    const [userAdjustments, setUserAdjustments] = useState(() => {
        const initial = {};
        completedWorkout.exercises.forEach((ex) => {
            const libraryEx = userProfile.exerciseLibrary?.find(
                (libEx) => libEx.name.toLowerCase() === ex.name.toLowerCase()
            );
            initial[ex.name] = {
                currentMax: libraryEx?.oneRepMax || 0,
                newMax: libraryEx?.oneRepMax || 0,
            };
        });
        return initial;
    });

    const [partnerAdjustments, setPartnerAdjustments] = useState(() => {
        if (!hasPartner) return {};
        const initial = {};
        partnerWorkout.exercises.forEach((ex) => {
            const partnerMax = userProfile.partner.maxes?.[ex.name.toLowerCase().replace(/ /g, "_")] || 0;
            initial[ex.name] = {
                currentMax: partnerMax,
                newMax: partnerMax,
            };
        });
        return initial;
    });

    const handleUserMaxChange = useCallback((exerciseName, delta) => {
        setUserAdjustments((prev) => ({
            ...prev,
            [exerciseName]: {
                ...prev[exerciseName],
                newMax: Math.max(0, (prev[exerciseName]?.newMax || 0) + delta),
            },
        }));
    }, []);

    const handlePartnerMaxChange = useCallback((exerciseName, delta) => {
        setPartnerAdjustments((prev) => ({
            ...prev,
            [exerciseName]: {
                ...prev[exerciseName],
                newMax: Math.max(0, (prev[exerciseName]?.newMax || 0) + delta),
            },
        }));
    }, []);

    const handleSave = useCallback(() => {
        // Prepare the data to pass back
        const userMaxUpdates = {};
        Object.entries(userAdjustments).forEach(([name, data]) => {
            if (data.newMax !== data.currentMax) {
                userMaxUpdates[name] = data.newMax;
            }
        });

        const partnerMaxUpdates = {};
        if (hasPartner) {
            Object.entries(partnerAdjustments).forEach(([name, data]) => {
                if (data.newMax !== data.currentMax) {
                    partnerMaxUpdates[name] = data.newMax;
                }
            });
        }

        onSave({
            userMaxUpdates,
            partnerMaxUpdates,
            userWorkout: completedWorkout,
            partnerWorkout: hasPartner ? partnerWorkout : null,
        });
    }, [userAdjustments, partnerAdjustments, completedWorkout, partnerWorkout, hasPartner, onSave]);

    return (
        <div className="min-h-screen bg-gray-900 text-white p-4 md:p-8 animate-fade-in">
            <div className="max-w-4xl mx-auto">
                <h1 className="text-3xl font-bold text-center mb-2">Workout Complete!</h1>
                <p className="text-gray-400 text-center mb-8">
                    Review your performance and adjust weights for next week.
                </p>

                {/* Grid Layout: Single column for solo, two columns for partner */}
                <div className={`grid ${hasPartner ? "grid-cols-2 gap-6" : "grid-cols-1"}`}>
                    {/* User Column */}
                    <div>
                        <h2 className="text-xl font-semibold mb-4 text-center border-b border-gray-700 pb-2">
                            {userProfile.displayName}
                        </h2>
                        <div className="space-y-4">
                            {completedWorkout.exercises.map((ex) => (
                                <ExerciseAdjustmentCard
                                    key={ex.name}
                                    exerciseName={ex.name}
                                    currentMax={userAdjustments[ex.name]?.currentMax}
                                    newMax={userAdjustments[ex.name]?.newMax}
                                    onIncrement={() => handleUserMaxChange(ex.name, 2.5)}
                                    onDecrement={() => handleUserMaxChange(ex.name, -2.5)}
                                    completedSets={ex.sets}
                                />
                            ))}
                        </div>
                    </div>

                    {/* Partner Column (only if partner workout exists) */}
                    {hasPartner && (
                        <div>
                            <h2 className="text-xl font-semibold mb-4 text-center border-b border-gray-700 pb-2">
                                {userProfile.partner.name}
                            </h2>
                            <div className="space-y-4">
                                {partnerWorkout.exercises.map((ex) => (
                                    <ExerciseAdjustmentCard
                                        key={ex.name}
                                        exerciseName={ex.name}
                                        currentMax={partnerAdjustments[ex.name]?.currentMax}
                                        newMax={partnerAdjustments[ex.name]?.newMax}
                                        onIncrement={() => handlePartnerMaxChange(ex.name, 2.5)}
                                        onDecrement={() => handlePartnerMaxChange(ex.name, -2.5)}
                                        completedSets={ex.sets}
                                    />
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* Action Buttons */}
                <div className="mt-10 flex flex-col sm:flex-row justify-center gap-4">
                    <button
                        onClick={onCancel}
                        className="bg-gray-700 hover:bg-gray-600 text-white font-bold py-3 px-8 rounded-lg transition-colors"
                    >
                        Go Back
                    </button>
                    <button
                        onClick={handleSave}
                        className="bg-green-600 hover:bg-green-500 text-white font-bold py-3 px-8 rounded-lg transition-colors"
                    >
                        Save & Finish
                    </button>
                </div>
            </div>
        </div>
    );
};

/**
 * ExerciseAdjustmentCard Component
 * 
 * Displays a single exercise with its completed sets and allows adjustment of the 1RM.
 */
const ExerciseAdjustmentCard = ({
    exerciseName,
    currentMax,
    newMax,
    onIncrement,
    onDecrement,
    completedSets,
}) => {
    const hasChanged = currentMax !== newMax;
    const changeAmount = newMax - currentMax;

    return (
        <div className="bg-gray-800 p-4 rounded-xl">
            <div className="flex justify-between items-center mb-2">
                <h3 className="font-semibold text-lg">{exerciseName}</h3>
                {hasChanged && (
                    <span className={`text-sm font-bold ${changeAmount > 0 ? "text-green-400" : "text-red-400"}`}>
                        {changeAmount > 0 ? "+" : ""}{changeAmount} lbs
                    </span>
                )}
            </div>

            {/* Completed Sets Summary */}
            {completedSets && completedSets.length > 0 && (
                <div className="text-sm text-gray-400 mb-3">
                    {completedSets.map((set, i) => (
                        <span key={i} className="mr-2">
                            {set.reps}x{set.weight}
                        </span>
                    ))}
                </div>
            )}

            {/* 1RM Adjustment Controls */}
            <div className="flex items-center justify-between bg-gray-700 rounded-lg p-2">
                <span className="text-sm text-gray-400">Next Week 1RM:</span>
                <div className="flex items-center gap-2">
                    <button
                        onClick={onDecrement}
                        className="bg-red-600 hover:bg-red-500 w-8 h-8 rounded-full flex items-center justify-center text-xl font-bold"
                        aria-label={`Decrease ${exerciseName} 1RM`}
                    >
                        <ChevronDown size={20} />
                    </button>
                    <span className="text-xl font-bold w-20 text-center">{newMax} lbs</span>
                    <button
                        onClick={onIncrement}
                        className="bg-green-600 hover:bg-green-500 w-8 h-8 rounded-full flex items-center justify-center text-xl font-bold"
                        aria-label={`Increase ${exerciseName} 1RM`}
                    >
                        <ChevronUp size={20} />
                    </button>
                </div>
            </div>
        </div>
    );
};

export default PostWorkoutReview;
