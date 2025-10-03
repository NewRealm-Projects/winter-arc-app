import { PushupState, SetTarget, WorkoutStatus, TrackingRecord, DailyTracking } from '../types';

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

/**
 * Generiert einen neuen Trainingsplan basierend auf der Historie
 * @param previousTotal Summe der Liegestütze vom letzten Training (oder initial basierend auf maxReps)
 * @param daysCompleted Anzahl der absolvierten Trainingstage (für progressiven Anstieg)
 * @returns Array mit 5 Sätzen in absteigender Reihenfolge
 */
export function generateProgressivePlan(
  previousTotal: number,
  _daysCompleted: number
): number[] {
  // Heute wird die Summe um 1 erhöht (progressiver Overload)
  const totalToday = previousTotal + 1;

  // Verteile die Gesamtsumme auf 5 Sätze in absteigender Reihenfolge
  // Strategie: Gleichmäßiger Abstand zwischen den Sätzen

  // Berechne durchschnittliche Wiederholungen pro Satz
  const average = totalToday / 5;

  // Wir wollen einen Abstand von ca. 3 Wiederholungen zwischen den Sätzen
  // So dass: s1 > s2 > s3 > s4 > s5
  // Mit: s1 + s2 + s3 + s4 + s5 = totalToday

  // Mittlerer Satz (s3) = Durchschnitt
  const middle = Math.round(average);

  // Abstand zwischen Sätzen (ca. 3, aber anpassbar basierend auf total)
  const gap = Math.max(2, Math.floor(totalToday / 25));

  let sets = [
    middle + gap * 2,     // Satz 1
    middle + gap,         // Satz 2
    middle,               // Satz 3
    middle - gap,         // Satz 4
    middle - gap * 2,     // Satz 5
  ];

  // Stelle sicher, dass alle Sätze mindestens 1 Wiederholung haben
  sets = sets.map(s => Math.max(1, s));

  // Korrigiere die Summe, falls durch Rundung Abweichungen entstanden sind
  const currentSum = sets.reduce((a, b) => a + b, 0);
  const diff = totalToday - currentSum;

  if (diff !== 0) {
    // Verteile die Differenz auf die Sätze (bevorzugt auf die ersten Sätze)
    sets[0] += diff;
  }

  return sets;
}

/**
 * Ermittelt die letzte Liegestütze-Summe aus der Tracking-Historie
 * @param tracking Tracking-Daten
 * @returns Letzte Gesamtsumme oder 0 wenn keine Historie vorhanden
 */
export function getLastPushupTotal(tracking: TrackingRecord): number {
  const dates = Object.keys(tracking).sort().reverse();

  for (const date of dates) {
    const dayData = tracking[date];
    if (dayData?.pushups?.total && dayData.pushups.total > 0) {
      return dayData.pushups.total;
    }
  }

  return 0;
}

/**
 * Zählt die Anzahl der Tage mit absolvierten Liegestützen
 * @param tracking Tracking-Daten
 * @returns Anzahl der Trainingstage
 */
export function countPushupDays(tracking: TrackingRecord): number {
  return Object.values(tracking).filter(
    (day: DailyTracking) => day?.pushups?.total && day.pushups.total > 0
  ).length;
}
