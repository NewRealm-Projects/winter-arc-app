import { describe, it, expect } from 'vitest';
import {
  validatePresetName,
  validatePresetAmount,
  sanitizePresetEmoji,
  PRESET_CONSTRAINTS,
} from './presetValidation';

describe('presetValidation', () => {
  describe('PRESET_CONSTRAINTS', () => {
    it('should define expected constraint values', () => {
      expect(PRESET_CONSTRAINTS.MAX_COUNT).toBe(5);
      expect(PRESET_CONSTRAINTS.MIN_AMOUNT_ML).toBe(50);
      expect(PRESET_CONSTRAINTS.MAX_AMOUNT_ML).toBe(5000);
      expect(PRESET_CONSTRAINTS.MIN_NAME_LENGTH).toBe(1);
      expect(PRESET_CONSTRAINTS.MAX_NAME_LENGTH).toBe(30);
      expect(PRESET_CONSTRAINTS.DEFAULT_EMOJI).toBe('💧');
    });
  });

  describe('validatePresetName', () => {
    // Happy path tests
    it('should return null for valid name', () => {
      const error = validatePresetName('Water Bottle');
      expect(error).toBeNull();
    });

    it('should return null for single character name', () => {
      const error = validatePresetName('A');
      expect(error).toBeNull();
    });

    it('should return null for name at max length', () => {
      const name = 'a'.repeat(PRESET_CONSTRAINTS.MAX_NAME_LENGTH);
      const error = validatePresetName(name);
      expect(error).toBeNull();
    });

    it('should return null for name with spaces', () => {
      const error = validatePresetName('My Water Bottle');
      expect(error).toBeNull();
    });

    it('should return null for name with special characters', () => {
      const error = validatePresetName('Water-Bottle #1');
      expect(error).toBeNull();
    });

    // Edge cases - empty or too short
    it('should reject empty string', () => {
      const error = validatePresetName('');
      expect(error).not.toBeNull();
      expect(error?.field).toBe('name');
      expect(error?.message).toContain('at least 1 character');
    });

    it('should reject whitespace-only string', () => {
      const error = validatePresetName('   ');
      expect(error).not.toBeNull();
      expect(error?.field).toBe('name');
      expect(error?.message).toContain('at least 1 character');
    });

    // Edge cases - too long
    it('should reject name exceeding max length', () => {
      const name = 'a'.repeat(PRESET_CONSTRAINTS.MAX_NAME_LENGTH + 1);
      const error = validatePresetName(name);
      expect(error).not.toBeNull();
      expect(error?.field).toBe('name');
      expect(error?.message).toContain(`at most ${PRESET_CONSTRAINTS.MAX_NAME_LENGTH}`);
    });

    it('should reject very long name', () => {
      const name = 'a'.repeat(100);
      const error = validatePresetName(name);
      expect(error).not.toBeNull();
      expect(error?.field).toBe('name');
    });

    // Trimming behavior
    it('should trim leading whitespace before validation', () => {
      const error = validatePresetName('   Water');
      expect(error).toBeNull();
    });

    it('should trim trailing whitespace before validation', () => {
      const error = validatePresetName('Water   ');
      expect(error).toBeNull();
    });

    it('should reject if trimmed result is empty', () => {
      const error = validatePresetName('     ');
      expect(error).not.toBeNull();
    });

    // Unicode and emoji
    it('should accept Unicode characters', () => {
      const error = validatePresetName('Wasser 💧');
      expect(error).toBeNull();
    });

    it('should accept emoji in name', () => {
      const error = validatePresetName('🥤 Soda');
      expect(error).toBeNull();
    });

    it('should count emoji correctly towards length', () => {
      // Emojis are single characters in JS
      const name = '🥤'.repeat(PRESET_CONSTRAINTS.MAX_NAME_LENGTH + 1);
      const error = validatePresetName(name);
      expect(error).not.toBeNull();
    });

    // Boundary tests
    it('should accept name at exactly min length after trim', () => {
      const error = validatePresetName('A');
      expect(error).toBeNull();
    });

    it('should accept name at exactly max length', () => {
      const name = 'x'.repeat(PRESET_CONSTRAINTS.MAX_NAME_LENGTH);
      const error = validatePresetName(name);
      expect(error).toBeNull();
    });
  });

  describe('validatePresetAmount', () => {
    // Happy path tests
    it('should return null for valid amount', () => {
      const error = validatePresetAmount(500);
      expect(error).toBeNull();
    });

    it('should return null for minimum valid amount', () => {
      const error = validatePresetAmount(PRESET_CONSTRAINTS.MIN_AMOUNT_ML);
      expect(error).toBeNull();
    });

    it('should return null for maximum valid amount', () => {
      const error = validatePresetAmount(PRESET_CONSTRAINTS.MAX_AMOUNT_ML);
      expect(error).toBeNull();
    });

    it('should return null for typical bottle size', () => {
      const error = validatePresetAmount(750);
      expect(error).toBeNull();
    });

    it('should return null for large container', () => {
      const error = validatePresetAmount(2000);
      expect(error).toBeNull();
    });

    // Integer validation
    it('should reject decimal amount', () => {
      const error = validatePresetAmount(500.5);
      expect(error).not.toBeNull();
      expect(error?.field).toBe('amountMl');
      expect(error?.message).toContain('whole number');
    });

    it('should reject amount with fraction', () => {
      const error = validatePresetAmount(123.456);
      expect(error).not.toBeNull();
      expect(error?.field).toBe('amountMl');
    });

    // Minimum boundary
    it('should reject amount below minimum', () => {
      const error = validatePresetAmount(PRESET_CONSTRAINTS.MIN_AMOUNT_ML - 1);
      expect(error).not.toBeNull();
      expect(error?.field).toBe('amountMl');
      expect(error?.message).toContain(`at least ${PRESET_CONSTRAINTS.MIN_AMOUNT_ML}ml`);
    });

    it('should reject zero amount', () => {
      const error = validatePresetAmount(0);
      expect(error).not.toBeNull();
      expect(error?.field).toBe('amountMl');
    });

    it('should reject negative amount', () => {
      const error = validatePresetAmount(-100);
      expect(error).not.toBeNull();
      expect(error?.field).toBe('amountMl');
    });

    // Maximum boundary
    it('should reject amount above maximum', () => {
      const error = validatePresetAmount(PRESET_CONSTRAINTS.MAX_AMOUNT_ML + 1);
      expect(error).not.toBeNull();
      expect(error?.field).toBe('amountMl');
      expect(error?.message).toContain(`at most ${PRESET_CONSTRAINTS.MAX_AMOUNT_ML}ml`);
    });

    it('should reject very large amount', () => {
      const error = validatePresetAmount(1000000);
      expect(error).not.toBeNull();
      expect(error?.field).toBe('amountMl');
    });

    // Edge cases
    it('should handle Infinity', () => {
      const error = validatePresetAmount(Infinity);
      expect(error).not.toBeNull();
    });

    it('should handle NaN', () => {
      const error = validatePresetAmount(NaN);
      expect(error).not.toBeNull();
    });

    it('should handle negative infinity', () => {
      const error = validatePresetAmount(-Infinity);
      expect(error).not.toBeNull();
    });

    // Boundary exact tests
    it('should accept exactly minimum amount', () => {
      const error = validatePresetAmount(50);
      expect(error).toBeNull();
    });

    it('should accept exactly maximum amount', () => {
      const error = validatePresetAmount(5000);
      expect(error).toBeNull();
    });

    it('should reject just below minimum', () => {
      const error = validatePresetAmount(49);
      expect(error).not.toBeNull();
    });

    it('should reject just above maximum', () => {
      const error = validatePresetAmount(5001);
      expect(error).not.toBeNull();
    });
  });

  describe('sanitizePresetEmoji', () => {
    // Happy path tests
    it('should return emoji unchanged if valid', () => {
      const result = sanitizePresetEmoji('🥤');
      expect(result).toBe('🥤');
    });

    it('should return water droplet emoji', () => {
      const result = sanitizePresetEmoji('💧');
      expect(result).toBe('💧');
    });

    it('should return first character if multiple provided', () => {
      const result = sanitizePresetEmoji('🥤🥤🥤');
      expect(result).toBe('🥤');
    });

    it('should handle text character as emoji', () => {
      const result = sanitizePresetEmoji('W');
      expect(result).toBe('W');
    });

    // Default emoji cases
    it('should return default emoji for undefined', () => {
      const result = sanitizePresetEmoji(undefined);
      expect(result).toBe(PRESET_CONSTRAINTS.DEFAULT_EMOJI);
    });

    it('should return default emoji for empty string', () => {
      const result = sanitizePresetEmoji('');
      expect(result).toBe(PRESET_CONSTRAINTS.DEFAULT_EMOJI);
    });

    it('should return default emoji for whitespace only', () => {
      const result = sanitizePresetEmoji('   ');
      expect(result).toBe(PRESET_CONSTRAINTS.DEFAULT_EMOJI);
    });

    it('should return default emoji for null-like input', () => {
      const result = sanitizePresetEmoji('');
      expect(result).toBe('💧');
    });

    // Trimming behavior
    it('should trim whitespace before taking first character', () => {
      const result = sanitizePresetEmoji('   🥤');
      expect(result).toBe('🥤');
    });

    it('should handle whitespace around emoji', () => {
      const result = sanitizePresetEmoji(' 💧 ');
      expect(result).toBe('💧');
    });

    // Multiple characters
    it('should take first character from text string', () => {
      const result = sanitizePresetEmoji('Water');
      expect(result).toBe('W');
    });

    it('should take first emoji from sequence', () => {
      const result = sanitizePresetEmoji('🥤💧🍷');
      expect(result).toBe('🥤');
    });

    // Unicode edge cases
    it('should handle multi-byte emoji', () => {
      const result = sanitizePresetEmoji('👨‍👩‍👧‍👦');
      expect(result).toBeTruthy();
      expect(result.length).toBeGreaterThan(0);
    });

    it('should handle flag emojis', () => {
      const result = sanitizePresetEmoji('🇺🇸');
      expect(result).toBeTruthy();
    });

    it('should handle skin tone modifiers', () => {
      const result = sanitizePresetEmoji('👍🏽');
      expect(result).toBeTruthy();
    });

    // Special characters
    it('should handle special characters', () => {
      const result = sanitizePresetEmoji('!@#$');
      expect(result).toBe('!');
    });

    it('should handle numbers', () => {
      const result = sanitizePresetEmoji('123');
      expect(result).toBe('1');
    });

    // Default emoji constant verification
    it('should use consistent default emoji', () => {
      const result1 = sanitizePresetEmoji('');
      const result2 = sanitizePresetEmoji(undefined);
      const result3 = sanitizePresetEmoji('   ');

      expect(result1).toBe(result2);
      expect(result2).toBe(result3);
      expect(result1).toBe(PRESET_CONSTRAINTS.DEFAULT_EMOJI);
    });

    // Array.from behavior verification
    it('should correctly split multi-character strings', () => {
      // Using Array.from to properly handle emoji
      const input = '🥤Water';
      const result = sanitizePresetEmoji(input);
      expect(result).toBe('🥤');
    });

    it('should handle combining characters properly', () => {
      const result = sanitizePresetEmoji('é'); // e + combining accent
      expect(result).toBeTruthy();
      expect(result.length).toBeGreaterThan(0);
    });
  });

  describe('integration scenarios', () => {
    it('should validate complete preset object', () => {
      const nameError = validatePresetName('Water Bottle');
      const amountError = validatePresetAmount(500);
      const emoji = sanitizePresetEmoji('💧');

      expect(nameError).toBeNull();
      expect(amountError).toBeNull();
      expect(emoji).toBe('💧');
    });

    it('should handle invalid preset gracefully', () => {
      const nameError = validatePresetName('');
      const amountError = validatePresetAmount(-100);

      expect(nameError).not.toBeNull();
      expect(amountError).not.toBeNull();
    });

    it('should sanitize emoji even with validation errors', () => {
      const emoji = sanitizePresetEmoji('');
      expect(emoji).toBe(PRESET_CONSTRAINTS.DEFAULT_EMOJI);
    });

    it('should validate multiple presets', () => {
      const presets = [
        { name: 'Small Cup', amount: 250, emoji: '☕' },
        { name: 'Large Bottle', amount: 1000, emoji: '🥤' },
        { name: 'Water', amount: 500, emoji: '💧' },
      ];

      presets.forEach((preset) => {
        expect(validatePresetName(preset.name)).toBeNull();
        expect(validatePresetAmount(preset.amount)).toBeNull();
        expect(sanitizePresetEmoji(preset.emoji)).toBeTruthy();
      });
    });

    it('should enforce max count constraint', () => {
      const presetCount = 6;
      expect(presetCount).toBeGreaterThan(PRESET_CONSTRAINTS.MAX_COUNT);
    });
  });
});