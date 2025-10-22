# Tasks: Localize Notes Tracking

## Phase 1: Data Layer (Foundation)

### T1: Create Food Database
- [ ] Create `src/data/foodDatabase.ts` with `FoodItem` interface
- [ ] Add ~50 common foods with nutrition data (per 100g):
  - Fruits: banana, apple, orange, berries, etc.
  - Vegetables: broccoli, carrot, tomato, cucumber, etc.
  - Proteins: chicken, eggs, tofu, beans, etc.
  - Grains: rice, pasta, bread, oats, etc.
  - Dairy: milk, yogurt, cheese, etc.
- [ ] Include common serving sizes for each item
- [ ] Source data from USDA FoodData Central
- [ ] Add TypeScript types and export

**Files:** `src/data/foodDatabase.ts` (new)

### T2: Implement Food Search Utility
- [ ] Create `src/utils/foodSearch.ts`
- [ ] Implement fuzzy search function (Levenshtein distance or similar)
- [ ] Add category filter support
- [ ] Add language-aware search (match both DE and EN names)
- [ ] Write unit tests for search accuracy

**Files:** `src/utils/foodSearch.ts` (new), `src/utils/__tests__/foodSearch.test.ts` (new)

### T3: Create Nutrition Calculator Utility
- [ ] Create `src/utils/nutritionCalculator.ts`
- [ ] Implement `calculateNutrition(foodItem, portionGrams)` function
- [ ] Add macro validation helpers
- [ ] Add calorie calculation from macros (4-4-9 rule)
- [ ] Write unit tests for calculations

**Files:** `src/utils/nutritionCalculator.ts` (new), `src/utils/__tests__/nutritionCalculator.test.ts` (new)

## Phase 2: UI Components (Structured Logging)

### T4: Create DrinkLogModal Component
- [ ] Create `src/components/notes/DrinkLogModal.tsx`
- [ ] Reuse hydration preset system from HydrationTile
- [ ] Add beverage type selector (water, coffee, tea, protein, other)
- [ ] Add optional note field
- [ ] Integrate with `firestoreService.updateDailyTracking()`
- [ ] Create `DrinkEvent` on successful log
- [ ] Add translations for modal UI

**Files:** `src/components/notes/DrinkLogModal.tsx` (new)

### T5: Create FoodLogModal Component
- [ ] Create `src/components/notes/FoodLogModal.tsx`
- [ ] Add two-tab interface: "Search Database" | "Manual Entry"
- [ ] **Tab 1 (Search):**
  - Search input with autocomplete
  - Category filter dropdown
  - Food results list
  - Serving size selector (common + custom)
  - Nutrition preview
- [ ] **Tab 2 (Manual):**
  - Food name input
  - Calories input
  - Protein/carbs/fat inputs
  - Auto-calculate option
- [ ] Optional note field
- [ ] Integrate with `firestoreService.updateDailyTracking()`
- [ ] Create `FoodEvent` on successful log
- [ ] Add translations for modal UI

**Files:** `src/components/notes/FoodLogModal.tsx` (new)

### T6: Create WorkoutLogModal Component
- [ ] Create `src/components/notes/WorkoutLogModal.tsx`
- [ ] Sport type dropdown (HIIT/Hyrox, Cardio, Gym, Swimming, Football, Other)
- [ ] Duration input (minutes)
- [ ] Intensity radio buttons (Easy, Moderate, Hard)
- [ ] Optional note field
- [ ] Integrate with `firestoreService.updateDailyTracking()`
- [ ] Create `WorkoutEvent` on successful log
- [ ] Add translations for modal UI

**Files:** `src/components/notes/WorkoutLogModal.tsx` (new)

### T7: Create WeightLogModal Component
- [ ] Create `src/components/notes/WeightLogModal.tsx`
- [ ] Weight input (kg) with decimal support
- [ ] Optional body fat % input
- [ ] Auto-calculate and display BMI
- [ ] Integrate with `firestoreService.updateDailyTracking()`
- [ ] Create `WeightEvent` on successful log
- [ ] Add translations for modal UI

