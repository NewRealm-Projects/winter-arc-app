import { PushupState, SetTarget, WorkoutStatus } from '../types';

/**
 * Initialisiert den Liegestütze-Trainingsplan basierend auf den maximalen Wiederholungen
 */
export function initPushupPlan(maxReps: number): PushupState {
  const B = Math.max(3, Math.floor(0.45 * maxReps));
  return {
    baseReps: B,
    sets: 5,
    restTime: 90, // Sekunden
  };
}

/**
 * Gibt den täglichen Trainingsplan zurück
 */
export function getDailyPlan(state: PushupState): SetTarget[] {
  return [
    { number: 1, target: state.baseReps, type: 'fixed' },
    { number: 2, target: state.baseReps, type: 'fixed' },
    { number: 3, target: state.baseReps, type: 'fixed' },
    { number: 4, target: state.baseReps, type: 'fixed' },
    { number: 5, target: state.baseReps + 2, type: 'amrap' }, // AMRAP mit Limit
  ];
}

/**
 * Wertet das Training aus und berechnet den neuen Zustand
 */
export function evaluateWorkout(
  state: PushupState,
  reps: number[]
): { newState: PushupState; status: WorkoutStatus } {
  const B = state.baseReps;
  const hit = reps.slice(0, 4).filter((r) => r >= B).length;
  const amrapOk = reps[4] >= B;

  let nextB: number;
  let status: WorkoutStatus;

  if (hit === 4 && amrapOk) {
    nextB = B + 1; // Progress
    status = 'pass';
  } else if (hit === 3 || (hit === 4 && reps[4] === B - 1)) {
    nextB = B; // Hold
    status = 'hold';
  } else {
    nextB = Math.max(3, B - 1); // Regression
    status = 'fail';
  }

  // Deload Guard
  const nextSets = nextB * 5 > 120 ? 4 : 5;

  return {
    newState: {
      baseReps: nextB,
      sets: nextSets,
      restTime: state.restTime,
    },
    status,
  };
}

/**
 * Berechnet die Gesamtanzahl der Liegestütze aus einem Workout
 */
export function calculateTotalReps(reps: number[]): number {
  return reps.reduce((sum, r) => sum + r, 0);
}
