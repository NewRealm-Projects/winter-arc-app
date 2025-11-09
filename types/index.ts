// Barrel re-export for tests expecting '@/types'
export type { User, Group, TrackingEntry, NewUser } from '../lib/db/schema';
// Domain specific types that may be needed by tests (stubs)
// Align with app/types/tracking WorkoutEntry to satisfy tests
export interface WorkoutEntry { durationMinutes: number; intensity?: number; category?: string }
export interface DailyTracking {
  date: string;
  water?: number;
  protein?: number;
  calories?: number;
  carbsG?: number;
  fatG?: number;
  sports?: Record<string, { active?: boolean; duration?: number; intensity?: number }>;
  weight?: { value: number; bodyFat?: number; bmi?: number };
  pushups?: { total?: number; workout?: any };
  completed?: boolean;
}
