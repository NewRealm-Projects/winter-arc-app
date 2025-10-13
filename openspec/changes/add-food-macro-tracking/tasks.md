# Implementation Tasks

## 1. Data Model Updates

- [ ] 1.1 Extend `FoodEvent` interface in `src/types/events.ts`
  - Add `carbsG?: number`
  - Add `fatG?: number`
  - Keep `calories`, `proteinG`, `label` as existing

- [ ] 1.2 Update `SmartTrackingContribution` type
  - Add `calories?: number` (for calorie tracking from food notes)
  - Add `carbsG?: number`
  - Add `fatG?: number`

## 2. Tracking Sync Integration

- [ ] 2.1 Update `trackingSync.ts` to process carbs/fat from food events
  - Extend `buildContributionFromEvent` for `case 'food'`
  - Aggregate `carbsG` and `fatG` per day

- [ ] 2.2 Update `combineTrackingWithSmart` utility
  - Merge calories/carbs/fat from smart contributions

## 3. Notes UI Updates

- [ ] 3.1 Update `EventBadges` component in `NotesPage.tsx`
  - Show carbs/fat in food badge
  - Format: `🍽️ Chicken (300 kcal · 30g P · 5g C · 10g F)`
  - Handle missing fields gracefully

- [ ] 3.2 Add macro summary per note (optional enhancement)
  - Calculate total P/C/F per note
  - Show visual breakdown (pie chart or bars)

## 4. Dashboard Integration - Unified Nutrition Tile

- [ ] 4.1 Create nutrition goal calculation utility
  - Create `src/utils/nutrition.ts`
  - Implement `calculateTDEE(weight, bodyFat?, gender)` - TDEE based on LBM or bodyweight
  - Implement `calculateProteinGoal(weight)` - 2g per kg (existing logic)
  - Implement `calculateCarbsGoal(tdee)` - 40% of TDEE (in grams)
  - Implement `calculateFatGoal(tdee)` - 30% of TDEE (in grams)
  - Unit tests for all calculation functions

- [ ] 4.2 Replace ProteinTile with NutritionTile
  - Rename `src/components/ProteinTile.tsx` to `NutritionTile.tsx`
  - Display all 4 macros: Calories, Protein, Carbs, Fat
  - Show current value / goal for each macro with percentage
  - Main progress bar for calories (primary metric)
  - Use `useCombinedTracking()` to merge manual + smart contributions
  - Calculate goals using `nutrition.ts` utilities

- [ ] 4.3 Implement Quick-Add modal for all macros
  - Tabbed interface: Kalorien, Protein, Kohlenhydrate, Fett
  - Quick-add buttons per tab:
    - Calories: +100, +200, +300 kcal
    - Protein: +10g, +20g, +30g
    - Carbs: +25g, +50g, +100g
    - Fat: +10g, +20g, +30g
  - Exact input fields for all 4 macros
  - Save updates to `tracking[date]` with all macro values

- [ ] 4.4 Add smart hints to NutritionTile
  - Display "💡 Ziel basiert auf Gewicht & KFA" if auto-calculated
  - Display "🔗 Enthält Essen aus Notizen" if smartContributions > 0
  - Hide hints if not applicable (clean UI)

- [ ] 4.5 Update Dashboard layout
  - Replace `<ProteinTile />` with `<NutritionTile />` in Dashboard
  - Ensure tile uses `tile-grid-2` for proper desktop alignment
  - Test mobile layout (one column, full width)

## 5. Testing

- [ ] 5.1 Unit tests for `trackingSync.ts`
  - Test food event with all macros
  - Test food event with missing macros
  - Test aggregation across multiple notes

- [ ] 5.2 Integration tests for `useCombinedTracking`
  - Verify food macros appear in combined tracking
  - Verify protein sync to Dashboard

- [ ] 5.3 E2E tests for Notes page
  - Add food note with macros
  - Verify badge shows all fields
  - Verify Dashboard protein updates

## 6. Documentation

- [ ] 6.1 Update CLAUDE.md
  - Document food macro tracking feature
  - Explain protein sync from notes to Dashboard

- [ ] 6.2 Create capability specs in OpenSpec
  - Create `notes` spec - Smart Note system, food tracking
  - Create `training-load` spec - Check-In flow, Training Load calculation

- [ ] 6.3 Update i18n translations
  - Add macro-related strings (carbsG, fatG display)
  - Add Calories Tile strings (goal, quick-add buttons)

## Parallel Work Opportunities

- Tasks 2.1, 2.2 can run in parallel
- Tasks 3.1, 4.1 can run in parallel
- Tasks 5.1, 5.2, 5.3 can run in parallel after implementation

## Dependencies

- Task 1.1 must complete before 2.1
- Task 2.1 must complete before 3.1
- Task 3.1 must complete before 5.3
