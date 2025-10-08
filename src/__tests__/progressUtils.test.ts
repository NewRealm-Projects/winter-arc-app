import { describe, expect, it, vi } from 'vitest';
import {
  calculateCompletionStreak,
  getDayCompletion,
  getDayProgressSummary,
  getPercent,
  resolveProteinGoal,
  resolveWaterGoal,
} from '../utils/progress';
import type { DailyTracking, SportTracking } from '../types';

describe('getPercent', () => {
  it('returns 0 when goal is zero or invalid', () => {
    expect(getPercent(100, 0)).toBe(0);
    expect(getPercent(100, Number.NaN)).toBe(0);
  });

  it('clamps the result to 0-100 and rounds', () => {
    expect(getPercent(50, 100)).toBe(50);
    expect(getPercent(150, 100)).toBe(100);
    expect(getPercent(-10, 100)).toBe(0);
  });
});

describe('resolveWaterGoal', () => {
  it('prefers explicit hydration goal when available', () => {
    expect(resolveWaterGoal({ hydrationGoalLiters: 3 })).toBe(3000);
  });

  it('falls back to weight-based calculation', () => {
    expect(resolveWaterGoal({ weight: 82 })).toBe(2870);
  });

  it('uses default when no data provided', () => {
    expect(resolveWaterGoal(undefined)).toBe(3000);
  });
});

describe('resolveProteinGoal', () => {
  it('returns configured protein goal when valid', () => {
    expect(resolveProteinGoal({ proteinGoalGrams: 160 })).toBe(160);
  });

  it('derives protein goal from weight when not configured', () => {
    expect(resolveProteinGoal({ weight: 73 })).toBe(146);
  });

  it('returns 0 when input is missing', () => {
    expect(resolveProteinGoal(undefined)).toBe(0);
  });
});

describe('getDayCompletion', () => {
  it('calculates weighted completion based on goals', () => {
    const result = getDayCompletion({
      tracking: {
        water: 1000,
        protein: 120,
        sports: { hiit: { active: true } } as SportTracking,
        weight: { value: 72 },
      },
      user: {
        weight: 70,
        hydrationGoalLiters: 2.5,
        proteinGoalGrams: 150,
      },
      enabledActivities: ['water', 'protein', 'sports', 'weight'],
    });

    expect(result.percent).toBe(73);
    expect(result.movement.sportsCount).toBeGreaterThan(0);
    expect(result.movement.pushupsDone).toBe(false);
    expect(result.weight.logged).toBe(true);
    expect(result.weights.weight).toBeCloseTo(1 / 6, 3);
  });

  it('re-normalizes weights when activities are disabled', () => {
    const result = getDayCompletion({
      tracking: { water: 500 },
      user: { weight: 70, hydrationGoalLiters: 1 },
      enabledActivities: ['water'],
    });

    expect(result.percent).toBe(50);
  });

  it('reduces completion when weight tracking is enabled but not logged', () => {
    const result = getDayCompletion({
      tracking: {
        water: 2500,
        protein: 150,
        sports: { hiit: { active: true } } as SportTracking,
      },
      user: {
        weight: 80,
        hydrationGoalLiters: 2.5,
        proteinGoalGrams: 150,
      },
      enabledActivities: ['water', 'protein', 'sports', 'weight'],
    });

    expect(result.percent).toBe(83);
    expect(result.ratios.weight).toBe(0);
    expect(result.weight.logged).toBe(false);
  });
});

