import { useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { EXERCISE_DATABASE } from "../lib/constants";
import { ROUTES, getTemplateDetailsRoute } from "../lib/routes";

/**
 * Custom hook that manages all workout-related business logic.
 * Extracted from App.jsx to improve separation of concerns.
 */
export const useWorkoutManager = (userProfile, updateUserProfileInFirestore) => {
    const navigate = useNavigate();

    /**
     * Select and apply a program template to the user's workout plan
     */
    const selectProgramTemplate = useCallback(
        (program) => {
            if (!userProfile) return;

            const newWorkoutPlan = {};
            const workoutDays = Object.keys(program).filter(
                (k) =>
                    k.startsWith("workout_") || k.startsWith("day_") || k.endsWith("_day")
            );

            workoutDays.forEach((dayKey) => {
                const workoutDay = program[dayKey];
                const exercises = [];

                for (const exerciseName in workoutDay) {
                    const exerciseDetails = workoutDay[exerciseName];
                    const libraryExercise = userProfile.exerciseLibrary.find(
                        (e) => e.name === exerciseName
                    );
                    const oneRepMax = libraryExercise ? libraryExercise.oneRepMax : 100;

                    const exerciseInfo = Object.values(EXERCISE_DATABASE)
                        .flat()
                        .find((ex) => ex.name === exerciseName);
                    const exerciseType = exerciseInfo ? exerciseInfo.type : "weighted";

                    const sets = exerciseDetails.reps.map((rep, index) => {
                        const percentage = exerciseDetails.percentages[index] / 100;
                        return {
                            reps: rep,
                            percentage: percentage,
                            weight: Math.round((oneRepMax * percentage) / 2.5) * 2.5,
                        };
                    });

                    exercises.push({
                        id: exerciseName,
                        name: exerciseName,
                        type: exerciseType,
                        oneRepMax: oneRepMax,
                        sets: sets,
                    });
                }

                newWorkoutPlan[dayKey] = { exercises };
            });

            updateUserProfileInFirestore({ workoutPlan: newWorkoutPlan });
            navigate(ROUTES.DASHBOARD);
        },
        [userProfile, updateUserProfileInFirestore, navigate]
    );

    /**
     * Save a custom workout created by the user
     */
    const saveCustomWorkout = useCallback(
        (customWorkout) => {
            if (!userProfile) return;
            const { day, ...workoutDetails } = customWorkout;

            const newPlan = {
                ...(userProfile.workoutPlan || {}),
                [day]: workoutDetails,
            };

            updateUserProfileInFirestore({ workoutPlan: newPlan });
            navigate(ROUTES.DASHBOARD);
        },
        [userProfile, updateUserProfileInFirestore, navigate]
    );

    /**
     * Record a completed workout to history
     */
    const finishWorkout = useCallback(
        (completedWorkout) => {
            if (!userProfile) return;
            const updatedHistory = [
                ...(userProfile.workoutHistory || []),
                completedWorkout,
            ];
            updateUserProfileInFirestore({ workoutHistory: updatedHistory });
            sessionStorage.removeItem('currentWorkoutDay');
            navigate(ROUTES.DASHBOARD);
        },
        [userProfile, updateUserProfileInFirestore, navigate]
    );

    /**
     * Update a partner's workout data with new 1RM
     */
    const updatePartnerWorkoutData = useCallback(
        (exerciseId, newOneRepMax) => {
            if (!userProfile || !userProfile.partner) return;

            const newPartnerMaxes = {
                ...userProfile.partner.maxes,
                [exerciseId]: newOneRepMax,
            };

            const newPartnerWorkoutPlan = JSON.parse(
                JSON.stringify(userProfile.partner.workoutPlan)
            );
            for (const day in newPartnerWorkoutPlan) {
                const dayExercises = newPartnerWorkoutPlan[day].exercises;
                const exerciseIndex = dayExercises.findIndex(
                    (ex) => ex.id === exerciseId
                );
                if (exerciseIndex > -1) {
                    const exercise = dayExercises[exerciseIndex];
                    exercise.sets = exercise.sets.map((set) => ({
                        ...set,
                        weight: Math.round((newOneRepMax * set.percentage) / 2.5) * 2.5,
                    }));
                }
            }

            updateUserProfileInFirestore({
                "partner.maxes": newPartnerMaxes,
                "partner.workoutPlan": newPartnerWorkoutPlan,
            });
        },
        [userProfile, updateUserProfileInFirestore]
    );

    /**
     * Update a workout day's data (e.g., after completing sets)
     */
    const updateWorkoutDay = useCallback(
        (updatedWorkoutDay) => {
            if (!userProfile) return;

            const newWorkoutPlan = {
                ...userProfile.workoutPlan,
                [updatedWorkoutDay.dayIdentifier]: updatedWorkoutDay,
            };

            updateUserProfileInFirestore({ workoutPlan: newWorkoutPlan });
        },
        [userProfile, updateUserProfileInFirestore]
    );

    /**
     * Update exercise library 1RM and recalculate workout weights
     */
    const updateLibrary = useCallback(
        (exerciseName, newOneRepMax, workoutData, setWorkoutData) => {
            if (!userProfile) return;

            const newExerciseLibrary = userProfile.exerciseLibrary.map((ex) => {
                if (ex.name === exerciseName) {
                    return { ...ex, oneRepMax: newOneRepMax };
                }
                return ex;
            });

            const newWorkoutPlan = JSON.parse(JSON.stringify(userProfile.workoutPlan));
            for (const day in newWorkoutPlan) {
                const dayExercises = newWorkoutPlan[day].exercises;
                const exerciseIndex = dayExercises.findIndex(
                    (ex) => ex.name === exerciseName
                );
                if (exerciseIndex > -1) {
                    const exercise = dayExercises[exerciseIndex];
                    exercise.oneRepMax = newOneRepMax;
                    exercise.sets = exercise.sets.map((set) => ({
                        ...set,
                        weight: Math.round((newOneRepMax * set.percentage) / 2.5) * 2.5,
                    }));
                }
            }

            updateUserProfileInFirestore({
                exerciseLibrary: newExerciseLibrary,
                workoutPlan: newWorkoutPlan,
            }).then(() => {
                if (workoutData && setWorkoutData) {
                    const dayIdentifier = workoutData.dayIdentifier;
                    const updatedWorkoutDay = newWorkoutPlan[dayIdentifier];
                    setWorkoutData({ ...updatedWorkoutDay, dayIdentifier });
                    sessionStorage.setItem('currentWorkoutDay', JSON.stringify({ ...updatedWorkoutDay, dayIdentifier }));
                }
            });
        },
        [userProfile, updateUserProfileInFirestore]
    );

    /**
     * Update the entire workout plan
     */
    const updateWorkoutPlan = useCallback(
        (newWorkoutPlan) => {
            if (!userProfile) return;
            updateUserProfileInFirestore({ workoutPlan: newWorkoutPlan });
        },
        [userProfile, updateUserProfileInFirestore]
    );

    /**
     * Navigate to a specific page with optional data
     */
    const navigateTo = useCallback((page, data = null, id = null) => {
        if (page === "planner" && data) {
            sessionStorage.setItem('currentWorkoutDay', JSON.stringify(data));
            navigate(ROUTES.PLANNER);
        } else if (page === "program_template_details" && id) {
            navigate(getTemplateDetailsRoute(id));
        } else {
            const routeMap = {
                dashboard: ROUTES.DASHBOARD,
                settings: ROUTES.SETTINGS,
                create_workout: ROUTES.CREATE_WORKOUT,
                exercise_library: ROUTES.EXERCISE_LIBRARY,
                calculator: ROUTES.CALCULATOR,
                program_templates: ROUTES.PROGRAM_TEMPLATES,
            };
            navigate(routeMap[page] || ROUTES.DASHBOARD);
        }
    }, [navigate]);

    return {
        selectProgramTemplate,
        saveCustomWorkout,
        finishWorkout,
        updatePartnerWorkoutData,
        updateWorkoutDay,
        updateLibrary,
        updateWorkoutPlan,
        navigateTo,
    };
};
