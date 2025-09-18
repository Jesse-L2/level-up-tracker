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
} from "lucide-react";
import { Modal } from "./ui/Modal";
import { MiniPlateDisplay } from "./ui/MiniPlateDisplay";

const daysOrder = [
  "Day 1",
  "Day 2",
  "Day 3",
  "Day 4",
  "Day 5",
  "Day 6",
  "Day 7",
];

export const Dashboard = ({ userProfile, onNavigate }) => {
  const [expandedDay, setExpandedDay] = useState(null);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [expandedHistory, setExpandedHistory] = useState(null);
  const [isPartnerView, setIsPartnerView] = useState(false);

  const toggleHistory = useCallback(
    (index) => {
      setExpandedHistory(expandedHistory === index ? null : index);
    },
    [expandedHistory]
  );

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
    return Array.from(exercises);
  };

  const uniqueExercises = getUniqueExercises();

  // Set default selected exercise
  useEffect(() => {
    if (uniqueExercises.length > 0 && !selectedExercise) {
      setSelectedExercise(uniqueExercises[0]);
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
        const exercise = session.exercises.find(
          (ex) => ex.name === selectedExercise
        );
        if (!exercise) return null;

        const topSet = exercise.sets.reduce(
          (max, set) => (set.weight > max.weight ? set : max),
          { weight: 0, reps: 0 }
        );

        if (topSet.weight === 0) return null;

        // Epley 1RM Formula
        const oneRepMax = topSet.weight * (1 + topSet.reps / 30);

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
        <header className="flex flex-wrap justify-between items-center mb-8 gap-4">
          <div>
            <h1 className="text-4xl font-bold text-white">LevelUp Tracker</h1>
            <p className="text-gray-300">
              {isPartnerView ? `${userProfile.partner.name}'s personalized workout dashboard.` : 'Your personalized workout dashboard.'}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {userProfile.partner && (
              <div className="flex items-center gap-2">
                <div className="text-white">{userProfile.displayName}</div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" value="" className="sr-only peer" checked={isPartnerView} onChange={handleToggle} />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                </label>
                <div className="text-white">{userProfile.partner.name}</div>
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
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-semibold text-white">
                  Your Weekly Plan
                </h2>
                <button
                  onClick={() => onNavigate("create_workout")}
                  className="bg-blue-600 hover:bg-blue-500 text-white font-bold py-2 px-4 rounded-lg transition-colors"
                >
                  Add/Edit Workout Day
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
                          <span className="text-sm text-gray-300">
                            {workoutDetails.name.split('_').slice(2).map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
                          </span>
                        </div>
                        <div className="flex items-center gap-4">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onNavigate("planner", {
                                ...workoutDetails,
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
                                        <MiniPlateDisplay
                                          targetWeight={s.weight}
                                          availablePlates={
                                            userProfile.availablePlates
                                          }
                                        />
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
                        {ex}
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
                    ? `No data for ${selectedExercise}. Complete a workout to track your progress!`
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
                onClick={() => setIsHistoryModalOpen(true)}
                className="w-full mt-4 bg-gray-700 hover:bg-gray-600 text-white font-bold py-2 px-4 rounded-lg transition-colors"
              >
                View Full History
              </button>
            </div>
          </div>
        </div>
      </div>

      <Modal
        isOpen={isHistoryModalOpen}
        onClose={() => setIsHistoryModalOpen(false)}
        title="Full Workout History"
      >
        <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-4">
          {(isPartnerView ? userProfile.partner.workoutHistory : userProfile.workoutHistory) &&
          (isPartnerView ? userProfile.partner.workoutHistory : userProfile.workoutHistory).length > 0 ? (
            (isPartnerView ? userProfile.partner.workoutHistory : userProfile.workoutHistory)
              .slice()
              .reverse()
              .map((session, index) => (
                <div key={index} className="bg-gray-700 p-4 rounded-lg">
                  <h4 className="font-bold text-lg text-white">
                    {session.dayName} -{" "}
                    {new Date(session.date).toLocaleDateString()}
                  </h4>
                  <ul className="list-disc list-inside mt-2 text-gray-300">
                    {session.exercises.length > 0 ? (
                      session.exercises.map((ex, exIndex) => (
                        <li key={exIndex}>
                          {ex.name}:{" "}
                          {ex.sets
                            .map((s) => `${s.reps}x${s.weight}lbs`)
                            .join(", ")}
                        </li>
                      ))
                    ) : (
                      <p className="text-gray-400">
                        No sets logged for this exercise.
                      </p>
                    )}
                  </ul>
                </div>
              ))
          ) : (
            <p className="text-gray-400">No history to show.</p>
          )}
        </div>
      </Modal>
    </div>
  );
};