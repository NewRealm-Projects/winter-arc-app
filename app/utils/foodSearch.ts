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
  // Handle trivial cases directly
  if (a === b) return 0;
  if (a.length === 0) return b.length;
  if (b.length === 0) return a.length;

  // Allocate 2D matrix fully initialized to 0 to satisfy strict undefined checks
  // Using definite assignment with explicit number type to satisfy strict indexing rules.
  const matrix: number[][] = Array.from({ length: b.length + 1 }, () => Array<number>(a.length + 1).fill(0));

  for (let i = 0; i <= b.length; i++) {
    const row = matrix[i];
    if (!row) continue; // defensive (should be allocated)
    row[0] = i;
  }
  const firstRow = matrix[0];
  if (firstRow) {
    for (let j = 0; j <= a.length; j++) {
      firstRow[j] = j;
    }
  }

  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      const cost = b[i - 1] === a[j - 1] ? 0 : 1;
      const prevRow = matrix[i - 1];
      const currentRow = matrix[i];
      if (!prevRow || !currentRow) continue; // safety
      const substitution: number = prevRow[j - 1]! + cost;
      const insertion: number = currentRow[j - 1]! + 1;
      const deletion: number = prevRow[j]! + 1;
      currentRow[j] = Math.min(substitution, insertion, deletion);
    }
  }

  const lastRow = matrix[b.length];
  if (!lastRow) return 0;
  return lastRow[a.length] ?? 0;
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

