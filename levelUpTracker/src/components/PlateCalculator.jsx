import React, { useState, useCallback, useEffect } from "react";
import { FormField } from "./ui/FormField";
import { Weight } from "lucide-react";

export const PlateCalculator = ({ availablePlates, onBack }) => {
  const [targetWeight, setTargetWeight] = useState("");
  const [barbellWeight, setBarbellWeight] = useState(45);
  const [calculation, setCalculation] = useState(null);
  const [message, setMessage] = useState(null);
  const [plates, setPlates] = useState(availablePlates);

  // Set page title
  useEffect(() => {
    document.title = "Level Up Tracker - Plate Calculator";
    return () => {
      document.title = "Level Up Tracker";
    };
  }, []);

  useEffect(() => {
    const fetchPlateData = async () => {
      try {
        const response = await fetch("/plate-data.json");
        const data = await response.json();
        const formattedPlates = data.map((p) => ({
          weight: p.weight,
          count: p.quantity,
        }));
        setPlates(formattedPlates);
      } catch (error) {
        console.error("Failed to fetch plate data:", error);
      }
    };

    if (!availablePlates || availablePlates.length === 0) {
      fetchPlateData();
    } else {
      setPlates(availablePlates);
    }
  }, [availablePlates]);

  const calculatePlates = useCallback(() => {
    const target = parseFloat(targetWeight);
    const barbell = parseFloat(barbellWeight);

    if (isNaN(target) || target <= 0) {
      setMessage("Please enter a valid positive target weight.");
      setCalculation(null);
      return;
    }
    if (isNaN(barbell) || barbell < 0) {
      setMessage("Please enter a valid positive barbell weight.");
      setCalculation(null);
      return;
    }
    if (target < barbell) {
      setMessage(
        `Target weight (${target} lbs) cannot be less than barbell weight (${barbell} lbs).`
      );
      setCalculation(null);
      return;
    }

    setMessage(null);
    let weightNeededPerSide = (target - barbell) / 2;
    const platesForOneSide = [];
    let currentWeightOnSide = 0;

    const platesWorkingPool = plates
      .map((p) => ({ weight: p.weight, count: Math.floor(p.count / 2) }))
      .sort((a, b) => b.weight - a.weight);

    for (let i = 0; i < platesWorkingPool.length; i++) {
      const plateType = platesWorkingPool[i];
      while (
        currentWeightOnSide + plateType.weight <= weightNeededPerSide + 0.001 &&
        plateType.count > 0
      ) {
        platesForOneSide.push(plateType.weight);
        currentWeightOnSide += plateType.weight;
        plateType.count--;
      }
    }

    const achievedTotalWeight = barbell + currentWeightOnSide * 2;
    const difference = target - achievedTotalWeight;

    if (Math.abs(difference) > 0.1) {
      setCalculation({
        platesPerSide: platesForOneSide,
        message: `Could not reach exact weight. Closest achievable: ${achievedTotalWeight.toFixed(
          1
        )} lbs.`,
        remaining: difference.toFixed(2),
        totalAchieved: achievedTotalWeight,
      });
    } else {
      setCalculation({
        platesPerSide: platesForOneSide,
        message: "Success! Load these plates on each side.",
        totalAchieved: achievedTotalWeight,
      });
    }
  }, [targetWeight, barbellWeight, plates]);

  return (
    <div className="p-4 md:p-8 text-theme-primary animate-fade-in">
      <div className="max-w-2xl mx-auto card-physical p-6 rounded-2xl">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <Weight size={32} className="text-theme-primary" /> Plate Calculator
          </h1>
          <button
            onClick={onBack}
            className="btn-modern font-bold py-2 px-4 rounded-lg text-theme-primary"
          >
            Back
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <FormField
            label="Target Weight (lbs)"
            id="targetWeight"
            type="number"
            value={targetWeight}
            onChange={(e) => setTargetWeight(e.target.value)}
            placeholder="e.g., 225"
          />
          <FormField
            label="Barbell Weight (lbs)"
            id="barbellWeight"
            type="number"
            value={barbellWeight}
            onChange={(e) => setBarbellWeight(e.target.value)}
          />
        </div>

        <button
          onClick={calculatePlates}
          className="w-full btn-modern btn-modern-primary text-white font-bold py-3 rounded-lg transition-colors mb-6"
        >
          Calculate
        </button>

        {message && <p className="text-red-400 text-center mb-4">{message}</p>}

        {calculation && (
          <div className="card-inner p-6 rounded-lg animate-fade-in">
            <h2 className="text-xl font-semibold mb-4 text-center">
              {calculation.message}
            </h2>
            {calculation.platesPerSide.length > 0 && (
              <div className="flex items-center justify-center space-x-0.5 sm:space-x-1 bg-theme-input p-2 sm:p-4 rounded-lg overflow-x-auto">
                <div
                  className="hidden sm:block h-2 bg-gray-400 rounded-l-lg flex-shrink-0 w-8 sm:w-12"
                ></div>
                <div className="hidden sm:block h-6 sm:h-8 w-1 bg-gray-400 flex-shrink-0"></div>
                {calculation.platesPerSide
                  .slice()
                  .reverse()
                  .map((plateWeight, index) => (
                    <div
                      key={`plate-${index}-${plateWeight}`}
                      className="hidden sm:flex bg-blue-500 text-white items-center justify-center font-bold rounded-sm text-[8px] sm:text-sm flex-shrink-0 w-3 sm:w-5"
                      style={{
                        height: `${Math.min(90, 40 + plateWeight * 1.5)}px`,
                      }}
                      title={`${plateWeight} lbs`}
                      aria-label={`${plateWeight} pound plate`}
                    >
                      {plateWeight}
                    </div>
                  ))}
                <div
                  className="flex-grow h-2 bg-gray-400 flex-shrink-0 min-w-[1rem] sm:min-w-[1.5rem] rounded-l-lg sm:rounded-none"
                ></div>

                {calculation.platesPerSide.map((plateWeight, index) => (
                  <div
                    key={`mirror-${index}-${plateWeight}`}
                    className="bg-blue-500 text-white flex items-center justify-center font-bold rounded-sm text-[8px] sm:text-sm flex-shrink-0 w-3 sm:w-5"
                    style={{
                      height: `${Math.min(90, 40 + plateWeight * 1.5)}px`,
                    }}
                    title={`${plateWeight} lbs`}
                    aria-label={`${plateWeight} pound plate`}
                  >
                    {plateWeight}
                  </div>
                ))}
                <div className="h-6 sm:h-8 w-1 bg-gray-400 flex-shrink-0"></div>
                <div
                  className="h-2 bg-gray-400 rounded-r-lg flex-shrink-0 w-8 sm:w-[50px]"
                ></div>
              </div>
            )}
            {calculation.totalAchieved && (
              <p className="text-center mt-4 text-theme-secondary">
                Total Weight: {calculation.totalAchieved.toFixed(1)} lbs
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
