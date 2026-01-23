// Route path constants
export const ROUTES = {
  DASHBOARD: '/',
  SETTINGS: '/settings',
  CREATE_WORKOUT: '/create-workout',
  EXERCISE_LIBRARY: '/exercise-library',
  PLANNER: '/planner',
  CALCULATOR: '/calculator',
  PROGRAM_TEMPLATES: '/templates',
  PROGRAM_TEMPLATE_DETAILS: '/templates/:id',
  HISTORY: '/history',
  LOGIN: '/login',
  SIGNUP: '/signup',
  EDIT_PROGRAM: '/edit-program',
};

// Helper to generate dynamic routes
export const getTemplateDetailsRoute = (id) => `/templates/${id}`;
