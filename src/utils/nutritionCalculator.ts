/**
 * Nutrition calculation utilities
 * Handles portion-based calculations and macro validation
 */

import type { FoodItem } from '../data/foodDatabase';

export interface NutritionResult {
  calories: number; // kcal
  proteinG: number;
  carbsG: number;
  fatG: number;
  fiberG?: number;
}

/**
 * Calculate nutrition for a given portion size
 * All values in FoodItem are per 100g, scale proportionally
 */
export function calculateNutrition(foodItem: FoodItem, portionGrams: number): NutritionResult {
  const ratio = portionGrams / 100;

  return {
    calories: Math.round(foodItem.calories * ratio),
    proteinG: Math.round(foodItem.proteinG * ratio * 10) / 10, // 1 decimal
    carbsG: Math.round(foodItem.carbsG * ratio * 10) / 10,
    fatG: Math.round(foodItem.fatG * ratio * 10) / 10,
    fiberG: foodItem.fiberG ? Math.round(foodItem.fiberG * ratio * 10) / 10 : undefined,
  };
}

/**
 * Calculate calories from macros using 4-4-9 rule
 * Protein: 4 kcal/g, Carbs: 4 kcal/g, Fat: 9 kcal/g
 */
export function calculateCaloriesFromMacros(
  proteinG: number,
  carbsG: number,
  fatG: number
): number {
  return Math.round(proteinG * 4 + carbsG * 4 + fatG * 9);
}

/**
 * Calculate macros from calories and percentages
 * Useful for goal setting
 */
export function calculateMacrosFromCalories(
  totalCalories: number,
  proteinPercent: number, // 0-100
  carbsPercent: number, // 0-100
  fatPercent: number // 0-100
): NutritionResult {
  // Ensure percentages sum to 100
  const total = proteinPercent + carbsPercent + fatPercent;
  if (Math.abs(total - 100) > 0.1) {
    throw new Error('Macro percentages must sum to 100');
  }

  const proteinCals = (totalCalories * proteinPercent) / 100;
  const carbsCals = (totalCalories * carbsPercent) / 100;
  const fatCals = (totalCalories * fatPercent) / 100;

  return {
    calories: totalCalories,
    proteinG: Math.round((proteinCals / 4) * 10) / 10,
    carbsG: Math.round((carbsCals / 4) * 10) / 10,
    fatG: Math.round((fatCals / 9) * 10) / 10,
  };
}

/**
 * Validation error interface
 */
export interface NutritionValidationError {
  field: 'calories' | 'proteinG' | 'carbsG' | 'fatG' | 'portionGrams';
  message: string;
}

/**
 * Validate nutrition input from manual entry
 */
export function validateNutrition(
  nutrition: Partial<NutritionResult>
): NutritionValidationError | null {
  if (nutrition.calories !== undefined) {
    if (nutrition.calories < 0) {
      return { field: 'calories', message: 'Calories cannot be negative' };
    }
    if (nutrition.calories > 10000) {
      return { field: 'calories', message: 'Calories must be less than 10,000' };
    }
  }

  if (nutrition.proteinG !== undefined) {
    if (nutrition.proteinG < 0) {
      return { field: 'proteinG', message: 'Protein cannot be negative' };
    }
    if (nutrition.proteinG > 500) {
      return { field: 'proteinG', message: 'Protein must be less than 500g' };
    }
  }

  if (nutrition.carbsG !== undefined) {
    if (nutrition.carbsG < 0) {
      return { field: 'carbsG', message: 'Carbs cannot be negative' };
    }
    if (nutrition.carbsG > 1000) {
      return { field: 'carbsG', message: 'Carbs must be less than 1,000g' };
    }
  }

  if (nutrition.fatG !== undefined) {
    if (nutrition.fatG < 0) {
      return { field: 'fatG', message: 'Fat cannot be negative' };
    }
    if (nutrition.fatG > 500) {
      return { field: 'fatG', message: 'Fat must be less than 500g' };
    }
  }

  return null;
}

