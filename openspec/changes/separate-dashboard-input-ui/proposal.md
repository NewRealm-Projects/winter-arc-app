# Separate Dashboard and Input UI

## Why

The current Dashboard page mixes two distinct user goals: **viewing progress** and **logging activities**. This creates cognitive overhead and cluttered UI. Users have requested a clearer separation where the Dashboard is purely for monitoring (read-only with edit capability), while a dedicated Input page handles all data entry. Additionally, the "Optional Notes" field in modals is currently non-functional and should post to a dedicated Notes section with proper context labeling for journaling.

## What Changes

### Dashboard Tiles - Remove Add Functionality
- **HydrationTile**: Remove quick-add preset buttons and modal, add corner Edit icon
- **NutritionTile**: Remove quick-add macro buttons and modal, add corner Edit icon
- **PushupTile**: Remove add modal, add corner Edit icon
- **WeightTile**: Keep current behavior (already has "Add Weight" as primary action, will get Edit icon)
- **UnifiedTrainingCard**: **EXCEPTION** - Keep Check-in button (critical daily workflow)

### Dashboard Tiles - Add Edit Functionality
- Add small edit icon (✏️ or 🖊️) in top-right corner of each tile
- Icon opens existing edit modal pre-filled with current values
- Consistent positioning across all tiles

### Input Page (Renamed from Notes)
- **Page title**: "Notes" → "Input" (both UI and route `/input`)
- **Navigation label**: Update bottom nav from "Notes" to "Input"
- **Notes functionality**: Connect "Notes" textarea in modals to post entries to Notes section
- **Notes label**: Rename "Optional Notes" → "Notes" in all modals
- **Notes section**: Remove "Your workout notes" subtitle (redundant with new naming)
- **Note labeling**: Each note SHALL display activity context badge (e.g., "🥤 Drink", "🍎 Food")
- **Note summary**: Each note SHALL show concise data summary (e.g., "250ml Water", "Chicken breast 150g")
- **Summary truncation**: Long summaries (e.g., multiple food items) SHALL truncate to first 2 items + "and X others" with hover-to-expand
- **Custom notes**: Add "+ New Note" button for standalone note creation without modal

### Translation Updates
- Update German and English translations for renamed elements
- Ensure consistency across all modal labels

## Impact

### Affected Specs
- **`dashboard/spec.md`** - MODIFIED: Update tile interaction requirements (remove add, add edit)
- **`input/spec.md`** - ADDED: New capability spec for Input page with contextualized journaling and smart truncation

### Affected Code

**Modified Files:**
- `src/components/HydrationTile.tsx` - Remove add buttons/modal, add edit icon
- `src/components/NutritionTile.tsx` - Remove add buttons/modal, add edit icon
- `src/components/PushupTile.tsx` - Remove add modal, add edit icon
- `src/components/WeightTile.tsx` - Add edit icon (keep add button)
- `src/pages/NotesPage.tsx` - Rename to InputPage, update title/subtitle, add custom note UI
- `src/components/notes/QuickLogPanel.tsx` - Add note metadata to save handlers
- `src/components/notes/NoteCard.tsx` - Add activity badges, summaries, and truncation with tooltip
- `src/components/notes/DrinkLogModal.tsx` - Rename label, pass activity context to notes
- `src/components/notes/FoodLogModal.tsx` - Rename label, pass activity context to notes
- `src/components/notes/WorkoutLogModal.tsx` - Rename label, pass activity context to notes
- `src/components/notes/WeightLogModal.tsx` - Rename label, pass activity context to notes
- `src/components/notes/PushupLogModal.tsx` - Rename label, pass activity context to notes
- `src/features/notes/pipeline.ts` - Add support for manual notes with activity metadata
- `src/types/events.ts` - Add note metadata types (activityType, activitySummary, activityDetails)
- `src/utils/activitySummary.ts` - Activity summary generators with truncation logic (NEW)
- `src/i18n/translations.ts` - Update labels for Input page, Notes field, remove subtitle
- `src/App.tsx` - Update route from `/notes` to `/input`
- `src/components/BottomNav.tsx` - Update nav label and icon

**New Files:**
- `src/components/notes/CustomNoteModal.tsx` - Standalone note creation modal
- `src/components/ui/TruncatedSummary.tsx` - Reusable component for truncated text with hover tooltip

**No Database Changes:**
All data structures remain backward-compatible. New note metadata fields are optional.

### User Experience Impact

**Before:**
- Dashboard has mixed "view" and "add" actions (cognitive load)
- "Optional Notes" field is non-functional (confusing)
- "Notes" page name doesn't reflect actual purpose (logging activities)
- Notes lack context about which activity they relate to

**After:**
- Dashboard is clean, read-only with edit capability (clarity)
- "Notes" field posts to dedicated section with activity labels (functional + contextual)
- "Input" page name matches purpose (data entry hub)
- Each note displays badge + summary showing activity context (e.g., "🥤 Drink • 250ml Water")
- Long summaries truncate gracefully (e.g., "Chicken 150g, Rice 200g and 3 others" with hover tooltip)
- Users can create custom notes for general journaling

### Breaking Changes
None - This is a UI/UX reorganization with backward-compatible data layer.
