import React, { useState, useMemo, useEffect } from 'react';
import { createUserWithEmailAndPassword, signInWithPopup, updateProfile } from 'firebase/auth';
import { auth, googleProvider, isMobileDevice, signInWithRedirect, getRedirectResult } from '../firebase.js';
import { Check, X } from 'lucide-react';

// Password validation requirements
const PASSWORD_REQUIREMENTS = [
  { id: 'length', label: 'At least 8 characters', test: (p) => p.length >= 8 },
  { id: 'uppercase', label: 'One uppercase letter', test: (p) => /[A-Z]/.test(p) },
  { id: 'lowercase', label: 'One lowercase letter', test: (p) => /[a-z]/.test(p) },
  { id: 'number', label: 'One number', test: (p) => /[0-9]/.test(p) },
  { id: 'special', label: 'One special character (!@#$%^&*)', test: (p) => /[!@#$%^&*(),.?":{}|<>]/.test(p) },
];

// Helper to map Firebase error codes to user-friendly messages
const getErrorMessage = (errorCode) => {
  const errorMessages = {
    'auth/email-already-in-use': 'An account with this email already exists.',
    'auth/invalid-email': 'Please enter a valid email address.',
    'auth/operation-not-allowed': 'This sign-up method is not enabled.',
    'auth/weak-password': 'Password is too weak. Please choose a stronger password.',
    'auth/popup-closed-by-user': 'Sign-up cancelled.',
    'auth/cancelled-popup-request': 'Sign-up cancelled.',
    'auth/account-exists-with-different-credential':
      'An account already exists with this email using a different sign-in method.',
    'auth/network-request-failed': 'Network error. Please check your connection.',
  };
  return errorMessages[errorCode] || 'An error occurred. Please try again.';
};

export const Signup = ({ onSwitchToLogin }) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  // Handle redirect result on component mount (for mobile auth flow)
  // Only run in main window, not in popup windows to prevent auth loops
  useEffect(() => {
    // Skip if this is a popup window (opener is set)
    if (window.opener) {
      return;
    }

    const handleRedirectResult = async () => {
      try {
        const result = await getRedirectResult(auth);
        if (result) {
          // User successfully signed up via redirect
          // The auth state listener in App.jsx will handle the navigation
        }
      } catch (error) {
        if (error.code !== 'auth/popup-closed-by-user' && error.code !== 'auth/cancelled-popup-request') {
          setError(getErrorMessage(error.code));
        }
      }
    };
    handleRedirectResult();
  }, []);

  const passwordValidation = useMemo(() => {
    return PASSWORD_REQUIREMENTS.map((req) => ({
      ...req,
      passed: req.test(password),
    }));
  }, [password]);

  const isPasswordValid = passwordValidation.every((req) => req.passed);
  const passwordsMatch = password === confirmPassword && confirmPassword.length > 0;
  const isNameValid = name.trim().length >= 2;

  const handleSignup = async (e) => {
    e.preventDefault();
    setError(null);

    if (!isNameValid) {
      setError('Please enter your name (at least 2 characters).');
      return;
    }

    if (!isPasswordValid) {
      setError('Password does not meet all requirements.');
      return;
    }

    if (!passwordsMatch) {
      setError('Passwords do not match.');
      return;
    }

    setIsLoading(true);
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      // Set the display name on the Firebase Auth user
      await updateProfile(userCredential.user, { displayName: name.trim() });
    } catch (error) {
      setError(getErrorMessage(error.code));
    } finally {
      setIsLoading(false);
    }
  };

  const handleSocialSignup = async (provider) => {
    setError(null);
    setIsLoading(true);
    try {
      if (isMobileDevice()) {
        // Use redirect-based flow for mobile browsers
        // Note: signInWithRedirect will navigate away, so loading state persists
        await signInWithRedirect(auth, provider);
      } else {
        // Use popup-based flow for desktop browsers
        await signInWithPopup(auth, provider);
      }
    } catch (error) {
      if (error.code !== 'auth/popup-closed-by-user' && error.code !== 'auth/cancelled-popup-request') {
        setError(getErrorMessage(error.code));
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center text-white px-4 py-8">
      <div className="card-physical p-8 rounded-2xl w-full max-w-md">
        <h2 className="text-3xl font-bold text-center mb-8 bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
          Create Account
        </h2>
        {error && (
          <div className="bg-red-500/10 border border-red-500/50 text-red-400 px-4 py-3 rounded-lg mb-6 text-sm text-center">
            {error}
          </div>
        )}

        {/* Social Signup Buttons */}
        <div className="space-y-3 mb-6">
          <button
            type="button"
            onClick={() => handleSocialSignup(googleProvider)}
            disabled={isLoading}
            className="w-full py-3 px-4 bg-white hover:bg-gray-100 text-gray-800 rounded-xl font-semibold transition-all duration-200 flex items-center justify-center gap-3 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              />
            </svg>
            Continue with Google
          </button>
        </div>

        {/* Divider */}
        <div className="relative mb-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-600"></div>
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-4 bg-gray-800 text-gray-400">or sign up with email</span>
          </div>
        </div>

        {/* Email/Password Form */}
        <form onSubmit={handleSignup} className="space-y-5">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-300 mb-1">
              Name
            </label>
            <input
              type="text"
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              disabled={isLoading}
              className={`w-full p-3 bg-gray-700/50 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all disabled:opacity-50 ${name.length > 0
                ? isNameValid
                  ? 'border-green-500'
                  : 'border-red-500'
                : 'border-gray-600'
                }`}
              placeholder="Your name"
            />
            {name.length > 0 && !isNameValid && (
              <p className="text-red-400 text-sm mt-2 flex items-center gap-1">
                <X size={14} />
                Name must be at least 2 characters
              </p>
            )}
          </div>
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-1">
              Email
            </label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={isLoading}
              className="w-full p-3 bg-gray-700/50 border border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all disabled:opacity-50"
              placeholder="you@example.com"
            />
          </div>
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-300 mb-1">
              Password
            </label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              disabled={isLoading}
              className="w-full p-3 bg-gray-700/50 border border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all disabled:opacity-50"
              placeholder="••••••••"
            />
            {/* Password requirements checklist */}
            {password.length > 0 && (
              <ul className="mt-3 space-y-1.5 text-sm">
                {passwordValidation.map((req) => (
                  <li key={req.id} className="flex items-center gap-2">
                    {req.passed ? (
                      <Check size={14} className="text-green-500 flex-shrink-0" />
                    ) : (
                      <X size={14} className="text-gray-500 flex-shrink-0" />
                    )}
                    <span className={req.passed ? 'text-green-400' : 'text-gray-500'}>
                      {req.label}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>
          <div>
            <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-300 mb-1">
              Confirm Password
            </label>
            <input
              type="password"
              id="confirmPassword"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              disabled={isLoading}
              className={`w-full p-3 bg-gray-700/50 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all disabled:opacity-50 ${confirmPassword.length > 0
                ? passwordsMatch
                  ? 'border-green-500'
                  : 'border-red-500'
                : 'border-gray-600'
                }`}
              placeholder="••••••••"
            />
            {confirmPassword.length > 0 && !passwordsMatch && (
              <p className="text-red-400 text-sm mt-2 flex items-center gap-1">
                <X size={14} />
                Passwords do not match
              </p>
            )}
          </div>
          <button
            type="submit"
            disabled={!isNameValid || !isPasswordValid || !passwordsMatch || isLoading}
            className="w-full py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 rounded-xl font-bold transition-all duration-200 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? 'Creating Account...' : 'Create Account'}
          </button>
        </form>

        <p className="text-center mt-6 text-gray-400">
          Already have an account?{' '}
          <button
            onClick={onSwitchToLogin}
            disabled={isLoading}
            className="text-blue-400 hover:text-blue-300 font-semibold transition-colors disabled:opacity-50"
          >
            Sign in
          </button>
        </p>
      </div>
    </div>
  );
};
