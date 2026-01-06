import React, { useState, useEffect } from 'react';

function ProgramTemplateDetails({ id, onBack, onNavigate, onSelectProgram }) {
  const [program, setProgram] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Set page title
  useEffect(() => {
    document.title = "Level Up Tracker - Program Details";
    return () => {
      document.title = "Level Up Tracker";
    };
  }, []);

  useEffect(() => {
    fetch('/program-templates.json')
      .then(response => {
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response.json();
      })
      .then(data => {
        const foundProgram = data.programs[id];
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

  const handleSelectProgram = () => {
    onSelectProgram(program);
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
          <h2 className="text-xl font-semibold mb-2">Structure:</h2>
          <p className="text-gray-400">{program.structure}</p>
        </div>

        <button
          onClick={handleSelectProgram}
          className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-md text-lg transition-colors duration-200"
        >
          Select This Program
        </button>
      </div>
    </div>
  );
}

export default ProgramTemplateDetails;