/**
 * Validate portion size input
 */
export function validatePortionGrams(grams: number): NutritionValidationError | null {
  if (!Number.isFinite(grams)) {
    return { field: 'portionGrams', message: 'Portion must be a valid number' };
  }
  if (grams <= 0) {
    return { field: 'portionGrams', message: 'Portion must be greater than 0' };
  }
  if (grams > 5000) {
    return { field: 'portionGrams', message: 'Portion must be less than 5,000g' };
  }
  return null;
}

/**
 * Sum multiple nutrition results
 * Useful for calculating daily totals
 */
export function sumNutrition(items: NutritionResult[]): NutritionResult {
  const result: NutritionResult = {
    calories: 0,
    proteinG: 0,
    carbsG: 0,
    fatG: 0,
  };

  for (const item of items) {
    result.calories += item.calories;
    result.proteinG += item.proteinG;
    result.carbsG += item.carbsG;
    result.fatG += item.fatG;
    if (item.fiberG !== undefined) {
      result.fiberG = (result.fiberG || 0) + item.fiberG;
    }
  }

  // Round to 1 decimal
  result.proteinG = Math.round(result.proteinG * 10) / 10;
  result.carbsG = Math.round(result.carbsG * 10) / 10;
  result.fatG = Math.round(result.fatG * 10) / 10;
  if (result.fiberG !== undefined) {
    result.fiberG = Math.round(result.fiberG * 10) / 10;
  }

  return result;
}

/**
 * Format nutrition for display
 */
export function formatNutrition(nutrition: NutritionResult, language: 'de' | 'en'): string {
  const parts: string[] = [];

  if (nutrition.calories > 0) {
    parts.push(`${nutrition.calories} kcal`);
  }
  if (nutrition.proteinG > 0) {
    parts.push(`${nutrition.proteinG}g ${language === 'de' ? 'E' : 'P'}`);
  }
  if (nutrition.carbsG > 0) {
    parts.push(`${nutrition.carbsG}g ${language === 'de' ? 'K' : 'C'}`);
  }
  if (nutrition.fatG > 0) {
    parts.push(`${nutrition.fatG}g F`);
  }

  return parts.join(' · ');
}

/**
 * Format a single nutrition value for display with proper rounding
 * Handles JavaScript floating-point precision issues
 * @param value - Raw nutritional value
 * @param decimals - Decimal places to show (default: 1)
 * @returns Formatted string suitable for display
 */
export const formatNutritionValue = (
  value: number,
  decimals: number = 1
): string => {
  if (!Number.isFinite(value)) {
    return '0';
  }
  return Number(value.toFixed(decimals)).toString();
};

/**
 * Format complete nutrition result for display with proper rounding
 * @param result - NutritionResult object
 * @returns Object with formatted string values
 */
export const formatNutritionForDisplay = (result: NutritionResult) => {
  return {
    calories: formatNutritionValue(result.calories, 0),
    protein: formatNutritionValue(result.proteinG, 1),
    carbs: formatNutritionValue(result.carbsG, 1),
    fat: formatNutritionValue(result.fatG, 1),
  };
};

/**
 * Check if nutrition values are reasonable based on macros
 * Warns if calories don't match macros (4-4-9 rule)
 */
export function validateMacroConsistency(
  nutrition: NutritionResult
): { consistent: boolean; expectedCalories?: number } {
  if (!nutrition.proteinG && !nutrition.carbsG && !nutrition.fatG) {
    return { consistent: true };
  }

  const expectedCalories = calculateCaloriesFromMacros(
    nutrition.proteinG,
    nutrition.carbsG,
    nutrition.fatG
  );

  // Allow 10% variance
  const variance = Math.abs(nutrition.calories - expectedCalories) / expectedCalories;

  return {
    consistent: variance <= 0.1,
    expectedCalories,
  };
}
