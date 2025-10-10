import { addDays, format } from 'date-fns';
import type { DailyTracking, Activity, User, DailyCheckIn } from '../types';
import { countActiveSports } from './sports';
import { calculateProteinGoal, calculateWaterGoal } from './calculations';
import {
  STREAK_COMPLETION_THRESHOLD,
  STREAK_WEIGHTS_BASE,
  STREAK_WEIGHTS_WITH_CHECKIN,
} from '../constants/streak';

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

export interface DayStreakScoreInput {
  tracking?: Partial<DailyTracking>;
  checkIn?: Partial<DailyCheckIn> | null;
  user?: Partial<Pick<User, 'weight' | 'hydrationGoalLiters' | 'proteinGoalGrams'>> | null;
  enabledActivities?: Activity[];
}

export interface DayStreakScoreResult {
  score: number; // 0-100
  streakMet: boolean;
  components: {
    movement: number;
    water: number;
    protein: number;
    checkin?: number;
  };
  weights: {
    movement: number;
    water: number;
    protein: number;
    checkin?: number;
  };
}

/**
 * Calculates the weighted streak score for a day (0-100)
 *
 * Weights:
 * - Without check-in: Movement 40%, Water 30%, Protein 30%
 * - With check-in: Movement 35%, Water 25%, Protein 25%, Check-in 15%
 *
 * A day counts towards the streak if score >= STREAK_COMPLETION_THRESHOLD (70%)
 *
 * @param input - Day tracking data, optional check-in data, user data
 * @returns Weighted score (0-100) and streak status
 */
export function getDayStreakScore({
  tracking,
  checkIn,
  user,
  enabledActivities,
}: DayStreakScoreInput): DayStreakScoreResult {
  const safeTracking = tracking ?? {};
  const waterGoal = resolveWaterGoal(user);
  const proteinGoal = resolveProteinGoal(user);

  // Movement: Binary (0 or 1)
  const pushupsDone = Boolean(safeTracking.pushups?.total && safeTracking.pushups.total > 0);
  const sportsCount = countActiveSports(safeTracking.sports);
  const movementDone = pushupsDone || sportsCount > 0;

  const isPushupsEnabled = enabledActivities ? enabledActivities.includes('pushups') : true;
  const isSportsEnabled = enabledActivities ? enabledActivities.includes('sports') : true;
  const isMovementEnabled = isPushupsEnabled || isSportsEnabled;
  const movementRatio = isMovementEnabled ? (movementDone ? 1 : 0) : 0;

  // Water: Proportional to goal
  const waterValue = Number.isFinite(safeTracking.water) ? Math.max(safeTracking.water ?? 0, 0) : 0;
  const isWaterEnabled = enabledActivities ? enabledActivities.includes('water') : true;
  const waterRatio = isWaterEnabled && waterGoal > 0 ? clamp(waterValue / waterGoal) : 0;

  // Protein: Proportional to goal
  const proteinValue = Number.isFinite(safeTracking.protein) ? Math.max(safeTracking.protein ?? 0, 0) : 0;
  const isProteinEnabled = enabledActivities ? enabledActivities.includes('protein') : true;
  const proteinRatio = isProteinEnabled && proteinGoal > 0 ? clamp(proteinValue / proteinGoal) : 0;

  // Check-in: Average of sleep & recovery, reduced if sick
  let checkinRatio = 0;
  let hasCheckIn = false;
  if (checkIn && (checkIn.sleepScore || checkIn.recoveryScore)) {
    const sleepScore = Number.isFinite(checkIn.sleepScore) ? Math.max(Math.min(checkIn.sleepScore ?? 0, 10), 0) : 0;
    const recoveryScore = Number.isFinite(checkIn.recoveryScore) ? Math.max(Math.min(checkIn.recoveryScore ?? 0, 10), 0) : 0;
    const sick = Boolean(checkIn.sick);

    // Average sleep and recovery (both 0-10), convert to 0-1
    checkinRatio = ((sleepScore / 10) * 0.5 + (recoveryScore / 10) * 0.5) * (sick ? 0.5 : 1);
    hasCheckIn = true;
  }

  // Choose weights based on check-in availability
  const weights = hasCheckIn ? STREAK_WEIGHTS_WITH_CHECKIN : STREAK_WEIGHTS_BASE;

  // Calculate weighted score
  let score = 0;
  if (hasCheckIn) {
    const weightsWithCheckIn = weights as typeof STREAK_WEIGHTS_WITH_CHECKIN;
    score =
      movementRatio * weightsWithCheckIn.movement +
      waterRatio * weightsWithCheckIn.water +
      proteinRatio * weightsWithCheckIn.protein +
      checkinRatio * weightsWithCheckIn.checkin;
  } else {
    score =
      movementRatio * weights.movement +
      waterRatio * weights.water +
      proteinRatio * weights.protein;
  }

  const scorePercent = Math.round(clamp(score) * 100);
  const streakMet = scorePercent >= STREAK_COMPLETION_THRESHOLD;

  const result: DayStreakScoreResult = {
    score: scorePercent,
    streakMet,
    components: {
      movement: movementRatio,
      water: waterRatio,
      protein: proteinRatio,
      ...(hasCheckIn && { checkin: checkinRatio }),
    },
    weights: {
      movement: weights.movement,
      water: weights.water,
      protein: weights.protein,
      ...(hasCheckIn && { checkin: (weights as typeof STREAK_WEIGHTS_WITH_CHECKIN).checkin }),
    },
  };

  return result;
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
    weight: number;
  };
  ratios: {
    water: number;
    protein: number;
    movement: number;
    weight: number;
  };
  totals: {
    water: number;
    protein: number;
    weight: number | null;
  };
  goals: {
    water: number;
    protein: number;
  };
  movement: {
    pushupsDone: boolean;
    sportsCount: number;
  };
  weight: {
    logged: boolean;
  };
}

