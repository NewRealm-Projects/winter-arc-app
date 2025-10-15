# Design: Localize Notes Tracking

## Overview

This design document details the technical architecture for replacing AI-powered free-form note parsing with structured local-only logging interfaces.

---

## 1. Food Database Design

### 1.1 Data Structure

```typescript
// src/data/foodDatabase.ts

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
  id: string; // Unique identifier (kebab-case, e.g., "banana", "chicken-breast")
  name: {
    de: string; // German name
    en: string; // English name
  };
  category: FoodCategory;
  // All nutrition values per 100g
  calories: number; // kcal
  proteinG: number;
  carbsG: number;
  fatG: number;
  fiberG?: number; // Optional
  commonServings?: CommonServing[]; // Optional, but recommended
  keywords?: string[]; // Additional search terms (e.g., ["hähnchen", "poulet"])
}

export const FOOD_DATABASE: FoodItem[] = [
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
    keywords: ['hähnchen', 'chicken', 'poulet', 'geflügel', 'poultry'],
  },
  // ... 198 more items
];
```

### 1.2 Database Size Optimization

**Target**: ~200 items, <50KB gzipped

**Optimization strategies:**
- Use short property names in production build (via minification)
- Omit optional `fiberG` when not relevant
- Omit `keywords` for foods with straightforward names
- Keep only 2-3 common servings per item

**Estimated size:**
- Per item: ~150-250 bytes
- 200 items × 200 bytes = 40KB uncompressed
- Gzip compression: ~50-60% reduction → 20-25KB final size

### 1.3 Data Source