**Files:** `src/components/notes/WeightLogModal.tsx` (new)

### T8: Create PushupLogModal Component
- [ ] Create `src/components/notes/PushupLogModal.tsx`
- [ ] Count input with increment/decrement buttons
- [ ] Optional note field
- [ ] Integrate with `firestoreService.updateDailyTracking()`
- [ ] Create `PushupEvent` on successful log
- [ ] Add translations for modal UI

**Files:** `src/components/notes/PushupLogModal.tsx` (new)

### T9: Create QuickLogPanel Component
- [ ] Create `src/components/notes/QuickLogPanel.tsx`
- [ ] Four quick action buttons:
  - 🥤 Drink (opens DrinkLogModal)
  - 🍎 Food (opens FoodLogModal)
  - 💪 Pushups (opens PushupLogModal)
  - ⚖️ Weight (opens WeightLogModal)
  - 🏃 Workout (opens WorkoutLogModal)
- [ ] Responsive grid layout
- [ ] Icon + label design
- [ ] Handle modal state management
- [ ] Add translations

**Files:** `src/components/notes/QuickLogPanel.tsx` (new)

### T10: Create ArchivedNotesView Component
- [ ] Create `src/components/notes/ArchivedNotesView.tsx`
- [ ] Read-only display of existing SmartNotes
- [ ] Timeline view with date grouping
- [ ] Show events extracted from old notes
- [ ] "Legacy Notes" section header
- [ ] Add translations

**Files:** `src/components/notes/ArchivedNotesView.tsx` (new)

## Phase 3: Architecture Cleanup (Remove AI)

### T11: Refactor Notes Pipeline
- [ ] Open `src/features/notes/pipeline.ts`
- [ ] Remove `summarizeAndValidate()` import and calls
- [ ] Remove `mergeEvents()` function
- [ ] Remove `normalizeLLMEvent()` function
- [ ] Simplify `processSmartNote()` - direct event creation only
- [ ] Simplify `updateSmartNote()` - direct event creation only
- [ ] Remove `retrySmartNote()` function (no longer needed)
- [ ] Keep `parseHeuristic()` for legacy note processing only
- [ ] Update TypeScript types

**Files:** `src/features/notes/pipeline.ts` (refactor)

### T12: Remove Gemini Service
- [ ] Delete `src/services/gemini.ts`
- [ ] Remove all imports of `gemini.ts` from other files
- [ ] Update TypeScript paths if needed

**Files:** `src/services/gemini.ts` (delete)

### T13: Remove AI Dependency from package.json
- [ ] Open `package.json`
- [ ] Remove `@google/generative-ai` from dependencies
- [ ] Run `npm install` to update lockfile
- [ ] Verify no broken imports

**Files:** `package.json` (edit)

## Phase 4: UI Integration

### T14: Update NotesPage
- [ ] Open `src/pages/NotesPage.tsx`
- [ ] Remove free-form text input UI
- [ ] Add `<QuickLogPanel />` at top
- [ ] Add "Today's Activity" section (current day events)
- [ ] Add `<ArchivedNotesView />` for legacy notes
- [ ] Update layout and styling
- [ ] Ensure mobile responsiveness

**Files:** `src/pages/NotesPage.tsx` (refactor)

### T15: Add Translation Keys
- [ ] Open `src/i18n/translations.ts`
- [ ] Add `quickLog` namespace:
  - Panel buttons (drink, food, workout, weight, pushups)
  - Modal titles and labels
  - Form fields and placeholders
  - Validation messages
- [ ] Add `foodDatabase` namespace:
  - Category names
  - Common serving size labels
  - Search placeholders
- [ ] Add keys for ArchivedNotesView
- [ ] Translate to both German and English

**Files:** `src/i18n/translations.ts` (edit)

## Phase 5: Testing & Validation

