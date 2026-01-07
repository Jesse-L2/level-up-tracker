import React, { useEffect } from 'react';
import { useWorkout } from '../context/WorkoutContext';

// Helper to format the workout/week key into a readable title
const formatWorkoutKey = (key) => {
  return key
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
};

// Component to display a single exercise's set scheme
const ExerciseDisplay = ({ liftId, exerciseData, lifts, userLibrary }) => {
  const liftInfo = lifts[liftId];
  const liftName = liftInfo ? liftInfo.name : liftId;

  // Find user's 1RM for this lift
  const userExercise = userLibrary?.find(
    (ex) => ex.name.toLowerCase() === liftName.toLowerCase()
  );
  const userOneRepMax = userExercise?.oneRepMax;

  // Build the set details string
  const setDetails = exerciseData.reps.map((rep, index) => {
    const percentage = exerciseData.percentages[index] || exerciseData.percentages[0];
    const weight = userOneRepMax ? Math.round((userOneRepMax * percentage / 100) / 2.5) * 2.5 : null;
    return {
      reps: rep,
      percentage: percentage,
      weight: weight,
    };
  });

  return (
    <div className="bg-gray-700/50 p-3 rounded-lg mb-2">
      <div className="flex justify-between items-center mb-2">
        <span className="font-semibold text-white">{liftName}</span>
      </div>
      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-2 text-sm">
        {setDetails.map((set, i) => (
          <div key={i} className="bg-gray-800 p-2 rounded text-center">
            <p className="text-gray-400 text-xs">Set {i + 1}</p>
            <p className="text-white font-bold">{set.reps}</p>
            <p className="text-blue-400 text-xs">@ {set.percentage}%</p>
            {set.weight && <p className="text-green-400 text-xs">{set.weight} lbs</p>}
          </div>
        ))}
      </div>
    </div>
  );
};

// Component to display a single workout (a collection of exercises)
const WorkoutSection = ({ workoutKey, workoutData, lifts, userLibrary }) => {
  const title = formatWorkoutKey(workoutKey);
  const exerciseIds = Object.keys(workoutData);

  return (
    <div className="bg-gray-800 rounded-xl p-4 mb-4 border border-gray-700">
      <h3 className="text-xl font-semibold text-blue-400 mb-4">{title}</h3>
      {exerciseIds.map((liftId) => (
        <ExerciseDisplay
          key={liftId}
          liftId={liftId}
          exerciseData={workoutData[liftId]}
          lifts={lifts}
          userLibrary={userLibrary}
        />
      ))}
    </div>
  );
};

function ProgramTemplateDetails({ id, program, lifts, loading, error, onBack, onNavigate, onSelectProgram }) {
  const { userProfile } = useWorkout();

  // Set page title
  useEffect(() => {
    document.title = "Level Up Tracker - Program Details";
    return () => {
      document.title = "Level Up Tracker";
    };
  }, []);

  const handleSelectProgram = () => {
    onSelectProgram(program);
  };

  // Extract workout keys from the program (anything that's not id, name, description, structure)
  const getWorkoutKeys = (prog) => {
    if (!prog) return [];
    const metaKeys = ['id', 'name', 'description', 'structure'];
    return Object.keys(prog).filter((key) => !metaKeys.includes(key));
  };

  if (loading) {
    return <div className="text-white text-center mt-8">Loading program details...</div>;
  }

  if (error) {
    return <div className="text-red-500 text-center mt-8">Error: {error.message}</div>;
  }

  if (!program) {
    return <div className="text-white text-center mt-8">Program not found.</div>;
  }

  const workoutKeys = getWorkoutKeys(program);
  const userLibrary = userProfile?.exerciseLibrary || [];

  return (
    <div className="container mx-auto p-4 text-white">
      <button
        onClick={onBack}
        className="bg-gray-600 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded-md mb-6 transition-colors duration-200"
      >
        &larr; Back to Programs
      </button>

      <h1 className="text-3xl font-bold mb-2">{program.name}</h1>
      <p className="text-gray-300 mb-2">{program.description}</p>
      <p className="text-gray-500 text-sm mb-6 italic">{program.structure}</p>

      <div className="mb-8">
        <h2 className="text-2xl font-semibold mb-4 border-b border-gray-700 pb-2">Program Breakdown</h2>
        {workoutKeys.length > 0 ? (
          workoutKeys.map((key) => (
            <WorkoutSection
              key={key}
              workoutKey={key}
              workoutData={program[key]}
              lifts={lifts}
              userLibrary={userLibrary}
            />
          ))
        ) : (
          <p className="text-gray-500">No workout details available for this program.</p>
        )}
      </div>

      <div className="bg-gray-800 rounded-lg shadow-lg p-6 border border-gray-700">
        <button
          onClick={handleSelectProgram}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-md text-lg transition-colors duration-200"
        >
          Select This Program
        </button>
      </div>
    </div>
  );
}

export default ProgramTemplateDetails;