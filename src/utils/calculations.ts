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
 * Berechnet den Streak (aufeinanderfolgende Tage)
 * @param dates Array von Daten (YYYY-MM-DD) sortiert
 * @returns Anzahl aufeinanderfolgender Tage
 */
export function calculateStreak(dates: string[]): number {
  if (dates.length === 0) return 0;

  let streak = 1;
  const sortedDates = [...dates].sort().reverse();

  for (let i = 0; i < sortedDates.length - 1; i++) {
    const current = new Date(sortedDates[i]);
    const next = new Date(sortedDates[i + 1]);
    const diffDays = Math.floor(
      (current.getTime() - next.getTime()) / (1000 * 60 * 60 * 24)
    );

    if (diffDays === 1) {
      streak++;
    } else {
      break;
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
  return new Intl.DateFormat('de-DE').format(d);
}
