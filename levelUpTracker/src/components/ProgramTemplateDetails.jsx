import React, { useState, useEffect } from 'react';

function ProgramTemplateDetails({ id, onBack, onNavigate }) {
  const [program, setProgram] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetch('/program-templates.json')
      .then(response => {
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response.json();
      })
      .then(data => {
        const foundProgram = data.find(p => p.id === id);
        if (foundProgram) {
          setProgram(foundProgram);
        } else {
          setError(new Error("Program not found."));
        }
        setLoading(false);
      })
      .catch(error => {
        console.error("Error fetching program templates:", error);
        setError(error);
        setLoading(false);
      });
  }, [id]);

  const handleCustomize = () => {
    // In a real application, this would navigate to a workout creation/customization page
    // and pre-populate it with the selected program's details.
    // alert(`Customizing ${program.name}! (This is a placeholder for actual customization logic.)`);
    onNavigate('create_workout', { programTemplate: program });
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

  return (
    <div className="container mx-auto p-4 text-white">
      <button
        onClick={onBack}
        className="bg-gray-600 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded-md mb-6 transition-colors duration-200"
      >
        &larr; Back to Programs
      </button>

      <h1 className="text-3xl font-bold mb-4">{program.name}</h1>
      <p className="text-gray-300 mb-6">{program.description}</p>

      <div className="bg-gray-800 rounded-lg shadow-lg p-6 border border-gray-700">
        <div className="mb-4">
          <h2 className="text-xl font-semibold mb-2">Key Lifts:</h2>
          <p className="text-gray-400">{program.lifts.join(', ')}</p>
        </div>
        <div className="mb-4">
          <h2 className="text-xl font-semibold mb-2">Structure:</h2>
          <p className="text-gray-400">{program.structure}</p>
        </div>
        <div className="mb-6">
          <h2 className="text-xl font-semibold mb-2">Notes:</h2>
          <p className="text-gray-400">{program.notes}</p>
        </div>

        <button
          onClick={handleCustomize}
          className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-md text-lg transition-colors duration-200"
        >
          Customize This Program
        </button>
      </div>
    </div>
  );
}

export default ProgramTemplateDetails;