/**
 * Food search utility with fuzzy matching
 * Uses Levenshtein distance for similarity scoring
 */

import { FOOD_DATABASE, FoodCategory, FoodItem } from '../data/foodDatabase';
import type { Language } from '../types';

export interface FoodSearchOptions {
  query: string;
  category?: FoodCategory;
  language: Language;
  limit?: number;
}

export interface FoodSearchResult {
  item: FoodItem;
  score: number; // 0-1, higher is better
}

/**
 * Levenshtein distance implementation
 * Calculates the minimum number of single-character edits needed to change one word into another
 * https://en.wikipedia.org/wiki/Levenshtein_distance
 */
function levenshteinDistance(a: string, b: string): number {
  const matrix: number[][] = [];

  // Initialize first column (0 to b.length)
  for (let i = 0; i <= b.length; i++) {
    matrix[i] = [i];
  }

  // Initialize first row (0 to a.length)
  for (let j = 0; j <= a.length; j++) {
    matrix[0][j] = j;
  }

  // Fill in the rest of the matrix
  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1, // substitution
          matrix[i][j - 1] + 1, // insertion
          matrix[i - 1][j] + 1 // deletion
        );
      }
    }
  }

  return matrix[b.length][a.length];
}

/**
 * Calculate similarity score between two strings
 * Returns 0-1, where 1 is identical and 0 is completely different
 */
function calculateSimilarity(query: string, target: string): number {
  if (query === target) return 1.0;

  const distance = levenshteinDistance(query, target);
  const maxLength = Math.max(query.length, target.length);

  // Normalize to 0-1 range
  return 1 - distance / maxLength;
}

/**
 * Search foods with fuzzy matching
 * - Exact match: score = 1.0
 * - Prefix match: score = 0.9
 * - Contains match: score = 0.8
 * - Keyword match: score = 0.7
 * - Fuzzy match: score = 0.5-0.7 (based on similarity)
 */
export function searchFoods(options: FoodSearchOptions): FoodSearchResult[] {
  const { query, category, language, limit = 20 } = options;

  // If no query, return all items in category (or all items)
  if (!query.trim()) {
    const filtered = category
      ? FOOD_DATABASE.filter((item) => item.category === category)
      : FOOD_DATABASE;

    return filtered.slice(0, limit).map((item) => ({ item, score: 1.0 }));
  }

  const normalizedQuery = query.toLowerCase().trim();
  const results: FoodSearchResult[] = [];

  for (const item of FOOD_DATABASE) {
    // Skip if category filter doesn't match
    if (category && item.category !== category) {
      continue;
    }

    const itemName = item.name[language].toLowerCase();
    const keywords = item.keywords?.map((k) => k.toLowerCase()) || [];

    // Calculate score
    let score = 0;

    // 1. Exact match
    if (itemName === normalizedQuery) {
      score = 1.0;
    }
    // 2. Prefix match
    else if (itemName.startsWith(normalizedQuery)) {
      score = 0.9;
    }
    // 3. Contains match
    else if (itemName.includes(normalizedQuery)) {
      score = 0.8;
    }
    // 4. Keyword match
    else if (keywords.some((k) => k === normalizedQuery || k.includes(normalizedQuery))) {
      score = 0.7;
    }
    // 5. Fuzzy match (only if query is long enough)
    else if (normalizedQuery.length >= 3) {
      const similarity = calculateSimilarity(normalizedQuery, itemName);
      // Only include if similarity is above threshold (60%)
      if (similarity > 0.6) {
        score = similarity * 0.6; // Scale down fuzzy matches (max 0.6)
      }

      // Also check keywords with fuzzy matching
      for (const keyword of keywords) {
        const kwSimilarity = calculateSimilarity(normalizedQuery, keyword);
        if (kwSimilarity > 0.7) {
          score = Math.max(score, kwSimilarity * 0.55); // Slightly lower than name match
        }
      }
    }

    if (score > 0) {
      results.push({ item, score });
    }
  }

  // Sort by score (descending) and return top N
  return results.sort((a, b) => b.score - a.score).slice(0, limit);
}

/**
 * Get quick food suggestions (top 5 per category)
 */
export function getQuickSuggestions(_language: Language): Record<FoodCategory, FoodItem[]> {
  const categories: FoodCategory[] = [
    'fruits',
    'vegetables',
    'proteins',
    'grains',
    'dairy',
    'snacks',
    'beverages',
  ];

  const suggestions: Partial<Record<FoodCategory, FoodItem[]>> = {};

  for (const category of categories) {
    suggestions[category] = FOOD_DATABASE.filter((food) => food.category === category).slice(0, 5);
  }

  return suggestions as Record<FoodCategory, FoodItem[]>;
}

/**
 * Search by partial match (for autocomplete)
 * Returns matches that start with or contain the query
 */
export function autocompleteSearch(
  query: string,
  language: Language,
  limit = 10
): FoodSearchResult[] {
  if (!query.trim()) return [];

  const normalizedQuery = query.toLowerCase().trim();
  const results: FoodSearchResult[] = [];

  for (const item of FOOD_DATABASE) {
    const itemName = item.name[language].toLowerCase();

    let score = 0;
    if (itemName.startsWith(normalizedQuery)) {
      score = 1.0;
    } else if (itemName.includes(normalizedQuery)) {
      score = 0.8;
    }

    if (score > 0) {
      results.push({ item, score });
    }
  }

  return results.sort((a, b) => b.score - a.score).slice(0, limit);
}

