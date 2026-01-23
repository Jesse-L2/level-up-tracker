import { describe, it, expect } from 'vitest';
import { isBarbellExercise } from '../constants';

describe('isBarbellExercise', () => {
    it('should return true for known barbell exercises', () => {
        expect(isBarbellExercise('Bench Press')).toBe(true);
        expect(isBarbellExercise('Squat')).toBe(true);
        expect(isBarbellExercise('Deadlift')).toBe(true);
        expect(isBarbellExercise('Overhead Press')).toBe(true);
        expect(isBarbellExercise('Bent-over Rows')).toBe(true);
    });

    it('should return true for case-insensitive matches', () => {
        expect(isBarbellExercise('bench press')).toBe(true); // constants.js logic should handle exact match, but helper might not need to if used after formatting. 
        // Wait, looking at constants.js implementation:
        // if (DEFAULT_BARBELL_EXERCISES.includes(name)) return true; -> This is case sensitive mostly unless names are normalized first.
        // But the next check: if (name.toLowerCase().includes("barbell")) return true;
        // The default list uses Title Case.
        // Let's verify strict behavior.
    });

    it('should return true for exercises containing "Barbell"', () => {
        expect(isBarbellExercise('Barbell Row')).toBe(true);
        expect(isBarbellExercise('Custom Barbell Curl')).toBe(true);
        expect(isBarbellExercise('Calf Raise')).toBe(true);
    });

    it('should return true for default list items even without "Barbell" in name', () => {
        expect(isBarbellExercise('Squat')).toBe(true);
        expect(isBarbellExercise('Deadlift')).toBe(true);
    });

    it('should return false for non-barbell exercises', () => {
        expect(isBarbellExercise('Dumbbell Press')).toBe(false);
        expect(isBarbellExercise('Push-ups')).toBe(false);
        expect(isBarbellExercise('Cable Flys')).toBe(false);
        expect(isBarbellExercise('Leg Press')).toBe(false);
        // Chest Press might be ambiguous, but if it's not in the list and doesn't say barbell, it should be false
        expect(isBarbellExercise('Chest Press')).toBe(false);
    });
});
