# Tasks: Fix UI & Note Generation Issues

## Phase 1: Fix EditIcon Spacing (1 task)

### Task 1: Adjust Tile Padding & EditIcon Offset
**Goal**: Prevent EditIcon from overlapping tile content

**Analysis**:
- Current: EditIcon uses `absolute top-3 right-3` positioning
- Issue: Too close to tile content, causing overlap on smaller tiles like Hydration
- Solution: Increase offset and ensure proper z-index layering

**Changes**:
1. Update `src/components/ui/EditIcon.tsx`:
   - Add `top-2` (instead of `top-3`)
   - Add `right-2` (instead of `right-3`)
   - Or add padding to tile wrapper

2. Update all Dashboard tiles to have consistent padding:
   - `src/components/HydrationTile.tsx`
   - `src/components/NutritionTile.tsx`
   - `src/components/PushupTile.tsx`
   - `src/components/WeightTile.tsx`

**Test**:
- ✅ EditIcon visible and not overlapping on all tiles
- ✅ Responsive on mobile (375px width)
- ✅ Consistent positioning across all tiles

---

## Phase 2: Fix Rounding Issue (1 task)

### Task 2: Create Display Rounding Utility
**Goal**: Round nutritional values to 1 decimal place for display

**Analysis**:
- Current: `3.199999999999999` from floating-point calculation
- Issue: JavaScript arithmetic precision causes ugly display
- Solution: Round for display only, keep raw values in database

**Changes**:
1. Create utility function in `src/utils/nutritionCalculator.ts`:
```typescript
export const formatNutritionValue = (value: number, decimals: number = 1): string => {
  return Number(value.toFixed(decimals)).toString();
};
```

2. Update display locations:
   - `src/components/notes/FoodLogModal.tsx` - Total Nutrition display
   - `src/utils/activitySummary.ts` - Food summary generation
   - Input page note summaries

**Test**:
- ✅ Fat displays as "3.2g" not "3.199999999999999g"
- ✅ Other macros also rounded properly
- ✅ Database stores raw values unchanged

---

## Phase 3: Consolidate Food Notes (1 task)

### Task 3: Fix Food Note Generation
**Goal**: Create ONE note per food session (not per item)

**Current Flow (WRONG)**:
```
User adds 5 foods to cart with note "Missing Greek Yogurt, please add"
↓
handleFoodSave called once with all cart items
↓
For each food in cart, create separate note
↓
Result: 5 identical notes in Input page
```

**Proposed Flow (CORRECT)**:
```
User adds 5 foods to cart with note "Missing Greek Yogurt, please add"
↓
handleFoodSave called once with all cart items
↓
Create ONE note with consolidated summary
↓
Result: 1 note with all items in summary
```

**Changes**:
1. Update `src/components/notes/QuickLogPanel.tsx`:

**Current code** (lines 111-125):
```typescript
// WRONG: Creates note for each food item
if (data.note?.trim()) {
  const { summary, details } = generateFoodSummary([{ name: data.foodName, grams: data.portionGrams || 100 }]);
  const note: SmartNote = { ... };
  await noteStore.add(note);
}
```

**New code**:
```typescript
// CORRECT: Create one note with all cart items
if (data.note?.trim() || cartItems.length > 0) {
  // Collect all items
  const foodItems = cartItems.map(item => ({
    name: item.foodName,
    grams: item.portionGrams || 100
  }));

  // Generate summary for ALL items
  const { summary, details } = generateFoodSummary(foodItems);

  // Create SINGLE note
  const note: SmartNote = {
    id: uuidv4(),
    ts: Date.now(),
    raw: data.note || '',
    summary: data.note || `Food logged: ${foodItems.length} items`,
    events: [],
    activityType: 'food',
    activitySummary: summary,
    activityDetails: details,
    content: data.note || `Food logged: ${foodItems.length} items`,
  };
  await noteStore.add(note);
}
```

**Wait**: I need to check `FoodLogData` structure - does it contain cart items?

Looking at `FoodLogData` interface (lines 10-17 in FoodLogModal.tsx):
```typescript
export interface FoodLogData {
  source: 'database' | 'manual';
  foodName: string;          // Only ONE item!
  portionGrams?: number;
  nutrition: NutritionResult;
  note?: string;
  date: string;
}
```

**ISSUE**: FoodLogData only captures one food item, not the full cart!

**Real Fix Required**: Refactor FoodLogModal to return full cart data

**Alternative Approach** (Simpler):
- Keep current FoodLogModal behavior
- Each food item logs independently (expected)
- BUT: Only save ONE note (with the note text) if note is provided
- Track whether note was already saved for this session (add flag)

**Better Approach** (Correct):
- Modify `FoodLogData` to include full cart items
- Update `FoodLogModal.onSave` callback
- Then consolidate notes

---

## Phase 4: Testing (2 tasks)

### Task 4: Unit Tests
**Goal**: Verify rounding and note logic

**Tests**:
- ✅ formatNutritionValue("3.199999999999999", 1) === "3.2"
- ✅ Food note consolidation creates single note
- ✅ Note summary includes all food items

**Files**:
- `src/__tests__/nutritionCalculator.test.ts`
- `src/__tests__/activitySummary.test.ts`

---

### Task 5: Visual Regression & Mobile
**Goal**: Verify fixes don't break UI

**Test Cases**:
1. ✅ EditIcon spacing on all tiles (mobile + desktop)
2. ✅ Nutrition display shows rounded values
3. ✅ Input page shows 1 food note instead of 5

**Devices**:
- Mobile: 375×667 (iPhone SE)
- Tablet: 768×1024
- Desktop: 1920×1080

---

## Summary

| Phase | Task | Complexity |
|-------|------|-----------|
| 1 | Edit Icon Spacing | Low |
| 2 | Rounding Utility | Low |
| 3 | Food Note Consolidation | **Medium** |
| 4 | Testing | Medium |
| **Total** | **5 tasks** | **~2-3 hours** |

---

## Decision Point: Food Note Consolidation

**Option A**: Simple - Only save note once per session (ignore duplicate items)
- Simpler to implement
- May lose item-specific notes

**Option B**: Correct - Refactor FoodLogData and modal to support cart
- More complex
- Better UX (one comprehensive note)
- Matches user intent

**Recommendation**: Start with Option B for best UX

---

## Success Criteria

✅ EditIcon properly spaced, no overlaps
✅ Nutrition values display with 1 decimal place (3.2g not 3.199...)
✅ Food modals save consolidated notes (not duplicates)
✅ All tests passing
✅ Mobile responsive
