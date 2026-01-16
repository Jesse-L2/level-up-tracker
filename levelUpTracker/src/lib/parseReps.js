/**
 * Parses a rep value that may include a "+" suffix (e.g., "8+" meaning "8 or more").
 * Returns an object with the numeric value and a flag indicating if it's an AMRAP (As Many Reps As Possible) set.
 * 
 * @param {string|number} reps - The rep value to parse (e.g., 8, "8", "8+", "12+")
 * @returns {{ value: number, isAMRAP: boolean }} - The parsed rep value and AMRAP flag
 */
export const parseReps = (reps) => {
    if (reps === null || reps === undefined || reps === '') {
        return { value: 0, isAMRAP: false };
    }

    const repsStr = String(reps);
    const isAMRAP = repsStr.includes('+');

    // Remove the "+" and parse as integer
    const numericValue = parseInt(repsStr.replace('+', ''), 10);

    return {
        value: isNaN(numericValue) ? 0 : numericValue,
        isAMRAP
    };
};

/**
 * Checks if a rep value contains a "+" suffix indicating AMRAP.
 * 
 * @param {string|number} reps - The rep value to check
 * @returns {boolean} - True if the rep value is an AMRAP set
 */
export const isAMRAPSet = (reps) => {
    if (reps === null || reps === undefined || reps === '') {
        return false;
    }
    return String(reps).includes('+');
};

/**
 * Gets the numeric value from a rep string, stripping any "+" suffix.
 * 
 * @param {string|number} reps - The rep value to parse
 * @returns {number} - The numeric rep value
 */
export const getNumericReps = (reps) => {
    return parseReps(reps).value;
};
