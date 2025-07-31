import React, { useState, useCallback } from "react";
import { EXERCISE_DATABASE } from "../lib/constants";
import { FormField } from "./ui/FormField";
import { Flame } from "lucide-react";

const shuffleArray = (array) => {
  const newArray = [...array];
  for (let i = newArray.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
  }
  return newArray;
};

export const WorkoutGenerator = ({ userProfile, onGenerate, onBack }) => {
  const [days, setDays] = useState(3);
  const [split, setSplit] = useState("full_body");

  const handleGenerate = useCallback(() => {
    const { goal, availableEquipment } = userProfile;

    const getSetRepScheme = (exerciseGoal) => {
      switch (exerciseGoal) {
        case "strength":
          return { sets: 5, reps: "5" };
        case "hypertrophy":
          return { sets: 4, reps: "8-12" };
        case "endurance":
          return { sets: 3, reps: "15-20" };
        default:
          return { sets: 3, reps: "10" };
      }
    };

    const filterExercises = (muscleGroup) => {
      return EXERCISE_DATABASE[muscleGroup].filter((ex) => {
        if (ex.requires.length === 0) return true;
        return ex.requires.every((req) => availableEquipment.includes(req));
      });
    };

    const newWorkoutPlan = [];
    const muscleGroups = Object.keys(EXERCISE_DATABASE);

    for (let i = 0; i < days; i++) {
      const dayWorkout = {
        day: i + 1,
        name: `Day ${i + 1}`,
        exercises: [],
      };

      let muscleGroupsForDay = [];
      let dayNamePrefix = "";

      if (split === "full_body") {
        dayNamePrefix = `Full Body ${String.fromCharCode(65 + (i % 3))}`;
        muscleGroupsForDay = ["chest", "back", "legs", "shoulders", "arms"];
      } else if (split === "push_pull_legs") {
        const dayTypeIndex = i % 3;
        if (dayTypeIndex === 0) {
          dayNamePrefix = "Push (Chest, Shoulders, Tris)";
          muscleGroupsForDay = ["chest", "shoulders", "arms"];
        } else if (dayTypeIndex === 1) {
          dayNamePrefix = "Pull (Back, Biceps)";
          muscleGroupsForDay = ["back", "arms"];
        } else {
          dayNamePrefix = "Legs (Quads, Hams, Calves)";
          muscleGroupsForDay = ["legs"];
        }
      } else if (split === "body_part") {
        const group = muscleGroups[i % muscleGroups.length];
        dayNamePrefix = group.charAt(0).toUpperCase() + group.slice(1);
        muscleGroupsForDay = [group];
      }

      dayWorkout.name = dayNamePrefix;

      muscleGroupsForDay.forEach((group) => {
        const availableExercises = filterExercises(group);
        if (availableExercises.length === 0) {
          console.warn(
            `No exercises found for ${group} with available equipment.`
          );
          return;
        }

        let numExercisesToAdd = 1;
        if (["legs", "back", "chest"].includes(group)) {
          numExercisesToAdd = 2;
        } else if (
          group === "arms" &&
          (split === "push_pull_legs" || split === "body_part")
        ) {
          numExercisesToAdd = 2;
        } else if (group === "arms" && split === "full_body") {
          numExercisesToAdd = 1;
        }

        const selectedExercises = shuffleArray(availableExercises).slice(
          0,
          numExercisesToAdd
        );

        selectedExercises.forEach((exercise) => {
          dayWorkout.exercises.push({
            ...exercise,
            ...getSetRepScheme(goal),
            weight: 135,
            history: [],
          });
        });
      });
      newWorkoutPlan.push(dayWorkout);
    }

    onGenerate(newWorkoutPlan);
  }, [userProfile, days, split, onGenerate]);

  return (
    <div className="p-4 md:p-8 text-white animate-fade-in">
      <div className="max-w-2xl mx-auto bg-gray-800 p-6 rounded-2xl shadow-lg">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold">Generate New Plan</h1>
          <button
            onClick={onBack}
            className="bg-gray-700 hover:bg-gray-600 text-white font-bold py-2 px-4 rounded-lg transition-colors"
          >
            Back
          </button>
        </div>

        <div className="space-y-6">
          <div>
            <label htmlFor="daysPerWeek" className="block text-gray-400 mb-2">
              Days per week
            </label>
            <input
              id="daysPerWeek"
              type="range"
              min="1"
              max="7"
              value={days}
              onChange={(e) => setDays(Number(e.target.value))}
              className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
            />
            <div className="text-center text-xl font-bold mt-2">{days}</div>
          </div>
          <FormField
            label="Workout Split"
            id="workoutSplit"
            type="select"
            value={split}
            onChange={(e) => setSplit(e.target.value)}
          >
            <option value="full_body">Full Body</option>
            <option value="push_pull_legs">Push / Pull / Legs</option>
            <option value="body_part">Body Part Split</option>
          </FormField>
        </div>

        <button
          onClick={handleGenerate}
          className="w-full mt-8 bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 rounded-lg transition-colors flex items-center justify-center gap-2"
        >
          <Flame size={20} className="text-white" /> Generate Workout
        </button>
      </div>
    </div>
  );
};
