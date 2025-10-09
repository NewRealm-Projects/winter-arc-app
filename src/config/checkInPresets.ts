import type { CheckInPreset } from '../types/tracking';

export const CHECK_IN_PRESETS: CheckInPreset[] = [
  {
    id: 'check-in-only',
    nameKey: 'checkIn.presets.checkInOnly',
    sleepScore: 7,
    recoveryScore: 7,
    sick: false,
    activities: [],
  },
  {
    id: 'easy-run',
    nameKey: 'checkIn.presets.easyRun',
    sleepScore: 7,
    recoveryScore: 7,
    sick: false,
    activities: [
      {
        type: 'running',
        durationMinutes: 45,
        intensity: 5,
      },
    ],
  },
  {
    id: 'strength-session',
    nameKey: 'checkIn.presets.strengthSession',
    sleepScore: 7,
    recoveryScore: 7,
    sick: false,
    activities: [
      {
        type: 'strength',
        durationMinutes: 60,
        intensity: 6,
      },
    ],
  },
  {
    id: 'hiit-workout',
    nameKey: 'checkIn.presets.hiitWorkout',
    sleepScore: 7,
    recoveryScore: 7,
    sick: false,
    activities: [
      {
        type: 'hiit',
        durationMinutes: 30,
        intensity: 8,
      },
    ],
  },
  {
    id: 'recovery-day',
    nameKey: 'checkIn.presets.recoveryDay',
    sleepScore: 8,
    recoveryScore: 6,
    sick: false,
    activities: [
      {
        type: 'mobility',
        durationMinutes: 20,
        intensity: 3,
      },
    ],
  },
  {
    id: 'sick-day',
    nameKey: 'checkIn.presets.sickDay',
    sleepScore: 5,
    recoveryScore: 4,
    sick: true,
    activities: [],
  },
];
