import React from 'react';

// Default standard plates
const STANDARD_PLATES = [
    { weight: 45, count: 10 },
    { weight: 35, count: 10 },
    { weight: 25, count: 10 },
    { weight: 10, count: 10 },
    { weight: 5, count: 10 },
    { weight: 2.5, count: 10 },
];

export const PlateVisualizer = ({ weight, barbellWeight = 45 }) => {
    if (!weight || weight <= barbellWeight) return null;

    const weightNeededPerSide = (weight - barbellWeight) / 2;
    const platesForOneSide = [];
    let currentWeightOnSide = 0;

    // Clone plates to track usage (simple greedy approach)
    // We assume infinite or large enough supply for valid sets usually
    const platesWorkingPool = STANDARD_PLATES
        .map((p) => ({ weight: p.weight, count: 50 })) // increased count
        .sort((a, b) => b.weight - a.weight);

    for (let i = 0; i < platesWorkingPool.length; i++) {
        const plateType = platesWorkingPool[i];
        // Allow for tiny float errors
        while (
            currentWeightOnSide + plateType.weight <= weightNeededPerSide + 0.001
        ) {
            platesForOneSide.push(plateType.weight);
            currentWeightOnSide += plateType.weight;
        }
    }

    if (platesForOneSide.length === 0) return null;

    return (
        <div className="flex items-center gap-1 mt-1 justify-end">
            <div className="h-6 w-1 bg-gray-500 rounded-sm"></div>
            {platesForOneSide.map((plateWeight, index) => (
                <div
                    key={`plate-${index}`}
                    className="bg-blue-500 text-white flex items-center justify-center font-bold rounded-sm text-xs"
                    style={{
                        height: `${Math.min(30, 15 + plateWeight * 0.4)}px`,
                        width: "18px",
                    }}
                    title={`${plateWeight} lbs`}
                >
                    {plateWeight}
                </div>
            ))}
        </div>
    );
};
