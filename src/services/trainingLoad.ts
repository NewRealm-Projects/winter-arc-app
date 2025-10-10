import type {
  TrainingLoadComputationInput,
  TrainingLoadComputationResult,
  WorkoutEntry,
  DailyTracking,
} from '../types';
import { normalizeSports } from '../utils/sports';

const TRAINING_LOAD_CAP = 1000;
const PUSHUP_MINUTE_FACTOR = 0.15 / 10; // minutes per pushup
const PUSHUP_INTENSITY_FACTOR = 0.9;

const CATEGORY_MULTIPLIER: Record<string, number> = {
  easy: 0.8,
  mod: 1.0,
  hard: 1.3,
  race: 1.6,
};

const clamp = (value: number, min: number, max: number): number => {
  if (Number.isNaN(value)) {
    return min;
  }
  if (value < min) {
    return min;
  }
  if (value > max) {
    return max;
  }
  return value;
};

const resolveMultiplier = (workout: WorkoutEntry): number => {
  if (typeof workout.intensity === 'number') {
    const intensity = clamp(Math.round(workout.intensity), 1, 10);
    return 0.6 + 0.1 * intensity;
  }

  if (workout.category && CATEGORY_MULTIPLIER[workout.category]) {
    return CATEGORY_MULTIPLIER[workout.category];
  }

  return CATEGORY_MULTIPLIER.mod;
};

const computeBaseFromWorkouts = (workouts: WorkoutEntry[], pushupsReps: number): number => {
  const workoutsLoad = workouts.reduce((total, workout) => {
    if (workout.durationMinutes <= 0) {
      return total;
    }
    const multiplier = resolveMultiplier(workout);
    return total + workout.durationMinutes * multiplier;
  }, 0);

  const pushupDuration = clamp(pushupsReps, 0, Number.POSITIVE_INFINITY) * PUSHUP_MINUTE_FACTOR;
  const pushupLoad = pushupDuration * PUSHUP_INTENSITY_FACTOR;

  return workoutsLoad + pushupLoad;
};

export function computeDailyTrainingLoadV1(
  params: TrainingLoadComputationInput
): TrainingLoadComputationResult {
  const sessionLoad = computeBaseFromWorkouts(params.workouts, 0); // Base workouts without pushups

  const sleepScore = clamp(Math.round(params.sleepScore), 1, 10);
  const recoveryScore = clamp(Math.round(params.recoveryScore), 1, 10);
  const sick = Boolean(params.sick);

  // Wellness modifier: combines sleep, recovery, and sickness
  // Formula: 0.6 + 0.04*recovery + 0.02*sleep - (sick? 0.3 : 0)
  // Range: [0.4, 1.4] to prevent extreme values
  const wellnessModRaw = 0.6 + 0.04 * recoveryScore + 0.02 * sleepScore - (sick ? 0.3 : 0);
  const wellnessMod = clamp(wellnessModRaw, 0.4, 1.4);

  // Pushup adjustment: Add pushups as a bonus (capped at 20% of session load)
  const pushupAdjRaw = (params.pushupsReps / 100) * sessionLoad;
  const pushupAdj = Math.min(pushupAdjRaw, 0.2 * sessionLoad);

  // Final training load
  const loadRaw = (sessionLoad + pushupAdj) * wellnessMod;
  const load = Math.round(clamp(loadRaw, 0, TRAINING_LOAD_CAP));

  return {
    load,
    components: {
      baseFromWorkouts: sessionLoad,
      modifierSleep: wellnessMod, // Store combined wellness mod for backwards compatibility
      modifierRecovery: wellnessMod,
      modifierSick: wellnessMod,
    },
    inputs: {
      sleepScore,
      recoveryScore,
      sick,
    },
  };
}

export const buildWorkoutEntriesFromTracking = (tracking?: DailyTracking): WorkoutEntry[] => {
  if (!tracking) {
    return [];
  }

  const normalized = normalizeSports(tracking.sports);

  return Object.values(normalized).reduce<WorkoutEntry[]>((acc, entry) => {
    if (!entry.active) {
      return acc;
    }

    const duration = typeof entry.duration === 'number' ? entry.duration : 0;
    if (duration <= 0) {
      return acc;
    }

    acc.push({
      durationMinutes: duration,
      intensity: typeof entry.intensity === 'number' ? entry.intensity : undefined,
    });
    return acc;
  }, []);
};

export const resolvePushupsFromTracking = (tracking?: DailyTracking): number => {
  if (!tracking) {
    return 0;
  }

  if (typeof tracking.pushups?.total === 'number') {
    return tracking.pushups.total;
  }

  const reps = tracking.pushups?.workout?.reps ?? [];
  return reps.reduce((total, value) => total + value, 0);
};

export const trainingLoadService = {
  computeDailyTrainingLoadV1,
  buildWorkoutEntriesFromTracking,
  resolvePushupsFromTracking,
};
