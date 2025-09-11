# Partner Workout Feature Implementation Plan

This document outlines the plan to implement a partner workout feature in the LevelUp Tracker application. The goal is to allow two users to work out together, track their progress simultaneously, and easily switch between their workout data.

## 1. Data Model Changes (Firebase)

- **Partner Linking:**
    - In the `users` collection, each user document will have a `partnerId` field. This field will store the UID of the partner user.
    - To establish a connection, an invitation system will be used. A user can send an invitation to another user by email. The invitation will be stored in a new `invitations` collection with a unique token. When the recipient accepts, their `partnerId` will be set to the sender's UID, and vice-versa.

- **Partner Data:**
    - Each user will maintain their own separate `workoutHistory`, `workoutPlan`, and `maxes`.
    - When viewing a partner workout, the application will fetch the data for both the current user and the user specified in `partnerId`.

## 2. UI/UX Changes

- **Partner Toggle:**
    - A prominent toggle switch will be added to the main navigation or header of the application. This will allow the user to switch between their view and their partner's view.
    - When the partner view is active, the app will display the partner's data (e.g., their dashboard, workout plan, and history).

- **Workout Planner (`WorkoutPlanner.jsx`):**
    - The exercise cards in the workout planner will be redesigned to show both the user's and their partner's sets, reps, and weights.
    - A side-by-side or tabbed layout will be used within each exercise card to clearly distinguish between the two users' data.
    - Checkboxes or buttons will be provided for each user to mark their sets as complete. It should be possible to mark sets as complete for both users at the same time.

- **Dashboard (`Dashboard.jsx`):**
    - The dashboard will be updated to display a summary of the partner's recent activity, such as their last workout and any new personal records.

- **Settings (`SettingsPage.jsx`):**
    - A new "Partner" section will be added to the settings page.
    - This section will allow users to:
        - Send an invitation to a partner via email.
        - View pending invitations.
        - Accept or decline invitations.
        - Remove a partner.

## 3. Firebase Integration

- **Security Rules:**
    - Firebase security rules will be updated to allow users to read and write to their partner's workout data.
    - For example, a user will be able to create a new workout session in their partner's `workoutHistory`.

- **Cloud Functions (Optional):**
    - A Cloud Function can be used to handle the invitation process. When a user sends an invitation, the function can create the invitation document in the `invitations` collection and send an email to the recipient.

## 4. Component-Level Implementation Plan

- **`SettingsPage.jsx`:**
    - Add a form to send a partner invitation. The form will take the partner's email as input.
    - Display a list of pending invitations with "Accept" and "Decline" buttons.
    - Add a button to remove the current partner.

- **`Dashboard.jsx`:**
    - If a partner is linked, fetch the partner's data and display a summary of their progress.
    - Add a partner toggle switch to the UI.

- **`WorkoutPlanner.jsx`:**
    - Fetch the partner's workout plan and maxes.
    - Update the exercise cards to display both users' data.
    - Modify the set completion logic to handle both users. When a set is completed, update the `workoutHistory` for the respective user(s).

- **`firebase.js`:**
    - Add new functions to:
        - Send a partner invitation.
        - Accept or decline an invitation.
        - Remove a partner.
        - Fetch a partner's data.
        - Save a workout session for a partner.

## 5. Step-by-Step Implementation Guide

1.  **Implement the data model changes in Firebase.** Add the `partnerId` field to the `users` collection and create the `invitations` collection.
2.  **Create the "Partner" section in the `SettingsPage.jsx` component.** Implement the UI and logic for sending, accepting, and declining invitations.
3.  **Update the Firebase security rules** to allow partner access.
4.  **Add the partner toggle switch to the `Dashboard.jsx` component.**
5.  **Modify the `WorkoutPlanner.jsx` component** to display both users' data and handle set completion for both users.
6.  **Update the `Dashboard.jsx` component** to display a summary of the partner's progress.
7.  **Test the feature thoroughly.**
