import React, { useState, useCallback, useEffect } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { getAuth, signOut } from "firebase/auth";
import {
  ChevronDown,
  ChevronUp,
  Settings,
  Weight,
  BookOpen, // New Icon
  LogOut,
  Edit2, // New Icon
} from "lucide-react";
import { isBarbellExercise } from "../lib/constants";
import { MiniPlateDisplay } from "./ui/MiniPlateDisplay";
import { calculateLevel, calculateProgressToNextLevel } from "../lib/gamification";
import { Trophy } from "lucide-react";

const daysOrder = [
  "Day 1",
  "Day 2",
  "Day 3",
  "Day 4",
  "Day 5",
  "Day 6",
  "Day 7",
];

// Helper to format snake_case exercise names to Title Case
const formatExerciseName = (name) => {
  if (!name) return '';
  return name
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
};

export const Dashboard = ({ userProfile, onNavigate, deleteWorkout }) => {
  const [expandedDay, setExpandedDay] = useState(null);
  const [expandedHistory, setExpandedHistory] = useState(null);
  const [isPartnerView, setIsPartnerView] = useState(false);

  const toggleHistory = useCallback(
    (index) => {
      setExpandedHistory(expandedHistory === index ? null : index);
    },
    [expandedHistory]
  );

  // handleDelete helper for the dashboard widget
  const handleDelete = async (index, e) => {
    e.stopPropagation();
    if (window.confirm("Are you sure you want to delete this workout?")) {
      // Dashboard uses sliced reverse array, need to find original index
      // The display is slice().reverse(), but slice() copies the whole array if userProfile.workoutHistory
      // Actually the code below uses: userProfile.workoutHistory.slice().reverse()
      // So index 0 in display is last element in original array.
      const history = isPartnerView ? userProfile.partner.workoutHistory : userProfile.workoutHistory;
      const originalIndex = history.length - 1 - index;

      if (deleteWorkout) {
        await deleteWorkout(originalIndex);
      }
    }
  };

  const toggleDay = useCallback(
    (dayName) => {
      setExpandedDay(expandedDay === dayName ? null : dayName);
    },
    [expandedDay]
  );

  const getSortedWorkoutPlan = () => {
    const plan = isPartnerView ? userProfile.partner.workoutPlan : userProfile.workoutPlan;
    if (!plan || typeof plan !== "object") {
      return [];
    }

    // Use saved order if available
    const savedOrder = isPartnerView
      ? userProfile.partner?.workoutPlanOrder
      : userProfile.workoutPlanOrder;

    if (savedOrder && Array.isArray(savedOrder)) {
      // Return entries in saved order, then any new keys not in order
      const planKeys = Object.keys(plan);
      const orderedEntries = savedOrder
        .filter(key => planKeys.includes(key))
        .map(key => [key, plan[key]]);
      // Add any keys not in the saved order
      planKeys.forEach(key => {
        if (!savedOrder.includes(key)) {
          orderedEntries.push([key, plan[key]]);
        }
      });
      return orderedEntries;
    }

    // Fall back to sorting by day number
    return Object.entries(plan).sort(([dayA], [dayB]) => {
      const dayNumA = parseInt(dayA.split('_')[1]);
      const dayNumB = parseInt(dayB.split('_')[1]);
      return dayNumA - dayNumB;
    });
  };

  const sortedWorkoutPlan = getSortedWorkoutPlan();

  const [selectedExercise, setSelectedExercise] = useState(null);

  const getUniqueExercises = () => {
    const exercises = new Set();
    if (userProfile.workoutPlan) {
      Object.values(userProfile.workoutPlan).forEach((day) => {
        day.exercises.forEach((ex) => exercises.add(ex.name));
      });
    }
    // Sort alphabetically by formatted name
    return Array.from(exercises).sort((a, b) =>
      formatExerciseName(a).localeCompare(formatExerciseName(b))
    );
  };

  const uniqueExercises = getUniqueExercises();

  // Set default selected exercise (prefer Bench Press)
  useEffect(() => {
    if (uniqueExercises.length > 0 && !selectedExercise) {
      // Try to find Bench Press (handles both "Bench Press" and "bench_press")
      const benchPress = uniqueExercises.find(
        (ex) => formatExerciseName(ex).toLowerCase() === 'bench press'
      );
      setSelectedExercise(benchPress || uniqueExercises[0]);
    }
  }, [uniqueExercises, selectedExercise]);

  const getChartData = () => {
    const workoutHistory = isPartnerView ? userProfile.partner.workoutHistory : userProfile.workoutHistory;
    if (
      !workoutHistory ||
      workoutHistory.length === 0 ||
      !selectedExercise
    )
      return [];

    const exerciseData = workoutHistory
      .map((session) => {
        // Normalize names for comparison (handle both snake_case and Title Case)
        const normalizedSelectedExercise = selectedExercise.toLowerCase().replace(/_/g, ' ');
        const exercise = session.exercises.find(
          (ex) => ex.name.toLowerCase().replace(/_/g, ' ') === normalizedSelectedExercise
        );
        if (!exercise || !exercise.sets || exercise.sets.length === 0) return null;

        const topSet = exercise.sets.reduce(
          (max, set) => {
            const weight = parseFloat(set.weight) || 0;
            const maxWeight = parseFloat(max.weight) || 0;
            return weight > maxWeight ? set : max;
          },
          { weight: 0, reps: 0 }
        );

        const topWeight = parseFloat(topSet.weight) || 0;
        const topReps = parseFloat(topSet.reps) || 0;

        if (topWeight === 0) return null;

        // Epley 1RM Formula
        const oneRepMax = topWeight * (1 + topReps / 30);

        return {
          date: new Date(session.date).toISOString().split("T")[0],
          oneRepMax: oneRepMax,
        };
      })
      .filter(Boolean);

    return exerciseData
      .sort((a, b) => new Date(a.date) - new Date(b.date))
      .slice(-10);
  };

  const chartData = getChartData();

  const getChartDomain = () => {
    if (chartData.length === 0) {
      return [0, 100]; // Default domain
    }

    const oneRepMaxValues = chartData.map(d => d.oneRepMax);
    let min = Math.min(...oneRepMaxValues);
    let max = Math.max(...oneRepMaxValues);

    if (min === max) {
      const padding = min * 0.1;
      min -= padding;
      max += padding;
    } else {
      const padding = (max - min) * 0.1; // 10% padding
      min -= padding;
      max += padding;
    }

    return [Math.max(0, min), max];
  };

  const chartDomain = getChartDomain();

  const getTicks = (domain) => {
    if (!domain) return [];
    const [min, max] = domain;
    const ticks = [];
    const start = Math.ceil(min / 5) * 5;
    for (let i = start; i <= max; i += 5) {
      ticks.push(i);
    }
    return ticks;
  };

  const chartTicks = getTicks(chartDomain);

  const handleToggle = () => {
    if (userProfile.partner) {
      setIsPartnerView(!isPartnerView);
    }
  };

  return (
    <div className="p-4 md:p-8 text-white animate-fade-in">
      <div className="max-w-6xl mx-auto">
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-6 md:gap-4">
          <div className="w-full md:w-auto">
            <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">LevelUp Tracker</h1>
            <div className="flex items-center gap-4 mb-2">
              <div className="flex items-center gap-2 bg-yellow-500/20 text-yellow-500 px-3 py-1 rounded-full border border-yellow-500/50">
                <Trophy size={16} />
                <span className="font-bold">Level {calculateLevel(isPartnerView ? userProfile.partner?.xp : userProfile.xp)}</span>
              </div>
              <div className="w-32 md:w-48 h-2 bg-gray-700 rounded-full overflow-hidden">
                <div
                  className="h-full bg-yellow-500 transition-all duration-1000"
                  style={{ width: `${calculateProgressToNextLevel(isPartnerView ? userProfile.partner?.xp : userProfile.xp)}%` }}
                />
              </div>
            </div>
            <p className="text-gray-300 text-sm md:text-base">
              {isPartnerView ? `${userProfile.partner.name}'s personalized workout dashboard.` : 'Your personalized workout dashboard.'}
            </p>
          </div>
          <div className="flex items-center gap-2 w-full md:w-auto justify-end">
            {userProfile.partner && (
              <div className="flex items-center gap-2 mr-2 bg-gray-700/50 p-2 rounded-lg border border-gray-600/50">
                <div className="text-white text-sm font-semibold">{userProfile.displayName}</div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" value="" className="sr-only peer" checked={isPartnerView} onChange={handleToggle} />
                  <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                </label>
                <div className="text-white text-sm font-semibold">{userProfile.partner.name}</div>
              </div>
            )}
            <button
              onClick={() => onNavigate("settings")}
              className="bg-gray-700 hover:bg-gray-600 p-3 rounded-full transition-colors"
              aria-label="Settings"
            >
              <Settings size={20} className="text-white" />
            </button>
            <button
              onClick={() => signOut(getAuth())}
              className="bg-gray-700 hover:bg-gray-600 p-3 rounded-full transition-colors"
              aria-label="Logout"
            >
              <LogOut size={20} className="text-white" />
            </button>
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
            <div className="bg-gray-800 p-6 rounded-2xl shadow-lg">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
                <h2 className="text-2xl font-semibold text-white">
                  Your Weekly Plan
                </h2>
                <button
                  onClick={() => onNavigate("edit_program")}
                  className="w-full sm:w-auto bg-blue-600 hover:bg-blue-500 text-white font-bold py-2.5 px-4 rounded-lg transition-colors flex items-center justify-center gap-2"
                >
                  <Edit2 size={18} /> Manage Schedule
                </button>
              </div>
              {sortedWorkoutPlan.length > 0 ? (
                <div className="space-y-4">
                  {sortedWorkoutPlan.map(([dayName, workoutDetails]) => (
                    <div
                      key={dayName}
                      className="bg-gray-700 rounded-lg overflow-hidden"
                    >
                      <div
                        onClick={() => toggleDay(dayName)}
                        className="w-full flex justify-between items-center p-4 text-left cursor-pointer"
                        aria-expanded={expandedDay === dayName}
                        aria-controls={`workout-day-${dayName}`}
                        role="button"
                      >
                        <div className="flex flex-col text-left">
                          <span className="font-bold text-lg text-white">
                            {dayName.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
                          </span>
                          {workoutDetails.name && (
                            <span className="text-sm text-gray-300">
                              {workoutDetails.name.split('_').slice(2).map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-4">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              // Always use the primary user's workout data, not the partner's
                              // The WorkoutPlanner handles partner data separately
                              const primaryWorkoutDetails = userProfile.workoutPlan[dayName];
                              onNavigate("planner", {
                                ...primaryWorkoutDetails,
                                dayIdentifier: dayName,
                              });
                            }}
                            className="bg-green-600 hover:bg-green-500 text-white font-bold py-2 px-4 rounded-lg transition-colors"
                          >
                            Start Planner
                          </button>
                          {expandedDay === dayName ? (
                            <ChevronUp
                              className="text-white"
                              aria-label="Collapse"
                            />
                          ) : (
                            <ChevronDown
                              className="text-white"
                              aria-label="Expand"
                            />
                          )}
                        </div>
                      </div>
                      {expandedDay === dayName && (
                        <div
                          id={`workout-day-${dayName}`}
                          className="p-4 bg-gray-900/50 border-t border-gray-600"
                        >
                          <ul className="space-y-2">
                            {workoutDetails.exercises.map((ex, exIndex) => (
                              <li key={exIndex} className="text-white">
                                <div className="flex justify-between items-center">
                                  <span>{ex.name}</span>
                                  <span className="text-gray-300">
                                    {Array.isArray(ex.sets)
                                      ? ex.sets.length
                                      : 0}{" "}
                                    sets
                                  </span>
                                </div>
                                <ul className="pl-4 mt-1 border-l-2 border-gray-600">
                                  {(Array.isArray(ex.sets) ? ex.sets : []).map(
                                    (s, i) => (
                                      <li
                                        key={i}
                                        className="text-sm text-gray-300"
                                      >
                                        Set {i + 1}: {s.reps} reps @ {s.weight}{" "}
                                        lbs ({s.percentage * 100}%)
                                        {(ex.isBarbell || isBarbellExercise(ex.name)) && (
                                          <MiniPlateDisplay
                                            targetWeight={s.weight}
                                            availablePlates={
                                              userProfile.availablePlates
                                            }
                                          />
                                        )}
                                      </li>
                                    )
                                  )}
                                </ul>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-10">
                  <p className="text-gray-400 mb-4">
                    Your plan is empty. Let's build your first workout!
                  </p>
                  <button
                    onClick={() => onNavigate("create_workout")}
                    className="bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 px-6 rounded-lg transition-colors"
                  >
                    Create a Workout
                  </button>
                </div>
              )}
            </div>

            <div className="bg-gray-800 p-6 rounded-2xl shadow-lg">
              <div className="flex flex-wrap justify-between items-center mb-4 gap-2">
                <h2 className="text-2xl font-semibold text-white">
                  1RM Progress
                </h2>
                {uniqueExercises.length > 0 && (
                  <select
                    value={selectedExercise || ""}
                    onChange={(e) => setSelectedExercise(e.target.value)}
                    className="bg-gray-700 text-white p-2 rounded-lg"
                  >
                    {uniqueExercises.map((ex) => (
                      <option key={ex} value={ex}>
                        {formatExerciseName(ex)}
                      </option>
                    ))}
                  </select>
                )}
              </div>
              {chartData.length > 0 ? (
                <div style={{ width: "100%", height: 300 }}>
                  <ResponsiveContainer>
                    <LineChart
                      data={chartData}
                      margin={{ top: 5, right: 20, left: -10, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="#4A5568" />
                      <XAxis dataKey="date" stroke="#A0AEC0" padding={{ left: 20, right: 20 }} />
                      <YAxis stroke="#A0AEC0" domain={chartDomain} ticks={chartTicks} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "#1A202C",
                          border: "1px solid #4A5568",
                        }}
                        formatter={(value) => [
                          `${value.toFixed(1)} lbs`,
                          "1RM",
                        ]}
                      />
                      <Legend />
                      <Line type="monotone" dataKey="oneRepMax" stroke="#4299E1" name="Est. 1RM" dot={{ r: 4 }} activeDot={{ r: 8 }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <p className="text-gray-400 text-center py-8">
                  {selectedExercise
                    ? `No data for ${formatExerciseName(selectedExercise)}. Complete a workout to track your progress!`
                    : "No exercises found in your plan."}
                </p>
              )}
            </div>
          </div>

          <div className="space-y-8">
            <div className="bg-gray-800 p-6 rounded-2xl shadow-lg">
              <h2 className="text-2xl font-semibold text-white mb-4">
                Tools & Library
              </h2>
              <div className="space-y-3">
                <button
                  onClick={() => onNavigate("calculator")}
                  className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-3 px-4 rounded-lg transition-colors flex items-center justify-center gap-2"
                >
                  <Weight size={20} className="text-white" /> Plate Calculator
                </button>
                <button
                  onClick={() => onNavigate("exercise_library")}
                  className="w-full bg-teal-600 hover:bg-teal-500 text-white font-bold py-3 px-4 rounded-lg transition-colors flex items-center justify-center gap-2"
                >
                  <BookOpen size={20} className="text-white" /> Exercise Library
                </button>
                <button
                  onClick={() => onNavigate("program_templates")}
                  className="w-full bg-purple-600 hover:bg-purple-500 text-white font-bold py-3 px-4 rounded-lg transition-colors flex items-center justify-center gap-2"
                >
                  <BookOpen size={20} className="text-white" /> Program
                  Templates
                </button>
              </div>
            </div>
            <div className="bg-gray-800 p-6 rounded-2xl shadow-lg">
              <h2 className="text-2xl font-semibold text-white mb-4">
                Workout History
              </h2>
              <div className="space-y-3 max-h-96 overflow-y-auto pr-2">
                {(isPartnerView ? userProfile.partner.workoutHistory : userProfile.workoutHistory) &&
                  (isPartnerView ? userProfile.partner.workoutHistory : userProfile.workoutHistory).length > 0 ? (
                  (isPartnerView ? userProfile.partner.workoutHistory : userProfile.workoutHistory)
                    .slice()
                    .reverse()
                    .map((session, index) => (
                      <div key={index} className="bg-gray-700 rounded-lg overflow-hidden">
                        <div
                          onClick={() => toggleHistory(index)}
                          className="w-full flex justify-between items-center p-3 cursor-pointer"
                        >
                          <div>
                            <p className="font-semibold text-white">
                              {session.dayName}
                            </p>
                            <p className="text-sm text-gray-400">
                              {new Date(session.date).toLocaleDateString()}
                            </p>
                          </div>
                          {expandedHistory === index ? (
                            <ChevronUp className="text-white" />
                          ) : (
                            <ChevronDown className="text-white" />
                          )}
                        </div>
                        {expandedHistory === index && (
                          <div className="p-4 bg-gray-900/50 border-t border-gray-600">
                            <ul className="space-y-2">
                              {session.exercises.map((ex, exIndex) => (
                                <li key={exIndex} className="text-white">
                                  <div className="flex justify-between items-center">
                                    <span>{ex.name}</span>
                                  </div>
                                  <ul className="pl-4 mt-1 border-l-2 border-gray-600">
                                    {ex.sets.map((s, i) => (
                                      <li key={i} className="text-sm text-gray-300">
                                        Set {i + 1}: {s.reps} reps @ {s.weight} lbs
                                      </li>
                                    ))}
                                  </ul>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    ))
                ) : (
                  <p className="text-gray-400">No workouts completed yet.</p>
                )}
              </div>
              <button
                onClick={() => onNavigate("history")}
                className="w-full mt-4 bg-gray-700 hover:bg-gray-600 text-white font-bold py-2 px-4 rounded-lg transition-colors"
              >
                View Full History
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};