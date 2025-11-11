# Project Description: LevelUp Workout Tracker

## 1. Overview

LevelUp Workout Tracker is a comprehensive web application designed for fitness enthusiasts to create, manage, and track their workout routines. It provides a personalized experience by generating workout plans based on individual goals, experience levels, and available equipment. The application is built using a modern web stack, with a React frontend and a Firebase backend, ensuring a responsive and real-time user experience.

## 2. Core Features

The application boasts a rich set of features aimed at supporting a user's entire fitness journey:

*   **User Authentication:** Supports both anonymous access for new users and standard email/password signup and login.
*   **Personalized Dashboard:** The central hub that displays the user's current workout plan, progress charts (tracking volume over time), and quick access to all tools.
*   **Workout Generator:** Dynamically creates tailored workout plans. Users can specify:
    *   **Fitness Goal:** Strength, Hypertrophy, or Endurance.
    *   **Fitness Level:** Beginner, Intermediate, or Advanced.
    *   **Available Equipment:** Ensures workouts only include exercises the user can perform.
    *   **Workout Split:** Days per week and training style (e.g., Full Body, Push/Pull/Legs).
*   **Program Templates:** Users can browse and adopt pre-defined, structured workout programs.
*   **Interactive Workout Planner:** A step-by-step "player" interface to guide users through their daily workout. It allows for:
    *   Completing sets and reps.
    *   Editing weight/reps on the fly.
    *   Providing feedback ("Too Easy", "Just Right", "Too Hard") which automatically adjusts weights for future workouts (Progressive Overload).
*   **Exercise Library:** A repository of exercises where users can manage and track their one-rep max (1RM) for different lifts. This 1RM data is used to calculate working weights.
*   **Custom Workout Creation:** Flexibility for users to build their own workout days from scratch.
*   **Plate Calculator:** A utility tool that calculates the exact combination of weight plates needed to load a barbell to a specific target weight, based on the user's available plates.
*   **Settings Management:** A dedicated page for users to configure their profile, fitness goals, and manage their inventory of available gym equipment and weight plates.
*   **Partner Training:** Includes functionality to track and update workout data for a training partner, recalculating their weights based on their own 1RM.
*   **Workout History:** Logs all completed workouts for users to review their past performance.

## 3. Technical Architecture

The project is built with a modern JavaScript technology stack:

*   **Frontend:**
    *   **Framework:** React (using functional components, hooks, and Context API for state management).
    *   **Build Tool:** Vite for fast development and optimized builds.
    *   **Styling:** Tailwind CSS for a utility-first CSS workflow.
    *   **Data Visualization:** `recharts` for rendering progress charts.
    *   **Icons:** `lucide-react` for a clean and consistent icon set.

*   **Backend (Serverless):**
    *   **Platform:** Google Firebase.
    *   **Database:** Firestore (a NoSQL document database) is used to store all user data, including profiles, workout plans, exercise libraries, and history.
    *   **Authentication:** Firebase Authentication for managing user sign-up, login, and anonymous sessions.
    *   **Server-side Logic:** Firebase Cloud Functions are used for backend operations (directory structure is in place).

## 4. Project Structure

The repository is organized into two main parts:

*   **Root Directory:** Contains high-level project documentation (`README.md`, setup guides), configuration files (`package.json`), and the main application folder.
*   **`levelUpTracker/` Directory:** This is the core of the project, containing the entire Vite/React application.
    *   `src/`: The source code for the React application, with a standard component-based architecture.
    *   `public/`: Static assets, including JSON files for program templates and default data.
    *   `functions/`: A directory for Firebase Cloud Functions.
    *   Firebase configuration files (`firebase.json`, `firestore.rules`, etc.).
