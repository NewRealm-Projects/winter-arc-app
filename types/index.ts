// Barrel re-export for DB schema types (suffixed to avoid conflicts)
export type {
  User as DbUser,
  Group as DbGroup,
  TrackingEntry as DbTrackingEntry,
  NewUser as DbNewUser,
} from '../lib/db/schema';

// Re-export canonical app types for domain logic (these are the primary types)
export type {
  User,
  DailyTracking,
  WorkoutEntry,
  SportTracking,
  SportEntry,
  SportKey,
  Gender,
  Language,
  Activity,
  ActivityLevel,
  WorkoutStatus,
  PushupState,
  PushupWorkout,
  LeaderboardEntry,
  GroupMember,
  UserWithStats,
  TrackingRecord,
  SetTarget,
  SmartTrackingContribution,
  BeforeInstallPromptEvent,
  DrinkPreset,
  Group,
} from '../app/types';

