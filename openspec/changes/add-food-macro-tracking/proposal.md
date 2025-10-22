# Food & Macro Tracking Enhancement

## Why

Currently, the Notes system supports basic food tracking with `calories` and `proteinG`, but lacks comprehensive macro tracking (carbohydrates, fats). Users need a complete nutritional overview to track their diet effectively, especially for fitness goals like bulking or cutting.

**Business Value:**
- Complete nutrition tracking alongside fitness metrics
- Better alignment with user fitness goals
- Reduced need for external nutrition apps
- Integration with existing protein tracking on Dashboard

**User Pain Points:**
- Can track protein but not other macros (carbs, fat)
- No visual overview of daily nutrition
- Manual calculation of macro ratios
- Protein from food notes already syncs to Dashboard, but no UI feedback

## What Changes

### Core Changes
1. **Extend Food Event Model**
   - Add `carbsG` (carbohydrates in grams)
   - Add `fatG` (fat in grams)
   - Keep existing `calories`, `proteinG`, `label`

2. **Macro Overview UI in Notes**
   - Visual breakdown of calories (P/C/F split)
   - Daily macro totals per note
   - Color-coded macro badges

3. **Dashboard Integration - Unified Nutrition Tile**
   - **Replace ProteinTile with NutritionTile** - Comprehensive macro tracking
   - Display all macros in one tile: Calories, Protein, Carbs, Fat
   - Smart calorie goal calculation based on weight + body fat %
   - Protein from food notes **already syncs** (document this)
   - Extend `SmartTrackingContribution` to include `calories`, `carbsG`, `fatG`

4. **Food Entry UI Enhancement**
   - Structured food input form (optional)
   - Quick-add common foods (optional)
   - Manual macro entry

### Non-Goals (Out of Scope)
- Food database/search API integration
- Barcode scanning
- Recipe builder
- Meal planning

## Impact

### Affected Specs
- **notes** (NEW capability) - Currently undocumented, needs spec creation
- **dashboard** - Add NutritionTile with activity level support, document protein integration from notes
- **user-auth** (MODIFIED) - Add Activity Level onboarding step
- **settings** (MODIFIED) - Add Activity Level setting

### Affected Code
- `src/types/events.ts` - Extend `FoodEvent` interface (carbsG, fatG)
- `src/types/index.ts` - Extend `SmartTrackingContribution` (calories, carbsG, fatG) + Add `ActivityLevel` type + Extend `User` interface (activityLevel field)
- `src/features/notes/trackingSync.ts` - Add carbs/fat/calories to contributions
- `src/pages/NotesPage.tsx` - Update EventBadges to show all macros
- `src/components/ProteinTile.tsx` - **REPLACE** with `NutritionTile.tsx`
- `src/utils/nutrition.ts` - **NEW**: Calorie calculation (TDEE based on weight + BF% + activity level)
- `src/pages/OnboardingPage.tsx` - Add Activity Level selection step (after Body Fat %)
- `src/pages/SettingsPage.tsx` - Add Activity Level setting
- **No changes needed** to protein sync logic (already working)

### Breaking Changes
**None** - Additive changes only. Existing food events remain valid.

### Migration
- Existing food events without `carbsG`/`fatG` default to `undefined`
- Backward compatible with current notes

## Questions / Clarifications

1. ~~Should calories be tracked on Dashboard (new tile)?~~ **RESOLVED: Yes, add Calories Tile**
2. Should we add a "Today's Nutrition" summary card on Dashboard? (Future enhancement)
3. AI parsing: Should Smart Note AI auto-extract macros from text like "300 kcal, 20P 30C 10F"? (Future enhancement)
