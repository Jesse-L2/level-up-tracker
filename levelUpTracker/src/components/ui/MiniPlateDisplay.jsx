// src/components/ui/MiniPlateDisplay.jsx
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
      className="flex items-center gap-1 mt-1"
      aria-label={`Plates for ${targetWeight} lbs`}
    >
      <span className="text-xs text-gray-400 mr-1">Plates:</span>
      {platesPerSide.map((plate, index) => (
        <div
          key={index}
          className="bg-gray-500 text-white text-xs font-bold rounded-sm flex items-center justify-center"
          style={{ width: "18px", height: "18px" }}
          title={`${plate} lbs`}
        >
          {plate}
        </div>
      ))}
    </div>
  );
};
