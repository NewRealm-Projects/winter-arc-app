import { addDays, format } from 'date-fns';
import type { DailyTracking, Activity, User } from '../types';
import { countActiveSports } from './sports';
import { calculateProteinGoal, calculateWaterGoal } from './calculations';
import { STREAK_COMPLETION_THRESHOLD } from '../constants/streak';

const DEFAULT_WATER_GOAL_ML = 3000;

export function clamp(value: number, min = 0, max = 1): number {
  if (!Number.isFinite(value)) {
    return min;
  }

  if (value < min) {
    return min;
  }
  if (value > max) {
    return max;
  }
  return value;
}

export function getPercent(value: unknown, goal: unknown): number {
  const numericValue = Number(value);
  const numericGoal = Number(goal);

  if (!Number.isFinite(numericValue) || !Number.isFinite(numericGoal) || numericGoal <= 0) {
    return 0;
  }

  const ratio = clamp(numericValue / numericGoal, 0, 1);
  return Math.round(ratio * 100);
}

export function formatMl(
  value: unknown,
  options: { locale?: string; maximumFractionDigits?: number } = {}
): string {
  const numericValue = Number(value);
  const safeValue = Number.isFinite(numericValue) ? Math.max(numericValue, 0) : 0;
  const liters = safeValue / 1000;
  const formatter = new Intl.NumberFormat(options.locale ?? 'de-DE', {
    minimumFractionDigits: 0,
    maximumFractionDigits: options.maximumFractionDigits ?? 1,
  });
  return formatter.format(liters);
}

export function formatGrams(
  value: unknown,
  options: { locale?: string } = {}
): string {
  const numericValue = Number(value);
  const safeValue = Number.isFinite(numericValue) ? Math.max(numericValue, 0) : 0;
  const formatter = new Intl.NumberFormat(options.locale ?? 'de-DE', {
    maximumFractionDigits: 0,
  });
  return formatter.format(safeValue);
}

export interface DayCompletionInput {
  tracking?: Partial<DailyTracking>;
  user?: Pick<User, 'weight' | 'hydrationGoalLiters' | 'proteinGoalGrams'> | null;
  enabledActivities?: Activity[];
}

export interface DayCompletionResult {
  percent: number;
  weights: {
    water: number;
    protein: number;
    movement: number;
  };
  ratios: {
    water: number;
    protein: number;
    movement: number;
  };
  totals: {
    water: number;
    protein: number;
  };
  goals: {
    water: number;
    protein: number;
  };
  movement: {
    pushupsDone: boolean;
    sportsCount: number;
  };
}

export function resolveWaterGoal(
  user?: Pick<User, 'weight' | 'hydrationGoalLiters'> | null
): number {
  if (user?.hydrationGoalLiters && Number.isFinite(user.hydrationGoalLiters) && user.hydrationGoalLiters > 0) {
    return Math.round(user.hydrationGoalLiters * 1000);
  }

  if (user?.weight && Number.isFinite(user.weight) && user.weight > 0) {
    return calculateWaterGoal(user.weight);
  }

  return DEFAULT_WATER_GOAL_ML;
}

export function resolveProteinGoal(
  user?: Pick<User, 'weight' | 'proteinGoalGrams'> | null
): number {
  if (user?.proteinGoalGrams && Number.isFinite(user.proteinGoalGrams) && user.proteinGoalGrams > 0) {
    return Math.round(user.proteinGoalGrams);
  }

  if (user?.weight && Number.isFinite(user.weight) && user.weight > 0) {
    return calculateProteinGoal(user.weight);
  }

  return 0;
}

export function getDayCompletion({
  tracking,
  user,
  enabledActivities,
}: DayCompletionInput): DayCompletionResult {
  const safeTracking = tracking ?? {};
  const waterGoal = resolveWaterGoal(user);
  const proteinGoal = resolveProteinGoal(user);

  const waterValue = Number.isFinite(safeTracking.water) ? Math.max(safeTracking.water ?? 0, 0) : 0;
  const proteinValue = Number.isFinite(safeTracking.protein) ? Math.max(safeTracking.protein ?? 0, 0) : 0;
  const pushupsDone = Boolean(safeTracking.pushups?.total && safeTracking.pushups.total > 0);
  const sportsCount = countActiveSports(safeTracking.sports);
  const movementDone = pushupsDone || sportsCount > 0;

  const isWaterEnabled = enabledActivities ? enabledActivities.includes('water') : true;
  const isProteinEnabled = enabledActivities ? enabledActivities.includes('protein') : true;
  const isPushupsEnabled = enabledActivities ? enabledActivities.includes('pushups') : true;
  const isSportsEnabled = enabledActivities ? enabledActivities.includes('sports') : true;
  const isMovementEnabled = isPushupsEnabled || isSportsEnabled;

  const hasProteinGoal = isProteinEnabled && proteinGoal > 0;

  const baseWeights = {
    water: isWaterEnabled ? 0.4 : 0,
    protein: hasProteinGoal ? 0.4 : 0,
    movement: isMovementEnabled ? 0.2 : 0,
  };

  const weightSum = baseWeights.water + baseWeights.protein + baseWeights.movement;

  const normalizedWeights = weightSum > 0
    ? {
        water: baseWeights.water / weightSum,
        protein: baseWeights.protein / weightSum,
        movement: baseWeights.movement / weightSum,
      }
    : { water: 0, protein: 0, movement: 0 };

  const waterRatio = waterGoal > 0 ? clamp(waterValue / waterGoal) : 0;
  const proteinRatio = proteinGoal > 0 ? clamp(proteinValue / proteinGoal) : 0;
  const movementRatio = movementDone ? 1 : 0;

  const completion =
    waterRatio * normalizedWeights.water +
    proteinRatio * normalizedWeights.protein +
    movementRatio * normalizedWeights.movement;

  const percent = Math.round(clamp(completion) * 100);

  return {
    percent,
    weights: normalizedWeights,
    ratios: {
      water: waterRatio,
      protein: proteinRatio,
      movement: movementRatio,
    },
    totals: {
      water: waterValue,
      protein: proteinValue,
    },
    goals: {
      water: isWaterEnabled ? waterGoal : 0,
      protein: hasProteinGoal ? proteinGoal : 0,
    },
    movement: {
      pushupsDone,
      sportsCount,
    },
  };
}

export function calculateCompletionStreak(
  tracking: Record<string, Partial<DailyTracking>>,
  user?: Pick<User, 'weight' | 'hydrationGoalLiters' | 'proteinGoalGrams'> | null,
  enabledActivities?: Activity[]
): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  let streak = 0;
  let cursor = new Date(today);

  for (let i = 0; i < 365; i++) {
    const key = format(cursor, 'yyyy-MM-dd');
    const dayTracking = Object.prototype.hasOwnProperty.call(tracking, key)
      ? tracking[key]
      : undefined;

    const completion = getDayCompletion({ tracking: dayTracking, user, enabledActivities });
    if (completion.percent < STREAK_COMPLETION_THRESHOLD) {
      break;
    }

    streak += 1;
    cursor = addDays(cursor, -1);
  }

  return streak;
}
