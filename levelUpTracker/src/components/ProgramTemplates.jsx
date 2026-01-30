import React, { useState, useEffect } from 'react';

function ProgramTemplates({ onNavigate, userProfile }) {
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
    return <div className="text-theme-primary text-center mt-8">Loading program templates...</div>;
  }

  if (error) {
    return <div className="text-red-500 text-center mt-8">Error: {error.message}</div>;
  }

  // Merge custom templates
  const customTemplates = userProfile?.customTemplates || {};
  const allPrograms = { ...customTemplates, ...programs };

  // Separate custom and standard programs for display if desired, or just map all
  // For now, straightforward mapping of allPrograms

  return (
    <div className="container mx-auto p-4">
      <div className="flex flex-col sm:flex-row items-center justify-between mb-6 sm:mb-8 gap-4 sm:gap-0">
        <h1 className="text-3xl sm:text-4xl font-bold text-center sm:text-left text-theme-primary">Program Templates</h1>
        <button
          onClick={() => onNavigate('dashboard')}
          className="btn-modern font-bold py-2 px-4 rounded-lg mb-0 text-theme-primary w-full sm:w-auto"
        >
          Back to Dashboard
        </button>
      </div>
      <p className="text-theme-secondary mb-8">Explore popular workout programs and customize them to fit your goals.</p>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {Object.values(allPrograms).map(program => (
          <div key={program.id} className="card-physical rounded-lg p-6 hover:border-[color:var(--btn-primary-bg)] transition-all duration-200">
            <div className="flex flex-col items-center md:flex-row md:justify-between md:items-start mb-2 gap-2 md:gap-0">
              <h2 className="text-xl font-semibold text-theme-primary text-center md:text-left">{program.name}</h2>
              {program.structure === 'Custom' && <span className="bg-purple-600 text-xs text-white px-2 py-1 rounded-full">Custom</span>}
            </div>
            <p className="text-theme-secondary mb-4 text-sm text-center md:text-left">{program.description}</p>
            <div className="flex justify-center md:justify-start w-full">
              <button
                onClick={() => onNavigate('program_template_details', null, program.id)}
                className="inline-block btn-modern btn-modern-primary text-white font-bold py-2 px-4 rounded-md w-full md:w-auto"
              >
                View Details
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default ProgramTemplates;
