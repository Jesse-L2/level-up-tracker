// This table maps the number of reps to a corresponding percentage of 1 Rep Max.
// It's based on common strength training principles (e.g., Prilepin's Chart).
export const REP_SCHEME_TABLE = {
  1: 1.0,
  2: 0.95,
  3: 0.9,
  4: 0.88,
  5: 0.86,
  6: 0.85,
  7: 0.83,
  8: 0.8,
  9: 0.78,
  10: 0.75,
  11: 0.72,
  12: 0.7,
  16: 0.65,
  20: 0.6,
  25: 0.55,
  30: 0.5,
};

// A helper function to get the percentage for a given number of reps.
export const getPercentageForReps = (reps) => {
  const repsAsNum = parseInt(reps, 10);
  if (repsAsNum > 12) return REP_SCHEME_TABLE[12];
  return REP_SCHEME_TABLE[repsAsNum] || 0.75; // Default to 75% if not found
};
