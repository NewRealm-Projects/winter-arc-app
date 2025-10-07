export interface DaySession {
  type: string;
  duration: number;
  intensity: number;
}

export interface DayRecovery {
  sleepQuality: number;
  recovery: number;
  illness: boolean;
  pushupsTotal?: number;
  sessions?: DaySession[];
}

const MAX_TRAINING_LOAD = 1500;
const PUSHUP_LOAD_FACTOR = 0.8;

const clamp = (value: number, min: number, max: number): number => {
  if (Number.isNaN(value)) {
    return min;
  }
  return Math.min(Math.max(value, min), max);
};

const computeSessionLoad = (session: DaySession): number => {
  const safeDuration = clamp(session.duration, 0, Number.POSITIVE_INFINITY);
  const safeIntensity = clamp(session.intensity, 0, Number.POSITIVE_INFINITY);
  return safeDuration * safeIntensity;
};

export function computeTrainingLoad(input: DayRecovery): number {
  const sessionLoad = (input.sessions ?? []).reduce<number>((sum, session) => {
    return sum + computeSessionLoad(session);
  }, 0);

  const pushupLoad = input.pushupsTotal ? input.pushupsTotal * PUSHUP_LOAD_FACTOR : 0;
  const baseLoad = sessionLoad + pushupLoad;

  const sleepScore = clamp(input.sleepQuality, 0, 10);
  const recoveryScore = clamp(input.recovery, 0, 10);

  let modifier = clamp((sleepScore + recoveryScore) / 20, 0, 1);
  if (input.illness) {
    modifier *= 0.6;
  }

  const load = Math.round(baseLoad * modifier);
  return clamp(load, 0, MAX_TRAINING_LOAD);
}

export const trainingLoadUtils = {
  clamp,
  computeSessionLoad,
};
