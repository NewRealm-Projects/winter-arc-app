import { DrinkPreset } from '../types';

export const PRESET_CONSTRAINTS = {
  MAX_COUNT: 5,
  MIN_AMOUNT_ML: 50,
  MAX_AMOUNT_ML: 5000,
  MIN_NAME_LENGTH: 1,
  MAX_NAME_LENGTH: 30,
  DEFAULT_EMOJI: '💧',
} as const;

export interface PresetValidationError {
  field: 'name' | 'amountMl' | 'emoji' | 'count';
  message: string;
}

/**
 * Validates a drink preset name
 */
export function validatePresetName(name: string): PresetValidationError | null {
  const trimmed = name.trim();

  if (trimmed.length < PRESET_CONSTRAINTS.MIN_NAME_LENGTH) {
    return {
      field: 'name',
      message: 'Name must be at least 1 character',
    };
  }

  if (trimmed.length > PRESET_CONSTRAINTS.MAX_NAME_LENGTH) {
    return {
      field: 'name',
      message: `Name must be at most ${PRESET_CONSTRAINTS.MAX_NAME_LENGTH} characters`,
    };
  }

  return null;
}

/**
 * Validates a drink preset amount
 */
export function validatePresetAmount(amountMl: number): PresetValidationError | null {
  if (!Number.isInteger(amountMl)) {
    return {
      field: 'amountMl',
      message: 'Amount must be a whole number',
    };
  }

  if (amountMl < PRESET_CONSTRAINTS.MIN_AMOUNT_ML) {
    return {
      field: 'amountMl',
      message: `Amount must be at least ${PRESET_CONSTRAINTS.MIN_AMOUNT_ML}ml`,
    };
  }

  if (amountMl > PRESET_CONSTRAINTS.MAX_AMOUNT_ML) {
    return {
      field: 'amountMl',
      message: `Amount must be at most ${PRESET_CONSTRAINTS.MAX_AMOUNT_ML}ml`,
    };
  }

  return null;
}

/**
 * Validates and sanitizes a drink preset emoji
 */
export function sanitizePresetEmoji(emoji: string | undefined): string {
  if (!emoji || emoji.trim().length === 0) {
    return PRESET_CONSTRAINTS.DEFAULT_EMOJI;
  }

  // Take only the first character (emoji or text)
  const firstChar = Array.from(emoji.trim())[0];
  return firstChar || PRESET_CONSTRAINTS.DEFAULT_EMOJI;
}

/**
 * Validates a complete drink preset
 */
export function validatePreset(
  preset: Omit<DrinkPreset, 'id' | 'order'>
): PresetValidationError | null {
  const nameError = validatePresetName(preset.name);
  if (nameError) {
    return nameError;
  }

  const amountError = validatePresetAmount(preset.amountMl);
  if (amountError) {
    return amountError;
  }

  return null;
}

/**
 * Validates preset count limit
 */
export function validatePresetCount(currentCount: number): PresetValidationError | null {
  if (currentCount >= PRESET_CONSTRAINTS.MAX_COUNT) {
    return {
      field: 'count',
      message: `Maximum ${PRESET_CONSTRAINTS.MAX_COUNT} presets allowed`,
    };
  }

  return null;
}

/**
 * Creates a sanitized preset with validated fields
 */
export function sanitizePreset(
  preset: Omit<DrinkPreset, 'id' | 'order'>
): Omit<DrinkPreset, 'id' | 'order'> {
  return {
    name: preset.name.trim(),
    amountMl: Math.round(preset.amountMl),
    emoji: sanitizePresetEmoji(preset.emoji),
  };
}

/**
 * Reorders presets after deletion to compact order field
 */
export function reorderPresets(presets: DrinkPreset[]): DrinkPreset[] {
  return presets
    .sort((a, b) => a.order - b.order)
    .map((preset, index) => ({
      ...preset,
      order: index,
    }));
}
