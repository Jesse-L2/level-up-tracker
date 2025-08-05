import React, { useState, useMemo, useCallback } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { ChevronDown, ChevronUp, Settings, Weight } from "lucide-react";
import { Modal } from "./ui/Modal";
import { MiniPlateDisplay } from "./ui/MiniPlateDisplay";

const daysOrder = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
];

export const Dashboard = ({ userProfile, onNavigate }) => {
  const [expandedDay, setExpandedDay] = useState(null);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);

  const toggleDay = useCallback(
    (dayName) => {
      setExpandedDay(expandedDay === dayName ? null : dayName);
    },
    [expandedDay]
  );

  // Memoize and sort the workout plan by day of the week
  const sortedWorkoutPlan = useMemo(() => {
    if (
      !userProfile.workoutPlan ||
      typeof userProfile.workoutPlan !== "object"
    ) {
      return [];
    }
    // Convert the plan object to an array and sort it
    return Object.entries(userProfile.workoutPlan).sort(([dayA], [dayB]) => {
      return daysOrder.indexOf(dayA) - daysOrder.indexOf(dayB);
    });
  }, [userProfile.workoutPlan]);

  const chartData = useMemo(() => {
    if (!userProfile.workoutHistory || userProfile.workoutHistory.length === 0)
      return [];

    const volumeByDay = {};
    userProfile.workoutHistory.forEach((session) => {
      const date = new Date(session.date).toISOString().split("T")[0];
      const totalVolume = session.exercises.reduce((totalVol, ex) => {
        const exerciseVolume = ex.sets.reduce((setVol, s) => {
          const reps = parseInt(s.reps, 10);
          const weight = parseFloat(s.weight);
          return setVol + (isNaN(reps) || isNaN(weight) ? 0 : reps * weight);
        }, 0);
        return totalVol + exerciseVolume;
      }, 0);

      if (!volumeByDay[date]) {
        volumeByDay[date] = 0;
      }
      volumeByDay[date] += totalVolume;
    });

    return Object.entries(volumeByDay)
      .map(([date, volume]) => ({ date, volume }))
      .sort((a, b) => new Date(a.date) - new Date(b.date))
      .slice(-10);
  }, [userProfile.workoutHistory]);

  return (
    <div className="p-4 md:p-8 text-white animate-fade-in">
      <div className="max-w-6xl mx-auto">
        <header className="flex flex-wrap justify-between items-center mb-8 gap-4">
          <div>
            <h1 className="text-4xl font-bold text-white">LevelUp Tracker</h1>
            <p className="text-gray-300">
              Your personalized workout dashboard.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => onNavigate("settings")}
              className="bg-gray-700 hover:bg-gray-600 p-3 rounded-full transition-colors"
              aria-label="Settings"
            >
              <Settings size={20} className="text-white" />
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
                      <button
                        onClick={() => toggleDay(dayName)}
                        className="w-full flex justify-between items-center p-4 text-left"
                        aria-expanded={expandedDay === dayName}
                        aria-controls={`workout-day-${dayName}`}
                      >
                        <div className="flex flex-col text-left">
                          <span className="font-bold text-lg text-white">
                            {dayName}
                          </span>
                          <span className="text-sm text-gray-300">
                            {workoutDetails.name}
                          </span>
                        </div>
                        <div className="flex items-center gap-4">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onNavigate("player", {
                                ...workoutDetails,
                                dayIdentifier: dayName,
                              });
                            }}
                            className="bg-green-600 hover:bg-green-500 text-white font-bold py-2 px-4 rounded-lg transition-colors"
                          >
                            Start Workout
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
                      </button>
                      {expandedDay === dayName && (
                        <div
                          id={`workout-day-${dayName}`}
                          className="p-4 bg-gray-900/50 border-t border-gray-600"
                        >
                          <ul className="space-y-2">
                            {workoutDetails.exercises.length > 0 ? (
                              workoutDetails.exercises.map((ex, exIndex) => (
                                <li key={exIndex} className="text-white">
                                  <div className="flex justify-between items-center">
                                    <span>{ex.name}</span>
                                    <span className="text-gray-300">
                                      {ex.sets} x {ex.reps} @ {ex.weight} lbs
                                    </span>
                                  </div>
                                  {ex.type === "barbell" && (
                                    <MiniPlateDisplay
                                      targetWeight={ex.weight}
                                      availablePlates={
                                        userProfile.availablePlates
                                      }
                                    />
                                  )}
                                </li>
                              ))
                            ) : (
                              <p className="text-gray-400">
                                No exercises planned for this day.
                              </p>
                            )}
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
              <h2 className="text-2xl font-semibold text-white mb-4">
                Progress Overview (Total Volume)
              </h2>
              {chartData.length > 0 ? (
                <div style={{ width: "100%", height: 300 }}>
                  <ResponsiveContainer>
                    <BarChart
                      data={chartData}
                      margin={{ top: 5, right: 20, left: -10, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="#4A5568" />
                      <XAxis dataKey="date" stroke="#A0AEC0" />
                      <YAxis stroke="#A0AEC0" />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "#1A202C",
                          border: "1px solid #4A5568",
                        }}
                        formatter={(value) => [
                          `${value.toFixed(1)} lbs`,
                          "Volume",
                        ]}
                      />
                      <Legend />
                      <Bar dataKey="volume" fill="#4299E1" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <p className="text-gray-400 text-center py-8">
                  Complete some workouts to see your progress!
                </p>
              )}
            </div>
          </div>

          <div className="space-y-8">
            <div className="bg-gray-800 p-6 rounded-2xl shadow-lg">
              <h2 className="text-2xl font-semibold text-white mb-4">Tools</h2>
              <button
                onClick={() => onNavigate("calculator")}
                className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-3 px-4 rounded-lg transition-colors flex items-center justify-center gap-2"
              >
                <Weight size={20} className="text-white" /> Plate Calculator
              </button>
            </div>
            <div className="bg-gray-800 p-6 rounded-2xl shadow-lg">
              <h2 className="text-2xl font-semibold text-white mb-4">
                Workout History
              </h2>
              <div className="space-y-3 max-h-96 overflow-y-auto pr-2">
                {userProfile.workoutHistory &&
                userProfile.workoutHistory.length > 0 ? (
                  userProfile.workoutHistory
                    .slice()
                    .reverse()
                    .map((session, index) => (
                      <div key={index} className="bg-gray-700 p-3 rounded-lg">
                        <p className="font-semibold text-white">
                          {session.dayName}
                        </p>
                        <p className="text-sm text-gray-400">
                          {new Date(session.date).toLocaleDateString()}
                        </p>
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
          {userProfile.workoutHistory &&
          userProfile.workoutHistory.length > 0 ? (
            userProfile.workoutHistory
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
