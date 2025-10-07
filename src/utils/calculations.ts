import { countActiveSports } from './sports';
import type { SportTracking, Activity } from '../types';
import { STREAK_COMPLETION_THRESHOLD } from '../constants/streak';

/**
 * Berechnet den BMI (Body Mass Index)
 * @param weight Gewicht in kg
 * @param height Größe in cm
 * @returns BMI
 */
export function calculateBMI(weight: number, height: number): number {
  const heightInMeters = height / 100;
  return Number((weight / (heightInMeters * heightInMeters)).toFixed(1));
}

/**
 * Berechnet das empfohlene tägliche Proteinziel basierend auf Körpergewicht
 * @param weight Gewicht in kg
 * @param multiplier Multiplikator (Standard: 2g pro kg für aktive Personen)
 * @returns Protein in Gramm
 */
export function calculateProteinGoal(
  weight: number,
  multiplier: number = 2
): number {
  return Math.round(weight * multiplier);
}

/**
 * Berechnet das empfohlene tägliche Wasserziel basierend auf Körpergewicht
 * @param weight Gewicht in kg
 * @param multiplier Multiplikator in ml pro kg (Standard: 35ml pro kg)
 * @returns Wasser in Milliliter
 */
export function calculateWaterGoal(
  weight: number,
  multiplier: number = 35
): number {
  return Math.round(weight * multiplier);
}

/**
 * Berechnet den Streak (aufeinanderfolgende Tage mit ausreichender Tageserfüllung)
 * @param tracking Tracking-Daten (key: YYYY-MM-DD, value: DailyTracking)
 * @param enabledActivities Array of enabled activities (default: all)
 * @returns Anzahl aufeinanderfolgender Tage mit mindestens 50% erfüllten Tasks
 */
export function calculateStreak(
  tracking: Record<string, { pushups?: { total?: number }; sports?: SportTracking; water?: number; protein?: number; weight?: { value?: number } }>,
  enabledActivities: Activity[] = ['pushups', 'sports', 'water', 'protein']
): number {
  const dates = Object.keys(tracking).sort().reverse();
  if (dates.length === 0) return 0;

  // Total tasks = enabled activities + weight (always tracked)
  const totalTasks = enabledActivities.length + 1;
  const completionThreshold = STREAK_COMPLETION_THRESHOLD / 100;
  const requiredTasks = Math.max(1, Math.ceil(totalTasks * completionThreshold));

  let streak = 0;
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  for (let i = 0; i < dates.length; i++) {
    const dateStr = dates[i];
    const dayTracking = tracking[dateStr];

    if (!dayTracking) {
      continue;
    }

    const { sports, water = 0, protein = 0, pushups, weight } = dayTracking;
    const date = new Date(dateStr);
    date.setHours(0, 0, 0, 0);

    // Count completed tasks based on enabled activities
    const completedTasks = [];

    if (enabledActivities.includes('pushups') && (pushups?.total || 0) > 0) {
      completedTasks.push('pushups');
    }
    if (enabledActivities.includes('sports') && countActiveSports(sports) > 0) {
      completedTasks.push('sports');
    }
    if (enabledActivities.includes('water') && water >= 2000) {
      completedTasks.push('water');
    }
    if (enabledActivities.includes('protein') && protein >= 100) {
      completedTasks.push('protein');
    }
    // Weight is always checked (mandatory)
    if (weight?.value) {
      completedTasks.push('weight');
    }

    const isCompleted = completedTasks.length >= requiredTasks;

    if (!isCompleted) {
      // Day doesn't meet required task threshold - stop counting
      break;
    }

    // Check if it's consecutive with previous day (or today for first iteration)
    if (i === 0) {
      // First iteration - check if it's today or yesterday
      const diffDays = Math.floor((today.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));

      // Count this day as the start of the streak
      streak = 1;

      if (diffDays > 1) {
        // Gap detected - this is an old streak, not current
        break;
      }
    } else {
      const prevDate = new Date(dates[i - 1]);
      prevDate.setHours(0, 0, 0, 0);
      const diffDays = Math.floor((prevDate.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));

      if (diffDays === 1) {
        streak++;
      } else {
        break;
      }
    }
  }

  return streak;
}

/**
 * Formatiert eine Zahl mit Tausendertrennzeichen
 */
export function formatNumber(num: number): string {
  return new Intl.NumberFormat('de-DE').format(num);
}

/**
 * Formatiert Datum in DD.MM.YYYY
 */
export function formatDate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return new Intl.DateTimeFormat('de-DE').format(d);
}
