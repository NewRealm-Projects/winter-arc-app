/**
 * Embedded nutrition database for common foods
 * Source: USDA FoodData Central (public domain)
 * All nutrition values are per 100g
 */

export type FoodCategory =
  | 'fruits'
  | 'vegetables'
  | 'proteins'
  | 'grains'
  | 'dairy'
  | 'snacks'
  | 'beverages';

export interface CommonServing {
  name: {
    de: string;
    en: string;
  };
  grams: number;
}

export interface FoodItem {
  id: string;
  name: {
    de: string;
    en: string;
  };
  category: FoodCategory;
  // All nutrition values per 100g
  calories: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
  fiberG?: number;
  commonServings?: CommonServing[];
  keywords?: string[];
}

export const FOOD_DATABASE: FoodItem[] = [
  // FRUITS
  {
    id: 'banana',
    name: { de: 'Banane', en: 'Banana' },
    category: 'fruits',
    calories: 89,
    proteinG: 1.1,
    carbsG: 23,
    fatG: 0.3,
    fiberG: 2.6,
    commonServings: [
      { name: { de: '1 kleine (90g)', en: '1 small (90g)' }, grams: 90 },
      { name: { de: '1 mittelgroße (120g)', en: '1 medium (120g)' }, grams: 120 },
      { name: { de: '1 große (150g)', en: '1 large (150g)' }, grams: 150 },
    ],
  },
  {
    id: 'apple',
    name: { de: 'Apfel', en: 'Apple' },
    category: 'fruits',
    calories: 52,
    proteinG: 0.3,
    carbsG: 14,
    fatG: 0.2,
    fiberG: 2.4,
    commonServings: [
      { name: { de: '1 kleiner (150g)', en: '1 small (150g)' }, grams: 150 },
      { name: { de: '1 mittelgroßer (180g)', en: '1 medium (180g)' }, grams: 180 },
      { name: { de: '1 großer (220g)', en: '1 large (220g)' }, grams: 220 },
    ],
  },
  {
    id: 'orange',
    name: { de: 'Orange', en: 'Orange' },
    category: 'fruits',
    calories: 47,
    proteinG: 0.9,
    carbsG: 12,
    fatG: 0.1,
    fiberG: 2.4,
    commonServings: [
      { name: { de: '1 mittelgroße (140g)', en: '1 medium (140g)' }, grams: 140 },
      { name: { de: '1 große (180g)', en: '1 large (180g)' }, grams: 180 },
    ],
  },
  {
    id: 'strawberries',
    name: { de: 'Erdbeeren', en: 'Strawberries' },
    category: 'fruits',
    calories: 32,
    proteinG: 0.7,
    carbsG: 8,
    fatG: 0.3,
    fiberG: 2,
    commonServings: [
      { name: { de: '1 Tasse (150g)', en: '1 cup (150g)' }, grams: 150 },
      { name: { de: '1 Handvoll (100g)', en: '1 handful (100g)' }, grams: 100 },
    ],
    keywords: ['beeren', 'berries'],
  },
  {
    id: 'blueberries',
    name: { de: 'Heidelbeeren', en: 'Blueberries' },
    category: 'fruits',
    calories: 57,
    proteinG: 0.7,
    carbsG: 14,
    fatG: 0.3,
    fiberG: 2.4,
    commonServings: [
      { name: { de: '1 Tasse (150g)', en: '1 cup (150g)' }, grams: 150 },
      { name: { de: '1 Handvoll (75g)', en: '1 handful (75g)' }, grams: 75 },
    ],
    keywords: ['beeren', 'berries'],
  },

  // VEGETABLES
  {
    id: 'broccoli',
    name: { de: 'Brokkoli', en: 'Broccoli' },
    category: 'vegetables',
    calories: 34,
    proteinG: 2.8,
    carbsG: 7,
    fatG: 0.4,
    fiberG: 2.6,
    commonServings: [
      { name: { de: '1 Tasse (90g)', en: '1 cup (90g)' }, grams: 90 },
      { name: { de: '1 Portion (150g)', en: '1 serving (150g)' }, grams: 150 },
    ],
  },
  {
    id: 'carrot',
    name: { de: 'Karotte', en: 'Carrot' },
    category: 'vegetables',
    calories: 41,
    proteinG: 0.9,
    carbsG: 10,
    fatG: 0.2,
    fiberG: 2.8,
    commonServings: [
      { name: { de: '1 mittelgroße (60g)', en: '1 medium (60g)' }, grams: 60 },
      { name: { de: '1 Tasse (130g)', en: '1 cup (130g)' }, grams: 130 },
    ],
    keywords: ['möhre', 'mohrrübe'],
  },
  {
    id: 'tomato',
    name: { de: 'Tomate', en: 'Tomato' },
    category: 'vegetables',
    calories: 18,
    proteinG: 0.9,
    carbsG: 3.9,
    fatG: 0.2,
    fiberG: 1.2,
    commonServings: [
      { name: { de: '1 mittelgroße (120g)', en: '1 medium (120g)' }, grams: 120 },
      { name: { de: '1 Tasse gehackt (180g)', en: '1 cup chopped (180g)' }, grams: 180 },
    ],
  },
  {
    id: 'cucumber',
    name: { de: 'Gurke', en: 'Cucumber' },
    category: 'vegetables',
    calories: 15,
    proteinG: 0.7,
    carbsG: 3.6,
    fatG: 0.1,
    fiberG: 0.5,
    commonServings: [
      { name: { de: '1 mittelgroße (300g)', en: '1 medium (300g)' }, grams: 300 },
      { name: { de: '1 Tasse (100g)', en: '1 cup (100g)' }, grams: 100 },
    ],
    keywords: ['salatgurke'],
  },
  {
    id: 'spinach',
    name: { de: 'Spinat', en: 'Spinach' },
    category: 'vegetables',
    calories: 23,
    proteinG: 2.9,
    carbsG: 3.6,
    fatG: 0.4,
    fiberG: 2.2,
    commonServings: [
      { name: { de: '1 Tasse roh (30g)', en: '1 cup raw (30g)' }, grams: 30 },
      { name: { de: '1 Portion gekocht (180g)', en: '1 serving cooked (180g)' }, grams: 180 },
    ],
  },

  // PROTEINS
  {
    id: 'chicken-breast',
    name: { de: 'Hähnchenbrust', en: 'Chicken Breast' },
    category: 'proteins',
    calories: 165,
    proteinG: 31,
    carbsG: 0,
    fatG: 3.6,
    commonServings: [
      { name: { de: '100g Portion', en: '100g serving' }, grams: 100 },
      { name: { de: '150g Portion', en: '150g serving' }, grams: 150 },
      { name: { de: '200g Portion', en: '200g serving' }, grams: 200 },
    ],
    keywords: ['hähnchen', 'chicken', 'geflügel', 'poultry', 'poulet'],
  },
  {
    id: 'eggs',
    name: { de: 'Eier', en: 'Eggs' },
    category: 'proteins',
    calories: 155,
    proteinG: 13,
    carbsG: 1.1,
    fatG: 11,
    commonServings: [
      { name: { de: '1 Ei (50g)', en: '1 egg (50g)' }, grams: 50 },
      { name: { de: '2 Eier (100g)', en: '2 eggs (100g)' }, grams: 100 },
      { name: { de: '3 Eier (150g)', en: '3 eggs (150g)' }, grams: 150 },
    ],
    keywords: ['ei', 'egg'],
  },
  {
    id: 'tofu',
    name: { de: 'Tofu', en: 'Tofu' },
    category: 'proteins',
    calories: 76,
    proteinG: 8,
    carbsG: 1.9,
    fatG: 4.8,
    commonServings: [
      { name: { de: '100g Portion', en: '100g serving' }, grams: 100 },
      { name: { de: '150g Portion', en: '150g serving' }, grams: 150 },
    ],
    keywords: ['soja', 'soy'],
  },
  {
    id: 'salmon',
    name: { de: 'Lachs', en: 'Salmon' },
    category: 'proteins',
    calories: 208,
    proteinG: 20,
    carbsG: 0,
    fatG: 13,
    commonServings: [
      { name: { de: '100g Filet', en: '100g fillet' }, grams: 100 },
      { name: { de: '150g Filet', en: '150g fillet' }, grams: 150 },
    ],
    keywords: ['fish', 'fisch'],
  },
  {
    id: 'tuna-canned',
    name: { de: 'Thunfisch (Dose)', en: 'Tuna (canned)' },
    category: 'proteins',
    calories: 116,
    proteinG: 26,
    carbsG: 0,
    fatG: 0.8,
    commonServings: [
      { name: { de: '1 Dose (140g)', en: '1 can (140g)' }, grams: 140 },
      { name: { de: '100g', en: '100g' }, grams: 100 },
    ],
    keywords: ['fish', 'fisch', 'dose', 'canned'],
  },
  {
    id: 'ground-beef',
    name: { de: 'Rinderhackfleisch', en: 'Ground Beef' },
    category: 'proteins',
    calories: 250,
    proteinG: 26,
    carbsG: 0,
    fatG: 15,
    commonServings: [
      { name: { de: '100g', en: '100g' }, grams: 100 },
      { name: { de: '150g', en: '150g' }, grams: 150 },
    ],
    keywords: ['hackfleisch', 'beef', 'rind', 'meat'],
  },
  {
    id: 'kidney-beans',
    name: { de: 'Kidneybohnen', en: 'Kidney Beans' },
    category: 'proteins',
    calories: 127,
    proteinG: 8.7,
    carbsG: 23,
    fatG: 0.5,
    fiberG: 6.4,
    commonServings: [
      { name: { de: '1 Dose (240g)', en: '1 can (240g)' }, grams: 240 },
      { name: { de: '1 Tasse (180g)', en: '1 cup (180g)' }, grams: 180 },
    ],
    keywords: ['bohnen', 'beans', 'hülsenfrüchte', 'legumes'],
  },

  // GRAINS
  {
    id: 'white-rice-cooked',
    name: { de: 'Reis (gekocht)', en: 'Rice (cooked)' },
    category: 'grains',
    calories: 130,
    proteinG: 2.7,
    carbsG: 28,
    fatG: 0.3,
    fiberG: 0.4,
    commonServings: [
      { name: { de: '1 Tasse (160g)', en: '1 cup (160g)' }, grams: 160 },
      { name: { de: '1 Portion (200g)', en: '1 serving (200g)' }, grams: 200 },
    ],
  },
  {
    id: 'pasta-cooked',
    name: { de: 'Nudeln (gekocht)', en: 'Pasta (cooked)' },
    category: 'grains',
    calories: 131,
    proteinG: 5,
    carbsG: 25,
    fatG: 1.1,
    fiberG: 1.8,
    commonServings: [
      { name: { de: '1 Portion (140g)', en: '1 serving (140g)' }, grams: 140 },
      { name: { de: '1 Tasse (200g)', en: '1 cup (200g)' }, grams: 200 },
    ],
  },
  {
    id: 'oatmeal',
    name: { de: 'Haferflocken', en: 'Oatmeal' },
    category: 'grains',
    calories: 389,
    proteinG: 17,
    carbsG: 66,
    fatG: 7,
    fiberG: 11,
    commonServings: [
      { name: { de: '1 Portion trocken (40g)', en: '1 serving dry (40g)' }, grams: 40 },
      { name: { de: '1 Tasse trocken (80g)', en: '1 cup dry (80g)' }, grams: 80 },
    ],
    keywords: ['hafer', 'oats', 'porridge'],
  },
  {
    id: 'whole-wheat-bread',
    name: { de: 'Vollkornbrot', en: 'Whole Wheat Bread' },
    category: 'grains',
    calories: 247,
    proteinG: 13,
    carbsG: 41,
    fatG: 3.4,
    fiberG: 7,
    commonServings: [
      { name: { de: '1 Scheibe (30g)', en: '1 slice (30g)' }, grams: 30 },
      { name: { de: '2 Scheiben (60g)', en: '2 slices (60g)' }, grams: 60 },
    ],
    keywords: ['brot', 'bread'],
  },
  {
    id: 'quinoa-cooked',
    name: { de: 'Quinoa (gekocht)', en: 'Quinoa (cooked)' },
    category: 'grains',
    calories: 120,
    proteinG: 4.4,
    carbsG: 21,
    fatG: 1.9,
    fiberG: 2.8,
    commonServings: [
      { name: { de: '1 Tasse (185g)', en: '1 cup (185g)' }, grams: 185 },
      { name: { de: '1 Portion (150g)', en: '1 serving (150g)' }, grams: 150 },
    ],
  },

  // DAIRY
  {
    id: 'milk-whole',
    name: { de: 'Vollmilch', en: 'Whole Milk' },
    category: 'dairy',
    calories: 61,
    proteinG: 3.2,
    carbsG: 4.8,
    fatG: 3.3,
    commonServings: [
      { name: { de: '1 Glas (250ml)', en: '1 glass (250ml)' }, grams: 250 },
      { name: { de: '1 Tasse (240ml)', en: '1 cup (240ml)' }, grams: 240 },
    ],
    keywords: ['milch', 'milk'],
  },
  {
    id: 'greek-yogurt',
    name: { de: 'Griechischer Joghurt', en: 'Greek Yogurt' },
    category: 'dairy',
    calories: 59,
    proteinG: 10,
    carbsG: 3.6,
    fatG: 0.4,
    commonServings: [
      { name: { de: '1 Becher (150g)', en: '1 container (150g)' }, grams: 150 },
      { name: { de: '1 Portion (200g)', en: '1 serving (200g)' }, grams: 200 },
    ],
    keywords: ['joghurt', 'yogurt', 'yoghurt'],
  },
  {
    id: 'cheddar-cheese',
    name: { de: 'Cheddar Käse', en: 'Cheddar Cheese' },
    category: 'dairy',
    calories: 403,
    proteinG: 25,
    carbsG: 1.3,
    fatG: 33,
    commonServings: [
      { name: { de: '1 Scheibe (28g)', en: '1 slice (28g)' }, grams: 28 },
      { name: { de: '30g Portion', en: '30g serving' }, grams: 30 },
    ],
    keywords: ['käse', 'cheese'],
  },
  {
    id: 'cottage-cheese',
    name: { de: 'Hüttenkäse', en: 'Cottage Cheese' },
    category: 'dairy',
    calories: 98,
    proteinG: 11,
    carbsG: 3.4,
    fatG: 4.3,
    commonServings: [
      { name: { de: '1 Becher (200g)', en: '1 container (200g)' }, grams: 200 },
      { name: { de: '1 Tasse (225g)', en: '1 cup (225g)' }, grams: 225 },
    ],
    keywords: ['käse', 'cheese', 'quark'],
  },

  // SNACKS
  {
    id: 'almonds',
    name: { de: 'Mandeln', en: 'Almonds' },
    category: 'snacks',
    calories: 579,
    proteinG: 21,
    carbsG: 22,
    fatG: 50,
    fiberG: 12,
    commonServings: [
      { name: { de: '1 Handvoll (30g)', en: '1 handful (30g)' }, grams: 30 },
      { name: { de: '1 Portion (40g)', en: '1 serving (40g)' }, grams: 40 },
    ],
    keywords: ['nüsse', 'nuts'],
  },
  {
    id: 'peanut-butter',
    name: { de: 'Erdnussbutter', en: 'Peanut Butter' },
    category: 'snacks',
    calories: 588,
    proteinG: 25,
    carbsG: 20,
    fatG: 50,
    fiberG: 6,
    commonServings: [
      { name: { de: '1 Esslöffel (16g)', en: '1 tablespoon (16g)' }, grams: 16 },
      { name: { de: '2 Esslöffel (32g)', en: '2 tablespoons (32g)' }, grams: 32 },
    ],
    keywords: ['erdnuss', 'peanut'],
  },
  {
    id: 'protein-bar',
    name: { de: 'Proteinriegel', en: 'Protein Bar' },
    category: 'snacks',
    calories: 350,
    proteinG: 20,
    carbsG: 40,
    fatG: 10,
    commonServings: [
      { name: { de: '1 Riegel (60g)', en: '1 bar (60g)' }, grams: 60 },
    ],
    keywords: ['riegel', 'bar', 'protein'],
  },
  {
    id: 'dark-chocolate',
    name: { de: 'Zartbitterschokolade', en: 'Dark Chocolate' },
    category: 'snacks',
    calories: 546,
    proteinG: 5,
    carbsG: 61,
    fatG: 31,
    fiberG: 7,
    commonServings: [
      { name: { de: '1 Rippe (20g)', en: '1 square (20g)' }, grams: 20 },
      { name: { de: '1 Tafel (100g)', en: '1 bar (100g)' }, grams: 100 },
    ],
    keywords: ['schokolade', 'chocolate'],
  },

  // BEVERAGES (for completeness in database)
  {
    id: 'protein-shake',
    name: { de: 'Proteinshake', en: 'Protein Shake' },
    category: 'beverages',
    calories: 120,
    proteinG: 25,
    carbsG: 3,
    fatG: 1.5,
    commonServings: [
      { name: { de: '1 Shake (250ml)', en: '1 shake (250ml)' }, grams: 250 },
      { name: { de: '1 Portion (300ml)', en: '1 serving (300ml)' }, grams: 300 },
    ],
    keywords: ['shake', 'whey', 'protein'],
  },
  {
    id: 'coffee-black',
    name: { de: 'Kaffee (schwarz)', en: 'Coffee (black)' },
    category: 'beverages',
    calories: 2,
    proteinG: 0.3,
    carbsG: 0,
    fatG: 0,
    commonServings: [
      { name: { de: '1 Tasse (240ml)', en: '1 cup (240ml)' }, grams: 240 },
    ],
    keywords: ['kaffee', 'coffee'],
  },
];

/**
 * Get food item by ID
 */
export function getFoodById(id: string): FoodItem | undefined {
  return FOOD_DATABASE.find((food) => food.id === id);
}

/**
 * Get all foods in a category
 */
export function getFoodsByCategory(category: FoodCategory): FoodItem[] {
  return FOOD_DATABASE.filter((food) => food.category === category);
}

/**
 * Get all categories with food counts
 */
export function getCategoryCounts(): Record<FoodCategory, number> {
  const counts: Record<string, number> = {};
  for (const food of FOOD_DATABASE) {
    counts[food.category] = (counts[food.category] || 0) + 1;
  }
  return counts as Record<FoodCategory, number>;
}
