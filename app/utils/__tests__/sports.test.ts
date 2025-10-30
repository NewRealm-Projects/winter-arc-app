import { describe, expect, it } from 'vitest';
import {
  countActiveSports,
  DEFAULT_SPORTS_STATE,
  isSportActive,
  normalizeSports,
  SPORT_KEYS,
  toSportEntry,
} from '../sports';
import type { SportEntry, SportTracking } from '../../types';

describe('sports utilities', () => {
  describe('SPORT_KEYS and DEFAULT_SPORTS_STATE', () => {
    it('exports all sport keys', () => {
      expect(SPORT_KEYS).toEqual(['hiit', 'cardio', 'gym', 'schwimmen', 'soccer', 'rest']);
    });

    it('creates default state with all sports inactive', () => {
      expect(DEFAULT_SPORTS_STATE).toMatchObject({
        hiit: { active: false },
        cardio: { active: false },
        gym: { active: false },
        schwimmen: { active: false },
        soccer: { active: false },
        rest: { active: false },
      });
    });
  });

  describe('toSportEntry', () => {
    it('converts boolean true to active sport entry', () => {
      const result = toSportEntry(true);
      expect(result).toEqual({ active: true });
    });

    it('converts boolean false to inactive sport entry', () => {
      const result = toSportEntry(false);
      expect(result).toEqual({ active: false });
    });

    it('converts undefined to inactive sport entry', () => {
      const result = toSportEntry(undefined);
      expect(result).toEqual({ active: false });
    });

    it('preserves full sport entry object', () => {
      const entry: SportEntry = { active: true, duration: 30, intensity: 4 };
      const result = toSportEntry(entry);
      expect(result).toEqual({ active: true, duration: 30, intensity: 4 });
    });

    it('handles sport entry with active false', () => {
      const entry: SportEntry = { active: false, duration: 20, intensity: 2 };
      const result = toSportEntry(entry);
      expect(result).toEqual({ active: false, duration: 20, intensity: 2 });
    });
  });

  describe('normalizeSports', () => {
    it('normalizes empty input to default state', () => {
      const result = normalizeSports();
      SPORT_KEYS.forEach((key) => {
        expect(result[key]).toEqual({ active: false });
      });
    });

    it('normalizes partial sports input', () => {
      const input: Partial<SportTracking> = {
        hiit: { active: true, duration: 25, intensity: 5 },
        cardio: { active: false },
      };

      const result = normalizeSports(input);

      expect(result.hiit).toEqual({ active: true, duration: 25, intensity: 5 });
      expect(result.cardio).toEqual({ active: false });
      expect(result.gym).toEqual({ active: false });
    });

    it('normalizes boolean values to sport entries', () => {
      const input = {
        hiit: true,
        cardio: false,
      };

      const result = normalizeSports(input);

      expect(result.hiit).toEqual({ active: true });
      expect(result.cardio).toEqual({ active: false });
    });
  });

  describe('isSportActive', () => {
    it('returns true for boolean true', () => {
      expect(isSportActive(true)).toBe(true);
    });

    it('returns false for boolean false', () => {
      expect(isSportActive(false)).toBe(false);
    });

    it('returns false for undefined', () => {
      expect(isSportActive(undefined)).toBe(false);
    });

    it('returns true for active sport entry', () => {
      expect(isSportActive({ active: true, duration: 30 })).toBe(true);
    });

    it('returns false for inactive sport entry', () => {
      expect(isSportActive({ active: false })).toBe(false);
    });
  });

  describe('countActiveSports', () => {
    it('returns 0 for undefined input', () => {
      expect(countActiveSports(undefined)).toBe(0);
    });

    it('returns 0 for empty sports', () => {
      expect(countActiveSports({})).toBe(0);
    });

    it('counts active sports correctly', () => {
      const sports: Partial<SportTracking> = {
        hiit: { active: true },
        cardio: { active: true },
        gym: { active: false },
      };

      expect(countActiveSports(sports)).toBe(2);
    });

    it('counts boolean active sports', () => {
      const sports = {
        hiit: true,
        cardio: false,
        gym: true,
      };

      expect(countActiveSports(sports)).toBe(2);
    });
  });
});

