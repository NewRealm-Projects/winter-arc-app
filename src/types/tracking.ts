import type { FieldValue, Timestamp } from 'firebase/firestore';

export type CheckInSource = 'manual';

export interface DailyCheckIn {
  date: string;
  sleepScore: number;
  recoveryScore: number;
  sick: boolean;
  createdAt: Timestamp | FieldValue;
  updatedAt: Timestamp | FieldValue;
  source: CheckInSource;
  appVersion?: string;
}

export type TrainingLoadCalcVersion = 'v1';

export interface TrainingLoadComponents {
  baseFromWorkouts: number;
  modifierSleep: number;
  modifierRecovery: number;
  modifierSick: number;
}

export interface TrainingLoadInputs {
  sleepScore: number;
  recoveryScore: number;
  sick: boolean;
}

export interface DailyTrainingLoad {
  date: string;
  load: number;
  components: TrainingLoadComponents;
  inputs: TrainingLoadInputs;
  createdAt: Timestamp | FieldValue;
  updatedAt: Timestamp | FieldValue;
  calcVersion: TrainingLoadCalcVersion;
}

export type WorkoutCategory = 'easy' | 'mod' | 'hard' | 'race';

export interface WorkoutEntry {
  durationMinutes: number;
  intensity?: number;
  category?: WorkoutCategory;
}

export interface TrainingLoadComputationInput {
  workouts: WorkoutEntry[];
  pushupsReps: number;
  sleepScore: number;
  recoveryScore: number;
  sick: boolean;
}

export interface TrainingLoadComputationResult {
  load: number;
  components: TrainingLoadComponents;
  inputs: TrainingLoadInputs;
}
