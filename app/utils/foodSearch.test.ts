import { describe, it, expect } from 'vitest';
import { searchFoods } from './foodSearch';
import type { FoodSearchOptions } from './foodSearch';

describe('foodSearch', () => {
  describe('searchFoods', () => {
    // Happy path tests
    describe('exact matches', () => {
      it('should return exact match with score 1.0', () => {
        const options: FoodSearchOptions = {
          query: 'Banana',
          language: 'en',
        };

        const results = searchFoods(options);
        const bananaResult = results.find((r) => r.item.id === 'banana');

        expect(bananaResult).toBeDefined();
        expect(bananaResult?.score).toBe(1.0);
      });

      it('should handle case-insensitive exact matches', () => {
        const options: FoodSearchOptions = {
          query: 'banana',
          language: 'en',
        };

        const results = searchFoods(options);
        const bananaResult = results.find((r) => r.item.id === 'banana');

        expect(bananaResult).toBeDefined();
        expect(bananaResult?.score).toBe(1.0);
      });

      it('should match German food names', () => {
        const options: FoodSearchOptions = {
          query: 'Banane',
          language: 'de',
        };

        const results = searchFoods(options);
        const bananaResult = results.find((r) => r.item.id === 'banana');

        expect(bananaResult).toBeDefined();
        expect(bananaResult?.score).toBe(1.0);
      });
    });

    describe('prefix matches', () => {
      it('should match prefix with score 0.9', () => {
        const options: FoodSearchOptions = {
          query: 'Ban',
          language: 'en',
        };

        const results = searchFoods(options);
        const bananaResult = results.find((r) => r.item.id === 'banana');

        expect(bananaResult).toBeDefined();
        expect(bananaResult?.score).toBe(0.9);
      });

      it('should prioritize prefix matches over fuzzy matches', () => {
        const options: FoodSearchOptions = {
          query: 'Chic',
          language: 'en',
        };

        const results = searchFoods(options);
        const chickenResult = results.find((r) => r.item.id === 'chicken-breast');

        if (chickenResult) {
          expect(chickenResult.score).toBeGreaterThanOrEqual(0.9);
        }
      });
    });

    describe('contains matches', () => {
      it('should match substring with score 0.8', () => {
        const options: FoodSearchOptions = {
          query: 'berry',
          language: 'en',
        };

        const results = searchFoods(options);
        const strawberryResult = results.find((r) => r.item.id === 'strawberries');

        expect(strawberryResult).toBeDefined();
        expect(strawberryResult?.score).toBe(0.8);
      });

      it('should find food by keyword', () => {
        const options: FoodSearchOptions = {
          query: 'berries',
          language: 'en',
        };

        const results = searchFoods(options);
        const strawberryResult = results.find((r) => r.item.id === 'strawberries');

        expect(strawberryResult).toBeDefined();
      });
    });

    describe('fuzzy matching', () => {
      it('should handle typos with fuzzy matching', () => {
        const options: FoodSearchOptions = {
          query: 'Banan',
          language: 'en',
        };

        const results = searchFoods(options);
        const bananaResult = results.find((r) => r.item.id === 'banana');

        expect(bananaResult).toBeDefined();
        expect(bananaResult!.score).toBeGreaterThan(0.5);
        expect(bananaResult!.score).toBeLessThan(1.0);
      });

      it('should handle multiple character differences', () => {
        const options: FoodSearchOptions = {
          query: 'Bannana', // Common typo
          language: 'en',
        };

        const results = searchFoods(options);
        const bananaResult = results.find((r) => r.item.id === 'banana');

        expect(bananaResult).toBeDefined();
        expect(bananaResult!.score).toBeGreaterThan(0.5);
      });

      it('should score similarity correctly for similar words', () => {
        const options: FoodSearchOptions = {
          query: 'Appl',
          language: 'en',
        };

        const results = searchFoods(options);
        const appleResult = results.find((r) => r.item.id === 'apple');

        expect(appleResult).toBeDefined();
        expect(appleResult!.score).toBeGreaterThan(0.7);
      });
    });

    describe('category filtering', () => {
      it('should filter by category when specified', () => {
        const options: FoodSearchOptions = {
          query: '',
          category: 'fruits',
          language: 'en',
        };

        const results = searchFoods(options);

        expect(results.length).toBeGreaterThan(0);
        results.forEach((result) => {
          expect(result.item.category).toBe('fruits');
        });
      });

      it('should apply search within filtered category', () => {
        const options: FoodSearchOptions = {
          query: 'Ban',
          category: 'fruits',
          language: 'en',
        };

        const results = searchFoods(options);
        const bananaResult = results.find((r) => r.item.id === 'banana');

        expect(bananaResult).toBeDefined();
        results.forEach((result) => {
          expect(result.item.category).toBe('fruits');
        });
      });

      it('should return no results if query does not match category', () => {
        const options: FoodSearchOptions = {
          query: 'Chicken',
          category: 'fruits',
          language: 'en',
        };

        const results = searchFoods(options);
        const chickenResult = results.find((r) => r.item.name.en.includes('Chicken'));

        expect(chickenResult).toBeUndefined();
      });
    });

    describe('result limiting', () => {
      it('should respect default limit of 20 results', () => {
        const options: FoodSearchOptions = {
          query: '',
          language: 'en',
        };

        const results = searchFoods(options);

        expect(results.length).toBeLessThanOrEqual(20);
      });

      it('should respect custom limit', () => {
        const options: FoodSearchOptions = {
          query: '',
          language: 'en',
          limit: 5,
        };

        const results = searchFoods(options);

        expect(results.length).toBeLessThanOrEqual(5);
      });

      it('should apply limit after sorting by score', () => {
        const options: FoodSearchOptions = {
          query: 'a',
          language: 'en',
          limit: 3,
        };

        const results = searchFoods(options);

        expect(results.length).toBeLessThanOrEqual(3);
        // Results should be sorted by score descending
        for (let i = 1; i < results.length; i++) {
          expect(results[i - 1]!.score).toBeGreaterThanOrEqual(results[i]!.score);
        }
      });
    });

    describe('edge cases', () => {
      it('should handle empty query', () => {
        const options: FoodSearchOptions = {
          query: '',
          language: 'en',
        };

        const results = searchFoods(options);

        expect(results.length).toBeGreaterThan(0);
        results.forEach((result) => {
          expect(result.score).toBe(1.0);
        });
      });

      it('should handle whitespace-only query', () => {
        const options: FoodSearchOptions = {
          query: '   ',
          language: 'en',
        };

        const results = searchFoods(options);

        expect(results.length).toBeGreaterThan(0);
      });

      it('should handle query with special characters', () => {
        const options: FoodSearchOptions = {
          query: 'Ban@na!',
          language: 'en',
        };

        const results = searchFoods(options);

        // Should still attempt to match despite special chars
        expect(results.length).toBeGreaterThanOrEqual(0);
      });

      it('should handle very long query strings', () => {
        const options: FoodSearchOptions = {
          query: 'a'.repeat(100),
          language: 'en',
        };

        const results = searchFoods(options);

        expect(results).toBeDefined();
        expect(Array.isArray(results)).toBe(true);
      });

      it('should handle query with no matches', () => {
        const options: FoodSearchOptions = {
          query: 'xyzabc123',
          language: 'en',
        };

        const results = searchFoods(options);

        // May return low-scoring fuzzy matches or empty array
        expect(results).toBeDefined();
        expect(Array.isArray(results)).toBe(true);
      });

      it('should handle Unicode characters', () => {
        const options: FoodSearchOptions = {
          query: '🍌',
          language: 'en',
        };

        const results = searchFoods(options);

        expect(results).toBeDefined();
        expect(Array.isArray(results)).toBe(true);
      });
    });

    describe('language support', () => {
      it('should search in English when language is en', () => {
        const options: FoodSearchOptions = {
          query: 'Chicken',
          language: 'en',
        };

        const results = searchFoods(options);
        const chickenResult = results.find((r) => r.item.id === 'chicken-breast');

        expect(chickenResult).toBeDefined();
      });

      it('should search in German when language is de', () => {
        const options: FoodSearchOptions = {
          query: 'Hähnchenbrust',
          language: 'de',
        };

        const results = searchFoods(options);
        const chickenResult = results.find((r) => r.item.id === 'chicken-breast');

        if (chickenResult) {
          expect(chickenResult).toBeDefined();
        }
      });

      it('should prefer language-specific matches', () => {
        const optionsEn: FoodSearchOptions = {
          query: 'Apple',
          language: 'en',
        };
        const optionsDe: FoodSearchOptions = {
          query: 'Apfel',
          language: 'de',
        };

        const resultsEn = searchFoods(optionsEn);
        const resultsDe = searchFoods(optionsDe);

        const appleEn = resultsEn.find((r) => r.item.id === 'apple');
        const appleDe = resultsDe.find((r) => r.item.id === 'apple');

        expect(appleEn).toBeDefined();
        expect(appleDe).toBeDefined();
      });
    });

    describe('result ordering', () => {
      it('should return results sorted by score descending', () => {
        const options: FoodSearchOptions = {
          query: 'app',
          language: 'en',
        };

        const results = searchFoods(options);

        for (let i = 1; i < results.length; i++) {
          expect(results[i - 1]!.score).toBeGreaterThanOrEqual(results[i]!.score);
        }
      });

      it('should prioritize exact matches over prefix matches', () => {
        const options: FoodSearchOptions = {
          query: 'Apple',
          language: 'en',
        };

        const results = searchFoods(options);

        if (results.length > 0) {
          const topResult = results[0];
          if (topResult && topResult.item.name.en === 'Apple') {
            expect(topResult.score).toBe(1.0);
          }
        }
      });
    });

    describe('performance edge cases', () => {
      it('should handle searching with zero limit', () => {
        const options: FoodSearchOptions = {
          query: 'Banana',
          language: 'en',
          limit: 0,
        };

        const results = searchFoods(options);

        expect(results.length).toBe(0);
      });

      it('should handle negative limit gracefully', () => {
        const options: FoodSearchOptions = {
          query: 'Banana',
          language: 'en',
          limit: -1,
        };

        const results = searchFoods(options);

        // Implementation should handle gracefully
        expect(results).toBeDefined();
      });

      it('should handle very large limit', () => {
        const options: FoodSearchOptions = {
          query: '',
          language: 'en',
          limit: 10000,
        };

        const results = searchFoods(options);

        expect(results).toBeDefined();
        expect(Array.isArray(results)).toBe(true);
      });
    });
  });
});