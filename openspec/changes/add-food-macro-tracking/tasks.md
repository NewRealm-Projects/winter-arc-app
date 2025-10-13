# Implementation Tasks

## 1. Data Model Updates

- [ ] 1.1 Add `ActivityLevel` type to `src/types/index.ts`
  - Type: `'sedentary' | 'light' | 'moderate' | 'active' | 'very_active'`
  - Default: `'moderate'`

- [ ] 1.2 Extend `User` interface in `src/types/index.ts`
  - Add `activityLevel?: ActivityLevel` (optional, default: 'moderate')

- [ ] 1.3 Extend `FoodEvent` interface in `src/types/events.ts`
  - Add `carbsG?: number`
  - Add `fatG?: number`
  - Keep `calories`, `proteinG`, `label` as existing

- [ ] 1.4 Update `SmartTrackingContribution` type
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
  - Implement `calculateTDEE(weight, activityLevel, bodyFat?)` - TDEE based on LBM and activity level
  - Activity multipliers: sedentary (30), light (35), moderate (40), active (45), very_active (50) kcal/kg LBM
  - Implement `calculateProteinGoal(weight)` - 2g per kg (existing logic)
  - Implement `calculateCarbsGoal(tdee)` - 40% of TDEE (in grams)
  - Implement `calculateFatGoal(tdee)` - 30% of TDEE (in grams)
  - Unit tests for all calculation functions with different activity levels

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

- [ ] 5.4 Unit tests for `nutrition.ts`
  - Test calculateTDEE() with all activity levels (sedentary, light, moderate, active, very_active)
  - Test LBM calculation with valid bodyFat (e.g., 15%, 25%)
  - Test fallback calculation without bodyFat
  - Test edge cases: weight = 0, bodyFat = -5, bodyFat = 150
  - Test calculateProteinGoal() with various weights (50kg, 80kg, 120kg)
  - Test calculateCarbsGoal() with various TDEEs (1500, 2500, 4000 kcal)
  - Test calculateFatGoal() with various TDEEs (1500, 2500, 4000 kcal)
  - Achieve ≥80% test coverage for nutrition.ts

- [ ] 5.5 Codacy Compliance Checks
  - Run `npm run lint` - NO errors/warnings allowed
  - Run `npm run format:check` - All files must pass Prettier
  - Run `npm run typecheck` - NO TypeScript errors
  - Run `npm test -- --coverage` - Coverage ≥80% for all new files
  - Fix all ESLint warnings (unused imports, unused variables, console.log)
  - Replace any `any` types with proper type definitions
  - Remove all `console.*` statements (use logger or remove entirely)
  - Extract magic numbers to named constants (e.g., `const ACTIVITY_MULTIPLIER_MODERATE = 40`)
  - Ensure no functions exceed 50 lines (split if needed)
  - Check for circular dependencies (should be none)

- [ ] 5.6 Performance Checks
  - Run `npm run analyze` - Verify nutrition.ts adds <10KB to bundle
  - Run `npm run lhci:run` - Lighthouse score must remain ≥90
  - Ensure NutritionTile rendering <16ms (60fps)
  - Check no memory leaks in NutritionTile (mount/unmount 100x)
  - Verify Quick-Add modal opens <100ms
  - Profile trackingSync.ts with 100+ notes (should be <50ms)

## 6. Onboarding & Settings

- [ ] 6.1 Add Activity Level step to Onboarding
  - Add step after Body Fat % input (between Step 6 and 7)
  - Display 5 activity level options with descriptions
  - Default selection: 'moderate'
  - Store in `user.activityLevel` field

- [ ] 6.2 Add Activity Level to Settings
  - Add section in Profile/Settings page
  - Display current activity level
  - Allow modification with dropdown or radio buttons
  - Update Firestore on change
  - Recalculate TDEE and nutrition goals immediately

## 7. Documentation

- [ ] 7.1 Update CLAUDE.md
  - Document food macro tracking feature
  - Explain protein sync from notes to Dashboard
  - Document activity level selection

- [ ] 7.2 Create capability specs in OpenSpec
  - Create `notes` spec - Smart Note system, food tracking
  - Update `user-auth` spec - Add Activity Level onboarding step (Step 6.5)
  - Update `settings` spec - Add Activity Level setting
  - Update `dashboard` spec - Document activity level in TDEE calculation

- [ ] 7.3 Update i18n translations
  - Define i18n keys for macro-related strings:
    - `dashboard.nutrition.title` = "Ernährung"
    - `dashboard.nutrition.calories` = "Kalorien"
    - `dashboard.nutrition.protein` = "Protein"
    - `dashboard.nutrition.carbs` = "Kohlenhydrate"
    - `dashboard.nutrition.fat` = "Fett"
    - `dashboard.nutrition.quickAdd` = "Schnell hinzufügen"
    - `dashboard.nutrition.edit` = "Bearbeiten"
    - `dashboard.nutrition.hintGoal` = "Ziel basiert auf Gewicht, KFA & Aktivität"
    - `dashboard.nutrition.hintGoalNoBodyFat` = "Ziel basiert auf Gewicht & Aktivität"
    - `dashboard.nutrition.hintSmartContributions` = "Enthält Essen aus Notizen"
    - `dashboard.nutrition.hintSetWeight` = "Setze dein Gewicht in den Einstellungen"
    - `dashboard.nutrition.errorSaving` = "Fehler beim Speichern"
  - Define i18n keys for Activity Level:
    - `onboarding.activityLevelTitle` = "Wie aktiv bist du?"
    - `onboarding.activityLevelDescription` = "Dies hilft uns bei der Berechnung deines Kalorienziels"
    - `onboarding.activityLevelSedentary` = "Wenig Bewegung, Bürojob"
    - `onboarding.activityLevelLight` = "1-2x Sport pro Woche"
    - `onboarding.activityLevelModerate` = "3-4x Sport pro Woche (Empfohlen)"
    - `onboarding.activityLevelActive` = "5-6x Sport pro Woche"
    - `onboarding.activityLevelVeryActive` = "Täglich Sport, körperlicher Job"
    - `settings.activityLevel` = "Aktivitätslevel"
    - `settings.activityLevelDescription` = "Wie oft trainierst du pro Woche?"
  - Define i18n keys for Notes food badges:
    - `notes.food.badge` = "🍽️ {label}"
    - `notes.food.macros` = "{calories} kcal · {protein}g P · {carbs}g C · {fat}g F"
  - Add English translations (EN) for all new keys
  - Update translation files: `src/i18n/de.json`, `src/i18n/en.json`

## Parallel Work Opportunities

- Tasks 2.1, 2.2 can run in parallel
- Tasks 3.1, 4.1 can run in parallel
- Tasks 5.1, 5.2, 5.3 can run in parallel after implementation

## Dependencies

- Task 1.1 must complete before 2.1
- Task 2.1 must complete before 3.1
- Task 3.1 must complete before 5.3
