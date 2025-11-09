// Maximum number of items to show before truncating
export const SUMMARY_MAX_ITEMS = 2;

export interface ActivitySummaryResult {
  summary: string; // Truncated display text
  details?: string[]; // Full list for tooltip (if truncated)
}

/**
 * Generate drink activity summary
 * @example "250ml Water"
 */
export function generateDrinkSummary(amountMl: number, beverage: string): ActivitySummaryResult {
  const beverageLabel = beverage.charAt(0).toUpperCase() + beverage.slice(1);
  return {
    summary: `${amountMl}ml ${beverageLabel}`,
  };
}

/**
 * Generate food activity summary with truncation for multiple items
 * @example Single item: "Chicken breast 150g"
 * @example Multiple items: "Chicken 150g, Rice 200g and 3 others"
 */
export function generateFoodSummary(
  items: Array<{ name: string; grams: number }>,
  manualMacros?: { calories: number; protein: number }
): ActivitySummaryResult {
  // Manual macro entry
  if (manualMacros) {
    return {
      summary: `Meal: ${manualMacros.calories} kcal, ${manualMacros.protein}g P`,
    };
  }

  // Single food item
  if (items.length === 1) {
    const first = items[0]!;
    return {
      summary: `${first.name} ${first.grams}g`,
    };
  }

  // Multiple items - truncate if > SUMMARY_MAX_ITEMS
  if (items.length <= SUMMARY_MAX_ITEMS) {
    const itemsStr = items.map((item) => `${item.name} ${item.grams}g`).join(', ');
    return {
      summary: itemsStr,
    };
  }

  // Truncated
  const visibleItems = items.slice(0, SUMMARY_MAX_ITEMS);
  const remainingCount = items.length - SUMMARY_MAX_ITEMS;
  const visibleStr = visibleItems.map((item) => `${item.name} ${item.grams}g`).join(', ');
  const fullDetails = items.map((item) => `${item.name} ${item.grams}g`);

  return {
    summary: `${visibleStr} and ${remainingCount} other${remainingCount > 1 ? 's' : ''}`,
    details: fullDetails,
  };
}

/**
 * Generate workout activity summary
 * @example "Cardio • 45min • Moderate"
 * @example "Rest day"
 */
export function generateWorkoutSummary(
  sport: string,
  durationMin?: number,
  intensity?: string
): ActivitySummaryResult {
  if (sport.toLowerCase() === 'rest') {
    return {
      summary: 'Rest day',
    };
  }

  const parts = [sport];
  if (durationMin) {
    parts.push(`${durationMin}min`);
  }
  if (intensity) {
    const intensityLabel = intensity.charAt(0).toUpperCase() + intensity.slice(1);
    parts.push(intensityLabel);
  }

  return {
    summary: parts.join(' • '),
  };
}

/**
 * Generate weight activity summary
 * @example "75kg"
 * @example "75kg • 18%"
 */
export function generateWeightSummary(weight: number, bodyFat?: number): ActivitySummaryResult {
  if (bodyFat !== undefined) {
    return {
      summary: `${weight}kg • ${bodyFat}%`,
    };
  }
  return {
    summary: `${weight}kg`,
  };
}

/**
 * Generate pushup activity summary
 * @example "50 reps"
 */
export function generatePushupSummary(count: number): ActivitySummaryResult {
  return {
    summary: `${count} rep${count !== 1 ? 's' : ''}`,
  };
}

/**
 * Generate custom note summary (from title or content preview)
 * @example "My training goals" or first 50 chars of content
 */
export function generateCustomNoteSummary(title?: string, content?: string): ActivitySummaryResult {
  if (title && title.trim()) {
    return {
      summary: title.trim(),
    };
  }
  if (content && content.trim()) {
    const preview = content.trim().slice(0, 50);
    return {
      summary: preview.length < content.trim().length ? `${preview}...` : preview,
    };
  }
  return {
    summary: 'Note',
  };
}

