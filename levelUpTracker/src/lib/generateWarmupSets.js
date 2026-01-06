/**
 * Generates warm-up sets based on the first working set's weight.
 * Following a common warm-up progression:
 * - Set 1: Bar only (45 lbs) x 10 reps
 * - Set 2: 50% of working weight x 5 reps
 * - Set 3: 70% of working weight x 3 reps
 * - Set 4: 85% of working weight x 1 rep
 * 
 * @param {number} workingWeight - The weight of the first working set
 * @param {number} barWeight - The weight of the barbell (default 45 lbs)
 * @returns {Array} Array of warm-up set objects
 */
export function generateWarmupSets(workingWeight, barWeight = 45) {
    if (workingWeight <= barWeight) {
        // If working weight is at or below bar weight, just return bar-only warm-up
        return [
            { reps: 10, weight: barWeight, isWarmup: true, percentage: 0 },
        ];
    }

    const warmupSets = [];

    // Set 1: Bar only
    warmupSets.push({
        reps: 10,
        weight: barWeight,
        isWarmup: true,
        percentage: 0,
        label: "Bar Only",
    });

    // Set 2: 50% of working weight (but at least bar weight)
    const fiftyPercent = Math.max(
        barWeight,
        Math.round((workingWeight * 0.5) / 2.5) * 2.5
    );
    if (fiftyPercent > barWeight) {
        warmupSets.push({
            reps: 5,
            weight: fiftyPercent,
            isWarmup: true,
            percentage: 0.5,
            label: "50%",
        });
    }

    // Set 3: 70% of working weight
    const seventyPercent = Math.max(
        barWeight,
        Math.round((workingWeight * 0.7) / 2.5) * 2.5
    );
    if (seventyPercent > fiftyPercent) {
        warmupSets.push({
            reps: 3,
            weight: seventyPercent,
            isWarmup: true,
            percentage: 0.7,
            label: "70%",
        });
    }

    // Set 4: 85% of working weight
    const eightyFivePercent = Math.max(
        barWeight,
        Math.round((workingWeight * 0.85) / 2.5) * 2.5
    );
    if (eightyFivePercent > seventyPercent && workingWeight >= 100) {
        warmupSets.push({
            reps: 1,
            weight: eightyFivePercent,
            isWarmup: true,
            percentage: 0.85,
            label: "85%",
        });
    }

    return warmupSets;
}

/**
 * Checks if a workout day's first exercise would benefit from warm-up sets
 * (i.e., is a barbell exercise with significant weight)
 * 
 * @param {Object} exercise - The exercise object
 * @returns {boolean} Whether warm-up sets should be suggested
 */
export function shouldSuggestWarmup(exercise) {
    if (!exercise || !exercise.sets || exercise.sets.length === 0) {
        return false;
    }

    const firstSetWeight = exercise.sets[0]?.weight || 0;
    const exerciseType = exercise.type?.toLowerCase();

    // Only suggest warm-ups for barbell exercises with significant weight
    return (
        (exerciseType === "barbell" || exerciseType === "weighted") &&
        firstSetWeight >= 65
    );
}
