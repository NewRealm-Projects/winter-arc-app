# Implementation Tasks

## 1. Dashboard Tiles - Remove Add Functionality
- [ ] 1.1 Remove quick-add buttons from HydrationTile.tsx (lines 256-283)
- [ ] 1.2 Remove add modal trigger from HydrationTile.tsx
- [ ] 1.3 Remove quick-add buttons from NutritionTile.tsx (lines 258-271)
- [ ] 1.4 Remove add modal trigger from NutritionTile.tsx
- [ ] 1.5 Remove add modal trigger from PushupTile.tsx (keep onClick for edit)
- [ ] 1.6 Update tests to remove add functionality assertions

## 2. Dashboard Tiles - Add Edit Icon
- [ ] 2.1 Create reusable EditIcon component (src/components/ui/EditIcon.tsx)
- [ ] 2.2 Add edit icon to HydrationTile (top-right corner, opens existing modal)
- [ ] 2.3 Add edit icon to NutritionTile (top-right corner, opens existing modal)
- [ ] 2.4 Add edit icon to PushupTile (top-right corner, opens existing modal)
- [ ] 2.5 Add edit icon to WeightTile (top-right corner, opens existing modal)
- [ ] 2.6 Ensure consistent positioning with CSS utility class (e.g., `tile-edit-icon`)
- [ ] 2.7 Update tests for new edit icon interactions

## 3. Input Page - Rename from Notes
- [ ] 3.1 Rename NotesPage.tsx → InputPage.tsx
- [ ] 3.2 Update page title from "Notes" to "Input" in component
- [ ] 3.3 Update route in App.tsx from `/notes` to `/input`
- [ ] 3.4 Update BottomNav.tsx navigation label and route
- [ ] 3.5 Update any internal links/redirects to use `/input`

## 4. Note Metadata - Activity Context
- [ ] 4.1 Add `activityType` field to note schema (drink, food, workout, weight, pushup, custom)
- [ ] 4.2 Add `activitySummary` field to note schema (truncated display text)
- [ ] 4.3 Add `activityDetails` field to note schema (full data for hover tooltip)
- [ ] 4.4 Update note creation in QuickLogPanel to include metadata
- [ ] 4.5 Update all modal save handlers to pass activity context
- [ ] 4.6 Create utility function to generate activity summaries with truncation

## 5. Note Display - Context Labels
- [ ] 5.1 Update NoteCard component to display activity badge (icon + type)
- [ ] 5.2 Display activity summary below badge (e.g., "🥤 Drink • 250ml Water")
- [ ] 5.3 Style badges with color coding per activity type
- [ ] 5.4 Ensure custom notes have distinct "📝 Note" badge
- [ ] 5.5 Handle legacy notes gracefully (no badge if metadata missing)

## 6. Summary Truncation - Handle Long Lists
- [ ] 6.1 Create TruncatedSummary component (src/components/ui/TruncatedSummary.tsx)
- [ ] 6.2 Implement truncation logic: show first 2 items, then "and X others"
- [ ] 6.3 Add hover tooltip showing full list of items
- [ ] 6.4 Make tooltip accessible (keyboard focus, ARIA labels)
- [ ] 6.5 Use TruncatedSummary in NoteCard for activitySummary display
- [ ] 6.6 Test truncation with 1, 2, 3, 5, 10+ items

## 7. Custom Note Creation
- [ ] 7.1 Create CustomNoteModal.tsx component (src/components/notes/)
- [ ] 7.2 Add "+ New Note" button to Input page header
- [ ] 7.3 Modal SHALL have title input and multi-line content textarea
- [ ] 7.4 Save custom notes with `activityType: 'custom'` and `activitySummary: title`
- [ ] 7.5 Display custom notes in Notes section with 📝 badge
- [ ] 7.6 Add keyboard shortcut for quick note creation (optional)

## 8. Activity Summary Generation
- [ ] 8.1 Implement `generateDrinkSummary()` - format: "{amount}ml {beverage}"
- [ ] 8.2 Implement `generateFoodSummary()` with truncation:
  - Single item: "Chicken breast 150g"
  - Multiple items: "Chicken 150g, Rice 200g and 3 others"
  - Store full list in `activityDetails` for tooltip
- [ ] 8.3 Implement `generateWorkoutSummary()` - format: "{sport} • {duration}min • {intensity}"
- [ ] 8.4 Implement `generateWeightSummary()` - format: "{weight}kg" or "{weight}kg • {bodyFat}%"
- [ ] 8.5 Implement `generatePushupSummary()` - format: "{count} reps"
- [ ] 8.6 Create utility file `src/utils/activitySummary.ts` with all generators
- [ ] 8.7 Add `SUMMARY_MAX_ITEMS` constant (default: 2)

## 9. Translation Updates
- [ ] 9.1 Update German translations: "Notes" → "Eingabe" (page title)
- [ ] 9.2 Update English translations: "Notes" → "Input" (page title)
- [ ] 9.3 Update "Optional Notes" → "Notes" in modal labels (de: "Optionale Notiz" → "Notiz")
- [ ] 9.4 Remove "Your workout notes" subtitle from translations (notes.subtitle)
- [ ] 9.5 Update bottom nav translation keys
- [ ] 9.6 Add translations for activity badges (drink, food, workout, weight, pushup, custom)
- [ ] 9.7 Add translation for "+ New Note" button
- [ ] 9.8 Add translation for "and X others" truncation text

## 10. Modal Label Updates
- [ ] 10.1 Update DrinkLogModal: "Optional Notes" → "Notes"
- [ ] 10.2 Update FoodLogModal: "Optional Notes" → "Notes"
- [ ] 10.3 Update WorkoutLogModal: "Optional Notes" → "Notes"
- [ ] 10.4 Update WeightLogModal: "Optional Notes" → "Notes"
- [ ] 10.5 Update PushupLogModal: "Optional Notes" → "Notes"

## 11. Notes Section Updates
- [ ] 11.1 Remove subtitle from Notes section header in InputPage.tsx (line 326)
- [ ] 11.2 Update section to display activity badges, summaries, and truncated lists
- [ ] 11.3 Ensure proper sorting (newest first)
- [ ] 11.4 Handle mixed legacy (SmartNotes) and new (manual) notes
- [ ] 11.5 Add filtering by activity type (optional)

## 12. Testing & QA
- [ ] 12.1 Update E2E tests for renamed route (/input)
- [ ] 12.2 Update component tests for tile edit icons
- [ ] 12.3 Test all modal notes posting to Notes section with correct metadata
- [ ] 12.4 Test custom note creation and display
- [ ] 12.5 Test activity summary generation for all types
- [ ] 12.6 Test summary truncation with various item counts (1, 2, 3, 5, 10+)
- [ ] 12.7 Test hover tooltip with full list display
- [ ] 12.8 Visual regression tests for Dashboard tile changes
- [ ] 12.9 Visual regression tests for note badges, summaries, and tooltips
- [ ] 12.10 Mobile responsiveness check for edit icons and note display
- [ ] 12.11 Accessibility audit (keyboard navigation, screen readers, badge semantics, tooltip ARIA)

## 13. Documentation
- [ ] 13.1 Update CLAUDE.md to reflect Dashboard/Input separation
- [ ] 13.2 Update any user-facing documentation
- [ ] 13.3 Add migration note for existing users (route change)
- [ ] 13.4 Document note metadata schema and activity summary format
- [ ] 13.5 Document truncation logic and tooltip behavior