export function resolveWaterGoal(
  user?: Partial<Pick<User, 'weight' | 'hydrationGoalLiters'>> | null
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
  user?: Partial<Pick<User, 'weight' | 'proteinGoalGrams'>> | null
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
  const rawWeightValue = safeTracking.weight?.value;
  const hasWeightValue = Number.isFinite(rawWeightValue);
  const weightValue = hasWeightValue ? Math.max(rawWeightValue ?? 0, 0) : 0;
  const pushupsDone = Boolean(safeTracking.pushups?.total && safeTracking.pushups.total > 0);
  const sportsCount = countActiveSports(safeTracking.sports);
  const movementDone = pushupsDone || sportsCount > 0;

  const isWaterEnabled = enabledActivities ? enabledActivities.includes('water') : true;
  const isProteinEnabled = enabledActivities ? enabledActivities.includes('protein') : true;
  const isPushupsEnabled = enabledActivities ? enabledActivities.includes('pushups') : true;
  const isSportsEnabled = enabledActivities ? enabledActivities.includes('sports') : true;
  const isMovementEnabled = isPushupsEnabled || isSportsEnabled;
  const isWeightEnabled = enabledActivities
    ? enabledActivities.includes('weight')
    : Boolean(safeTracking.weight);

  const hasProteinGoal = isProteinEnabled && proteinGoal > 0;

  const baseWeights = {
    water: isWaterEnabled ? 0.4 : 0,
    protein: hasProteinGoal ? 0.4 : 0,
    movement: isMovementEnabled ? 0.2 : 0,
    weight: isWeightEnabled ? 0.2 : 0,
  };

  const weightSum =
    baseWeights.water + baseWeights.protein + baseWeights.movement + baseWeights.weight;

  const normalizedWeights = weightSum > 0
    ? {
        water: baseWeights.water / weightSum,
        protein: baseWeights.protein / weightSum,
        movement: baseWeights.movement / weightSum,
        weight: baseWeights.weight / weightSum,
      }
    : { water: 0, protein: 0, movement: 0, weight: 0 };

  const waterRatio = waterGoal > 0 ? clamp(waterValue / waterGoal) : 0;
  const proteinRatio = proteinGoal > 0 ? clamp(proteinValue / proteinGoal) : 0;
  const movementRatio = movementDone ? 1 : 0;
  const weightRatio = isWeightEnabled ? (hasWeightValue ? 1 : 0) : 0;

  const completion =
    waterRatio * normalizedWeights.water +
    proteinRatio * normalizedWeights.protein +
    movementRatio * normalizedWeights.movement +
    weightRatio * normalizedWeights.weight;

  const percent = Math.round(clamp(completion) * 100);

  return {
    percent,
    weights: normalizedWeights,
    ratios: {
      water: waterRatio,
      protein: proteinRatio,
      movement: movementRatio,
      weight: weightRatio,
    },
    totals: {
      water: waterValue,
      protein: proteinValue,
      weight: hasWeightValue ? weightValue : null,
    },
    goals: {
      water: isWaterEnabled ? waterGoal : 0,
      protein: hasProteinGoal ? proteinGoal : 0,
    },
    movement: {
      pushupsDone,
      sportsCount,
    },
    weight: {
      logged: hasWeightValue,
    },
  };
}

export interface DayProgressSummary {
  readonly tasksCompleted: number;
  readonly tasksTotal: number;
  readonly percent: number;
  readonly streakMet: boolean;
  readonly streakScore?: number; // NEW: Weighted streak score (0-100)
}

