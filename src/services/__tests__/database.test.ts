import { calculateBMI } from '../database';

describe('database utils', () => {
  describe('calculateBMI', () => {
    it('should calculate BMI correctly for normal weight', () => {
      const bmi = calculateBMI(70, 175);
      expect(bmi).toBeCloseTo(22.86, 2);
    });

    it('should calculate BMI correctly for overweight', () => {
      const bmi = calculateBMI(90, 175);
      expect(bmi).toBeCloseTo(29.39, 2);
    });

    it('should calculate BMI correctly for underweight', () => {
      const bmi = calculateBMI(50, 175);
      expect(bmi).toBeCloseTo(16.33, 2);
    });

    it('should handle edge cases - very tall person', () => {
      const bmi = calculateBMI(80, 200);
      expect(bmi).toBeCloseTo(20.0, 2);
    });

    it('should handle edge cases - very short person', () => {
      const bmi = calculateBMI(60, 150);
      expect(bmi).toBeCloseTo(26.67, 2);
    });

    it('should return finite number', () => {
      const bmi = calculateBMI(70, 175);
      expect(Number.isFinite(bmi)).toBe(true);
    });
  });
});
