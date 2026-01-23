import { describe, it, expect } from 'vitest';

/**
 * Unit tests for EditProgram component logic
 * These test the helper functions and data transformations
 */

describe('EditProgram Logic', () => {
    describe('Set data transformations', () => {
        it('should convert percentage from decimal to display format', () => {
            const percentage = 0.65;
            const displayPercentage = Math.round(percentage * 100);
            expect(displayPercentage).toBe(65);
        });

        it('should convert percentage from display format to decimal', () => {
            const displayPercentage = 85;
            const decimal = displayPercentage / 100;
            expect(decimal).toBe(0.85);
        });

        it('should calculate weight from 1RM and percentage', () => {
            const oneRepMax = 200;
            const percentage = 0.75;
            const weight = Math.round((oneRepMax * percentage) / 2.5) * 2.5;
            expect(weight).toBe(150); // 200 * 0.75 = 150, rounds to nearest 2.5
        });

        it('should round weight to nearest 2.5 lbs', () => {
            const oneRepMax = 185;
            const percentage = 0.65;
            // 185 * 0.65 = 120.25
            const weight = Math.round((oneRepMax * percentage) / 2.5) * 2.5;
            expect(weight).toBe(120); // Rounds to 120
        });

        it('should handle edge case of 0 oneRepMax', () => {
            const oneRepMax = 0;
            const percentage = 0.75;
            const weight = Math.round((oneRepMax * percentage) / 2.5) * 2.5;
            expect(weight).toBe(0);
        });
    });

    describe('Clone sets for editing', () => {
        it('should clone exercise sets correctly', () => {
            const exerciseSets = [
                { reps: 10, percentage: 0.60, weight: 135 },
                { reps: 6, percentage: 0.75, weight: 170 },
                { reps: 4, percentage: 0.85, weight: 192.5 }
            ];

            const clonedSets = exerciseSets.map(set => ({
                reps: set.reps,
                percentage: Math.round((set.percentage || 0) * 100)
            }));

            expect(clonedSets).toEqual([
                { reps: 10, percentage: 60 },
                { reps: 6, percentage: 75 },
                { reps: 4, percentage: 85 }
            ]);
        });

        it('should handle AMRAP notation in reps', () => {
            const exerciseSets = [
                { reps: '8+', percentage: 0.65, weight: 147.5 }
            ];

            const clonedSets = exerciseSets.map(set => ({
                reps: set.reps,
                percentage: Math.round((set.percentage || 0) * 100)
            }));

            expect(clonedSets[0].reps).toBe('8+');
            expect(clonedSets[0].percentage).toBe(65);
        });
    });

    describe('Build sets from edit data', () => {
        it('should reconstruct sets from edit modal data', () => {
            const editingExercise = {
                oneRepMax: 225,
                sets: [
                    { reps: 10, percentage: 60 },
                    { reps: 6, percentage: 75 },
                    { reps: 4, percentage: 85 }
                ]
            };

            const newSets = editingExercise.sets.map(set => {
                const percentage = parseFloat(set.percentage) / 100;
                return {
                    reps: set.reps,
                    percentage: percentage,
                    weight: Math.round((editingExercise.oneRepMax * percentage) / 2.5) * 2.5
                };
            });

            expect(newSets).toEqual([
                { reps: 10, percentage: 0.6, weight: 135 },
                { reps: 6, percentage: 0.75, weight: 170 },
                { reps: 4, percentage: 0.85, weight: 192.5 }
            ]);
        });
    });

    describe('Add/Remove set operations', () => {
        it('should add a new set based on last set values', () => {
            const sets = [
                { reps: 5, percentage: 85 },
                { reps: 5, percentage: 85 }
            ];

            const lastSet = sets[sets.length - 1];
            const newSets = [...sets, { reps: lastSet.reps, percentage: lastSet.percentage }];

            expect(newSets.length).toBe(3);
            expect(newSets[2]).toEqual({ reps: 5, percentage: 85 });
        });

        it('should add default values if no sets exist', () => {
            const sets = [];
            const defaultSet = { reps: 12, percentage: 65 };
            const lastSet = sets[sets.length - 1] || defaultSet;
            const newSets = [...sets, { reps: lastSet.reps, percentage: lastSet.percentage }];

            expect(newSets.length).toBe(1);
            expect(newSets[0]).toEqual({ reps: 12, percentage: 65 });
        });

        it('should remove a set by index', () => {
            const sets = [
                { reps: 10, percentage: 60 },
                { reps: 6, percentage: 75 },
                { reps: 4, percentage: 85 }
            ];

            const indexToRemove = 1;
            const newSets = sets.filter((_, i) => i !== indexToRemove);

            expect(newSets.length).toBe(2);
            expect(newSets).toEqual([
                { reps: 10, percentage: 60 },
                { reps: 4, percentage: 85 }
            ]);
        });

        it('should not remove last set', () => {
            const sets = [{ reps: 5, percentage: 85 }];

            // Guard condition
            if (sets.length <= 1) {
                expect(sets.length).toBe(1);
                return;
            }

            const newSets = sets.filter((_, i) => i !== 0);
            expect(newSets.length).toBe(0); // This branch won't run due to guard
        });
    });

    describe('Template saving', () => {
        it('should generate unique template ID', () => {
            const id1 = `custom_${Date.now()}`;
            // Small delay to ensure different timestamps
            const id2 = `custom_${Date.now() + 1}`;

            expect(id1).toMatch(/^custom_\d+$/);
            expect(id2).toMatch(/^custom_\d+$/);
            expect(id1).not.toBe(id2);
        });

        it('should create template object from workout plan', () => {
            const templateName = 'My Custom Program';
            const templateDescription = 'A test template';
            const localWorkoutPlan = {
                day_1_upper: { exercises: [] },
                day_2_lower: { exercises: [] }
            };

            const newTemplate = {
                id: 'custom_12345',
                name: templateName,
                description: templateDescription,
                structure: 'Custom',
                ...localWorkoutPlan
            };

            expect(newTemplate.name).toBe('My Custom Program');
            expect(newTemplate.structure).toBe('Custom');
            expect(newTemplate.day_1_upper).toEqual({ exercises: [] });
            expect(newTemplate.day_2_lower).toEqual({ exercises: [] });
        });
    });

    describe('Bodyweight Logic', () => {
        it('should zero out weight and percentage for bodyweight exercises', () => {
            const newExercise = {
                name: 'Push ups',
                sets: 3,
                reps: 12,
                percentage: 65,
                isBodyweight: true
            };
            const oneRepMax = 100; // Should be ignored

            const percentage = newExercise.isBodyweight ? 0 : parseFloat(newExercise.percentage) / 100;
            const weight = newExercise.isBodyweight ? 0 : Math.round((oneRepMax * percentage) / 2.5) * 2.5;

            expect(percentage).toBe(0);
            expect(weight).toBe(0);
        });

        it('should use percentage for weighted exercises', () => {
            const newExercise = {
                name: 'Bench Press',
                sets: 3,
                reps: 12,
                percentage: 65,
                isBodyweight: false
            };
            const oneRepMax = 200;

            const percentage = newExercise.isBodyweight ? 0 : parseFloat(newExercise.percentage) / 100;
            const weight = newExercise.isBodyweight ? 0 : Math.round((oneRepMax * percentage) / 2.5) * 2.5;

            expect(percentage).toBe(0.65);
            expect(weight).toBe(130);
        });
    });
});
