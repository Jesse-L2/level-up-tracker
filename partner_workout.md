# Partner Workout Feature Implementation Plan

This document outlines a simplified plan to implement a partner workout feature in the LevelUp Tracker application. The goal is to allow a user to track workouts for a partner without requiring a separate authenticated account for the partner. The partner's data will be stored within the primary user's account.

## 1. Data Model Changes (Firebase)

- **Partner Data:**
  - In the `users` collection, each user document will have a `partner` map field. This field will store the partner's information, such as their name, and their workout data.
  - The `partner` map will contain the following fields:
    - `name`: The partner's name (string).
    - `maxes`: A map of the partner's maxes for different exercises.
    - `workoutHistory`: An array of the partner's completed workouts.
    - `workoutPlan`: The partner's current workout plan. Which should mirror the primary user's workout plan. They should not have 2 separate workout plans, simply different maxes.

## 2. UI/UX Changes

- **Partner Toggle:**

  - A prominent toggle switch will be added to the main navigation or header of the application. This will allow the user to switch between their view and their partner's view and will also be visible and toggleable in the Workout Planner when the user is entering their reps performed.
  - When the partner view is active, the app will display the partner's data from the `partner` map.
  - The partner data will be editable from the Settings page.

- **Workout Planner (`WorkoutPlanner.jsx`):**

  - The exercise cards in the workout planner will be redesigned to show both the user's and their partner's sets, reps, and weights.
  - A side-by-side or tabbed layout will be used within each exercise card to clearly distinguish between the two users' data.
  - Checkboxes or buttons will be provided for each user to mark their sets as complete.

- **Dashboard (`Dashboard.jsx`):**

  - The dashboard will be updated to display a summary of the partner's recent activity when the partner view is active.

- **Settings (`SettingsPage.jsx`):**
  - A new "Partner" section will be added to the settings page.
  - This section will allow users to:
    - Add a partner by entering their name.
    - Edit the partner's name.
    - Remove the partner and all their associated data.

## 3. Firebase Integration

- **Security Rules:**

  - Firebase security rules will be updated to protect the user's document, including the `partner` map in the same way that the `user` map is.

- **`firebase.js`:**
  - The functions in `firebase.js` will be updated to work with the new data model.
  - New functions will be added to:
    - Add or update a partner's name.
    - Remove a partner.
    - Save a workout session for a partner.

## 4. Component-Level Implementation Plan

- **`SettingsPage.jsx`:**

  - Add a form to add or edit a partner's name.
  - Add a button to remove the current partner.

- **`Dashboard.jsx`:**

  - If a partner exists, fetch the partner's data from the user's document and display a summary of their progress.
  - Add a partner toggle switch to the UI.

- **`WorkoutPlanner.jsx`:**

  - Fetch the partner's workout plan and maxes from the user's document.
  - Update the exercise cards to display both users' data.
  - Modify the set completion logic to handle both users. When a set is completed, update the `workoutHistory` for the respective user(s) within the same user document.

- **`firebase.js`:**
  - Add new functions to manage the partner data within the user's document.

## 5. Step-by-Step Implementation Guide

1.  **Update the `partner_workout.md` file** to reflect the simplified architecture.
2.  **Modify the `firebase.js` file** for managing partner data.
3.  **Update the Firebase security rules** to protect the user's document (if necessary, otherwise ignore)
4.  **Update the `SettingsPage.jsx` component** to allow adding, editing, and removing a partner.
5.  **Add the partner toggle switch to the `Dashboard.jsx` component.**
6.  **Modify the `WorkoutPlanner.jsx` component** to display both users' data from the same user document.
7.  **Update the `Dashboard.jsx` component** to display a summary of the partner's progress.
8.  **Test the feature thoroughly.**

NEXT: On the workout planner, change it so that only the primary user's data shows by default and the partner's data only appears directly next to it when the button to toggle a partner is selected.
