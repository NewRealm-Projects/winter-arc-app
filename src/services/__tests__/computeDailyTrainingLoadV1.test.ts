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

    expect(healthy.components.modifierSick).toBe(1);
    expect(sick.components.modifierSick).toBeCloseTo(0.5, 5);
    expect(sick.load).toBeLessThan(healthy.load);
    expect(sick.load).toBeLessThanOrEqual(Math.round(healthy.load * 0.55));
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
});
