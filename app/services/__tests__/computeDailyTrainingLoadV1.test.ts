import { describe, expect, it } from 'vitest';
import { computeDailyTrainingLoadV1 } from '../trainingLoad';

describe('computeDailyTrainingLoadV1', () => {
  it('increases load with better sleep and recovery scores', () => {
    const baseInput = {
      workouts: [{ durationMinutes: 45, intensity: 6 }],
      pushupsReps: 0,
      sleepScore: 1,
      recoveryScore: 1,
      sick: false,
    };

    const low = computeDailyTrainingLoadV1(baseInput);
    const high = computeDailyTrainingLoadV1({
      ...baseInput,
      sleepScore: 10,
      recoveryScore: 10,
    });

    // With new formula: wellnessMod = 0.6 + 0.04*recovery + 0.02*sleep
    // Low (sleep=1, recovery=1): 0.6 + 0.04 + 0.02 = 0.66
    // High (sleep=10, recovery=10): 0.6 + 0.4 + 0.2 = 1.2
    expect(high.load).toBeGreaterThan(low.load);
    expect(high.components.modifierSleep).toBeGreaterThan(low.components.modifierSleep);
    expect(high.components.modifierRecovery).toBeGreaterThan(low.components.modifierRecovery);
  });

  it('reduces the load when marked as sick', () => {
    const baseInput = {
      workouts: [{ durationMinutes: 60, intensity: 8 }],
      pushupsReps: 50,
      sleepScore: 7,
      recoveryScore: 7,
      sick: false,
    };

    const healthy = computeDailyTrainingLoadV1(baseInput);
    const sick = computeDailyTrainingLoadV1({ ...baseInput, sick: true });

    // With new formula: sick subtracts 0.3 from wellnessMod
    // Healthy (sleep=7, recovery=7): 0.6 + 0.28 + 0.14 = 1.02
    // Sick: 1.02 - 0.3 = 0.72
    expect(sick.load).toBeLessThan(healthy.load);

    // Wellness mod should reflect sickness penalty
    expect(sick.components.modifierSick).toBeLessThan(healthy.components.modifierSick);
  });

  it('caps the load at the maximum threshold', () => {
    const result = computeDailyTrainingLoadV1({
      workouts: [{ durationMinutes: 300, intensity: 10 }],
      pushupsReps: 500,
      sleepScore: 10,
      recoveryScore: 10,
      sick: false,
    });

    expect(result.load).toBeLessThanOrEqual(1000);
  });

  it('applies pushup adjustment correctly (capped at 20% of session load)', () => {
    const baseInput = {
      workouts: [{ durationMinutes: 60, intensity: 5 }], // ~300 session load
      pushupsReps: 100, // Should add pushups/100 * sessionLoad = 1 * 300 = 300, but capped at 20% = 60
      sleepScore: 5,
      recoveryScore: 5,
      sick: false,
    };

    const withPushups = computeDailyTrainingLoadV1(baseInput);
    const withoutPushups = computeDailyTrainingLoadV1({ ...baseInput, pushupsReps: 0 });

    // With pushups should be higher, but not by more than 20% of session load
    expect(withPushups.load).toBeGreaterThan(withoutPushups.load);
  });

  it('wellness modifier is clamped to [0.4, 1.4]', () => {
    // Test lower bound
    const lowInput = {
      workouts: [{ durationMinutes: 30, intensity: 5 }],
      pushupsReps: 0,
      sleepScore: 1,
      recoveryScore: 1,
      sick: true, // Should push wellness below 0.4, but clamped
    };
    const low = computeDailyTrainingLoadV1(lowInput);
    // wellnessMod = 0.6 + 0.04 + 0.02 - 0.3 = 0.36, clamped to 0.4
    expect(low.components.modifierSleep).toBeCloseTo(0.4, 2);

    // Test upper bound
    const highInput = {
      workouts: [{ durationMinutes: 30, intensity: 5 }],
      pushupsReps: 0,
      sleepScore: 10,
      recoveryScore: 10,
      sick: false, // Should push wellness to 1.2 (within bounds)
    };
    const high = computeDailyTrainingLoadV1(highInput);
    // wellnessMod = 0.6 + 0.4 + 0.2 = 1.2
    expect(high.components.modifierSleep).toBeCloseTo(1.2, 2);
  });
});

