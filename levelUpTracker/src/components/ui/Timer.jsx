import React, { useState, useEffect } from 'react';

const STROKE_WIDTH = 10;
const RADIUS = 50;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

export const Timer = ({ duration, onComplete }) => {
  const [remaining, setRemaining] = useState(duration);

  useEffect(() => {
    if (remaining <= 0) {
      onComplete();
      return;
    }

    const interval = setInterval(() => {
      setRemaining(prev => prev - 1);
    }, 1000);

    return () => clearInterval(interval);
  }, [remaining, onComplete]);

  const progress = remaining / duration;
  const strokeDashoffset = CIRCUMFERENCE * (1 - progress);

  const minutes = Math.floor(remaining / 60);
  const seconds = remaining % 60;

  return (
    <div className="relative w-32 h-32">
      <svg className="absolute top-0 left-0 w-full h-full" viewBox="0 0 120 120">
        {/* Background Circle */}
        <circle
          cx="60"
          cy="60"
          r={RADIUS}
          fill="none"
          stroke="#374151" // gray-700
          strokeWidth={STROKE_WIDTH}
        />
        {/* Progress Circle */}
        <circle
          cx="60"
          cy="60"
          r={RADIUS}
          fill="none"
          stroke="#60A5FA" // blue-400
          strokeWidth={STROKE_WIDTH}
          strokeDasharray={CIRCUMFERENCE}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          transform="rotate(-90 60 60)"
          style={{ transition: 'stroke-dashoffset 0.5s linear' }}
        />
      </svg>
      <div className="absolute top-0 left-0 w-full h-full flex flex-col items-center justify-center">
        <div className="text-3xl font-bold text-gray-300">
          {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
        </div>
      </div>
    </div>
  );
};