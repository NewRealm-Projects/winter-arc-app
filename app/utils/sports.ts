import type { SportEntry, SportKey, SportTracking } from '../types';

export const SPORT_KEYS: SportKey[] = ['hiit', 'cardio', 'gym', 'schwimmen', 'soccer', 'rest'];

export const DEFAULT_SPORTS_STATE: Record<SportKey, SportEntry> = SPORT_KEYS.reduce(
  (acc, key) => {
    acc[key] = { active: false };
    return acc;
  },
  {} as Record<SportKey, SportEntry>
);

type SportValue = SportEntry | SportTracking[SportKey] | boolean | undefined;
type SportInput = Partial<SportTracking> | Record<SportKey, SportEntry> | undefined;

export function toSportEntry(value?: SportValue): SportEntry {
  if (typeof value === 'boolean') {
    return { active: value };
  }
  if (!value) {
    return { active: false };
  }
  return {
    active: Boolean(value.active),
    duration: value.duration,
    intensity: value.intensity,
  };
}

export function normalizeSports(sports?: SportInput): Record<SportKey, SportEntry> {
  const source = (sports ?? {}) as Record<SportKey, SportValue>;
  return SPORT_KEYS.reduce((acc, key) => {
    acc[key] = { ...toSportEntry(source[key]) };
    return acc;
  }, {} as Record<SportKey, SportEntry>);
}

export function isSportActive(value?: SportValue): boolean {
  if (typeof value === 'boolean') {
    return value;
  }
  if (!value) {
    return false;
  }
  return Boolean(value.active);
}

export function countActiveSports(sports?: SportInput): number {
  if (!sports) {
    return 0;
  }
  const source = sports as Record<SportKey, SportValue>;
  return SPORT_KEYS.reduce((total, key) => total + (isSportActive(source[key]) ? 1 : 0), 0);
}

