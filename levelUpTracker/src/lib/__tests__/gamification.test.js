import { describe, it, expect } from 'vitest';
import { calculateLevel, calculateXpForNextLevel, calculateProgressToNextLevel, XP_REWARDS } from '../gamification';

describe('calculateLevel', () => {
    it('returns level 1 for 0 XP', () => {
        expect(calculateLevel(0)).toBe(1);
    });

    it('returns level 1 for null XP', () => {
        expect(calculateLevel(null)).toBe(1);
    });

    it('returns level 1 for negative XP', () => {
        expect(calculateLevel(-50)).toBe(1);
    });

    it('returns level 2 at 100 XP', () => {
        expect(calculateLevel(100)).toBe(2);
    });

    it('returns level 3 at 400 XP', () => {
        // Level 3 requires 100 * (3-1)^2 = 400 XP
        expect(calculateLevel(400)).toBe(3);
    });

    it('returns level 4 at 900 XP', () => {
        // Level 4 requires 100 * (4-1)^2 = 900 XP
        expect(calculateLevel(900)).toBe(4);
    });

    it('returns level 1 for 99 XP (just under threshold)', () => {
        expect(calculateLevel(99)).toBe(1);
    });

    it('handles large XP values', () => {
        // Level 11 requires 100 * 10^2 = 10000 XP
        expect(calculateLevel(10000)).toBe(11);
    });
});

describe('calculateXpForNextLevel', () => {
    it('returns 100 XP needed to reach level 2 (from level 1)', () => {
        expect(calculateXpForNextLevel(1)).toBe(100);
    });

    it('returns 400 XP needed to reach level 3 (from level 2)', () => {
        expect(calculateXpForNextLevel(2)).toBe(400);
    });

    it('returns 900 XP needed to reach level 4', () => {
        expect(calculateXpForNextLevel(3)).toBe(900);
    });
});

describe('calculateProgressToNextLevel', () => {
    it('returns 0% progress when at 0 XP', () => {
        expect(calculateProgressToNextLevel(0)).toBe(0);
    });

    it('returns 50% progress when halfway to level 2', () => {
        // Level 1 base: 0 XP, Level 2 requires 100 XP
        // 50 XP is 50% of the way
        expect(calculateProgressToNextLevel(50)).toBe(50);
    });

    it('returns 0% at exact level boundary', () => {
        // At 100 XP, you are level 2 with 0% progress to level 3
        // Level 2 base: 100, Level 3 requires 400, so 0 / 300 = 0%
        expect(calculateProgressToNextLevel(100)).toBe(0);
    });

    it('returns ~33% for 200 XP (one third of level 2 to 3)', () => {
        // Level 2 base: 100, Level 3: 400
        // XP in current level: 200 - 100 = 100
        // XP needed: 400 - 100 = 300
        // Progress: 100 / 300 = 33.33%
        expect(calculateProgressToNextLevel(200)).toBeCloseTo(33.33, 1);
    });
});

describe('XP_REWARDS', () => {
    it('has workout completion reward defined', () => {
        expect(XP_REWARDS.WORKOUT_COMPLETION).toBe(50);
    });

    it('has PR bonus defined', () => {
        expect(XP_REWARDS.PR_BONUS).toBe(10);
    });
});
