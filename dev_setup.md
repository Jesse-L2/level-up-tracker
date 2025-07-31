LevelUp Tracker: Developer Setup Guide

This guide provides detailed, step-by-step instructions for setting up the development environment for the LevelUp Tracker application. It covers everything from initializing the React project to configuring Firebase and all necessary dependencies.
Part 1: Prerequisites

Before you begin, ensure you have the following software installed on your system:

    Node.js: (Version 14.x or later) and npm (Node Package Manager). You can download them from nodejs.org.

    A code editor: Visual Studio Code is highly recommended.

    A Google Account: Required to create a Firebase project.

Part 2: Project Initialization and Setup

This section will guide you through creating the React application and installing its core dependencies.

    Create a New React App:
    Open your terminal or command prompt and run the following command to create a new React project named levelup-tracker.

    npx create-react-app levelup-tracker
    cd levelup-tracker

    Install Tailwind CSS:
    We will use Tailwind CSS for styling. Follow these steps to install it and configure it for your project.

    # Install Tailwind CSS and its peer dependencies
    npm install -D tailwindcss postcss autoprefixer

    # Generate your tailwind.config.js and postcss.config.js files
    npx tailwindcss init -p

    Next, configure your template paths by modifying the tailwind.config.js file.

    // tailwind.config.js
    /** @type {import('tailwindcss').Config} */
    module.exports = {
      content: [
        "./src/**/*.{js,jsx,ts,tsx}",
      ],
      theme: {
        extend: {},
      },
      plugins: [],
    }

    Finally, add the Tailwind directives to your main CSS file, ./src/index.css.

    /* ./src/index.css */
    @tailwind base;
    @tailwind components;
    @tailwind utilities;

    Install Additional Libraries:
    LevelUp Tracker uses several other libraries for charts, icons, and Firebase integration. Install them with the following command:

    npm install firebase recharts lucide-react

Part 3: Firebase Backend Setup

This application uses Google Firebase for its database and user authentication.

    Create a Firebase Project:

        Go to the Firebase Console.

        Click "Add project" and give it a name (e.g., "LevelUpTrackerDev").

        Follow the on-screen steps to create the project. You can disable Google Analytics for this simple project if you wish.

    Create a Web App in Firebase:

        Inside your new project's dashboard, click the web icon (</>) to add a web app.

        Give your app a nickname (e.g., "LevelUp Tracker Web") and click "Register app".

        Firebase will present you with a firebaseConfig object. Copy this object. We'll need it in the next step.

    Set Up Firestore Database:

        In the Firebase console's left-hand menu, go to Build > Firestore Database.

        Click "Create database".

        Start in test mode. This allows open read/write access during development.

        Choose a location for your database.

    Set Up Authentication:

        In the left-hand menu, go to Build > Authentication.

        Click "Get started".

        On the Sign-in method tab, select "Anonymous" and enable it. This allows users to use the app without creating an account.

Part 4: Integrating Code and Running the App

    Add Firebase Config to Your Project:
    It's best practice to store configuration variables in environment files. Create a new file in the root of your project named .env.local.

    # .env.local
    REACT_APP_FIREBASE_API_KEY="YOUR_API_KEY"
    REACT_APP_FIREBASE_AUTH_DOMAIN="YOUR_AUTH_DOMAIN"
    REACT_APP_FIREBASE_PROJECT_ID="YOUR_PROJECT_ID"
    REACT_APP_FIREBASE_STORAGE_BUCKET="YOUR_STORAGE_BUCKET"
    REACT_APP_FIREBASE_MESSAGING_SENDER_ID="YOUR_MESSAGING_SENDER_ID"
    REACT_APP_FIREBASE_APP_ID="YOUR_APP_ID"

    Replace the placeholder values with the keys from the firebaseConfig object you copied earlier.

    Replace the Application Code:

        Open the src/App.js file in your project.

        Delete all the existing code in that file.

        Copy the entire React code from the LevelUp Tracker application provided to you and paste it into src/App.js.

    Update Firebase Configuration in App.js:
    Find the firebaseConfig object at the top of the App.js file. Modify it to use the environment variables you just set up.

    // src/App.js

    // Replace the hardcoded config object with this:
    const firebaseConfig = {
      apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
      authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
      projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID,
      storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET,
      messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID,
      appId: process.env.REACT_APP_FIREBASE_APP_ID
    };

    Run the Application:
    You're all set! Go back to your terminal and start the development server.

    npm start

    Your browser should open to http://localhost:3000, and you should see the LevelUp Tracker application running, fully connected to your new Firebase backend.
