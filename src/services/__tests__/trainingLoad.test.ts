import { describe, it, expect, beforeEach } from 'vitest';
import {
  computeDailyTrainingLoadV1,
  buildWorkoutEntriesFromTracking,
  resolvePushupsFromTracking,
} from '../trainingLoad';
import type { DailyTracking, WorkoutEntry } from '@/types';

describe('TrainingLoad Service', () => {
  describe('computeDailyTrainingLoadV1', () => {
    it('should calculate base training load with no activities', () => {
      const result = computeDailyTrainingLoadV1({
        workouts: [],
        pushupsReps: 0,
        sleepScore: 5,
        recoveryScore: 5,
        sick: false,
      });

      expect(result.load).toBe(0);
      expect(result.components).toEqual({
        workoutLoad: 0,
        pushupsLoad: 0,
        wellnessMultiplier: 0.75,
      });
    });

    it('should calculate training load with workouts', () => {
      const workouts: WorkoutEntry[] = [
        { sport: 'gym', durationMin: 60, intensity: 8 },
        { sport: 'cardio', durationMin: 30, intensity: 6 },
      ];

      const result = computeDailyTrainingLoadV1({
        workouts,
        pushupsReps: 50,
        sleepScore: 8,
        recoveryScore: 7,
        sick: false,
      });

      expect(result.load).toBeGreaterThan(0);
      expect(result.components.workoutLoad).toBeGreaterThan(0);
      expect(result.components.pushupsLoad).toBeGreaterThan(0);
      expect(result.components.wellnessMultiplier).toBeCloseTo(0.975);
    });

    it('should reduce training load when sick', () => {
      const workouts: WorkoutEntry[] = [
        { sport: 'gym', durationMin: 60, intensity: 8 },
      ];

      const healthyResult = computeDailyTrainingLoadV1({
        workouts,
        pushupsReps: 100,
        sleepScore: 8,
        recoveryScore: 8,
        sick: false,
      });

      const sickResult = computeDailyTrainingLoadV1({
        workouts,
        pushupsReps: 100,
        sleepScore: 8,
        recoveryScore: 8,
        sick: true,
      });

      expect(sickResult.load).toBeLessThan(healthyResult.load);
      expect(sickResult.components.wellnessMultiplier).toBe(0.5);
    });

    it('should handle edge cases', () => {
      // Very high intensity workout
      const extremeWorkout = computeDailyTrainingLoadV1({
        workouts: [{ sport: 'hiit', durationMin: 120, intensity: 10 }],
        pushupsReps: 500,
        sleepScore: 10,
        recoveryScore: 10,
        sick: false,
      });

      expect(extremeWorkout.load).toBeLessThanOrEqual(200); // Should be capped

      // Very low wellness scores
      const lowWellness = computeDailyTrainingLoadV1({
        workouts: [{ sport: 'gym', durationMin: 60, intensity: 5 }],
        pushupsReps: 50,
        sleepScore: 1,
        recoveryScore: 1,
        sick: false,
      });

      expect(lowWellness.components.wellnessMultiplier).toBeLessThan(0.7);
    });
  });

  describe('buildWorkoutEntriesFromTracking', () => {
    it('should extract workouts from tracking data', () => {
      const tracking: DailyTracking = {
        pushups: { total: 50 },
        sports: {
          gym: { active: true, duration: 60, intensity: 7 },
          cardio: { active: true, duration: 30, intensity: 5 },
          rest: { active: false },
        },
        water: 2000,
        protein: 80,
        completed: true,
      };

      const workouts = buildWorkoutEntriesFromTracking(tracking);

      expect(workouts).toHaveLength(2);
      expect(workouts[0]).toEqual({
        sport: 'gym',
        durationMin: 60,
        intensity: 7,
      });
      expect(workouts[1]).toEqual({
        sport: 'cardio',
        durationMin: 30,
        intensity: 5,
      });
    });

    it('should handle undefined tracking', () => {
      const workouts = buildWorkoutEntriesFromTracking(undefined);
      expect(workouts).toEqual([]);
    });

    it('should filter out rest days and inactive sports', () => {
      const tracking: DailyTracking = {
        pushups: { total: 0 },
        sports: {
          gym: { active: false, duration: 60, intensity: 7 },
          rest: { active: true },
        },
        water: 2000,
        protein: 80,
        completed: true,
      };

      const workouts = buildWorkoutEntriesFromTracking(tracking);
      expect(workouts).toEqual([]);
    });
  });

  describe('resolvePushupsFromTracking', () => {
    it('should extract pushups from tracking data', () => {
      const tracking: DailyTracking = {
        pushups: { total: 100 },
        water: 2000,
        protein: 80,
        completed: true,
      };

      const pushups = resolvePushupsFromTracking(tracking);
      expect(pushups).toBe(100);
    });

    it('should extract pushups from workout data', () => {
      const tracking: DailyTracking = {
        pushups: {
          workout: {
            sets: [
              { reps: 20, type: 'normal' },
              { reps: 15, type: 'normal' },
              { reps: 25, type: 'normal' },
            ],
            totalReps: 60,
            completedAt: '2025-01-01T12:00:00Z',
          },
        },
        water: 2000,
        protein: 80,
        completed: true,
      };

      const pushups = resolvePushupsFromTracking(tracking);
      expect(pushups).toBe(60);
    });

    it('should prefer total over workout reps', () => {
      const tracking: DailyTracking = {
        pushups: {
          total: 100,
          workout: {
            sets: [{ reps: 20, type: 'normal' }],
            totalReps: 20,
            completedAt: '2025-01-01T12:00:00Z',
          },
        },
        water: 2000,
        protein: 80,
        completed: true,
      };

      const pushups = resolvePushupsFromTracking(tracking);
      expect(pushups).toBe(100);
    });

    it('should handle undefined tracking', () => {
      const pushups = resolvePushupsFromTracking(undefined);
      expect(pushups).toBe(0);
    });
  });
});