describe('getDayProgressSummary', () => {
  it('counts completed tasks and flags streaks at threshold', () => {
    const summary = getDayProgressSummary({
      tracking: {
        water: 2600,
        protein: 0,
        sports: { hiit: { active: true } } as SportTracking,
      },
      user: {
        hydrationGoalLiters: 2.5,
        proteinGoalGrams: 150,
      },
      enabledActivities: ['water', 'protein', 'sports'],
    });

    expect(summary.tasksTotal).toBe(3);
    expect(summary.tasksCompleted).toBe(2);
    expect(summary.percent).toBe(67);
    expect(summary.streakMet).toBe(true);
  });

  it('respects enabled activity overrides when calculating totals', () => {
    const summary = getDayProgressSummary({
      tracking: { water: 0, protein: 0 },
      user: { hydrationGoalLiters: 2, proteinGoalGrams: 120 },
      enabledActivities: ['protein'],
    });

    expect(summary.tasksTotal).toBe(1);
    expect(summary.tasksCompleted).toBe(0);
    expect(summary.percent).toBe(0);
    expect(summary.streakMet).toBe(false);
  });

  it('ignores protein task when goal is zero', () => {
    const summary = getDayProgressSummary({
      tracking: { protein: 250 },
      user: { proteinGoalGrams: 0 },
      enabledActivities: ['protein'],
    });

    expect(summary.tasksTotal).toBe(0);
    expect(summary.tasksCompleted).toBe(0);
    expect(summary.percent).toBe(0);
  });

  it('uses user enabled activities when overrides are missing', () => {
    const summary = getDayProgressSummary({
      tracking: { pushups: { total: 30 } as DailyTracking['pushups'] },
      user: {
        hydrationGoalLiters: 2,
        proteinGoalGrams: 100,
        enabledActivities: ['pushups'],
      },
    });

    expect(summary.tasksTotal).toBe(1);
    expect(summary.tasksCompleted).toBe(1);
    expect(summary.percent).toBe(100);
    expect(summary.streakMet).toBe(true);
  });
});

describe('calculateCompletionStreak', () => {
  it('counts consecutive completed days from today backwards', () => {
    const today = new Date('2024-01-10T08:00:00Z');
    const dates = [0, 1, 2, 4];
    const tracking: Record<string, Partial<DailyTracking>> = {};

    vi.useFakeTimers();
    vi.setSystemTime(today);

    try {
      for (const offset of dates) {
        const date = new Date(today);
        date.setDate(today.getDate() - offset);
        const key = date.toISOString().split('T')[0];
        tracking[key] = {
          water: offset === 4 ? 0 : 2500,
          protein: offset === 4 ? 0 : 150,
          sports: { hiit: { active: offset !== 4 } } as SportTracking,
          weight: offset === 4 ? undefined : { value: 80 },
        };
      }

      const streak = calculateCompletionStreak(
        tracking,
        { weight: 80, hydrationGoalLiters: 2.5, proteinGoalGrams: 150 },
        ['water', 'protein', 'sports', 'weight']
      );

      expect(streak).toBe(3);
    } finally {
      vi.useRealTimers();
    }
  });

  it('counts days with at least 50% completion towards the streak', () => {
    const today = new Date('2024-03-15T08:00:00Z');
    const tracking: Record<string, Partial<DailyTracking>> = {};

    vi.useFakeTimers();
    vi.setSystemTime(today);

    try {
      const createEntry = (offset: number, water: number, loggedWeight: boolean) => {
        const date = new Date(today);
        date.setDate(today.getDate() - offset);
        const key = date.toISOString().split('T')[0];
        if (
          key.match(/^\d{4}-\d{2}-\d{2}$/) &&
          !Object.prototype.hasOwnProperty.call(tracking, key) &&
          !Number.isNaN(Date.parse(key)) &&
          key === new Date(key).toISOString().split('T')[0]
        ) {
          tracking[key] = {
            water,
            weight: loggedWeight ? { value: 80 } : undefined,
          };
        }
      };

      createEntry(0, 1500, true); // weight logged keeps completion above threshold
      createEntry(1, 2000, false); // missing weight should end streak
      createEntry(2, 1000, false); // below threshold, should break streak

      const streak = calculateCompletionStreak(
        tracking,
        { hydrationGoalLiters: 3, weight: 80 },
        ['water', 'weight']
      );

      expect(streak).toBe(1);
    } finally {
      vi.useRealTimers();
    }
  });
});
