/**
 * Streak completion threshold (percentage)
 * A day counts towards the streak if the weighted daily score is >= this threshold
 * Updated from 50% to 70% for more challenging streak criteria (2025-10-10)
 */
export const STREAK_COMPLETION_THRESHOLD = 70;

/**
 * Streak score weights when check-in data is NOT available
 * Movement (pushups + sports) is core to the app
 */
export const STREAK_WEIGHTS_BASE = {
  movement: 0.4,  // 40%
  water: 0.3,     // 30%
  protein: 0.3,   // 30%
} as const;

/**
 * Streak score weights when check-in data IS available
 * Check-in (sleep + recovery) adds 15% to overall health tracking
 */
export const STREAK_WEIGHTS_WITH_CHECKIN = {
  movement: 0.35,  // 35%
  water: 0.25,     // 25%
  protein: 0.25,   // 25%
  checkin: 0.15,   // 15%
} as const;