### T16: Unit Tests for Food Database
- [ ] Test `foodSearch()` accuracy with various queries
- [ ] Test category filtering
- [ ] Test language-aware search (DE/EN)
- [ ] Test edge cases (empty query, no results, special characters)

**Files:** `src/utils/__tests__/foodSearch.test.ts` (new)

### T17: Unit Tests for Nutrition Calculator
- [ ] Test `calculateNutrition()` with various portion sizes
- [ ] Test rounding behavior
- [ ] Test macro-to-calorie conversion
- [ ] Test edge cases (0g, very large portions)

**Files:** `src/utils/__tests__/nutritionCalculator.test.ts` (new)

### T18: Component Tests for Modals
- [ ] Test DrinkLogModal: form submission, validation, cancel
- [ ] Test FoodLogModal: search, tab switching, manual entry
- [ ] Test WorkoutLogModal: dropdown selection, validation
- [ ] Test WeightLogModal: BMI calculation, decimal input
- [ ] Test PushupLogModal: increment/decrement buttons

**Files:** `src/components/notes/__tests__/*.test.tsx` (new)

### T19: E2E Tests for Quick Log Flow
- [ ] Test complete drink log flow
- [ ] Test complete food log flow (database search)
- [ ] Test complete food log flow (manual entry)
- [ ] Test complete workout log flow
- [ ] Test complete weight log flow
- [ ] Verify DailyTracking updates in Firestore
- [ ] Verify events created correctly

**Files:** `tests/e2e/quick-log.spec.ts` (new)

### T20: Integration Testing with 3 Users
- [ ] Deploy to local environment
- [ ] Have all 3 users test each logging type
- [ ] Gather feedback on UI/UX
- [ ] Verify data syncs to Firebase correctly
- [ ] Check for any edge cases or bugs
- [ ] Iterate based on feedback

## Phase 6: Expansion & Documentation

### T21: Expand Food Database (Ongoing)
- [ ] Monitor which foods users attempt to search for
- [ ] Add top 50 additional foods based on usage patterns
- [ ] Accept community contributions via PRs
- [ ] Target: 200 foods within 2 months

**Files:** `src/data/foodDatabase.ts` (expand)

### T22: Update Documentation
- [ ] Update `openspec/specs/notes/spec.md` with new architecture
- [ ] Update `openspec/specs/dashboard/spec.md` to reference structured logging
- [ ] Update `CLAUDE.md` if needed
- [ ] Update `CHANGELOG.md` with breaking changes note

**Files:** Multiple documentation files

### T23: Performance Validation
- [ ] Run Lighthouse CI
- [ ] Verify bundle size increase <60KB (target: ~50KB for food DB)
- [ ] Test food search with 200+ items (<100ms response time)
- [ ] Verify offline functionality works end-to-end

## Phase 7: Cleanup & Finalization

### T24: Remove Unused Code
- [ ] Search codebase for any remaining Gemini references
- [ ] Remove dead code related to AI parsing
- [ ] Clean up unused imports
- [ ] Run linter and fix any issues

### T25: Final TypeScript Check
- [ ] Run `npm run typecheck` - ensure 0 errors
- [ ] Fix any type issues introduced by refactoring
- [ ] Verify all new components have proper types

### T26: Final Testing & Deployment
- [ ] Run full test suite: `npm run test:all`
- [ ] Ensure all tests pass
- [ ] Run build: `npm run build`
- [ ] Deploy to production environment
- [ ] Monitor for 48 hours for any issues

---

## Summary

**Total Tasks**: 26
- **Phase 1 (Data Layer)**: 3 tasks
- **Phase 2 (UI Components)**: 7 tasks
- **Phase 3 (Architecture Cleanup)**: 3 tasks
- **Phase 4 (UI Integration)**: 2 tasks
- **Phase 5 (Testing)**: 5 tasks
- **Phase 6 (Expansion)**: 3 tasks
- **Phase 7 (Cleanup)**: 3 tasks

**Estimated Effort**: 3-4 weeks for complete implementation and testing
