# Add Custom Hydration Presets

## Why

The current Water Tile uses hardcoded quick-add buttons (250ml, 500ml, 1000ml) that don't match real-world drinking habits. Users consume various beverages in different amounts (coffee cups, water bottles, tea, sports drinks), making fixed increments inefficient and reducing tracking accuracy.

## What Changes

- **Rename** Water Tile → Hydration Tile to reflect broader beverage support
- **Add custom drink preset system:**
  - Users can create up to 5 personalized drink presets (e.g., "Coffee 250ml ☕", "2L Water Bottle 💧")
  - Each preset stores: name, amount (ml), optional emoji
  - Presets render as quick-add buttons in the tile
- **Remove hardcoded 250/500/1000ml buttons** - replaced by user-defined presets
- **Add preset management:**
  - Add new preset modal with name, amount, emoji inputs
  - Edit existing presets
  - Delete presets to free up slots (max 5)
- **Preserve manual input** via existing "✏️ Edit" button for one-off entries
- **Empty state guidance** when no presets exist

## Impact

- **Affected specs:** `specs/dashboard/spec.md` (Water Tile → Hydration Tile)
- **Affected code:**
  - `src/components/WaterTile.tsx` → `src/components/HydrationTile.tsx` (renamed, refactored)
  - `src/types/index.ts` (add `DrinkPreset` interface, update `User` type)
  - `src/store/useStore.ts` (add `updateUserPresets` action)
  - `src/services/firestoreService.ts` (preset sync to Firebase)
  - `src/i18n/translations.ts` (add hydration/preset keys, update water → hydration)
  - `src/pages/DashboardPage.tsx` (import rename)
- **Database schema:** Add `hydrationPresets?: DrinkPreset[]` to `users/{userId}` collection
- **User experience:** Improved tracking flexibility, personalized to individual habits
- **Migration:** No breaking changes - existing `water` tracking data preserved, empty presets for existing users
