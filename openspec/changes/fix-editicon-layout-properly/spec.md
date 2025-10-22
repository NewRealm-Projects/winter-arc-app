# Specification: EditIcon Layout Fix

**File**: `src/components/ui/EditIcon.tsx` + all Dashboard tiles
**Priority**: Critical
**Impact**: All Dashboard tiles

---

## Problem Analysis

### Current Layout Issue

```
Absolute Positioning Without Space Reservation

┌─────────────────────────────────┐
│ relative container              │
│ ┌─ EditIcon (absolute)          │
│ │ top-2 right-2                 │
│ │ NO z-index                    │
│ │                               │
│ │  [Nutrition ✏️] 390 kcal       │ ← Overlaps!
│ │  └─ Icon sits ON TOP of value │
│ └─────────────────────────────────┘
```

### Why This Happens

1. **EditIcon is `absolute top-2 right-2`** - positioned relative to nearest `relative` parent
2. **Header has flex layout with text** - content flows normally, doesn't know about absolute icon
3. **No z-index** - layering undefined
4. **No padding-right** - no space reserved for icon area
5. **No padding-right to prevent text** - text extends into icon space

---

## Solution: Dual Fix

### Part 1: EditIcon - Add Z-Index

**File**: `src/components/ui/EditIcon.tsx`

```typescript
function EditIcon({ onClick, ariaLabel }: EditIconProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={ariaLabel}
      className="absolute top-2 right-2 z-10 p-2 text-gray-400 ..."
      style={{ minWidth: '44px', minHeight: '44px' }}
    >
      {/* SVG icon */}
    </button>
  );
}
```

**Changes**:
- Add `z-10` to className
- **Rationale**: Ensures icon appears on top of header content

---

### Part 2: Tile Headers - Add Right Padding

**Pattern Applied to All 4 Tiles**:

```jsx
// BEFORE (no padding):
<div className="flex items-center gap-2 mb-2">
  <div className="text-xl">💧</div>
  <div>
    <h3>Hydration</h3>
    <div>Today</div>
  </div>
</div>

// AFTER (with padding):
<div className="flex items-center gap-2 mb-2 pr-12">
  {/* Same content, but text won't extend under icon area */}
</div>
```

**Padding Calculation**:
- EditIcon: 44px (minimum touch target)
- Icon position: `right-2` (8px)
- Total needed: 44px + 8px = 52px
- Padding class: `pr-12` = 48px (close enough, ~4px buffer)
- Alternative: `pr-14` = 56px (extra safe, generous spacing)

**Recommendation**: Use `pr-12` for consistency with existing spacing

---

## Implementation: Tile-by-Tile

### Tile 1: HydrationTile

**File**: `src/components/HydrationTile.tsx`

**Location**: Header div (usually around line 148-156)

**Current**:
```jsx
<div className="flex items-center gap-2 mb-2">
  <div className="text-xl">💧</div>
  <div>
    <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
      {t('tracking.hydration')}
    </h3>
    <div className="text-[10px] text-gray-500 dark:text-gray-400">{displayDayLabel}</div>
  </div>
</div>
```

**Updated**:
```jsx
<div className="flex items-center gap-2 mb-2 pr-12">
  <div className="text-xl">💧</div>
  <div>
    <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
      {t('tracking.hydration')}
    </h3>
    <div className="text-[10px] text-gray-500 dark:text-gray-400">{displayDayLabel}</div>
  </div>
</div>
```

**Change**: Add `pr-12` to className

---

### Tile 2: NutritionTile

**File**: `src/components/NutritionTile.tsx`

**Location**: Find header with nutrition icon

**Update**: Add `pr-12` to header flex container

---

### Tile 3: PushupTile

**File**: `src/components/PushupTile.tsx`

**Location**: Header with 💪 emoji

**Update**: Add `pr-12` to header flex container

---

### Tile 4: WeightTile

**File**: `src/components/WeightTile.tsx`

**Location**: Header with ⚖️ emoji

**Update**: Add `pr-12` to header flex container

---

## Visual Before/After

### Before (Issue 06)

```
Pushups:    [💪 Pushups  ✏️] 0 ← Icon overlaps value
Hydration:  [💧 Hydration ✏️] .5L ← Icon cramped
Nutrition:  [🍽️ Nutrition ✏️] 390 kcal ← OVERLAPS!
Weight:     [⚖️ Weight    ✏️] 75kg ← Cramped
```

### After (Fixed)

```
Pushups:    [💪 Pushups        ✏️] 0 ✅
Hydration:  [💧 Hydration      ✏️] .5L ✅
Nutrition:  [🍽️ Nutrition      ✏️] 390 kcal ✅
Weight:     [⚖️ Weight         ✏️] 75kg ✅
```

---

## CSS Explanation

### Padding-Right (pr-12)

```css
/* Tailwind pr-12 = padding-right: 3rem = 48px */
.pr-12 {
  padding-right: 3rem; /* 48px */
}

/* Icon needs space: 44px (touch target) + 8px (right-2 offset) ≈ 52px */
/* pr-12 (48px) provides ~96% coverage with 4px buffer */
```

### Z-Index (z-10)

```css
/* Tailwind z-10 = z-index: 10 */
.z-10 {
  z-index: 10;
}

/* Stacking context:
   - Header content: z-index: auto (0)
   - EditIcon: z-index: 10 ← Appears on top
*/
```

---

## Testing

### Unit Test Cases

```typescript
describe('EditIcon Layout', () => {
  it('should not overlap with tile header content', () => {
    // Verify pr-12 padding present on headers
    const header = screen.getByText('Hydration').closest('div');
    expect(header).toHaveClass('pr-12');
  });

  it('should have z-index for proper layering', () => {
    const editIcon = screen.getByLabelText('Edit');
    const computed = window.getComputedStyle(editIcon);
    expect(computed.zIndex).toBe('10');
  });
});
```

### Visual Test

**Mobile (375px)**:
- ✅ Header text doesn't overlap with icon
- ✅ 44×44px icon fully clickable
- ✅ No text wrapping issues

**Desktop (1920px)**:
- ✅ Consistent spacing
- ✅ Icon properly positioned
- ✅ No visual regressions

---

## Rollback

If any issues arise:

```bash
# Revert EditIcon
git checkout src/components/ui/EditIcon.tsx

# Revert all tiles
git checkout src/components/{Hydration,Nutrition,Pushup,Weight}Tile.tsx
```

---

## Success Criteria

✅ EditIcon appears on top of all content (z-index: 10)
✅ No text overlaps with icon on any tile
✅ Consistent `pr-12` padding on all tile headers
✅ 44×44px touch target maintained
✅ Mobile responsive (all screen sizes)
✅ No type errors
✅ No lint warnings
✅ All tests passing
✅ Build succeeds

---

## Time Estimate

- EditIcon z-index: 2 min
- 4 tile header updates: 8 min
- Testing: 10 min
- **Total: ~20 min**

---

## Dependencies

- None (all changes are CSS/styling)
- No breaking changes
- Backward compatible
- No new dependencies

---

## Risk Assessment

**Risk Level**: Very Low

- Simple CSS padding addition
- Single line addition (z-index)
- No logic changes
- No state management changes
- Easy to rollback
