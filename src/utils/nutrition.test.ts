import { describe, it, expect } from 'vitest';
import {
  calculateTDEE,
  calculateProteinGoal,
  calculateCarbsGoal,
  calculateFatGoal,
  calculateNutritionGoals,
} from './nutrition';

describe('nutrition.ts', () => {
  describe('calculateTDEE', () => {
    it('should calculate TDEE with body fat % (LBM method)', () => {
      // 80kg, 15% body fat, moderate activity
      // LBM = 80 * (1 - 0.15) = 68kg
      // TDEE = 68 * 40 = 2720 kcal
      expect(calculateTDEE(80, 'moderate', 15)).toBe(2720);
    });

    it('should calculate TDEE without body fat % (fallback method)', () => {
      // 80kg, no body fat, moderate activity
      // Fallback multiplier = 40 * 0.8 = 32
      // TDEE = 80 * 32 = 2560 kcal
      expect(calculateTDEE(80, 'moderate')).toBe(2560);
    });

    it('should calculate TDEE for sedentary activity level', () => {
      // 80kg, 15% body fat, sedentary
      // LBM = 68kg, TDEE = 68 * 30 = 2040 kcal
      expect(calculateTDEE(80, 'sedentary', 15)).toBe(2040);
    });

    it('should calculate TDEE for light activity level', () => {
      // 80kg, 15% body fat, light
      // LBM = 68kg, TDEE = 68 * 35 = 2380 kcal
      expect(calculateTDEE(80, 'light', 15)).toBe(2380);
    });

    it('should calculate TDEE for active level', () => {
      // 80kg, 15% body fat, active
      // LBM = 68kg, TDEE = 68 * 45 = 3060 kcal
      expect(calculateTDEE(80, 'active', 15)).toBe(3060);
    });

    it('should calculate TDEE for very_active level', () => {
      // 80kg, 15% body fat, very_active
      // LBM = 68kg, TDEE = 68 * 50 = 3400 kcal
      expect(calculateTDEE(80, 'very_active', 15)).toBe(3400);
    });

    it('should handle different body fat percentages', () => {
      // 80kg, 25% body fat, moderate
      // LBM = 80 * 0.75 = 60kg, TDEE = 60 * 40 = 2400 kcal
      expect(calculateTDEE(80, 'moderate', 25)).toBe(2400);
    });

    it('should handle low weight', () => {
      // 50kg, 15% body fat, moderate
      // LBM = 50 * 0.85 = 42.5kg, TDEE = 42.5 * 40 = 1700 kcal
      expect(calculateTDEE(50, 'moderate', 15)).toBe(1700);
    });

    it('should handle high weight', () => {
      // 120kg, 15% body fat, moderate
      // LBM = 120 * 0.85 = 102kg, TDEE = 102 * 40 = 4080 kcal
      expect(calculateTDEE(120, 'moderate', 15)).toBe(4080);
    });

    it('should return 0 for weight = 0', () => {
      expect(calculateTDEE(0, 'moderate', 15)).toBe(0);
    });

    it('should return 0 for negative weight', () => {
      expect(calculateTDEE(-10, 'moderate', 15)).toBe(0);
    });

    it('should handle body fat = 0% (edge case)', () => {
      // 80kg, 0% body fat, moderate
      // LBM = 80kg, TDEE = 80 * 40 = 3200 kcal
      expect(calculateTDEE(80, 'moderate', 0)).toBe(3200);
    });

    it('should handle body fat = 100% (edge case)', () => {
      // 80kg, 100% body fat, moderate
      // LBM = 0kg, TDEE = 0 kcal
      expect(calculateTDEE(80, 'moderate', 100)).toBe(0);
    });

    it('should use fallback for negative body fat', () => {
      // Invalid body fat, should use fallback
      expect(calculateTDEE(80, 'moderate', -5)).toBe(2560);
    });

    it('should use fallback for body fat > 100', () => {
      // Invalid body fat, should use fallback
      expect(calculateTDEE(80, 'moderate', 150)).toBe(2560);
    });

    it('should default to moderate activity level if not specified', () => {
      expect(calculateTDEE(80, undefined, 15)).toBe(2720);
    });
  });

  describe('calculateProteinGoal', () => {
    it('should calculate protein goal at 2g per kg', () => {
      expect(calculateProteinGoal(80)).toBe(160); // 80 * 2 = 160g
    });

    it('should handle low weight', () => {
      expect(calculateProteinGoal(50)).toBe(100); // 50 * 2 = 100g
    });

    it('should handle high weight', () => {
      expect(calculateProteinGoal(120)).toBe(240); // 120 * 2 = 240g
    });

    it('should return 0 for weight = 0', () => {
      expect(calculateProteinGoal(0)).toBe(0);
    });

    it('should return 0 for negative weight', () => {
      expect(calculateProteinGoal(-10)).toBe(0);
    });

    it('should round to nearest integer', () => {
      expect(calculateProteinGoal(75.5)).toBe(151); // 75.5 * 2 = 151
    });
  });

  describe('calculateCarbsGoal', () => {
    it('should calculate carbs goal at 40% of TDEE', () => {
      // 2500 kcal TDEE
      // Carbs = (2500 * 0.40) / 4 = 250g
      expect(calculateCarbsGoal(2500)).toBe(250);
    });

    it('should handle low TDEE', () => {
      // 1500 kcal TDEE
      // Carbs = (1500 * 0.40) / 4 = 150g
      expect(calculateCarbsGoal(1500)).toBe(150);
    });

    it('should handle high TDEE', () => {
      // 4000 kcal TDEE
      // Carbs = (4000 * 0.40) / 4 = 400g
      expect(calculateCarbsGoal(4000)).toBe(400);
    });

    it('should return 0 for TDEE = 0', () => {
      expect(calculateCarbsGoal(0)).toBe(0);
    });

    it('should return 0 for negative TDEE', () => {
      expect(calculateCarbsGoal(-100)).toBe(0);
    });

    it('should round to nearest integer', () => {
      // 2222 kcal TDEE
      // Carbs = (2222 * 0.40) / 4 = 222.2g → 222g
      expect(calculateCarbsGoal(2222)).toBe(222);
    });
  });

  describe('calculateFatGoal', () => {
    it('should calculate fat goal at 30% of TDEE', () => {
      // 2700 kcal TDEE
      // Fat = (2700 * 0.30) / 9 = 90g
      expect(calculateFatGoal(2700)).toBe(90);
    });

    it('should handle low TDEE', () => {
      // 1500 kcal TDEE
      // Fat = (1500 * 0.30) / 9 = 50g
      expect(calculateFatGoal(1500)).toBe(50);
    });

    it('should handle high TDEE', () => {
      // 4000 kcal TDEE
      // Fat = (4000 * 0.30) / 9 ≈ 133.33g → 133g
      expect(calculateFatGoal(4000)).toBe(133);
    });

    it('should return 0 for TDEE = 0', () => {
      expect(calculateFatGoal(0)).toBe(0);
    });

    it('should return 0 for negative TDEE', () => {
      expect(calculateFatGoal(-100)).toBe(0);
    });

    it('should round to nearest integer', () => {
      // 2500 kcal TDEE
      // Fat = (2500 * 0.30) / 9 ≈ 83.33g → 83g
      expect(calculateFatGoal(2500)).toBe(83);
    });
  });

  describe('calculateNutritionGoals', () => {
    it('should calculate all goals for typical user', () => {
      // 80kg, 15% body fat, moderate activity
      const goals = calculateNutritionGoals(80, 'moderate', 15);
      expect(goals).toEqual({
        calories: 2720,
        protein: 160,
        carbs: 272, // (2720 * 0.40) / 4 = 272g
        fat: 91, // (2720 * 0.30) / 9 ≈ 90.67g → 91g
      });
    });

    it('should calculate goals without body fat %', () => {
      // 80kg, no body fat, moderate activity
      const goals = calculateNutritionGoals(80, 'moderate');
      expect(goals).toEqual({
        calories: 2560,
        protein: 160,
        carbs: 256, // (2560 * 0.40) / 4 = 256g
        fat: 85, // (2560 * 0.30) / 9 ≈ 85.33g → 85g
      });
    });

    it('should calculate goals for sedentary user', () => {
      const goals = calculateNutritionGoals(80, 'sedentary', 15);
      expect(goals).toEqual({
        calories: 2040,
        protein: 160,
        carbs: 204,
        fat: 68,
      });
    });

    it('should calculate goals for very active user', () => {
      const goals = calculateNutritionGoals(80, 'very_active', 15);
      expect(goals).toEqual({
        calories: 3400,
        protein: 160,
        carbs: 340,
        fat: 113,
      });
    });

    it('should return zeros for invalid weight', () => {
      const goals = calculateNutritionGoals(0, 'moderate', 15);
      expect(goals).toEqual({
        calories: 0,
        protein: 0,
        carbs: 0,
        fat: 0,
      });
    });
  });
});
