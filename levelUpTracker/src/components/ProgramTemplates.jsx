import React, { useState, useEffect } from 'react';

function ProgramTemplates({ onNavigate }) {
  const [programs, setPrograms] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Set page title
  useEffect(() => {
    document.title = "Level Up Tracker - Program Templates";
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
        setPrograms(data.programs);
        setLoading(false);
      })
      .catch(error => {
        console.error("Error fetching program templates:", error);
        setError(error);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return <div className="text-white text-center mt-8">Loading program templates...</div>;
  }

  if (error) {
    return <div className="text-red-500 text-center mt-8">Error: {error.message}</div>;
  }

  return (
    <div className="container mx-auto p-4">
      <button
        onClick={() => onNavigate('dashboard')}
        className="bg-gray-600 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded-md mb-6 transition-colors duration-200"
      >
        &larr; Back to Dashboard
      </button>
      <h1 className="text-3xl font-bold text-white mb-6">Program Templates</h1>
      <p className="text-gray-300 mb-8">Explore popular workout programs and customize them to fit your goals.</p>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {Object.values(programs).map(program => (
          <div key={program.id} className="bg-gray-800 rounded-lg shadow-lg p-6 border border-gray-700 hover:border-blue-500 transition-all duration-200">
            <h2 className="text-xl font-semibold text-white mb-2">{program.name}</h2>
            <p className="text-gray-400 mb-4 text-sm">{program.description}</p>
            <button
              onClick={() => onNavigate('program_template_details', null, program.id)}
              className="inline-block bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-md transition-colors duration-200"
            >
              View Details
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

export default ProgramTemplates;
