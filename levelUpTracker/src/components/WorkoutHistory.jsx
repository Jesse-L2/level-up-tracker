import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, ChevronDown, ChevronUp, Calendar, Dumbbell, Trash2, AlertTriangle, X } from "lucide-react";
import { ROUTES } from "../lib/routes";

export const WorkoutHistory = ({ userProfile, deleteWorkout }) => {
    const navigate = useNavigate();
    const [expandedWorkout, setExpandedWorkout] = useState(null);
    const [confirmModal, setConfirmModal] = useState({ open: false, workoutIndex: null, workout: null });

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

    const handleDeleteClick = (index, workout, e) => {
        e.stopPropagation();
        setConfirmModal({ open: true, workoutIndex: index, workout });
    };

    const handleConfirmDelete = async () => {
        const { workoutIndex } = confirmModal;
        // Since the list is reversed for display, we need to find the original index
        const originalIndex = workoutHistory.length - 1 - workoutIndex;
        if (deleteWorkout) {
            await deleteWorkout(originalIndex);
        }
        setConfirmModal({ open: false, workoutIndex: null, workout: null });
    };

    const handleCancelDelete = () => {
        setConfirmModal({ open: false, workoutIndex: null, workout: null });
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
                                            onClick={(e) => handleDeleteClick(index, workout, e)}
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

            {/* Delete Confirmation Modal */}
            {confirmModal.open && (
                <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
                    <div className="bg-gray-800 rounded-2xl shadow-xl max-w-md w-full p-6 animate-fade-in border border-gray-700">
                        <div className="flex items-start gap-4 mb-4">
                            <div className="bg-red-600/20 p-3 rounded-full flex-shrink-0">
                                <AlertTriangle size={24} className="text-red-500" />
                            </div>
                            <div>
                                <h3 className="text-xl font-bold text-white mb-1">Delete Workout</h3>
                                <p className="text-gray-400 text-sm">
                                    {confirmModal.workout?.dayName || "Workout"} • {confirmModal.workout && formatDate(confirmModal.workout.date)}
                                </p>
                            </div>
                            <button
                                onClick={handleCancelDelete}
                                className="ml-auto text-gray-400 hover:text-white p-1"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        <div className="bg-gray-700/50 rounded-lg p-4 mb-6">
                            <p className="text-gray-300 text-sm">
                                Are you sure you want to delete this workout? This will:
                            </p>
                            <ul className="text-gray-400 text-sm mt-2 space-y-1">
                                <li className="flex items-center gap-2">
                                    <span className="text-red-400">•</span> Remove this workout from your history
                                </li>
                                <li className="flex items-center gap-2">
                                    <span className="text-red-400">•</span> Remove this data from your 1RM progress chart
                                </li>
                            </ul>
                            <p className="text-yellow-500 text-sm mt-3 font-medium">
                                This action cannot be undone.
                            </p>
                        </div>

                        <div className="flex gap-3 justify-end">
                            <button
                                onClick={handleCancelDelete}
                                className="px-5 py-2.5 rounded-lg text-gray-300 hover:text-white hover:bg-gray-700 font-medium transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleConfirmDelete}
                                className="px-5 py-2.5 rounded-lg bg-red-600 hover:bg-red-500 text-white font-bold shadow-lg transition-all active:scale-95"
                            >
                                Delete Workout
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
