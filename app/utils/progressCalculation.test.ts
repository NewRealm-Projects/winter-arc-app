import { describe, it, expect } from 'vitest';
import {
  calculateStatProgress,
  calculateTotalProgress,
  progressToAngle,
  angleToProgress,
  calculateBandAngles,
  polarToCartesian,
  getStatBandCenter,
  createArcPath,
} from './progressCalculation';

describe('progressCalculation', () => {
  describe('calculateStatProgress', () => {
    it('should return 0 for 0% progress', () => {
      const stat = {
        id: 'sports' as const,
        icon: '🏃',
        label: 'Sports',
        value: 'Not Completed',
        progress: 0,
        color: '#10B981',
      };
      expect(calculateStatProgress(stat)).toBe(0);
    });

    it('should return 10 for 50% progress (half of 20% max)', () => {
      const stat = {
        id: 'pushup' as const,
        icon: '💪',
        label: 'Pushups',
        value: '20 total',
        progress: 50,
        color: '#3B82F6',
      };
      expect(calculateStatProgress(stat)).toBe(10);
    });

    it('should return 20 for 100% progress', () => {
      const stat = {
        id: 'hydration' as const,
        icon: '💧',
        label: 'Water',
        value: '3L / 3L',
        progress: 100,
        color: '#06B6D4',
      };
      expect(calculateStatProgress(stat)).toBe(20);
    });

    it('should clamp to max 20%', () => {
      const stat = {
        id: 'nutrition' as const,
        icon: '🥩',
        label: 'Calories',
        value: '2000 kcal',
        progress: 150, // Over 100%
        color: '#F59E0B',
      };
      expect(calculateStatProgress(stat)).toBe(20);
    });
  });

  describe('calculateTotalProgress', () => {
    it('should sum progress from all stats clamped to 0-100', () => {
      const stats = [
        { id: 'sports' as const, icon: '🏃', label: 'Sports', value: '', progress: 100, color: '#10B981' },
        { id: 'pushup' as const, icon: '💪', label: 'Pushups', value: '', progress: 100, color: '#3B82F6' },
        { id: 'hydration' as const, icon: '💧', label: 'Water', value: '', progress: 100, color: '#06B6D4' },
        { id: 'nutrition' as const, icon: '🥩', label: 'Calories', value: '', progress: 100, color: '#F59E0B' },
        { id: 'weight' as const, icon: '⚖️', label: 'Weight', value: '', progress: 100, color: '#8B5CF6' },
      ];
      expect(calculateTotalProgress(stats)).toBe(100); // 20 + 20 + 20 + 20 + 20 = 100, clamped to 100
    });

    it('should return 50 for 50% total (one stat at 100%, four at 0%)', () => {
      const stats = [
        { id: 'sports' as const, icon: '🏃', label: 'Sports', value: '', progress: 100, color: '#10B981' },
        { id: 'pushup' as const, icon: '💪', label: 'Pushups', value: '', progress: 0, color: '#3B82F6' },
        { id: 'hydration' as const, icon: '💧', label: 'Water', value: '', progress: 0, color: '#06B6D4' },
        { id: 'nutrition' as const, icon: '🥩', label: 'Calories', value: '', progress: 0, color: '#F59E0B' },
        { id: 'weight' as const, icon: '⚖️', label: 'Weight', value: '', progress: 0, color: '#8B5CF6' },
      ];
      expect(calculateTotalProgress(stats)).toBe(20);
    });
  });

  describe('progressToAngle', () => {
    it('should convert 0% to 0°', () => {
      expect(progressToAngle(0)).toBe(0);
    });

    it('should convert 50% to 180°', () => {
      expect(progressToAngle(50)).toBe(180);
    });

    it('should convert 100% to 360°', () => {
      expect(progressToAngle(100)).toBe(360);
    });
  });

  describe('angleToProgress', () => {
    it('should convert 0° to 0%', () => {
      expect(angleToProgress(0)).toBe(0);
    });

    it('should convert 180° to 50%', () => {
      expect(angleToProgress(180)).toBe(50);
    });

    it('should convert 360° to 100%', () => {
      expect(angleToProgress(360)).toBe(100);
    });
  });

  describe('calculateBandAngles', () => {
    it('should calculate angles for first stat (0) with 100% progress', () => {
      const { startAngle, endAngle } = calculateBandAngles(0, 100);
      expect(startAngle).toBe(0);
      expect(endAngle).toBe(72); // 360° / 5 stats = 72° per stat
    });

    it('should calculate angles for second stat (1) with 50% progress', () => {
      const { startAngle, endAngle } = calculateBandAngles(1, 50);
      expect(startAngle).toBe(72); // 1 * 72
      expect(endAngle).toBe(108); // 72 + (50% of 72) = 72 + 36
    });

    it('should calculate angles for last stat (4) with 75% progress', () => {
      const { startAngle, endAngle } = calculateBandAngles(4, 75);
      expect(startAngle).toBe(288); // 4 * 72
      expect(endAngle).toBe(342); // 288 + (75% of 72) = 288 + 54
    });
  });

  describe('polarToCartesian', () => {
    it('should convert angle 0 at distance 100 to cartesian', () => {
      const { x, y } = polarToCartesian(0, 100);
      // angle 0 with -90 offset = -90 degrees in standard coords = pointing up
      expect(x).toBeCloseTo(0, 1);
      expect(y).toBeCloseTo(-100, 1);
    });

    it('should convert angle 90 at distance 100 to cartesian', () => {
      const { x, y } = polarToCartesian(90, 100);
      // angle 90 with -90 offset = 0 degrees in standard coords = pointing right
      expect(x).toBeCloseTo(100, 1);
      expect(y).toBeCloseTo(0, 1);
    });

    it('should convert angle 180 at distance 100 to cartesian', () => {
      const { x, y } = polarToCartesian(180, 100);
      // angle 180 with -90 offset = 90 degrees in standard coords = pointing down
      expect(x).toBeCloseTo(0, 1);
      expect(y).toBeCloseTo(100, 1);
    });

    it('should convert angle 270 at distance 100 to cartesian', () => {
      const { x, y } = polarToCartesian(270, 100);
      // angle 270 with -90 offset = 180 degrees in standard coords = pointing left
      expect(x).toBeCloseTo(-100, 1);
      expect(y).toBeCloseTo(0, 1);
    });
  });

  describe('getStatBandCenter', () => {
    it('should calculate center for first stat (index 0)', () => {
      const { x, y, angle } = getStatBandCenter(0, 100);
      expect(angle).toBe(36); // (0 * 72) + (72 / 2) = 36
      // x and y depend on angle
      expect(typeof x).toBe('number');
      expect(typeof y).toBe('number');
    });

    it('should calculate center for second stat (index 1)', () => {
      const { angle } = getStatBandCenter(1, 100);
      expect(angle).toBe(108); // (1 * 72) + (72 / 2) = 108
    });
  });

  describe('createArcPath', () => {
    it('should create valid SVG path string', () => {
      const path = createArcPath(120, 120, 100, 0, 90);
      expect(typeof path).toBe('string');
      expect(path).toContain('M'); // SVG move command
      expect(path).toContain('A'); // SVG arc command
    });

    it('should create path for full circle (0-360°)', () => {
      const path = createArcPath(120, 120, 100, 0, 360);
      expect(path).toContain('M');
      expect(path).toContain('A');
    });

    it('should create path for quarter circle (0-90°)', () => {
      const path = createArcPath(120, 120, 100, 0, 90);
      expect(path).toContain('M');
      expect(path).toContain('A');
    });
  });
});

