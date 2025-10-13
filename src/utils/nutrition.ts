import type { ActivityLevel } from '../types';

/**
 * Activity level multipliers for TDEE calculation (kcal per kg of Lean Body Mass)
 * Based on Katch-McArdle formula with activity level adjustments
 */
const ACTIVITY_MULTIPLIERS: Record<ActivityLevel, number> = {
  sedentary: 30, // Wenig Bewegung, Bürojob
  light: 35, // 1-2x Sport/Woche
  moderate: 40, // 3-4x Sport/Woche (Default)
  active: 45, // 5-6x Sport/Woche
  very_active: 50, // Täglich Sport, körperlich anstrengender Job
};

const DEFAULT_ACTIVITY_LEVEL: ActivityLevel = 'moderate';
const PROTEIN_PER_KG = 2.0; // 2g protein per kg bodyweight
const CARBS_PERCENTAGE = 0.4; // 40% of calories from carbs
const FAT_PERCENTAGE = 0.3; // 30% of calories from fat
const KCAL_PER_G_CARBS = 4; // 4 kcal per gram of carbs
const KCAL_PER_G_FAT = 9; // 9 kcal per gram of fat
const FALLBACK_MULTIPLIER_RATIO = 0.8; // 80% of LBM multiplier for bodyweight fallback

/**
 * Calculate Total Daily Energy Expenditure (TDEE) based on weight, body fat %, and activity level
 * Uses Lean Body Mass (LBM) when body fat % is available, otherwise uses adjusted bodyweight
 *
 * @param weight - User's weight in kg
 * @param activityLevel - User's activity level (default: 'moderate')
 * @param bodyFat - User's body fat percentage (optional)
 * @returns Estimated TDEE in kcal
 */
export function calculateTDEE(
  weight: number,
  activityLevel: ActivityLevel = DEFAULT_ACTIVITY_LEVEL,
  bodyFat?: number
): number {
  if (weight <= 0) {
    return 0;
  }

  const multiplier = ACTIVITY_MULTIPLIERS[activityLevel];

  if (bodyFat !== undefined && bodyFat >= 0 && bodyFat <= 100) {
    // Use Lean Body Mass (LBM) for more accurate TDEE
    const leanMass = weight * (1 - bodyFat / 100);
    return Math.round(leanMass * multiplier);
  }

  // Fallback: Use adjusted bodyweight multiplier
  const fallbackMultiplier = multiplier * FALLBACK_MULTIPLIER_RATIO;
  return Math.round(weight * fallbackMultiplier);
}

/**
 * Calculate daily protein goal based on bodyweight
 * Standard recommendation: 2g per kg bodyweight
 *
 * @param weight - User's weight in kg
 * @returns Daily protein goal in grams
 */
export function calculateProteinGoal(weight: number): number {
  if (weight <= 0) {
    return 0;
  }
  return Math.round(weight * PROTEIN_PER_KG);
}

/**
 * Calculate daily carbohydrates goal based on TDEE
 * Standard recommendation: 40% of total daily calories from carbs
 *
 * @param tdee - Total Daily Energy Expenditure in kcal
 * @returns Daily carbs goal in grams
 */
export function calculateCarbsGoal(tdee: number): number {
  if (tdee <= 0) {
    return 0;
  }
  return Math.round((tdee * CARBS_PERCENTAGE) / KCAL_PER_G_CARBS);
}

/**
 * Calculate daily fat goal based on TDEE
 * Standard recommendation: 30% of total daily calories from fat
 *
 * @param tdee - Total Daily Energy Expenditure in kcal
 * @returns Daily fat goal in grams
 */
export function calculateFatGoal(tdee: number): number {
  if (tdee <= 0) {
    return 0;
  }
  return Math.round((tdee * FAT_PERCENTAGE) / KCAL_PER_G_FAT);
}

/**
 * Calculate all nutrition goals for a user
 * Returns calories (TDEE), protein, carbs, and fat goals
 *
 * @param weight - User's weight in kg
 * @param activityLevel - User's activity level (default: 'moderate')
 * @param bodyFat - User's body fat percentage (optional)
 * @returns Object with all nutrition goals
 */
export function calculateNutritionGoals(
  weight: number,
  activityLevel: ActivityLevel = DEFAULT_ACTIVITY_LEVEL,
  bodyFat?: number
) {
  const tdee = calculateTDEE(weight, activityLevel, bodyFat);
  const protein = calculateProteinGoal(weight);
  const carbs = calculateCarbsGoal(tdee);
  const fat = calculateFatGoal(tdee);

  return {
    calories: tdee,
    protein,
    carbs,
    fat,
  };
}
