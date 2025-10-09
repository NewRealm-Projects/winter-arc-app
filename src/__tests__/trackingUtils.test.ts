import { describe, expect, it } from 'vitest';
import type { DailyTracking, SportTracking } from '../types';
import { combineTrackingWithSmart } from '../utils/tracking';
import { normalizeSports } from '../utils/sports';

describe('combineTrackingWithSmart', () => {
  it('merges manual and smart tracking data for existing days', () => {
    const manual: Record<string, DailyTracking> = {
      '2025-01-01': {
        date: '2025-01-01',
        sports: normalizeSports({
          cardio: { active: true, duration: 20, intensity: 2 },
        }) as SportTracking,
        water: 1200,
        protein: 85,
        pushups: { total: 30 },
        completed: true,
      },
    };

    const contributions = {
      '2025-01-01': {
        water: 300,
        protein: 15,
        pushups: 10,
        sports: {
          cardio: { active: true, duration: 25, intensity: 3 },
          gym: { active: false, duration: 40, intensity: 4 },
        },
      },
    };

    const result = combineTrackingWithSmart(manual, contributions);

    expect(result['2025-01-01']).toMatchObject({
      water: 1500,
      protein: 100,
      pushups: { total: 40 },
      sports: {
        cardio: { active: true, duration: 25, intensity: 3 },
      },
      completed: true,
    });
  });

  it('creates default entries when manual tracking is missing', () => {
    const manual: Record<string, DailyTracking> = {};

    const contributions = {
      '2025-02-05': {
        water: 500,
        protein: 40,
        pushups: 12,
        weight: { value: 78, bodyFat: 18 },
        sports: {
          hiit: { active: true, duration: 30, intensity: 5 },
        },
      },
    };

    const result = combineTrackingWithSmart(manual, contributions);

    expect(result['2025-02-05']).toMatchObject({
      date: '2025-02-05',
      water: 500,
      protein: 40,
      pushups: { total: 12 },
      weight: { value: 78, bodyFat: 18 },
      completed: false,
    });

    expect(result['2025-02-05'].sports).toMatchObject({
      hiit: { active: true, duration: 30, intensity: 5 },
    });
  });

  it('preserves manual metrics when no smart contribution is present', () => {
    const manual: Record<string, DailyTracking> = {
      '2025-03-10': {
        date: '2025-03-10',
        sports: normalizeSports() as SportTracking,
        water: 800,
        protein: 60,
        weight: { value: 80, bodyFat: 20, bmi: 23 },
        completed: false,
      },
    };

    const contributions = {};

    const result = combineTrackingWithSmart(manual, contributions);

    expect(result['2025-03-10']).toMatchObject({
      water: 800,
      protein: 60,
      weight: { value: 80, bodyFat: 20, bmi: 23 },
    });
  });

  it('handles entries without pushups or weight gracefully', () => {
    const manual: Record<string, DailyTracking> = {
      '2025-04-01': {
        date: '2025-04-01',
        sports: normalizeSports() as SportTracking,
        water: 1000,
        protein: 75,
        completed: false,
      },
    };

    const contributions = {
      '2025-04-01': {
        water: 200,
        protein: 10,
        sports: {},
      },
    };

    const result = combineTrackingWithSmart(manual, contributions);

    expect(result['2025-04-01']).toMatchObject({
      date: '2025-04-01',
      water: 1200,
      protein: 85,
      completed: false,
    });
    expect(result['2025-04-01'].pushups).toBeUndefined();
    expect(result['2025-04-01'].weight).toBeUndefined();
  });

  it('handles manual tracking without smart contributions', () => {
    const manual: Record<string, DailyTracking> = {
      '2025-05-01': {
        date: '2025-05-01',
        sports: normalizeSports({
          gym: { active: true, duration: 45, intensity: 4 },
        }) as SportTracking,
        water: 1500,
        protein: 90,
        completed: true,
      },
    };

    const contributions = {};

    const result = combineTrackingWithSmart(manual, contributions);

    expect(result['2025-05-01']).toMatchObject({
      date: '2025-05-01',
      water: 1500,
      protein: 90,
      completed: true,
      sports: {
        gym: { active: true, duration: 45, intensity: 4 },
      },
    });
  });

  it('merges sports contributions when smart data overrides manual data', () => {
    const manual: Record<string, DailyTracking> = {
      '2025-06-01': {
        date: '2025-06-01',
        sports: normalizeSports({
          cardio: { active: true, duration: 30, intensity: 3 },
        }) as SportTracking,
        water: 1000,
        protein: 70,
        completed: false,
      },
    };

    const contributions = {
      '2025-06-01': {
        water: 500,
        protein: 20,
        sports: {
          cardio: { active: true, duration: 45, intensity: 5 },
        },
      },
    };

    const result = combineTrackingWithSmart(manual, contributions);

    expect(result['2025-06-01'].sports.cardio).toMatchObject({
      active: true,
      duration: 45,
      intensity: 5,
    });
  });
});
