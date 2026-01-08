import React, { useState, useMemo } from 'react';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../firebase.js';
import { Check, X } from 'lucide-react';

// Password validation requirements
const PASSWORD_REQUIREMENTS = [
  { id: 'length', label: 'At least 8 characters', test: (p) => p.length >= 8 },
  { id: 'uppercase', label: 'One uppercase letter', test: (p) => /[A-Z]/.test(p) },
  { id: 'lowercase', label: 'One lowercase letter', test: (p) => /[a-z]/.test(p) },
  { id: 'number', label: 'One number', test: (p) => /[0-9]/.test(p) },
  { id: 'special', label: 'One special character (!@#$%^&*)', test: (p) => /[!@#$%^&*(),.?":{}|<>]/.test(p) },
];

export const Signup = ({ onSwitchToLogin }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const passwordValidation = useMemo(() => {
    return PASSWORD_REQUIREMENTS.map((req) => ({
      ...req,
      passed: req.test(password),
    }));
  }, [password]);

  const isPasswordValid = passwordValidation.every((req) => req.passed);
  const passwordsMatch = password === confirmPassword && confirmPassword.length > 0;

  const handleSignup = async (e) => {
    e.preventDefault();
    setError(null);

    if (!isPasswordValid) {
      setError('Password does not meet all requirements.');
      return;
    }

    if (!passwordsMatch) {
      setError('Passwords do not match.');
      return;
    }

    setIsSubmitting(true);
    try {
      await createUserWithEmailAndPassword(auth, email, password);
      // The onAuthStateChanged listener in App.jsx will handle the redirect
    } catch (error) {
      setError(error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-900 text-white">
      <div className="bg-gray-800 p-8 rounded-2xl shadow-lg w-full max-w-md">
        <h2 className="text-3xl font-bold text-center mb-6">Sign Up</h2>
        {error && <p className="text-red-500 text-center mb-4">{error}</p>}
        <form onSubmit={handleSignup} className="space-y-6">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-300">
              Email
            </label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full p-3 mt-1 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label
              htmlFor="password"
              className="block text-sm font-medium text-gray-300"
            >
              Password
            </label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full p-3 mt-1 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            {/* Password requirements checklist */}
            {password.length > 0 && (
              <ul className="mt-2 space-y-1 text-sm">
                {passwordValidation.map((req) => (
                  <li key={req.id} className="flex items-center gap-2">
                    {req.passed ? (
                      <Check size={14} className="text-green-500" />
                    ) : (
                      <X size={14} className="text-red-500" />
                    )}
                    <span className={req.passed ? 'text-green-400' : 'text-gray-400'}>
                      {req.label}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>
          <div>
            <label
              htmlFor="confirmPassword"
              className="block text-sm font-medium text-gray-300"
            >
              Confirm Password
            </label>
            <input
              type="password"
              id="confirmPassword"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              className={`w-full p-3 mt-1 bg-gray-700 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${confirmPassword.length > 0
                  ? passwordsMatch
                    ? 'border-green-500'
                    : 'border-red-500'
                  : 'border-gray-600'
                }`}
            />
            {confirmPassword.length > 0 && !passwordsMatch && (
              <p className="text-red-500 text-sm mt-1">Passwords do not match</p>
            )}
          </div>
          <button
            type="submit"
            disabled={!isPasswordValid || !passwordsMatch || isSubmitting}
            className="w-full py-3 bg-blue-600 hover:bg-blue-500 rounded-lg font-bold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? 'Creating Account...' : 'Sign Up'}
          </button>
        </form>
        <p className="text-center mt-6">
          Already have an account?{' '}
          <button
            onClick={onSwitchToLogin}
            className="text-blue-400 hover:underline"
          >
            Log in
          </button>
        </p>
      </div>
    </div>
  );
};
