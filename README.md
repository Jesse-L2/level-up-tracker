# LevelUp Workout Tracker

LevelUp Workout Tracker is a comprehensive web application designed for fitness enthusiasts to create, manage, and track their workout routines. It is built with React, Vite, Tailwind CSS, and powered by Google Firebase.

## Prerequisites

Before you begin, ensure you have the following installed:
- **Node.js** (Version 14.x or later) and **npm**

## Installation

1. Navigate to the project directory:
   ```bash
   cd levelUpTracker
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

## Configuration

1. Create a `.env.local` file in the `levelUpTracker` directory.
2. Add your Firebase configuration keys to the file:

   ```env
   VITE_FIREBASE_API_KEY=your_api_key
   VITE_FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
   VITE_FIREBASE_PROJECT_ID=your_project_id
   VITE_FIREBASE_STORAGE_BUCKET=your_project_id.appspot.com
   VITE_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
   VITE_FIREBASE_APP_ID=your_app_id
   ```

## Running the Application

To start the development server:

```bash
npm run dev
```

The application will be available at `http://localhost:5173` (or the next available port).
