import { describe, expect, it } from 'vitest';
import { computeTrainingLoad, DayRecovery, DaySession } from '../logic/trainingLoad';

const createSession = (overrides: Partial<DaySession> = {}): DaySession => ({
  type: 'cardio',
  duration: 60,
  intensity: 5,
  ...overrides,
});

const createRecovery = (overrides: Partial<DayRecovery> = {}): DayRecovery => ({
  sleepQuality: 7,
  recovery: 6,
  illness: false,
  ...overrides,
});

describe('computeTrainingLoad', () => {
  it('returns 0 load when no sessions and poor recovery', () => {
    const load = computeTrainingLoad(
      createRecovery({ sleepQuality: 1, recovery: 1, sessions: [] })
    );

    expect(load).toBe(0);
  });

  it('calculates higher load for intense sessions', () => {
    const load = computeTrainingLoad(
      createRecovery({
        sessions: [
          createSession({ duration: 90, intensity: 8 }),
          createSession({ duration: 45, intensity: 7 }),
        ],
      })
    );

    expect(load).toBeGreaterThan(0);
    expect(load).toBeLessThanOrEqual(1500);
  });

  it('reduces load when illness is true', () => {
    const healthyLoad = computeTrainingLoad(
      createRecovery({ sessions: [createSession()], illness: false })
    );
    const sickLoad = computeTrainingLoad(
      createRecovery({ sessions: [createSession()], illness: true })
    );

    expect(sickLoad).toBeLessThan(healthyLoad);
  });

  it('includes pushups total when provided', () => {
    const withoutPushups = computeTrainingLoad(
      createRecovery({ sessions: [createSession()], pushupsTotal: 0 })
    );
    const withPushups = computeTrainingLoad(
      createRecovery({ sessions: [createSession()], pushupsTotal: 100 })
    );

    expect(withPushups).toBeGreaterThan(withoutPushups);
  });

  it('caps training load at upper bound', () => {
    const load = computeTrainingLoad(
      createRecovery({
        sleepQuality: 10,
        recovery: 10,
        sessions: [createSession({ duration: 1000, intensity: 10 })],
      })
    );

    expect(load).toBe(1500);
  });

  it('handles invalid session values gracefully', () => {
    const load = computeTrainingLoad(
      createRecovery({
        sessions: [
          // Negative duration should be clamped to 0
          createSession({ duration: -50, intensity: 7 }),
          // NaN intensity should be clamped to 0
          createSession({ duration: 30, intensity: Number.NaN }),
        ],
      })
    );

    expect(load).toBe(0);
  });

  it('handles scenario with only pushups', () => {
    const load = computeTrainingLoad(
      createRecovery({ sessions: [], pushupsTotal: 200, sleepQuality: 8, recovery: 8 })
    );

    expect(load).toBeGreaterThan(0);
  });
});
