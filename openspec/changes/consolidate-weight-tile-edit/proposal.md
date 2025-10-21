# OpenSpec Proposal: Consolidate Weight Tile Edit UI

**Status**: PROPOSED
**Type**: UI/UX Consolidation
**Priority**: Medium
**Created**: 2025-10-21

## Problem Statement

The Weight Tile currently has an "Add Weight" button at the bottom, breaking consistency with other Dashboard tiles which use an EditIcon in the top-right corner. This creates inconsistent UI patterns and makes the Dashboard less predictable for users.

**Current State**:
- Hydration Tile → EditIcon (top-right)
- Nutrition Tile → EditIcon (top-right)
- Pushup Tile → EditIcon (top-right)
- Weight Tile → "Add Weight" button (bottom-center) ❌ Inconsistent

## Proposed Solution

Move the Weight Tile entry mechanism from a bottom-centered button to a top-right EditIcon, matching the pattern used across all other Dashboard tiles.

### Changes

1. **Remove "Add Weight" Button**
   - Delete the button UI from lines 274-281 in `src/components/WeightTile.tsx`
   - Simplify the component layout

2. **Add EditIcon to Weight Tile**
   - Place EditIcon in top-right corner (matching other tiles)
   - Click behavior: Opens the Weight modal for entry/editing
   - Touch target: 44x44px (accessibility standard)

3. **Maintain Existing Modal**
   - Keep the AppModal for weight/body fat entry
   - Same validation and save logic
   - Only change the trigger mechanism

### Benefits

✅ **Consistency**: All Dashboard tiles now follow identical edit pattern
✅ **Discoverability**: Users familiar with other tiles immediately understand Weight Tile is editable
✅ **Layout**: Removes bottom button, allowing more space for chart display
✅ **Accessibility**: Maintains 44x44px touch target standard

## Implementation Plan

**Phase 1**: UI Changes
- Add EditIcon import
- Replace "Add Weight" button with EditIcon component
- Adjust tile wrapper to use `relative` positioning

**Phase 2**: Testing
- Verify EditIcon click opens modal
- Test modal saves correctly
- Visual regression tests
- Mobile responsiveness

## Files to Modify

- `src/components/WeightTile.tsx`

## Backward Compatibility

✅ No breaking changes - internal state management unchanged
✅ Same functionality, different entry point

## Rollback Plan

If needed, restore the "Add Weight" button code from git history.

---

**Author**: Claude Code
**Branch**: `miket/chore-consolidate-weight-tile-edit`
