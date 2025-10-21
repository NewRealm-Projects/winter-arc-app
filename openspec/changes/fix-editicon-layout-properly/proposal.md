# OpenSpec Proposal: Fix EditIcon Layout Overlap

**Status**: PROPOSED
**Type**: UI/UX Bug Fix
**Priority**: Critical
**Created**: 2025-10-21
**Related Issue**: Issue 06 - EditIcon overlapping tile content

---

## Problem Statement

After adjusting EditIcon offset to `top-2 right-2`, a new and worse problem emerged: **The EditIcon is now overlapping tile content and values**.

### Manifestation (Issue 06)

**Pushups Tile**:
```
❌ [Pushups      ✏️] ← EditIcon overlapping "0" value
   0
```

**Hydration Tile**:
```
❌ [💧 Hydration  ✏️] .5L ← EditIcon cramping ".5L" text
   39% / 3.82L
```

**Nutrition Tile** (WORST):
```
❌ [🍽️ Nutrition  ✏️] 390 kcal ← EditIcon directly overlapping "390 kcal"!
   12% / 3,270 kcal
```

### Root Cause

1. **EditIcon is absolutely positioned** (top-2 right-2)
2. **Tile headers don't reserve space** for the icon
3. **Text content flows under the icon** causing overlap
4. **No z-index management** - unclear layering
5. **No padding-right** on header containers

### Current Structure

```jsx
<div className="relative">
  {/* EditIcon absolutely positioned */}
  <EditIcon onClick={...} />

  {/* Header with title + value - NO padding for icon */}
  <div className="flex items-center justify-between">
    <div>Title</div>
    <div>390 kcal</div>  ← OVERLAPS with EditIcon!
  </div>
</div>
```

---

## Proposed Solution

### Approach: Restructure header layout to accommodate IconEdit

**Two Components**:

1. **Fix EditIcon** (quick win)
   - Add `z-index: 10` so it appears on top
   - Ensure proper stacking context

2. **Fix Tile Headers** (core fix)
   - Add `padding-right` to header containers (50-60px)
   - Restructure header layout to work with absolute icon
   - Ensure content doesn't extend under icon area

### Solution Pattern

```jsx
<div className="relative">
  {/* EditIcon absolutely positioned with z-index */}
  <EditIcon onClick={...} />

  {/* Header with RIGHT PADDING for icon */}
  <div className="flex items-center justify-between pr-12">
    <div>Title</div>
    <div>390 kcal</div>  ← Now has space, no overlap!
  </div>
</div>
```

### Files to Modify

1. **EditIcon Component**
   - Add `z-index: 10` to button

2. **Dashboard Tiles** (all 4)
   - `src/components/HydrationTile.tsx`
   - `src/components/NutritionTile.tsx`
   - `src/components/PushupTile.tsx`
   - `src/components/WeightTile.tsx`

   Changes: Add `pr-12` (or `pr-14`) padding-right to header containers

---

## Implementation Plan

**Phase 1**: Fix EditIcon (1 task)
- Add z-index to ensure layering

**Phase 2**: Fix Tile Headers (4 tasks)
- Update each tile header to have padding-right

**Phase 3**: Testing (1 task)
- Verify no overlaps on all tiles

---

## Benefits

✅ No more overlapping content
✅ EditIcon appears on top of content
✅ Professional visual hierarchy
✅ Consistent spacing across all tiles
✅ Mobile responsive (padding adapts)

---

## Alternative Solutions Considered

### Alternative 1: Remove EditIcon from header
- **Rejected**: Breaks UI consistency, users won't find edit button

### Alternative 2: Move EditIcon below header
- **Rejected**: Breaks design pattern, requires restructuring all tiles

### Alternative 3: Use z-index only (no padding)
- **Rejected**: Doesn't solve overlap issue, just layers it visually

### Chosen: Padding + Z-Index
- **Accepted**: Clean, maintains layout integrity, respects space

---

**Author**: Claude Code
**Branch**: `miket/fix-editicon-layout-properly`
