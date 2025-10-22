# Tasks: Fix EditIcon Layout Overlap

## Phase 1: Fix EditIcon (1 task)

### Task 1: Add Z-Index to EditIcon
**Goal**: Ensure EditIcon appears on top of tile content

**File**: `src/components/ui/EditIcon.tsx`

**Changes**:
```jsx
// Add style prop with z-index
<button
  type="button"
  onClick={onClick}
  aria-label={ariaLabel}
  className="absolute top-2 right-2 p-2 ..."
  style={{ minWidth: '44px', minHeight: '44px', zIndex: 10 }}  // ← Add zIndex
>
```

**Or add to className**:
```jsx
className="absolute top-2 right-2 z-10 p-2 ..."
```

**Rationale**: Ensures icon appears on top when overlapping content

---

## Phase 2: Fix Tile Headers (4 tasks)

### Task 2: Fix Hydration Tile Header
**File**: `src/components/HydrationTile.tsx`

**Current** (lines ~148-155):
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

**Change**: Add `pr-12` to the flex container
```jsx
<div className="flex items-center gap-2 mb-2 pr-12">
  {/* content same as before */}
</div>
```

**Reason**: Creates space for EditIcon (12 = 48px = 44px icon + 4px padding)

---

### Task 3: Fix Nutrition Tile Header
**File**: `src/components/NutritionTile.tsx`

**Current** (find header with progress bar):
```jsx
<div className="flex items-center gap-2 mb-1.5">
  <div className="text-lg">🍽️</div>
  <div>
    <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
      {t('tracking.nutrition')}
    </h3>
  </div>
</div>
```

**Change**: Add `pr-12`
```jsx
<div className="flex items-center gap-2 mb-1.5 pr-12">
  {/* content same */}
</div>
```

---

### Task 4: Fix Pushup Tile Header
**File**: `src/components/PushupTile.tsx`

**Current** (header section):
```jsx
<div className="flex items-center gap-2 mb-2">
  <span className="text-xl">💪</span>
  <div>
    <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
      {t('tracking.pushups')}
    </h3>
    {/* day label */}
  </div>
</div>
```

**Change**: Add `pr-12`
```jsx
<div className="flex items-center gap-2 mb-2 pr-12">
  {/* content same */}
</div>
```

---

### Task 5: Fix Weight Tile Header
**File**: `src/components/WeightTile.tsx`

**Current** (lines ~148-155):
```jsx
<div className="flex items-center gap-2 mb-2">
  <div className="text-xl">⚖️</div>
  <div>
    <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
      {t('tracking.weight')}
    </h3>
    <div className="text-[10px] text-gray-500 dark:text-gray-400">{displayDayLabel}</div>
  </div>
</div>
```

**Change**: Add `pr-12`
```jsx
<div className="flex items-center gap-2 mb-2 pr-12">
  {/* content same */}
</div>
```

---

## Phase 3: Testing (2 tasks)

### Task 6: Visual Verification
**Goal**: Ensure no overlaps on all Dashboard tiles

**Test Cases**:
1. ✅ Pushups Tile: Value "0" not overlapped by EditIcon
2. ✅ Hydration Tile: ".5L" not cramped by EditIcon
3. ✅ Nutrition Tile: "390 kcal" has clear space, no overlap
4. ✅ Weight Tile: "75kg" has clear space, no overlap
5. ✅ All icons visible and clickable (44×44px touch target)

**Devices**:
- Mobile: 375×667 (iPhone SE)
- Tablet: 768×1024
- Desktop: 1920×1080

---

### Task 7: Quality Check
**Goal**: Verify code quality and consistency

**Checklist**:
- ✅ TypeScript: No errors (`npm run typecheck`)
- ✅ ESLint: No warnings (`npm run lint`)
- ✅ Tests: All pass (`npm run test:unit`)
- ✅ Build: Succeeds (`npm run build`)
- ✅ No visual regressions

---

## Summary

| Phase | Task | Complexity | Est. Time |
|-------|------|-----------|-----------|
| 1 | Add z-index to EditIcon | Trivial | 2 min |
| 2 | Fix 4 tile headers | Very Low | 10 min |
| 3 | Testing + QA | Low | 15 min |
| **Total** | **7 tasks** | **Very Low** | **~27 min** |

---

## Success Criteria

✅ EditIcon visible on top of content (z-index working)
✅ No text overlaps with EditIcon on any tile
✅ All tiles have consistent spacing (pr-12)
✅ 44×44px touch target maintained
✅ Mobile responsive (padding scales properly)
✅ No type errors or lint issues
✅ All tests passing

---

## Expected Result

**Before Fix**:
```
Nutrition: [🍽️ Nutrition ✏️ 390 kcal]  ← Icon overlaps value
```

**After Fix**:
```
Nutrition: [🍽️ Nutrition       ✏️] 390 kcal  ← Clean, no overlap
```

---

## Rollback

If issues arise:
```bash
git checkout src/components/ui/EditIcon.tsx src/components/*Tile.tsx
```
