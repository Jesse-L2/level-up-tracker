import { describe, it, expect } from 'vitest';
import { parseReps, isAMRAPSet, getNumericReps } from '../parseReps';

describe('parseReps', () => {
    describe('standard inputs', () => {
        it('parses a simple number', () => {
            expect(parseReps(5)).toEqual({ value: 5, isAMRAP: false });
        });

        it('parses a string number', () => {
            expect(parseReps('8')).toEqual({ value: 8, isAMRAP: false });
        });

        it('parses a double-digit string', () => {
            expect(parseReps('12')).toEqual({ value: 12, isAMRAP: false });
        });
    });

    describe('AMRAP inputs', () => {
        it('parses a string with + suffix', () => {
            expect(parseReps('5+')).toEqual({ value: 5, isAMRAP: true });
        });

        it('parses a double-digit AMRAP string', () => {
            expect(parseReps('10+')).toEqual({ value: 10, isAMRAP: true });
        });
    });

    describe('edge cases', () => {
        it('returns 0 and false for null', () => {
            expect(parseReps(null)).toEqual({ value: 0, isAMRAP: false });
        });

        it('returns 0 and false for undefined', () => {
            expect(parseReps(undefined)).toEqual({ value: 0, isAMRAP: false });
        });

        it('returns 0 and false for empty string', () => {
            expect(parseReps('')).toEqual({ value: 0, isAMRAP: false });
        });

        it('returns 0 for non-numeric string', () => {
            expect(parseReps('abc')).toEqual({ value: 0, isAMRAP: false });
        });

        it('parses numeric value from string with + but invalid base', () => {
            expect(parseReps('xyz+')).toEqual({ value: 0, isAMRAP: true });
        });
    });
});

describe('isAMRAPSet', () => {
    it('returns true for AMRAP string', () => {
        expect(isAMRAPSet('8+')).toBe(true);
    });

    it('returns false for standard string', () => {
        expect(isAMRAPSet('8')).toBe(false);
    });

    it('returns false for number', () => {
        expect(isAMRAPSet(8)).toBe(false);
    });

    it('returns false for null', () => {
        expect(isAMRAPSet(null)).toBe(false);
    });

    it('returns false for empty string', () => {
        expect(isAMRAPSet('')).toBe(false);
    });
});

describe('getNumericReps', () => {
    it('returns numeric value from AMRAP', () => {
        expect(getNumericReps('10+')).toBe(10);
    });

    it('returns numeric value from standard', () => {
        expect(getNumericReps(5)).toBe(5);
    });

    it('returns 0 for invalid input', () => {
        expect(getNumericReps(null)).toBe(0);
    });
});
