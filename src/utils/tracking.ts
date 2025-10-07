import type { DailyTracking, SmartTrackingContribution, SportEntry, SportKey } from '../types';
import { normalizeSports } from './sports';

function mergeSports(
  manual: Record<SportKey, SportEntry>,
  contribution?: SmartTrackingContribution['sports']
): Record<SportKey, SportEntry> {
  if (!contribution) {
    return manual;
  }

  const merged: Record<SportKey, SportEntry> = { ...manual };

  for (const [key, entry] of Object.entries(contribution) as Array<[SportKey, SportEntry | undefined]>) {
    if (!entry) continue;
    if (!entry.active) continue;

    const manualEntry = manual[key];
    merged[key] = {
      active: true,
      duration: entry.duration ?? manualEntry?.duration,
      intensity: entry.intensity ?? manualEntry.intensity,
    };
  }

  return merged;
}

export function combineTrackingWithSmart(
  tracking: Record<string, DailyTracking>,
  contributions: Record<string, SmartTrackingContribution>
): Record<string, DailyTracking> {
  const result: Record<string, DailyTracking> = {};
  const allKeys = new Set([...Object.keys(tracking), ...Object.keys(contributions)]);

  for (const dateKey of allKeys) {
    const manual = tracking[dateKey];
    const smart = contributions[dateKey];

    const manualSports = normalizeSports(manual?.sports);
    const sports = mergeSports(manualSports, smart?.sports);

    const water = (manual?.water ?? 0) + (smart?.water ?? 0);
    const protein = (manual?.protein ?? 0) + (smart?.protein ?? 0);
    const pushupsTotal = (manual?.pushups?.total ?? 0) + (smart?.pushups ?? 0);

    const pushups = (() => {
      if (manual?.pushups || pushupsTotal > 0) {
        return {
          ...manual?.pushups,
          total: pushupsTotal,
        };
      }
      return undefined;
    })();

    const weight = (() => {
      const value = manual?.weight?.value ?? smart?.weight?.value;
      const bodyFat = manual.weight?.bodyFat ?? smart?.weight?.bodyFat;
      const bmi = manual.weight?.bmi;

      if (value === undefined && bodyFat === undefined && bmi === undefined) {
        return undefined;
      }

      return {
        ...(manual.weight ?? {}),
        value: value ?? manual?.weight?.value ?? 0,
        bodyFat,
        bmi,
      };
    })();

    result[`${dateKey}`] = { date: manual?.date ?? dateKey, sports, water, protein, pushups, weight, completed: manual?.completed ?? false };
      date: manual?.date ?? dateKey,
      sports,
      water,
      protein,
      pushups,
      weight,
      completed: manual?.completed ?? false,
    };
  }

  return result;
}
