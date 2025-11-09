export type CheckInSource = 'manual';

export interface DailyCheckIn {
  date: string;
  sleepScore: number;
  recoveryScore: number;
  sick: boolean;
  createdAt: Date | string;
  updatedAt: Date | string;
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
  createdAt: Date | string;
  updatedAt: Date | string;
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

export type ActivityType = 'running' | 'cycling' | 'strength' | 'hiit' | 'mobility' | 'other';

export type IntensityLevel = 'low' | 'medium' | 'high';

export interface CheckInActivity {
  id: string;
  type: ActivityType;
  durationMinutes: number;
  intensity: number; // 1-10 scale
}

export interface CheckInPreset {
  id: string;
  nameKey: string;
  sleepScore: number;
  recoveryScore: number;
  sick: boolean;
  activities: Omit<CheckInActivity, 'id'>[];
}

