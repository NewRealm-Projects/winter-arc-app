export type Gender = 'male' | 'female' | 'diverse';

export type Language = 'de' | 'en';

export type Activity = 'pushups' | 'sports' | 'water' | 'protein' | 'weight';

export type ActivityLevel = 'sedentary' | 'light' | 'moderate' | 'active' | 'very_active';

export type WorkoutStatus = 'pass' | 'hold' | 'fail';

export type SportKey = 'hiit' | 'cardio' | 'gym' | 'schwimmen' | 'soccer' | 'rest';

export interface SportEntry {
  active: boolean;
  duration?: number;
  intensity?: number;
}

export type SportTracking = Record<SportKey, boolean | SportEntry>;

export interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export interface User {
  id: string;
  language: Language;
  nickname: string;
  gender: Gender;
  height: number; // cm
  weight: number; // kg
  hydrationGoalLiters?: number;
  proteinGoalGrams?: number;
  bodyFat?: number; // %
  activityLevel?: ActivityLevel; // User's activity level for TDEE calculation (default: 'moderate')
  maxPushups: number;
  groupCode: string;
  birthday?: string; // YYYY-MM-DD
  photoURL?: string; // Profile picture URL (Firebase Storage)
  shareProfilePicture?: boolean; // Allow profile picture to be visible in leaderboard
  enabledActivities?: Activity[]; // Activities user wants to track (default: all)
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
  sports: SportTracking;
  water: number; // ml
  protein: number; // g
  calories?: number; // kcal
  carbsG?: number; // g
  fatG?: number; // g
  recovery?: {
    sleepQuality?: number;
    recovery?: number;
    illness?: boolean;
  };
  weight?: {
    value: number; // kg
    bodyFat?: number; // %
    bmi?: number;
  };
  completed: boolean;
}

export interface SmartTrackingContribution {
  water?: number;
  protein?: number;
  pushups?: number;
  sports?: Partial<Record<SportKey, SportEntry>>;
  weight?: {
    value?: number;
    bodyFat?: number;
  };
  calories?: number;
  carbsG?: number;
  fatG?: number;
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

export interface GroupMember extends User {
  dailyPushups: number;
  totalPushups: number;
  sportSessions: number;
  streak: number;
  avgWater: number;
  avgProtein: number;
}

// Alias for backwards compatibility
export type UserWithStats = GroupMember;

export type TrackingRecord = Record<string, DailyTracking>;

export interface SetTarget {
  number: number;
  target: number;
  type: 'fixed' | 'amrap';
}

export * from './tracking';
