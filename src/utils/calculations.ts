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
 * Berechnet den Streak (aufeinanderfolgende Tage mit mindestens 3/5 Tasks)
 * @param tracking Tracking-Daten (key: YYYY-MM-DD, value: DailyTracking)
 * @returns Anzahl aufeinanderfolgender Tage mit mindestens 3/5 erledigten Tasks
 */
export function calculateStreak(tracking: Record<string, { pushups?: { total?: number }; sports?: Record<string, boolean>; water?: number; protein?: number; weight?: { value?: number } }>): number {
  const dates = Object.keys(tracking).sort().reverse();
  if (dates.length === 0) return 0;

  let streak = 0;
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  for (let i = 0; i < dates.length; i++) {
    const dateStr = dates[i];
    const dayTracking = tracking[dateStr];
    const date = new Date(dateStr);
    date.setHours(0, 0, 0, 0);

    // Check if day has at least 3/5 tasks completed
    const hasPushups = (dayTracking?.pushups?.total || 0) > 0;
    const hasSports = Object.values(dayTracking?.sports || {}).some(Boolean);
    const hasWater = (dayTracking?.water || 0) >= 2000; // Goal: 2L
    const hasProtein = (dayTracking?.protein || 0) >= 100; // Goal: 100g
    const hasWeight = !!dayTracking?.weight?.value; // Weight entered

    const tasksCompleted = [hasPushups, hasSports, hasWater, hasProtein, hasWeight].filter(Boolean).length;
    const isCompleted = tasksCompleted >= 3; // At least 3 tasks required

    if (!isCompleted) {
      // Day doesn't meet 3/5 requirement - stop counting
      break;
    }

    // Check if it's consecutive with previous day (or today for first iteration)
    if (i === 0) {
      // First iteration - check if it's today or yesterday
      const diffDays = Math.floor((today.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
      if (diffDays > 1) {
        // Gap detected - no current streak
        break;
      }
      streak = 1;
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
