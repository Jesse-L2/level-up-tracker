import React, { useMemo } from "react";

export const MiniPlateDisplay = ({
  targetWeight,
  availablePlates,
  barbellWeight = 45,
}) => {
  const platesPerSide = useMemo(() => {
    if (targetWeight <= barbellWeight || !availablePlates) {
      return [];
    }

    let weightNeededPerSide = (targetWeight - barbellWeight) / 2;
    if (weightNeededPerSide <= 0) return [];

    const platesForOneSide = [];
    const platesWorkingPool = availablePlates
      .map((p) => ({ weight: p.weight, count: Math.floor(p.count / 2) }))
      .sort((a, b) => b.weight - a.weight);

    for (const plateType of platesWorkingPool) {
      while (weightNeededPerSide >= plateType.weight && plateType.count > 0) {
        platesForOneSide.push(plateType.weight);
        weightNeededPerSide -= plateType.weight;
        plateType.count--;
      }
    }
    return platesForOneSide.sort((a, b) => b - a); // Sort heaviest to lightest for display
  }, [targetWeight, availablePlates, barbellWeight]);

  if (platesPerSide.length === 0) {
    return null; // Don't render anything if no plates are needed
  }

  return (
    <div
      className="flex items-center gap-1 mt-2"
      aria-label={`Plates for ${targetWeight} lbs`}
    >
      <div className="h-1 bg-gray-500 rounded-l-sm" style={{ width: '1rem' }}></div>
      <div className="h-4 w-0.5 bg-gray-500"></div>
      {platesPerSide.map((plate, index) => (
        <div
          key={index}
          className="bg-blue-500 text-white text-xs font-bold rounded-sm flex items-center justify-center"
          style={{ 
            height: `${24 + plate * 0.6}px`,
            width: '1.5rem'
          }}
          title={`${plate} lbs`}
        >
          <span className="text-xs">{plate}</span>
        </div>
      ))}
    </div>
  );
};
