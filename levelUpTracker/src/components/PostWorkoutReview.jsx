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

    const handleUserMaxSet = useCallback((exerciseName, newValue) => {
        setUserAdjustments((prev) => ({
            ...prev,
            [exerciseName]: {
                ...prev[exerciseName],
                newMax: Math.max(0, newValue),
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

    const handlePartnerMaxSet = useCallback((exerciseName, newValue) => {
        setPartnerAdjustments((prev) => ({
            ...prev,
            [exerciseName]: {
                ...prev[exerciseName],
                newMax: Math.max(0, newValue),
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
                <div className={`grid ${hasPartner ? "grid-cols-2 gap-6 items-stretch" : "grid-cols-1"}`}>
                    {/* User Column */}
                    <div className="flex flex-col">
                        <h2 className="text-xl font-semibold mb-4 text-center border-b border-gray-700 pb-2">
                            {userProfile.displayName}
                        </h2>
                        <div className="space-y-4 flex-grow">
                            {completedWorkout.exercises.map((ex) => (
                                <ExerciseAdjustmentCard
                                    key={ex.name}
                                    exerciseName={ex.name}
                                    currentMax={userAdjustments[ex.name]?.currentMax}
                                    newMax={userAdjustments[ex.name]?.newMax}
                                    onIncrement={() => handleUserMaxChange(ex.name, 2.5)}
                                    onDecrement={() => handleUserMaxChange(ex.name, -2.5)}
                                    onMaxChange={(newValue) => handleUserMaxSet(ex.name, newValue)}
                                    completedSets={ex.sets}
                                />
                            ))}
                        </div>
                    </div>

                    {/* Partner Column (only if partner workout exists) */}
                    {hasPartner && (
                        <div className="flex flex-col">
                            <h2 className="text-xl font-semibold mb-4 text-center border-b border-gray-700 pb-2">
                                {userProfile.partner.name}
                            </h2>
                            <div className="space-y-4 flex-grow">
                                {partnerWorkout.exercises.map((ex) => (
                                    <ExerciseAdjustmentCard
                                        key={ex.name}
                                        exerciseName={ex.name}
                                        currentMax={partnerAdjustments[ex.name]?.currentMax}
                                        newMax={partnerAdjustments[ex.name]?.newMax}
                                        onIncrement={() => handlePartnerMaxChange(ex.name, 2.5)}
                                        onDecrement={() => handlePartnerMaxChange(ex.name, -2.5)}
                                        onMaxChange={(newValue) => handlePartnerMaxSet(ex.name, newValue)}
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
 * Users can click the weight value to directly edit it, or use +/- buttons.
 */
const ExerciseAdjustmentCard = ({
    exerciseName,
    currentMax,
    newMax,
    onIncrement,
    onDecrement,
    onMaxChange,
    completedSets,
}) => {
    const [isEditing, setIsEditing] = useState(false);
    const [editValue, setEditValue] = useState(newMax.toString());
    const inputRef = React.useRef(null);

    const hasChanged = currentMax !== newMax;
    const changeAmount = newMax - currentMax;

    // Update editValue when newMax changes from outside (via chevrons)
    React.useEffect(() => {
        if (!isEditing) {
            setEditValue(newMax.toString());
        }
    }, [newMax, isEditing]);

    const handleEditStart = () => {
        setEditValue(newMax.toString());
        setIsEditing(true);
        // Focus the input after a short delay to ensure it's rendered
        setTimeout(() => inputRef.current?.focus(), 0);
    };

    const handleEditComplete = () => {
        setIsEditing(false);
        const parsed = parseFloat(editValue);
        if (!isNaN(parsed) && parsed >= 0) {
            onMaxChange(parsed);
        } else {
            // Reset to current value if invalid
            setEditValue(newMax.toString());
        }
    };

    const handleKeyDown = (e) => {
        if (e.key === "Enter") {
            handleEditComplete();
        } else if (e.key === "Escape") {
            setIsEditing(false);
            setEditValue(newMax.toString());
        }
    };

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

                    {isEditing ? (
                        <div className="flex items-center">
                            <input
                                ref={inputRef}
                                type="number"
                                value={editValue}
                                onChange={(e) => setEditValue(e.target.value)}
                                onBlur={handleEditComplete}
                                onKeyDown={handleKeyDown}
                                className="w-16 text-xl font-bold text-center bg-gray-600 text-white rounded border border-gray-500 focus:outline-none focus:border-blue-500 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                step="0.5"
                                min="0"
                                aria-label={`Edit ${exerciseName} 1RM value`}
                            />
                            <span className="text-xl font-bold ml-1">lbs</span>
                        </div>
                    ) : (
                        <button
                            onClick={handleEditStart}
                            className="text-xl font-bold w-20 text-center hover:bg-gray-600 rounded px-1 py-0.5 transition-colors cursor-text"
                            title="Click to edit value"
                            aria-label={`Click to edit ${exerciseName} 1RM value, currently ${newMax} lbs`}
                        >
                            {newMax} lbs
                        </button>
                    )}

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