interface DayTaskSummaryInput {
  readonly tracking?: Partial<DailyTracking>;
  readonly checkIn?: Partial<DailyCheckIn> | null; // NEW: Optional check-in data
  readonly user?:
    | Partial<
        Pick<
          User,
          'weight' | 'hydrationGoalLiters' | 'proteinGoalGrams' | 'enabledActivities'
        >
      >
    | null;
  readonly enabledActivities?: Activity[];
}

const DEFAULT_ENABLED_ACTIVITIES: Activity[] = [
  'pushups',
  'sports',
  'water',
  'protein',
];

function resolveEnabledActivities(
  input?: Pick<User, 'enabledActivities'> | null,
  override?: Activity[]
): Activity[] {
  if (override && override.length > 0) {
    return override;
  }
  if (input?.enabledActivities && input.enabledActivities.length > 0) {
    return input.enabledActivities;
  }
  return DEFAULT_ENABLED_ACTIVITIES;
}

/**
 * Calculates daily progress summary with task completion and streak status
 *
 * This function now uses the new weighted streak score calculation (getDayStreakScore)
 * which considers movement, water, protein, and optionally check-in data.
 *
 * @param input - Tracking data, optional check-in data, user data
 * @returns Progress summary with task counts and streak status
 */
export function getDayProgressSummary({
  tracking,
  checkIn,
  user,
  enabledActivities,
}: DayTaskSummaryInput): DayProgressSummary {
  const safeTracking = tracking ?? {};
  const resolvedActivities = resolveEnabledActivities(user ?? undefined, enabledActivities);
  const activitySet = new Set<Activity>(resolvedActivities);

  const waterGoal = resolveWaterGoal(user);
  const proteinGoal = resolveProteinGoal(user);
  const sportsCount = countActiveSports(safeTracking.sports);
  const pushupsDone = Boolean(safeTracking.pushups?.total && safeTracking.pushups.total > 0);
  const waterDone = activitySet.has('water')
    ? Number.isFinite(safeTracking.water) && (safeTracking.water ?? 0) >= waterGoal && waterGoal > 0
    : false;
  const proteinDone = activitySet.has('protein')
    ? Number.isFinite(safeTracking.protein) && (safeTracking.protein ?? 0) >= proteinGoal && proteinGoal > 0
    : false;
  const movementEnabled = activitySet.has('pushups') || activitySet.has('sports');
  const movementDone = movementEnabled ? pushupsDone || sportsCount > 0 : false;

  const tasks = [
    { enabled: activitySet.has('water'), completed: waterDone },
    { enabled: activitySet.has('protein') && proteinGoal > 0, completed: proteinDone },
    { enabled: movementEnabled, completed: movementDone },
  ];

  const tasksTotal = tasks.reduce((total, task) => (task.enabled ? total + 1 : total), 0);
  const tasksCompleted = tasks.reduce(
    (total, task) => (task.enabled && task.completed ? total + 1 : total),
    0
  );

  const percent = Math.round(
    (tasksCompleted / Math.max(1, tasksTotal)) * 100
  );

  // NEW: Use weighted streak score calculation
  const streakResult = getDayStreakScore({
    tracking: safeTracking,
    checkIn,
    user,
    enabledActivities: resolvedActivities,
  });

  return {
    tasksCompleted,
    tasksTotal,
    percent,
    streakMet: streakResult.streakMet, // Use new weighted calculation
    streakScore: streakResult.score, // Include score for debugging/display
  };
}

/**
 * Calculates the current streak (consecutive days meeting streak criteria)
 *
 * Uses the new weighted streak score calculation (getDayStreakScore).
 * A day counts if score >= STREAK_COMPLETION_THRESHOLD (70%).
 *
 * @param tracking - All tracking data (key: YYYY-MM-DD)
 * @param checkIns - Optional check-in data (key: YYYY-MM-DD)
 * @param user - User data for goals
 * @param enabledActivities - Activities to consider
 * @returns Number of consecutive days meeting streak criteria
 */
export function calculateCompletionStreak(
  tracking: Record<string, Partial<DailyTracking>>,
  checkIns?: Record<string, Partial<DailyCheckIn>> | null,
  user?: Partial<Pick<User, 'weight' | 'hydrationGoalLiters' | 'proteinGoalGrams'>> | null,
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
    const dayCheckIn = checkIns && Object.prototype.hasOwnProperty.call(checkIns, key)
      ? checkIns[key]
      : null;

    // Use new weighted streak score calculation
    const streakResult = getDayStreakScore({
      tracking: dayTracking,
      checkIn: dayCheckIn,
      user,
      enabledActivities,
    });

    if (!streakResult.streakMet) {
      break;
    }

    streak += 1;
    cursor = addDays(cursor, -1);
  }

  return streak;
}