**Primary source**: [USDA FoodData Central](https://fdc.nal.usda.gov/)
- Public domain nutrition data
- Regularly updated
- High accuracy

**Curation process:**
1. Identify most common foods from fitness/nutrition logs
2. Query USDA API for nutrition data
3. Convert to FoodItem format
4. Add common serving sizes based on regional standards
5. Add keywords for better search

---

## 2. Food Search Design

### 2.1 Search Algorithm

```typescript
// src/utils/foodSearch.ts

export interface FoodSearchOptions {
  query: string;
  category?: FoodCategory;
  language: 'de' | 'en';
  limit?: number; // Default: 20
}

export interface FoodSearchResult {
  item: FoodItem;
  score: number; // 0-1, higher is better
}

/**
 * Fuzzy search implementation using Levenshtein distance
 * - Exact match: score = 1.0
 * - Prefix match: score = 0.8-0.9
 * - Fuzzy match: score = 0.5-0.7
 * - No match: score = 0
 */
export function searchFoods(options: FoodSearchOptions): FoodSearchResult[] {
  const { query, category, language, limit = 20 } = options;

  if (!query.trim()) {
    // No query: return all items in category (if specified) or all items
    const filtered = category
      ? FOOD_DATABASE.filter(item => item.category === category)
      : FOOD_DATABASE;
    return filtered.slice(0, limit).map(item => ({ item, score: 1.0 }));
  }

  const normalizedQuery = query.toLowerCase().trim();
  const results: FoodSearchResult[] = [];

  for (const item of FOOD_DATABASE) {
    // Skip if category filter doesn't match
    if (category && item.category !== category) {
      continue;
    }

    const itemName = item.name[language].toLowerCase();
    const keywords = item.keywords?.map(k => k.toLowerCase()) || [];

    // Calculate score
    let score = 0;

    // Exact match
    if (itemName === normalizedQuery) {
      score = 1.0;
    }
    // Prefix match
    else if (itemName.startsWith(normalizedQuery)) {
      score = 0.9;
    }
    // Contains match
    else if (itemName.includes(normalizedQuery)) {
      score = 0.8;
    }
    // Keyword match
    else if (keywords.some(k => k === normalizedQuery || k.includes(normalizedQuery))) {
      score = 0.7;
    }
    // Fuzzy match (Levenshtein distance)
    else {
      const distance = levenshteinDistance(normalizedQuery, itemName);
      const maxLen = Math.max(normalizedQuery.length, itemName.length);
      const similarity = 1 - (distance / maxLen);
      if (similarity > 0.6) {
        score = similarity * 0.6; // Scale down fuzzy matches
      }
    }

    if (score > 0) {
      results.push({ item, score });
    }
  }

  // Sort by score (descending) and return top N
  return results
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
}

/**
 * Levenshtein distance implementation
 * https://en.wikipedia.org/wiki/Levenshtein_distance
 */
function levenshteinDistance(a: string, b: string): number {
  const matrix: number[][] = [];

  for (let i = 0; i <= b.length; i++) {
    matrix[i] = [i];
  }
  for (let j = 0; j <= a.length; j++) {
    matrix[0][j] = j;
  }

  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1, // substitution
          matrix[i][j - 1] + 1,     // insertion
          matrix[i - 1][j] + 1      // deletion
        );
      }
    }
  }

  return matrix[b.length][a.length];
}
```

### 2.2 Search Performance

**Target**: <50ms for 200 items on mobile devices

**Optimization:**
- Pre-normalize names and keywords at startup
- Use early exit for exact/prefix matches
- Only compute Levenshtein distance when necessary
- Cache search results for 5 seconds (debounced input)

---

## 3. Nutrition Calculator Design

### 3.1 Calculation Logic

```typescript
// src/utils/nutritionCalculator.ts

export interface NutritionResult {
  calories: number;    // kcal
  proteinG: number;
  carbsG: number;
  fatG: number;
  fiberG?: number;
}

/**
 * Calculate nutrition for a given portion size
 * All values in FoodItem are per 100g, scale proportionally
 */
export function calculateNutrition(
  foodItem: FoodItem,
  portionGrams: number
): NutritionResult {
  const ratio = portionGrams / 100;

  return {
    calories: Math.round(foodItem.calories * ratio),
    proteinG: Math.round(foodItem.proteinG * ratio * 10) / 10, // 1 decimal
    carbsG: Math.round(foodItem.carbsG * ratio * 10) / 10,
    fatG: Math.round(foodItem.fatG * ratio * 10) / 10,
    fiberG: foodItem.fiberG
      ? Math.round(foodItem.fiberG * ratio * 10) / 10
      : undefined,
  };
}

/**
 * Calculate calories from macros using 4-4-9 rule
 * Protein: 4 kcal/g, Carbs: 4 kcal/g, Fat: 9 kcal/g
 */
export function calculateCaloriesFromMacros(
  proteinG: number,
  carbsG: number,
  fatG: number
): number {
  return Math.round(proteinG * 4 + carbsG * 4 + fatG * 9);
}

/**
 * Validate nutrition input from manual entry
 */
export interface NutritionValidationError {
  field: 'calories' | 'proteinG' | 'carbsG' | 'fatG';
  message: string;
}

export function validateNutrition(nutrition: Partial<NutritionResult>): NutritionValidationError | null {
  if (nutrition.calories !== undefined && (nutrition.calories < 0 || nutrition.calories > 10000)) {
    return { field: 'calories', message: 'Calories must be between 0 and 10000' };
  }
  if (nutrition.proteinG !== undefined && (nutrition.proteinG < 0 || nutrition.proteinG > 500)) {
    return { field: 'proteinG', message: 'Protein must be between 0 and 500g' };
  }
  if (nutrition.carbsG !== undefined && (nutrition.carbsG < 0 || nutrition.carbsG > 1000)) {
    return { field: 'carbsG', message: 'Carbs must be between 0 and 1000g' };
  }
  if (nutrition.fatG !== undefined && (nutrition.fatG < 0 || nutrition.fatG > 500)) {
    return { field: 'fatG', message: 'Fat must be between 0 and 500g' };
  }
  return null;
}
```

---

## 4. UI Component Architecture

### 4.1 Component Hierarchy

```
NotesPage
├── QuickLogPanel
│   ├── QuickLogButton (Drink)
│   ├── QuickLogButton (Food)
│   ├── QuickLogButton (Pushups)
│   ├── QuickLogButton (Workout)
│   └── QuickLogButton (Weight)
├── TodayActivitySection
│   └── EventTimeline (today's events)
└── ArchivedNotesView (legacy SmartNotes)
    └── NoteCard (read-only)

Modals (rendered via AppModal)
├── DrinkLogModal
│   ├── BeverageTypeSelector
│   ├── PresetButtons (from HydrationTile)
│   └── ManualInput
├── FoodLogModal
│   ├── TabPanel
│   │   ├── DatabaseSearchTab
│   │   │   ├── SearchInput (autocomplete)
│   │   │   ├── CategoryFilter
│   │   │   ├── FoodResultsList
│   │   │   └── ServingSizeSelector
│   │   └── ManualEntryTab
│   │       ├── FoodNameInput
│   │       ├── CaloriesInput
│   │       └── MacrosInputs
│   └── NutritionPreview
├── WorkoutLogModal
│   ├── SportTypeDropdown
│   ├── DurationInput
│   ├── IntensitySelector
│   └── OptionalNote
├── WeightLogModal
│   ├── WeightInput
│   ├── BodyFatInput (optional)
│   └── BMIDisplay (calculated)
└── PushupLogModal
    ├── CountInput
    └── OptionalNote
```

### 4.2 Component Specifications

#### QuickLogPanel

**Props:** None (stateless, triggers modals)

**Layout:**
```tsx
<div className="grid grid-cols-2 gap-3 md:grid-cols-5">
  <QuickLogButton icon="🥤" label={t('quickLog.drink')} onClick={openDrinkModal} />
  <QuickLogButton icon="🍎" label={t('quickLog.food')} onClick={openFoodModal} />
  <QuickLogButton icon="💪" label={t('quickLog.pushups')} onClick={openPushupModal} />
  <QuickLogButton icon="🏃" label={t('quickLog.workout')} onClick={openWorkoutModal} />
  <QuickLogButton icon="⚖️" label={t('quickLog.weight')} onClick={openWeightModal} />
</div>
```

**Styling:**
- Use `glassCardClasses` from theme tokens
- Consistent with existing tile design
- Mobile: 2 columns, Desktop: 5 columns (single row)

#### FoodLogModal

**Props:**
```typescript
interface FoodLogModalProps {
  open: boolean;
  onClose: () => void;
  onSave: (data: FoodLogData) => Promise<void>;
  currentDate: string; // YYYY-MM-DD
}

interface FoodLogData {
  source: 'database' | 'manual';
  foodName: string;
  portionGrams?: number;
  nutrition: NutritionResult;
  note?: string;
}
```

**State Management:**
```typescript
const [activeTab, setActiveTab] = useState<'database' | 'manual'>('database');
const [searchQuery, setSearchQuery] = useState('');
const [selectedCategory, setSelectedCategory] = useState<FoodCategory | undefined>();
const [searchResults, setSearchResults] = useState<FoodSearchResult[]>([]);
const [selectedFood, setSelectedFood] = useState<FoodItem | null>(null);
const [portionGrams, setPortionGrams] = useState<number>(100);
const [manualNutrition, setManualNutrition] = useState<Partial<NutritionResult>>({});
const [note, setNote] = useState('');
```

**Database Search Tab Flow:**
1. User types in search input (debounced 300ms)
2. `searchFoods()` executes with current query + category filter
3. Results render as clickable cards with name + category icon
4. User clicks food → Show serving size selector
5. User selects serving OR enters custom grams
6. Nutrition preview updates in real-time via `calculateNutrition()`
7. User clicks "Log Food" → Save

**Manual Entry Tab Flow:**
1. User enters food name
2. User enters either:
   - Option A: Calories only
   - Option B: Protein + Carbs + Fat (auto-calculate calories via 4-4-9)
3. Nutrition preview updates
4. User clicks "Log Food" → Save

**Save Logic:**
```typescript
async function handleSave() {
  const nutrition = activeTab === 'database'
    ? calculateNutrition(selectedFood!, portionGrams)
    : {
        calories: manualNutrition.calories || 0,
        proteinG: manualNutrition.proteinG || 0,
        carbsG: manualNutrition.carbsG || 0,
        fatG: manualNutrition.fatG || 0,
      };

  const data: FoodLogData = {
    source: activeTab,
    foodName: activeTab === 'database' ? selectedFood!.name[currentLanguage] : manualNutrition.name!,
    portionGrams: activeTab === 'database' ? portionGrams : undefined,
    nutrition,
    note,
  };

  await onSave(data);
  onClose();
}
```

#### DrinkLogModal

**Props:**
```typescript
interface DrinkLogModalProps {
  open: boolean;
  onClose: () => void;
  onSave: (data: DrinkLogData) => Promise<void>;
  currentDate: string;
  userPresets: DrinkPreset[]; // From User.hydrationPresets
}

interface DrinkLogData {
  beverage: 'water' | 'protein' | 'coffee' | 'tea' | 'other';
  amountMl: number;
  note?: string;
}
```

**Layout:**
```tsx
<AppModal open={open} onClose={onClose} title={t('quickLog.drinkModal.title')}>
  <div className="space-y-4">
    {/* Beverage Type Selector */}
    <div>
      <label>{t('quickLog.drinkModal.beverageType')}</label>
      <div className="grid grid-cols-3 gap-2">
        <BeverageButton type="water" icon="💧" selected={beverage === 'water'} />
        <BeverageButton type="coffee" icon="☕" selected={beverage === 'coffee'} />
        <BeverageButton type="tea" icon="🍵" selected={beverage === 'tea'} />
        <BeverageButton type="protein" icon="🥤" selected={beverage === 'protein'} />
        <BeverageButton type="other" icon="🧃" selected={beverage === 'other'} />
      </div>
    </div>

    {/* Amount (Presets or Manual) */}
    <div>
      <label>{t('quickLog.drinkModal.amount')}</label>
      {userPresets.length > 0 && (
        <div className="grid grid-cols-3 gap-2 mb-2">
          {userPresets.map(preset => (
            <PresetButton key={preset.id} preset={preset} onClick={() => setAmountMl(preset.amountMl)} />
          ))}
        </div>
      )}
      <input type="number" value={amountMl} onChange={e => setAmountMl(Number(e.target.value))} />
    </div>

    {/* Optional Note */}
    <input type="text" placeholder={t('quickLog.optionalNote')} value={note} onChange={e => setNote(e.target.value)} />
  </div>

  <ModalPrimaryButton onClick={handleSave}>{t('common.actions.save')}</ModalPrimaryButton>
</AppModal>
```

---

## 5. Data Flow Architecture

### 5.1 Current Flow (AI-Powered)

```
User Input (free text)
  ↓
parseHeuristic() → candidates: Event[]
  ↓
Create SmartNote (pending: true)
  ↓
Gemini API summarizeAndValidate() [2-8s, costly]
  ↓
mergeEvents(candidates, llmEvents)
  ↓
Update SmartNote (pending: false)
  ↓
useCombinedDailyTracking() aggregates events → DailyTracking contribution
```

**Problems:**
- Latency: 2-8 seconds
- Cost: $0.0001-0.001 per note
- Failure rate: ~5%
- Offline: Not supported

### 5.2 New Flow (Structured)

```
User selects quick action
  ↓
Modal opens with structured form
  ↓
User fills form (instant validation)
  ↓
User clicks "Save"
  ↓
Create Event locally (source: 'manual')
  ↓
Update DailyTracking directly in Firestore [<100ms]
  ↓
Store Event in local history (optional: sync to Firestore)
  ↓
UI updates immediately (optimistic update)
```

**Benefits:**
- Latency: <100ms
- Cost: $0
- Failure rate: <0.1%
- Offline: Fully supported (queue sync when online)

### 5.3 Firestore Integration

**Update DailyTracking:**
```typescript
// Example: Food log
const userId = auth.currentUser!.uid;
const date = format(new Date(), 'yyyy-MM-dd');

const currentTracking = await firestoreService.getDailyTracking(userId, date);

await firestoreService.updateDailyTracking(userId, date, {
  calories: (currentTracking?.calories || 0) + foodData.nutrition.calories,
  protein: (currentTracking?.protein || 0) + foodData.nutrition.proteinG,
  carbsG: (currentTracking?.carbsG || 0) + foodData.nutrition.carbsG,
  fatG: (currentTracking?.fatG || 0) + foodData.nutrition.fatG,
});
```

**Store Event (Optional):**
```typescript
// For history/audit trail
const event: FoodEvent = {
  id: crypto.randomUUID(),
  ts: Date.now(),
  kind: 'food',
  label: foodData.foodName,
  calories: foodData.nutrition.calories,
  proteinG: foodData.nutrition.proteinG,
  carbsG: foodData.nutrition.carbsG,
  fatG: foodData.nutrition.fatG,
  confidence: 1.0,
  source: 'manual',
};

// Store in users/{userId}/events/{eventId} (new subcollection)
await firestoreService.addEvent(userId, event);
```

---

## 6. Legacy Data Handling

### 6.1 Existing SmartNotes

**Current structure:**
```typescript
interface SmartNote {
  id: string;
  ts: number;
  raw: string;        // Original user input
  summary: string;    // AI-generated summary
  events: Event[];    // Extracted events
  pending?: boolean;
  attachments?: SmartNoteAttachment[];
}
```

**Preservation strategy:**
- Keep all existing SmartNotes in Firestore
- Display in "Archived Notes" section (read-only)
- Events from SmartNotes still contribute to historical tracking
- No new SmartNotes created (replaced by direct events)

### 6.2 ArchivedNotesView Component

**Purpose:** Read-only display of legacy AI-parsed notes

**Layout:**
```tsx
<div className="space-y-4">
  <h3>{t('notes.archivedNotes.title')}</h3>
  <p className="text-sm text-gray-500">{t('notes.archivedNotes.description')}</p>

  <div className="space-y-3">
    {archivedNotes.map(note => (
      <NoteCard key={note.id} note={note} readOnly={true} />
    ))}
  </div>
</div>
```

**Behavior:**
- No edit/delete buttons
- Show "Legacy Note" badge
- Display AI summary and extracted events
- Show original raw input on expand

---

## 7. Translation Strategy

### 7.1 New Translation Namespaces

```typescript
// src/i18n/translations.ts

export const translations = {
  de: {
    // ... existing
    quickLog: {
      drink: 'Getränk',
      food: 'Essen',
      pushups: 'Liegestütze',
      workout: 'Training',
      weight: 'Gewicht',
      optionalNote: 'Optionale Notiz...',
      drinkModal: {
        title: 'Getränk loggen',
        beverageType: 'Getränkeart',
        amount: 'Menge (ml)',
        beverageWater: 'Wasser',
        beverageCoffee: 'Kaffee',
        beverageTea: 'Tee',
        beverageProtein: 'Proteinshake',
        beverageOther: 'Anderes',
      },
      foodModal: {
        title: 'Essen loggen',
        searchTab: 'Datenbank durchsuchen',
        manualTab: 'Manuell eingeben',
        searchPlaceholder: 'Lebensmittel suchen...',
        category: 'Kategorie',
        allCategories: 'Alle Kategorien',
        servingSize: 'Portionsgröße',
        customGrams: 'Eigene Menge (g)',
        nutritionPreview: 'Nährwerte (geschätzt)',
        manualFoodName: 'Lebensmittelname',
        manualCalories: 'Kalorien (kcal)',
        manualProtein: 'Eiweiß (g)',
        manualCarbs: 'Kohlenhydrate (g)',
        manualFat: 'Fett (g)',
      },
      workoutModal: {
        title: 'Training loggen',
        sportType: 'Sportart',
        duration: 'Dauer (Minuten)',
        intensity: 'Intensität',
        intensityEasy: 'Leicht',
        intensityModerate: 'Mittel',
        intensityHard: 'Schwer',
      },
      weightModal: {
        title: 'Gewicht loggen',
        weight: 'Gewicht (kg)',
        bodyFat: 'Körperfett (%, optional)',
        bmi: 'BMI',
      },
      pushupModal: {
        title: 'Liegestütze loggen',
        count: 'Anzahl',
      },
    },
    foodDatabase: {
      categories: {
        fruits: 'Obst',
        vegetables: 'Gemüse',
        proteins: 'Proteine',
        grains: 'Getreide',
        dairy: 'Milchprodukte',
        snacks: 'Snacks',
        beverages: 'Getränke',
      },
    },
    notes: {
      archivedNotes: {
        title: 'Archivierte Notizen',
        description: 'Alte Notizen mit KI-Verarbeitung (schreibgeschützt)',
        legacyBadge: 'Legacy',
      },
    },
  },
  en: {
    // ... English translations
  },
};
```

---

## 8. Performance Considerations

### 8.1 Bundle Size

**Current bundle (production):**
- Main chunk: ~450KB gzipped
- Budget: <600KB

**Food database addition:**
- 200 items × ~200 bytes = 40KB uncompressed
- Gzipped: ~20-25KB
- **New total**: ~470-475KB (well within budget)

### 8.2 Search Performance

**Target**: <50ms for 200 items

**Profiling strategy:**
- Test on low-end mobile devices (e.g., iPhone SE)
- Measure `searchFoods()` execution time
- Optimize if >50ms:
  - Pre-compute normalized strings
  - Use Web Workers for large searches
  - Implement virtual scrolling for results

### 8.3 Offline Support

**Strategy:**
- Food database embedded in bundle (no network needed)
- DailyTracking updates queue locally if offline
- Sync to Firestore when online
- Use `onSnapshot` for real-time sync across devices

---

## 9. Testing Strategy

### 9.1 Unit Tests

**Food Search:**
- Test exact match, prefix match, fuzzy match
- Test category filtering
- Test language switching
- Test edge cases (empty query, special characters)

**Nutrition Calculator:**
- Test portion scaling
- Test rounding behavior
- Test macro-to-calorie conversion
- Test validation

**Components:**
- Test modal open/close
- Test form validation
- Test save handlers
- Test error states

### 9.2 Integration Tests

**E2E Flow:**
1. Open QuickLogPanel
2. Click "Food" button
3. Search for "banana"
4. Select "1 medium (120g)"
5. Verify nutrition preview
6. Click "Log Food"
7. Verify DailyTracking updated in Firestore
8. Verify nutrition tile reflects new data

### 9.3 Performance Tests

**Lighthouse CI:**
- Target: Performance ≥90
- Verify bundle size increase acceptable
- Check for layout shifts

**Search Performance:**
- Profile `searchFoods()` with 200 items
- Target: <50ms on mobile

---

## 10. Future Enhancements

### 10.1 Food Database Expansion
- Start with 50 foods, expand to 200 based on usage
- Community contributions via PRs
- Regional food variants (e.g., German vs. US brands)

### 10.2 Barcode Scanning (Phase 2)
- Use device camera to scan barcodes
- Query Open Food Facts API for nutrition data
- Cache results in local database
- **Cost**: Free (Open Food Facts is open-source)

### 10.3 Meal Templates (Phase 2)
- Save common meals (e.g., "Breakfast: Oats + Banana + Protein")
- One-click logging of entire meals
- Stored in user profile

### 10.4 Recipe Database (Phase 3)
- Users can create recipes with ingredients
- Calculate nutrition from ingredients
- Share recipes with group members

---

## 11. Risk Mitigation

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| Food database too limited | Medium | Medium | Start with 50 items, expand iteratively. Manual entry covers edge cases. |
| Users miss AI summarization | Low | Low | Provide optional note field in all modals. Archive old AI notes for reference. |
| Search performance issues | Low | Medium | Profiling + optimization. Target <50ms. Use debouncing. |
| Nutrition data inaccuracies | Medium | Low | Source from USDA (trusted). Display "approximate values" disclaimer. |
| Bundle size exceeds budget | Low | Low | Food DB adds only ~25KB gzipped. Monitor with bundle analyzer. |

---

## Conclusion

This design replaces costly AI dependency with structured local-only logging, achieving:

- **$0/month cost** (vs $150-1500)
- **<100ms latency** (vs 2-8s)
- **100% offline support** (vs 0%)
- **<0.1% error rate** (vs ~5%)

All while maintaining full tracking functionality through carefully designed UI patterns and an embedded nutrition database.
