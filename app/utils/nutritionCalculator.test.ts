import { describe, it, expect } from 'vitest';
import {
  calculateNutrition,
  calculateCaloriesFromMacros,
  calculateMacrosFromCalories,
  validateNutrition,
} from './nutritionCalculator';
import type { FoodItem } from '../data/foodDatabase';

describe('nutritionCalculator', () => {
  describe('calculateNutrition', () => {
    const sampleFood: FoodItem = {
      id: 'test-food',
      name: { en: 'Test Food', de: 'Testessen' },
      category: 'proteins',
      calories: 200,
      proteinG: 25,
      carbsG: 10,
      fatG: 8,
      fiberG: 2,
    };

    // Happy path tests
    it('should calculate nutrition for 100g (base case)', () => {
      const result = calculateNutrition(sampleFood, 100);

      expect(result.calories).toBe(200);
      expect(result.proteinG).toBe(25);
      expect(result.carbsG).toBe(10);
      expect(result.fatG).toBe(8);
      expect(result.fiberG).toBe(2);
    });

    it('should calculate nutrition for 200g (double)', () => {
      const result = calculateNutrition(sampleFood, 200);

      expect(result.calories).toBe(400);
      expect(result.proteinG).toBe(50);
      expect(result.carbsG).toBe(20);
      expect(result.fatG).toBe(16);
      expect(result.fiberG).toBe(4);
    });

    it('should calculate nutrition for 50g (half)', () => {
      const result = calculateNutrition(sampleFood, 50);

      expect(result.calories).toBe(100);
      expect(result.proteinG).toBe(12.5);
      expect(result.carbsG).toBe(5);
      expect(result.fatG).toBe(4);
      expect(result.fiberG).toBe(1);
    });

    it('should round calories to nearest integer', () => {
      const food: FoodItem = {
        ...sampleFood,
        calories: 155,
      };

      const result = calculateNutrition(food, 137);

      expect(Number.isInteger(result.calories)).toBe(true);
    });

    it('should round macros to 1 decimal place', () => {
      const result = calculateNutrition(sampleFood, 33);

      expect(result.proteinG.toString().split('.')[1]?.length || 0).toBeLessThanOrEqual(1);
      expect(result.carbsG.toString().split('.')[1]?.length || 0).toBeLessThanOrEqual(1);
      expect(result.fatG.toString().split('.')[1]?.length || 0).toBeLessThanOrEqual(1);
    });

    // Edge cases
    it('should handle zero portion size', () => {
      const result = calculateNutrition(sampleFood, 0);

      expect(result.calories).toBe(0);
      expect(result.proteinG).toBe(0);
      expect(result.carbsG).toBe(0);
      expect(result.fatG).toBe(0);
      expect(result.fiberG).toBe(0);
    });

    it('should handle very small portions', () => {
      const result = calculateNutrition(sampleFood, 1);

      expect(result.calories).toBeGreaterThanOrEqual(0);
      expect(result.proteinG).toBeGreaterThanOrEqual(0);
    });

    it('should handle very large portions', () => {
      const result = calculateNutrition(sampleFood, 10000);

      expect(result.calories).toBe(20000);
      expect(result.proteinG).toBe(2500);
    });

    it('should handle food without fiber', () => {
      const foodNoFiber: FoodItem = {
        ...sampleFood,
        fiberG: undefined,
      };

      const result = calculateNutrition(foodNoFiber, 100);

      expect(result.fiberG).toBeUndefined();
    });

    it('should handle decimal portion sizes', () => {
      const result = calculateNutrition(sampleFood, 33.5);

      expect(result.calories).toBeGreaterThan(0);
      expect(result.proteinG).toBeGreaterThan(0);
    });
  });

  describe('calculateCaloriesFromMacros', () => {
    // Happy path tests
    it('should calculate calories using 4-4-9 rule', () => {
      const calories = calculateCaloriesFromMacros(25, 30, 10);

      // 25*4 + 30*4 + 10*9 = 100 + 120 + 90 = 310
      expect(calories).toBe(310);
    });

    it('should round to nearest integer', () => {
      const calories = calculateCaloriesFromMacros(25.5, 30.3, 10.7);

      expect(Number.isInteger(calories)).toBe(true);
    });

    it('should handle zero macros', () => {
      const calories = calculateCaloriesFromMacros(0, 0, 0);

      expect(calories).toBe(0);
    });

    it('should handle only protein', () => {
      const calories = calculateCaloriesFromMacros(50, 0, 0);

      expect(calories).toBe(200); // 50 * 4
    });

    it('should handle only carbs', () => {
      const calories = calculateCaloriesFromMacros(0, 100, 0);

      expect(calories).toBe(400); // 100 * 4
    });

    it('should handle only fat', () => {
      const calories = calculateCaloriesFromMacros(0, 0, 20);

      expect(calories).toBe(180); // 20 * 9
    });

    // Edge cases
    it('should handle decimal values', () => {
      const calories = calculateCaloriesFromMacros(10.5, 20.3, 5.7);

      expect(Number.isInteger(calories)).toBe(true);
      expect(calories).toBeGreaterThan(0);
    });

    it('should handle very large macro values', () => {
      const calories = calculateCaloriesFromMacros(200, 300, 100);

      expect(calories).toBe(2700); // 800 + 1200 + 900
    });

    it('should handle very small macro values', () => {
      const calories = calculateCaloriesFromMacros(0.1, 0.1, 0.1);

      expect(calories).toBeGreaterThanOrEqual(0);
    });
  });

  describe('calculateMacrosFromCalories', () => {
    // Happy path tests
    it('should calculate macros from calories with standard split', () => {
      const result = calculateMacrosFromCalories(2000, 30, 40, 30);

      expect(result.calories).toBe(2000);
      expect(result.proteinG).toBe(150); // 600 cal / 4
      expect(result.carbsG).toBe(200); // 800 cal / 4
      expect(result.fatG).toBeCloseTo(66.7, 1); // 600 cal / 9
    });

    it('should handle high protein split', () => {
      const result = calculateMacrosFromCalories(2000, 40, 30, 30);

      expect(result.proteinG).toBe(200); // 800 cal / 4
      expect(result.carbsG).toBe(150); // 600 cal / 4
      expect(result.fatG).toBeCloseTo(66.7, 1); // 600 cal / 9
    });

    it('should handle high carb split', () => {
      const result = calculateMacrosFromCalories(2000, 20, 60, 20);

      expect(result.proteinG).toBe(100); // 400 cal / 4
      expect(result.carbsG).toBe(300); // 1200 cal / 4
      expect(result.fatG).toBeCloseTo(44.4, 1); // 400 cal / 9
    });

    it('should round macros to 1 decimal place', () => {
      const result = calculateMacrosFromCalories(2000, 33.33, 33.33, 33.34);

      expect(result.proteinG.toString().split('.')[1]?.length || 0).toBeLessThanOrEqual(1);
      expect(result.carbsG.toString().split('.')[1]?.length || 0).toBeLessThanOrEqual(1);
      expect(result.fatG.toString().split('.')[1]?.length || 0).toBeLessThanOrEqual(1);
    });

    // Edge cases
    it('should throw error if percentages do not sum to 100', () => {
      expect(() => {
        calculateMacrosFromCalories(2000, 30, 30, 30); // Sums to 90
      }).toThrow('Macro percentages must sum to 100');
    });

    it('should throw error if percentages sum to > 100', () => {
      expect(() => {
        calculateMacrosFromCalories(2000, 40, 40, 40); // Sums to 120
      }).toThrow('Macro percentages must sum to 100');
    });

    it('should handle percentages that sum to 100 with floating point precision', () => {
      const result = calculateMacrosFromCalories(2000, 33.33, 33.33, 33.34);

      expect(result.calories).toBe(2000);
      expect(result.proteinG).toBeGreaterThan(0);
      expect(result.carbsG).toBeGreaterThan(0);
      expect(result.fatG).toBeGreaterThan(0);
    });

    it('should handle zero calories', () => {
      const result = calculateMacrosFromCalories(0, 30, 40, 30);

      expect(result.calories).toBe(0);
      expect(result.proteinG).toBe(0);
      expect(result.carbsG).toBe(0);
      expect(result.fatG).toBe(0);
    });

    it('should handle extreme splits (100% protein)', () => {
      const result = calculateMacrosFromCalories(2000, 100, 0, 0);

      expect(result.proteinG).toBe(500);
      expect(result.carbsG).toBe(0);
      expect(result.fatG).toBe(0);
    });

    it('should handle extreme splits (100% fat)', () => {
      const result = calculateMacrosFromCalories(2000, 0, 0, 100);

      expect(result.proteinG).toBe(0);
      expect(result.carbsG).toBe(0);
      expect(result.fatG).toBeCloseTo(222.2, 1);
    });
  });

  describe('validateNutrition', () => {
    // Happy path tests
    it('should return null for valid nutrition', () => {
      const error = validateNutrition({
        calories: 500,
        proteinG: 30,
        carbsG: 50,
        fatG: 15,
      });

      expect(error).toBeNull();
    });

    it('should return null for partial valid nutrition', () => {
      const error = validateNutrition({
        calories: 500,
      });

      expect(error).toBeNull();
    });

    it('should return null for empty nutrition object', () => {
      const error = validateNutrition({});

      expect(error).toBeNull();
    });

    // Calories validation
    it('should reject negative calories', () => {
      const error = validateNutrition({ calories: -100 });

      expect(error).not.toBeNull();
      expect(error?.field).toBe('calories');
      expect(error?.message).toContain('negative');
    });

    it('should reject calories > 10000', () => {
      const error = validateNutrition({ calories: 10001 });

      expect(error).not.toBeNull();
      expect(error?.field).toBe('calories');
      expect(error?.message).toContain('10,000');
    });

    it('should accept calories at boundary (0)', () => {
      const error = validateNutrition({ calories: 0 });

      expect(error).toBeNull();
    });

    it('should accept calories at boundary (10000)', () => {
      const error = validateNutrition({ calories: 10000 });

      expect(error).toBeNull();
    });

    // Protein validation
    it('should reject negative protein', () => {
      const error = validateNutrition({ proteinG: -5 });

      expect(error).not.toBeNull();
      expect(error?.field).toBe('proteinG');
      expect(error?.message).toContain('negative');
    });

    it('should reject protein > 500', () => {
      const error = validateNutrition({ proteinG: 501 });

      expect(error).not.toBeNull();
      expect(error?.field).toBe('proteinG');
      expect(error?.message).toContain('500');
    });

    it('should accept protein at boundary (0)', () => {
      const error = validateNutrition({ proteinG: 0 });

      expect(error).toBeNull();
    });

    it('should accept protein at boundary (500)', () => {
      const error = validateNutrition({ proteinG: 500 });

      expect(error).toBeNull();
    });

    // Carbs validation
    it('should reject negative carbs', () => {
      const error = validateNutrition({ carbsG: -10 });

      expect(error).not.toBeNull();
      expect(error?.field).toBe('carbsG');
      expect(error?.message).toContain('negative');
    });

    it('should reject carbs > 1000', () => {
      const error = validateNutrition({ carbsG: 1001 });

      expect(error).not.toBeNull();
      expect(error?.field).toBe('carbsG');
      expect(error?.message).toContain('1,000');
    });

    it('should accept carbs at boundary (0)', () => {
      const error = validateNutrition({ carbsG: 0 });

      expect(error).toBeNull();
    });

    it('should accept carbs at boundary (1000)', () => {
      const error = validateNutrition({ carbsG: 1000 });

      expect(error).toBeNull();
    });

    // Fat validation
    it('should reject negative fat', () => {
      const error = validateNutrition({ fatG: -3 });

      expect(error).not.toBeNull();
      expect(error?.field).toBe('fatG');
      expect(error?.message).toContain('negative');
    });

    it('should reject fat > 500', () => {
      const error = validateNutrition({ fatG: 501 });

      expect(error).not.toBeNull();
      expect(error?.field).toBe('fatG');
      expect(error?.message).toContain('500');
    });

    it('should accept fat at boundary (0)', () => {
      const error = validateNutrition({ fatG: 0 });

      expect(error).toBeNull();
    });

    it('should accept fat at boundary (500)', () => {
      const error = validateNutrition({ fatG: 500 });

      expect(error).toBeNull();
    });

    // Multiple fields validation
    it('should return first error when multiple fields are invalid', () => {
      const error = validateNutrition({
        calories: -100,
        proteinG: -5,
      });

      expect(error).not.toBeNull();
      expect(error?.field).toBe('calories'); // First field checked
    });

    it('should validate all fields independently', () => {
      const errors = [
        validateNutrition({ calories: -1 }),
        validateNutrition({ proteinG: -1 }),
        validateNutrition({ carbsG: -1 }),
        validateNutrition({ fatG: -1 }),
      ];

      errors.forEach((error) => {
        expect(error).not.toBeNull();
      });
    });

    // Edge cases
    it('should handle decimal values within range', () => {
      const error = validateNutrition({
        calories: 250.5,
        proteinG: 12.7,
        carbsG: 33.3,
        fatG: 8.9,
      });

      expect(error).toBeNull();
    });

    it('should handle very small positive values', () => {
      const error = validateNutrition({
        calories: 0.1,
        proteinG: 0.01,
        carbsG: 0.001,
        fatG: 0.0001,
      });

      expect(error).toBeNull();
    });
  });
});