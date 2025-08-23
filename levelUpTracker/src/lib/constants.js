// --- Constants and Mock Data ---
export const EXERCISE_DATABASE = {
  chest: [
    { name: "Bench Press", type: "barbell", requires: ["barbell", "bench"] },
    {
      name: "Dumbbell Press",
      type: "dumbbell",
      requires: ["dumbbell", "bench"],
    },
    { name: "Push-ups", type: "bodyweight", requires: [] },
    {
      name: "Incline Bench Press",
      type: "barbell",
      requires: ["barbell", "incline_bench"],
    },
    { name: "Cable Flys", type: "cable", requires: ["cable_machine"] },
  ],
  back: [
    { name: "Deadlift", type: "barbell", requires: ["barbell"] },
    { name: "Pull-ups", type: "bodyweight", requires: ["pull_up_bar"] },
    { name: "Bent-over Rows", type: "barbell", requires: ["barbell"] },
    {
      name: "Dumbbell Rows",
      type: "dumbbell",
      requires: ["dumbbell", "bench"],
    },
    { name: "Lat Pulldowns", type: "cable", requires: ["cable_machine"] },
  ],
  legs: [
    { name: "Squat", type: "barbell", requires: ["barbell", "squat_rack"] },
    { name: "Leg Press", type: "machine", requires: ["leg_press_machine"] },
    { name: "Lunges", type: "dumbbell", requires: ["dumbbell"] },
    { name: "Leg Curls", type: "machine", requires: ["leg_curl_machine"] },
    { name: "Sumo Deadlift", type: "barbell", requires: ["barbell"] },
    { name: "Calf Raises", type: "barbell", requires: [] },
  ],
  shoulders: [
    { name: "Overhead Press", type: "barbell", requires: ["barbell"] },
    { name: "Lateral Raises", type: "dumbbell", requires: ["dumbbell"] },
    { name: "Face Pulls", type: "cable", requires: ["cable_machine"] },
    { name: "Arnold Press", type: "dumbbell", requires: ["dumbbell", "bench"] },
  ],
  arms: [
    { name: "Bicep Curls", type: "dumbbell", requires: ["dumbbell"] },
    { name: "Tricep Dips", type: "bodyweight", requires: ["bench"] },
    { name: "Hammer Curls", type: "dumbbell", requires: ["dumbbell"] },
    { name: "Tricep Pushdowns", type: "cable", requires: ["cable_machine"] },
  ],
};

export const ALL_EQUIPMENT = [
  { id: "barbell", name: "Barbell" },
  { id: "dumbbell", name: "Dumbbells" },
  { id: "bench", name: "Flat Bench" },
  { id: "incline_bench", name: "Incline Bench" },
  { id: "squat_rack", name: "Squat Rack" },
  { id: "pull_up_bar", name: "Pull-up Bar" },
  { id: "cable_machine", name: "Cable Machine" },
  { id: "leg_press_machine", name: "Leg Press Machine" },
  { id: "leg_curl_machine", name: "Leg Curl Machine" },
];
