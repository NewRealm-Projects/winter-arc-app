export type Gender = 'male' | 'female' | 'diverse';

export type Language = 'de' | 'en';

export type WorkoutStatus = 'pass' | 'hold' | 'fail';

export interface User {
  id: string;
  language: Language;
  nickname: string;
  gender: Gender;
  height: number; // cm
  weight: number; // kg
  bodyFat?: number; // %
  maxPushups: number;
  groupCode: string;
  birthday?: string; // YYYY-MM-DD
  createdAt: Date;
  pushupState: PushupState;
}

export interface PushupState {
  baseReps: number;
  sets: number;
  restTime: number; // seconds
}

export interface PushupWorkout {
  reps: number[];
  status: WorkoutStatus;
  timestamp: Date;
}

export interface DailyTracking {
  date: string; // YYYY-MM-DD
  pushups?: {
    total?: number;
    workout?: PushupWorkout;
  };
  sports: {
    hiit: boolean;
    cardio: boolean;
    gym: boolean;
    schwimmen: boolean;
    soccer: boolean;
    rest: boolean;
  };
  water: number; // ml
  protein: number; // g
  weight?: {
    value: number; // kg
    bodyFat?: number; // %
    bmi?: number;
  };
  completed: boolean;
}

export interface Group {
  code: string;
  name: string;
  members: string[]; // userIds
  createdAt: Date;
}

export interface LeaderboardEntry {
  userId: string;
  nickname: string;
  score: number;
  totalPushups: number;
  sportSessions: number;
  streak: number;
}

export interface SetTarget {
  number: number;
  target: number;
  type: 'fixed' | 'amrap';
}
