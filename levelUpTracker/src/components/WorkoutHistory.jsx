import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, ChevronDown, ChevronUp, Calendar, Dumbbell, Trash2 } from "lucide-react";
import { ROUTES } from "../lib/routes";

export const WorkoutHistory = ({ userProfile }) => {
    const navigate = useNavigate();
    const [expandedWorkout, setExpandedWorkout] = useState(null);

    const workoutHistory = userProfile?.workoutHistory || [];

    // Sort by date, most recent first
    const sortedHistory = [...workoutHistory].sort(
        (a, b) => new Date(b.date) - new Date(a.date)
    );

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleDateString("en-US", {
            weekday: "short",
            year: "numeric",
            month: "short",
            day: "numeric",
        });
    };

    const formatTime = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleTimeString("en-US", {
            hour: "2-digit",
            minute: "2-digit",
        });
    };

    const toggleExpand = (index) => {
        setExpandedWorkout(expandedWorkout === index ? null : index);
    };

    const calculateTotalVolume = (workout) => {
        let totalVolume = 0;
        workout.exercises?.forEach((exercise) => {
            exercise.sets?.forEach((set) => {
                totalVolume += (set.weight || 0) * (set.reps || 0);
            });
        });
        return totalVolume;
    };

    const handleDelete = async (index, e) => {
        e.stopPropagation();
        if (window.confirm("Are you sure you want to delete this workout? This cannot be undone.")) {
            // Since the list is reversed for display, we need to find the original index
            // The original index is: totalLength - 1 - displayIndex
            const originalIndex = workoutHistory.length - 1 - index;
            if (userProfile.deleteWorkout) {
                await userProfile.deleteWorkout(originalIndex);
            } else {
                // Fallback for immediate UI update if hook hasn't reloaded yet (unlikely but safe)
                console.error("Delete function not found on user profile object");
            }
        }
    };

    return (
        <div className="p-4 md:p-8 text-white animate-fade-in">
            <div className="max-w-4xl mx-auto">
                {/* Header */}
                <div className="flex items-center justify-between mb-8">
                    <button
                        onClick={() => navigate(ROUTES.DASHBOARD)}
                        className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
                    >
                        <ArrowLeft size={20} />
                        Back to Dashboard
                    </button>
                    <h1 className="text-3xl font-bold">Workout History</h1>
                    <div className="w-32" /> {/* Spacer for centering */}
                </div>

                {sortedHistory.length === 0 ? (
                    <div className="text-center py-16">
                        <Dumbbell size={64} className="mx-auto text-gray-600 mb-4" />
                        <h2 className="text-2xl font-semibold text-gray-400 mb-2">
                            No workouts yet
                        </h2>
                        <p className="text-gray-500">
                            Complete your first workout to see it here!
                        </p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {sortedHistory.map((workout, index) => (
                            <div
                                key={index}
                                className="bg-gray-800 rounded-xl overflow-hidden shadow-lg"
                            >
                                {/* Workout Header - Always visible */}
                                <div
                                    onClick={() => toggleExpand(index)}
                                    className="w-full p-4 flex items-center justify-between hover:bg-gray-750 transition-colors cursor-pointer"
                                    role="button"
                                >
                                    <div className="flex items-center gap-4">
                                        <div className="bg-blue-600 p-3 rounded-lg">
                                            <Calendar size={24} />
                                        </div>
                                        <div className="text-left">
                                            <h3 className="text-lg font-semibold">
                                                {workout.dayName || "Workout"}
                                            </h3>
                                            <p className="text-gray-400 text-sm">
                                                {formatDate(workout.date)} at {formatTime(workout.date)}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <div className="text-right">
                                            <p className="text-sm text-gray-400">Total Volume</p>
                                            <p className="font-semibold text-blue-400">
                                                {calculateTotalVolume(workout).toLocaleString()} lbs
                                            </p>
                                        </div>
                                        <button
                                            onClick={(e) => handleDelete(index, e)}
                                            className="p-2 text-red-400 hover:text-red-300 hover:bg-red-900/20 rounded-full transition-colors"
                                            title="Delete Workout"
                                        >
                                            <Trash2 size={20} />
                                        </button>
                                        {expandedWorkout === index ? (
                                            <ChevronUp size={24} className="text-gray-400" />
                                        ) : (
                                            <ChevronDown size={24} className="text-gray-400" />
                                        )}
                                    </div>
                                </div>

                                {/* Expanded Details */}
                                {expandedWorkout === index && (
                                    <div className="border-t border-gray-700 p-4 bg-gray-850">
                                        {workout.exercises?.length === 0 ? (
                                            <p className="text-gray-500 text-center py-4">
                                                No exercises recorded
                                            </p>
                                        ) : (
                                            <div className="space-y-4">
                                                {workout.exercises?.map((exercise, exIndex) => (
                                                    <div
                                                        key={exIndex}
                                                        className="bg-gray-700 rounded-lg p-4"
                                                    >
                                                        <h4 className="font-semibold text-blue-400 mb-3">
                                                            {exercise.name}
                                                        </h4>
                                                        <div className="grid grid-cols-3 gap-2 text-sm">
                                                            <div className="text-gray-400 font-medium">
                                                                Set
                                                            </div>
                                                            <div className="text-gray-400 font-medium">
                                                                Weight
                                                            </div>
                                                            <div className="text-gray-400 font-medium">
                                                                Reps
                                                            </div>
                                                            {exercise.sets?.map((set, setIndex) => (
                                                                <React.Fragment key={setIndex}>
                                                                    <div className="text-white">
                                                                        {setIndex + 1}
                                                                    </div>
                                                                    <div className="text-white">
                                                                        {set.weight || "-"} lbs
                                                                    </div>
                                                                    <div className="text-white">
                                                                        {set.reps || "-"}
                                                                    </div>
                                                                </React.Fragment>
                                                            ))}
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};
