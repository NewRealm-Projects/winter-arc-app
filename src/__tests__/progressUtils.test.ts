import { describe, expect, it, vi } from 'vitest';
import {
  calculateCompletionStreak,
  getDayCompletion,
  getPercent,
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

describe('getDayCompletion', () => {
  it('calculates weighted completion based on goals', () => {
    const result = getDayCompletion({
      tracking: {
        water: 1000,
        protein: 120,
        sports: { hiit: { active: true } } as SportTracking,
      },
      user: {
        weight: 70,
        hydrationGoalLiters: 2.5,
        proteinGoalGrams: 150,
      },
      enabledActivities: ['water', 'protein', 'sports'],
    });

    expect(result.percent).toBe(68);
    expect(result.movement.sportsCount).toBeGreaterThan(0);
    expect(result.movement.pushupsDone).toBe(false);
  });

  it('re-normalizes weights when activities are disabled', () => {
    const result = getDayCompletion({
      tracking: { water: 500 },
      user: { weight: 70, hydrationGoalLiters: 1 },
      enabledActivities: ['water'],
    });

    expect(result.percent).toBe(50);
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
        };
      }

      const streak = calculateCompletionStreak(
        tracking,
        { weight: 80, hydrationGoalLiters: 2.5, proteinGoalGrams: 150 },
        ['water', 'protein', 'sports']
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
      const createEntry = (offset: number, water: number) => {
        const date = new Date(today);
        date.setDate(today.getDate() - offset);
        const key = date.toISOString().split('T')[0];
        tracking[key] = { water };
      };

      createEntry(0, 1500); // exactly 50% of 3L goal
      createEntry(1, 2000); // above threshold
      createEntry(2, 1000); // below threshold, should break streak

      const streak = calculateCompletionStreak(
        tracking,
        { hydrationGoalLiters: 3, weight: 80 },
        ['water']
      );

      expect(streak).toBe(2);
    } finally {
      vi.useRealTimers();
    }
  });
});
