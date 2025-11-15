import { describe, it, expect } from 'vitest';
import {
  generateDrinkSummary,
  generateFoodSummary,
  generateWorkoutSummary,
  generateWeightSummary,
  generatePushupSummary,
  generateCustomNoteSummary,
  SUMMARY_MAX_ITEMS,
} from './activitySummary';

describe('activitySummary', () => {
  describe('generateDrinkSummary', () => {
    it('should format drink with capitalized beverage', () => {
      const result = generateDrinkSummary(250, 'water');
      expect(result.summary).toBe('250ml Water');
      expect(result.details).toBeUndefined();
    });

    it('should handle different beverages', () => {
      const result = generateDrinkSummary(330, 'coffee');
      expect(result.summary).toBe('330ml Coffee');
    });

    it('should capitalize first letter of beverage', () => {
      const result = generateDrinkSummary(500, 'juice');
      expect(result.summary).toBe('500ml Juice');
    });

    it('should handle already capitalized beverage', () => {
      const result = generateDrinkSummary(200, 'Tea');
      expect(result.summary).toBe('200ml Tea');
    });

    it('should handle small amounts', () => {
      const result = generateDrinkSummary(50, 'water');
      expect(result.summary).toBe('50ml Water');
    });

    it('should handle large amounts', () => {
      const result = generateDrinkSummary(2000, 'water');
      expect(result.summary).toBe('2000ml Water');
    });

    it('should handle zero amount', () => {
      const result = generateDrinkSummary(0, 'water');
      expect(result.summary).toBe('0ml Water');
    });

    it('should handle single character beverage', () => {
      const result = generateDrinkSummary(250, 'w');
      expect(result.summary).toBe('250ml W');
    });
  });

  describe('generateFoodSummary', () => {
    describe('manual macros entry', () => {
      it('should format manual macro entry', () => {
        const result = generateFoodSummary([], { calories: 450, protein: 35 });
        expect(result.summary).toBe('Meal: 450 kcal, 35g P');
        expect(result.details).toBeUndefined();
      });

      it('should handle zero calories', () => {
        const result = generateFoodSummary([], { calories: 0, protein: 0 });
        expect(result.summary).toBe('Meal: 0 kcal, 0g P');
      });

      it('should handle high values', () => {
        const result = generateFoodSummary([], { calories: 1500, protein: 120 });
        expect(result.summary).toBe('Meal: 1500 kcal, 120g P');
      });

      it('should ignore items array when manual macros provided', () => {
        const items = [{ name: 'Ignored', grams: 100 }];
        const result = generateFoodSummary(items, { calories: 300, protein: 20 });
        expect(result.summary).toBe('Meal: 300 kcal, 20g P');
      });
    });

    describe('single food item', () => {
      it('should format single food item', () => {
        const items = [{ name: 'Chicken breast', grams: 150 }];
        const result = generateFoodSummary(items);
        expect(result.summary).toBe('Chicken breast 150g');
        expect(result.details).toBeUndefined();
      });

      it('should handle small portions', () => {
        const items = [{ name: 'Butter', grams: 10 }];
        const result = generateFoodSummary(items);
        expect(result.summary).toBe('Butter 10g');
      });

      it('should handle large portions', () => {
        const items = [{ name: 'Rice', grams: 500 }];
        const result = generateFoodSummary(items);
        expect(result.summary).toBe('Rice 500g');
      });
    });

    describe('multiple items without truncation', () => {
      it('should format two items', () => {
        const items = [
          { name: 'Chicken', grams: 150 },
          { name: 'Rice', grams: 200 },
        ];
        const result = generateFoodSummary(items);
        expect(result.summary).toBe('Chicken 150g, Rice 200g');
        expect(result.details).toBeUndefined();
      });

      it('should format items at SUMMARY_MAX_ITEMS limit', () => {
        const items = [
          { name: 'Chicken', grams: 150 },
          { name: 'Rice', grams: 200 },
        ];
        expect(items.length).toBe(SUMMARY_MAX_ITEMS);
        const result = generateFoodSummary(items);
        expect(result.summary).toContain('Chicken 150g');
        expect(result.summary).toContain('Rice 200g');
        expect(result.details).toBeUndefined();
      });
    });

    describe('multiple items with truncation', () => {
      it('should truncate items beyond SUMMARY_MAX_ITEMS', () => {
        const items = [
          { name: 'Chicken', grams: 150 },
          { name: 'Rice', grams: 200 },
          { name: 'Broccoli', grams: 100 },
        ];
        const result = generateFoodSummary(items);
        
        expect(result.summary).toContain('Chicken 150g');
        expect(result.summary).toContain('Rice 200g');
        expect(result.summary).toContain('and 1 other');
        expect(result.summary).not.toContain('Broccoli');
        expect(result.details).toBeDefined();
        expect(result.details).toHaveLength(3);
      });

      it('should use singular "other" for one hidden item', () => {
        const items = [
          { name: 'A', grams: 100 },
          { name: 'B', grams: 100 },
          { name: 'C', grams: 100 },
        ];
        const result = generateFoodSummary(items);
        expect(result.summary).toContain('and 1 other');
        expect(result.summary).not.toContain('others');
      });

      it('should use plural "others" for multiple hidden items', () => {
        const items = [
          { name: 'A', grams: 100 },
          { name: 'B', grams: 100 },
          { name: 'C', grams: 100 },
          { name: 'D', grams: 100 },
        ];
        const result = generateFoodSummary(items);
        expect(result.summary).toContain('and 2 others');
      });

      it('should include all items in details', () => {
        const items = [
          { name: 'Chicken', grams: 150 },
          { name: 'Rice', grams: 200 },
          { name: 'Broccoli', grams: 100 },
          { name: 'Sauce', grams: 50 },
        ];
        const result = generateFoodSummary(items);
        
        expect(result.details).toHaveLength(4);
        expect(result.details).toContain('Chicken 150g');
        expect(result.details).toContain('Rice 200g');
        expect(result.details).toContain('Broccoli 100g');
        expect(result.details).toContain('Sauce 50g');
      });

      it('should handle many items', () => {
        const items = Array.from({ length: 10 }, (_, i) => ({
          name: `Item${i}`,
          grams: 100,
        }));
        const result = generateFoodSummary(items);
        
        expect(result.summary).toContain('and 8 others');
        expect(result.details).toHaveLength(10);
      });
    });

    describe('edge cases', () => {
      it('should handle empty items array without manual macros', () => {
        const result = generateFoodSummary([]);
        // Implementation dependent - may vary
        expect(result).toBeDefined();
      });

      it('should handle zero grams', () => {
        const items = [{ name: 'Food', grams: 0 }];
        const result = generateFoodSummary(items);
        expect(result.summary).toContain('0g');
      });

      it('should handle decimal grams', () => {
        const items = [{ name: 'Spice', grams: 5.5 }];
        const result = generateFoodSummary(items);
        expect(result.summary).toContain('5.5g');
      });

      it('should handle very long food names', () => {
        const items = [{ name: 'A'.repeat(50), grams: 100 }];
        const result = generateFoodSummary(items);
        expect(result.summary).toContain('A'.repeat(50));
      });
    });
  });

  describe('generateWorkoutSummary', () => {
    it('should format workout with all details', () => {
      const result = generateWorkoutSummary('Running', 45, 'moderate');
      expect(result.summary).toBe('Running • 45min • Moderate');
      expect(result.details).toBeUndefined();
    });

    it('should format workout without intensity', () => {
      const result = generateWorkoutSummary('Swimming', 30);
      expect(result.summary).toBe('Swimming • 30min');
    });

    it('should format workout with only sport', () => {
      const result = generateWorkoutSummary('Yoga');
      expect(result.summary).toBe('Yoga');
    });

    it('should capitalize intensity', () => {
      const result = generateWorkoutSummary('Cycling', 60, 'high');
      expect(result.summary).toBe('Cycling • 60min • High');
    });

    it('should handle rest day specially', () => {
      const result = generateWorkoutSummary('rest');
      expect(result.summary).toBe('Rest day');
    });

    it('should handle rest day case-insensitive', () => {
      const result = generateWorkoutSummary('Rest');
      expect(result.summary).toBe('Rest day');
    });

    it('should handle REST in uppercase', () => {
      const result = generateWorkoutSummary('REST');
      expect(result.summary).toBe('Rest day');
    });

    it('should ignore duration and intensity for rest', () => {
      const result = generateWorkoutSummary('rest', 45, 'high');
      expect(result.summary).toBe('Rest day');
    });

    it('should handle zero duration', () => {
      const result = generateWorkoutSummary('Walking', 0);
      expect(result.summary).toBe('Walking • 0min');
    });

    it('should handle long duration', () => {
      const result = generateWorkoutSummary('Hiking', 180);
      expect(result.summary).toBe('Hiking • 180min');
    });

    it('should handle various intensities', () => {
      expect(generateWorkoutSummary('Run', 30, 'low').summary).toContain('Low');
      expect(generateWorkoutSummary('Run', 30, 'moderate').summary).toContain('Moderate');
      expect(generateWorkoutSummary('Run', 30, 'high').summary).toContain('High');
    });
  });

  describe('generateWeightSummary', () => {
    it('should format weight without body fat', () => {
      const result = generateWeightSummary(75);
      expect(result.summary).toBe('75kg');
      expect(result.details).toBeUndefined();
    });

    it('should format weight with body fat', () => {
      const result = generateWeightSummary(75, 18);
      expect(result.summary).toBe('75kg • 18%');
    });

    it('should handle zero body fat', () => {
      const result = generateWeightSummary(70, 0);
      expect(result.summary).toBe('70kg • 0%');
    });

    it('should handle decimal weight', () => {
      const result = generateWeightSummary(75.5);
      expect(result.summary).toBe('75.5kg');
    });

    it('should handle decimal body fat', () => {
      const result = generateWeightSummary(80, 15.5);
      expect(result.summary).toBe('80kg • 15.5%');
    });

    it('should handle high body fat percentage', () => {
      const result = generateWeightSummary(90, 35);
      expect(result.summary).toBe('90kg • 35%');
    });

    it('should handle low weight', () => {
      const result = generateWeightSummary(50);
      expect(result.summary).toBe('50kg');
    });

    it('should handle high weight', () => {
      const result = generateWeightSummary(150, 25);
      expect(result.summary).toBe('150kg • 25%');
    });
  });

  describe('generatePushupSummary', () => {
    it('should format single rep', () => {
      const result = generatePushupSummary(1);
      expect(result.summary).toBe('1 rep');
      expect(result.details).toBeUndefined();
    });

    it('should format multiple reps', () => {
      const result = generatePushupSummary(50);
      expect(result.summary).toBe('50 reps');
    });

    it('should format zero reps', () => {
      const result = generatePushupSummary(0);
      expect(result.summary).toBe('0 reps');
    });

    it('should format two reps (plural)', () => {
      const result = generatePushupSummary(2);
      expect(result.summary).toBe('2 reps');
    });

    it('should handle large numbers', () => {
      const result = generatePushupSummary(500);
      expect(result.summary).toBe('500 reps');
    });

    it('should use singular for exactly 1', () => {
      const result = generatePushupSummary(1);
      expect(result.summary).not.toContain('reps');
      expect(result.summary).toContain('rep');
    });
  });

  describe('generateCustomNoteSummary', () => {
    it('should use title when provided', () => {
      const result = generateCustomNoteSummary('My Training Goals');
      expect(result.summary).toBe('My Training Goals');
      expect(result.details).toBeUndefined();
    });

    it('should trim title', () => {
      const result = generateCustomNoteSummary('  Title with spaces  ');
      expect(result.summary).toBe('Title with spaces');
    });

    it('should use content preview when no title', () => {
      const content = 'This is a longer note about my training plans';
      const result = generateCustomNoteSummary(undefined, content);
      expect(result.summary).toBe(content);
    });

    it('should truncate long content to 50 chars', () => {
      const content = 'A'.repeat(100);
      const result = generateCustomNoteSummary(undefined, content);
      expect(result.summary.length).toBe(53); // 50 + '...'
      expect(result.summary).toEndWith('...');
    });

    it('should not add ellipsis if content is exactly 50 chars', () => {
      const content = 'A'.repeat(50);
      const result = generateCustomNoteSummary(undefined, content);
      expect(result.summary).toBe(content);
      expect(result.summary).not.toContain('...');
    });

    it('should prefer title over content', () => {
      const result = generateCustomNoteSummary('Title', 'Content that is ignored');
      expect(result.summary).toBe('Title');
    });

    it('should trim content before truncation', () => {
      const content = '  ' + 'A'.repeat(60);
      const result = generateCustomNoteSummary(undefined, content);
      expect(result.summary.startsWith(' ')).toBe(false);
    });

    it('should return "Note" for empty title and content', () => {
      const result = generateCustomNoteSummary('', '');
      expect(result.summary).toBe('Note');
    });

    it('should return "Note" for whitespace-only inputs', () => {
      const result = generateCustomNoteSummary('   ', '   ');
      expect(result.summary).toBe('Note');
    });

    it('should return "Note" for undefined inputs', () => {
      const result = generateCustomNoteSummary(undefined, undefined);
      expect(result.summary).toBe('Note');
    });

    it('should handle content shorter than 50 chars', () => {
      const content = 'Short note';
      const result = generateCustomNoteSummary(undefined, content);
      expect(result.summary).toBe('Short note');
    });

    it('should handle exactly 51 chars with ellipsis', () => {
      const content = 'A'.repeat(51);
      const result = generateCustomNoteSummary(undefined, content);
      expect(result.summary).toBe('A'.repeat(50) + '...');
    });

    it('should ignore empty title and use content', () => {
      const result = generateCustomNoteSummary('', 'Content here');
      expect(result.summary).toBe('Content here');
    });
  });

  describe('SUMMARY_MAX_ITEMS constant', () => {
    it('should be set to 2', () => {
      expect(SUMMARY_MAX_ITEMS).toBe(2);
    });
  });
});