import { describe, it, expect } from 'vitest';
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
      expect(result.components).toMatchObject({
        baseFromWorkouts: 0,
      });
      expect(result.components.modifierSleep).toBeGreaterThan(0);
    });

    it('should calculate training load with workouts', () => {
      const workouts: WorkoutEntry[] = [
        { durationMinutes: 60, intensity: 8 },
        { durationMinutes: 30, intensity: 6 },
      ];

      const result = computeDailyTrainingLoadV1({
        workouts,
        pushupsReps: 50,
        sleepScore: 8,
        recoveryScore: 7,
        sick: false,
      });

      expect(result.load).toBeGreaterThan(0);
      expect(result.components.baseFromWorkouts).toBeGreaterThan(0);
      expect(result.components.modifierSleep).toBeGreaterThan(0.9); // Good sleep/recovery
    });

    it('should reduce training load when sick', () => {
      const workouts: WorkoutEntry[] = [
        { durationMinutes: 60, intensity: 8 },
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
      expect(sickResult.components.modifierSick).toBeLessThan(healthyResult.components.modifierSick);
    });

    it('should handle edge cases', () => {
      // Very high intensity workout
      const extremeWorkout = computeDailyTrainingLoadV1({
        workouts: [{ durationMinutes: 120, intensity: 10 }],
        pushupsReps: 500,
        sleepScore: 10,
        recoveryScore: 10,
        sick: false,
      });

      expect(extremeWorkout.load).toBeLessThanOrEqual(1000); // Should be capped at TRAINING_LOAD_CAP

      // Very low wellness scores
      const lowWellness = computeDailyTrainingLoadV1({
        workouts: [{ durationMinutes: 60, intensity: 5 }],
        pushupsReps: 50,
        sleepScore: 1,
        recoveryScore: 1,
        sick: false,
      });

      expect(lowWellness.components.modifierSleep).toBeLessThan(0.7);
    });
  });

  describe('buildWorkoutEntriesFromTracking', () => {
    it('should extract workouts from tracking data', () => {
      const tracking: DailyTracking = {
        date: '2025-01-01',
        pushups: { total: 50 },
        sports: {
          gym: { active: true, duration: 60, intensity: 7 },
          cardio: { active: true, duration: 30, intensity: 5 },
          hiit: { active: false },
          schwimmen: { active: false },
          soccer: { active: false },
          rest: { active: false },
        },
        water: 2000,
        protein: 80,
        completed: true,
      };

      const workouts = buildWorkoutEntriesFromTracking(tracking);

      expect(workouts).toHaveLength(2);
      expect(workouts[0]).toMatchObject({
        durationMinutes: expect.any(Number),
        intensity: expect.any(Number),
      });
      expect(workouts[1]).toMatchObject({
        durationMinutes: expect.any(Number),
        intensity: expect.any(Number),
      });
    });

    it('should handle undefined tracking', () => {
      const workouts = buildWorkoutEntriesFromTracking(undefined);
      expect(workouts).toEqual([]);
    });

    it('should filter out rest days and inactive sports', () => {
      const tracking: DailyTracking = {
        date: '2025-01-01',
        pushups: { total: 0 },
        sports: {
          gym: { active: false, duration: 60, intensity: 7 },
          hiit: false,
          cardio: false,
          schwimmen: false,
          soccer: false,
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
        date: '2025-01-01',
        pushups: { total: 100 },
        sports: {
          hiit: false,
          cardio: false,
          gym: false,
          schwimmen: false,
          soccer: false,
          rest: false,
        },
        water: 2000,
        protein: 80,
        completed: true,
      };

      const pushups = resolvePushupsFromTracking(tracking);
      expect(pushups).toBe(100);
    });

    it('should extract pushups from workout data', () => {
      const tracking: DailyTracking = {
        date: '2025-01-01',
        pushups: {
          workout: {
            reps: [20, 15, 25],
            status: 'pass',
            timestamp: new Date('2025-01-01T12:00:00Z'),
          },
        },
        sports: {
          hiit: false,
          cardio: false,
          gym: false,
          schwimmen: false,
          soccer: false,
          rest: false,
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
        date: '2025-01-01',
        pushups: {
          total: 100,
          workout: {
            reps: [20],
            status: 'pass',
            timestamp: new Date('2025-01-01T12:00:00Z'),
          },
        },
        sports: {
          hiit: false,
          cardio: false,
          gym: false,
          schwimmen: false,
          soccer: false,
          rest: false,
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
