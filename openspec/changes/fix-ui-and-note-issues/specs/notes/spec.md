# Specification: Consolidate Food Notes

**Issue**: Food modal with 5 items creates 5 duplicate notes
**Files**: `src/components/notes/FoodLogModal.tsx`, `src/components/notes/QuickLogPanel.tsx`
**Priority**: High

---

## Problem Analysis

### Current Flow (Incorrect)

User action:
1. Opens Food modal
2. Adds 5 items to cart (Blueberries, Orange, Apple, Oatmeal, Banana)
3. Enters note: "Missing Greek Yogurt, please add"
4. Clicks Save

Result in Input page:
```
Note 1: "Missing Greek Yogurt, please add" | Blueberries 75g
Note 2: "Missing Greek Yogurt, please add" | Orange 140g
Note 3: "Missing Greek Yogurt, please add" | Apple 150g
Note 4: "Missing Greek Yogurt, please add" | Oatmeal 40g
Note 5: "Missing Greek Yogurt, please add" | Banana 120g
```

**Problem**: Same note duplicated 5 times, one per food item

### Root Cause

**File**: `src/components/notes/QuickLogPanel.tsx` (lines 111-125)

```typescript
const handleFoodSave = async (data: FoodLogData) => {
  // ... save tracking ...

  if (data.note?.trim()) {
    // WRONG: data.foodName is only ONE item from the LAST cart item saved
    const { summary, details } = generateFoodSummary([{ name: data.foodName, grams: data.portionGrams || 100 }]);

    // This creates a note for each item, but gets called once per item
    const note: SmartNote = { ... };
    await noteStore.add(note);
  }
};
```

**Issue**: `FoodLogData` interface only contains:
- `foodName` (single string)
- `portionGrams` (single number)
- `nutrition` (aggregated)
- `note` (from modal)

It doesn't contain the full cart!

### Data Flow Problem

```
FoodLogModal (manages cart internally)
  ├─ cartItems: [item1, item2, item3, item4, item5]
  └─ note: "Missing Greek Yogurt, please add"
    ↓
    (User clicks Save)
    ↓
  onSave callback triggered ONCE with FoodLogData
    ├─ foodName: "Blueberries" (? or aggregated?)
    ├─ portionGrams: 75
    ├─ nutrition: { aggregated from all 5 items }
    └─ note: "Missing Greek Yogurt, please add"
    ↓
    handleFoodSave receives it
    ↓
    Should create ONE note for all items ✅
    But only knows about "Blueberries" ❌
```

---

## Solution

### Approach: Modify FoodLogData Interface

Pass the full cart data through `FoodLogData`, then consolidate in `handleFoodSave`.

### Step 1: Extend FoodLogData Interface

**File**: `src/components/notes/FoodLogModal.tsx`

```typescript
// BEFORE:
export interface FoodLogData {
  source: 'database' | 'manual';
  foodName: string;
  portionGrams?: number;
  nutrition: NutritionResult;
  note?: string;
  date: string;
}

// AFTER:
export interface CartItem {
  id: string;
  source: 'database' | 'manual';
  foodName: string;
  portionGrams?: number;
  nutrition: NutritionResult;
}

export interface FoodLogData {
  cart: CartItem[]; // Full cart, not just one item
  note?: string;
  date: string;
}
```

### Step 2: Update FoodLogModal.handleSave

```typescript
const handleSave = async () => {
  if (cart.length === 0) {
    return; // No items to save
  }

  setSaving(true);
  try {
    // Calculate aggregated nutrition
    const aggregatedNutrition: NutritionResult = {
      calories: cart.reduce((sum, item) => sum + item.nutrition.calories, 0),
      proteinG: cart.reduce((sum, item) => sum + item.nutrition.proteinG, 0),
      carbsG: cart.reduce((sum, item) => sum + item.nutrition.carbsG, 0),
      fatG: cart.reduce((sum, item) => sum + item.nutrition.fatG, 0),
    };

    // Call onSave with consolidated data
    await onSave({
      cart: cart, // Full cart
      note: note.trim() || undefined,
      date: activeDate,
    });

    // Reset form
    setCart([]);
    setNote('');
    onClose();
  } catch (error) {
    console.error('Error saving food log:', error);
  } finally {
    setSaving(false);
  }
};
```

### Step 3: Update QuickLogPanel.handleFoodSave

```typescript
// BEFORE: Creates separate note per item
const handleFoodSave = async (data: FoodLogData) => {
  if (!auth.currentUser) return;

  const userId = auth.currentUser.uid;
  const dateKey = data.date;

  // Save tracking (unchanged)
  const currentTracking = tracking[dateKey] || { ... };
  const updatedTracking = {
    ...currentTracking,
    calories: (currentTracking.calories || 0) + data.nutrition.calories,
    protein: (currentTracking.protein || 0) + data.nutrition.proteinG,
    carbsG: (currentTracking.carbsG || 0) + data.nutrition.carbsG,
    fatG: (currentTracking.fatG || 0) + data.nutrition.fatG,
  };
  updateDayTracking(dateKey, updatedTracking);
  await saveDailyTracking(userId, dateKey, updatedTracking);

  // WRONG: Save note per item
  if (data.note?.trim()) {
    const { summary, details } = generateFoodSummary([{ name: data.foodName, grams: data.portionGrams || 100 }]);
    const note: SmartNote = { ... };
    await noteStore.add(note);
  }
};

// AFTER: Creates ONE note for entire session
const handleFoodSave = async (data: FoodLogData) => {
  if (!auth.currentUser) return;

  const userId = auth.currentUser.uid;
  const dateKey = data.date;

  // Calculate aggregated nutrition
  const aggregatedNutrition = data.cart.reduce(
    (acc, item) => ({
      calories: acc.calories + item.nutrition.calories,
      protein: acc.protein + item.nutrition.proteinG,
      carbs: acc.carbs + item.nutrition.carbsG,
      fat: acc.fat + item.nutrition.fatG,
    }),
    { calories: 0, protein: 0, carbs: 0, fat: 0 }
  );

  // Save tracking (with aggregated nutrition)
  const currentTracking = tracking[dateKey] || { ... };
  const updatedTracking = {
    ...currentTracking,
    calories: (currentTracking.calories || 0) + aggregatedNutrition.calories,
    protein: (currentTracking.protein || 0) + aggregatedNutrition.protein,
    carbsG: (currentTracking.carbsG || 0) + aggregatedNutrition.carbs,
    fatG: (currentTracking.fatG || 0) + aggregatedNutrition.fat,
  };
  updateDayTracking(dateKey, updatedTracking);
  await saveDailyTracking(userId, dateKey, updatedTracking);

  // CORRECT: Save ONE consolidated note for entire session
  if (data.note?.trim() || data.cart.length > 0) {
    // Prepare items for summary
    const foodItems = data.cart.map(item => ({
      name: item.foodName,
      grams: item.portionGrams || 100,
    }));

    // Generate consolidated summary with ALL items
    const { summary, details } = generateFoodSummary(foodItems, aggregatedNutrition);

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
};
```

---

## Expected Result

### Before Fix
```
Input Page Notes:
1. 🍎 Food | "Missing Greek Yogurt, please add" | Blueberries 75g [2 MIN AGO]
2. 🍎 Food | "Missing Greek Yogurt, please add" | Orange 140g [2 MIN AGO]
3. 🍎 Food | "Missing Greek Yogurt, please add" | Apple 150g [2 MIN AGO]
4. 🍎 Food | "Missing Greek Yogurt, please add" | Oatmeal 40g [2 MIN AGO]
5. 🍎 Food | "Missing Greek Yogurt, please add" | Banana 120g [2 MIN AGO]
6. 🥤 Drink | "A bo'le of wa'er" | 1500ml Water [3 MIN AGO]
```

### After Fix
```
Input Page Notes:
1. 🍎 Food | "Missing Greek Yogurt, please add" | Blueberries 75g, Orange 140g, Apple 150g, Oatmeal 40g, and 1 more [2 MIN AGO]
2. 🥤 Drink | "A bo'le of wa'er" | 1500ml Water [3 MIN AGO]
```

---

## Testing

### Unit Tests

```typescript
// Test consolidation logic
describe('handleFoodSave consolidation', () => {
  it('should create ONE note for multiple food items', async () => {
    const data: FoodLogData = {
      cart: [
        { id: '1', source: 'database', foodName: 'Blueberries', portionGrams: 75, nutrition: {...} },
        { id: '2', source: 'database', foodName: 'Orange', portionGrams: 140, nutrition: {...} },
        { id: '3', source: 'database', foodName: 'Apple', portionGrams: 150, nutrition: {...} },
      ],
      note: 'Missing Greek Yogurt',
      date: '2025-10-21',
    };

    await handleFoodSave(data);

    // Verify: Only ONE note created
    const notes = await noteStore.list();
    expect(notes.length).toBe(1);
    expect(notes[0].activityType).toBe('food');
    expect(notes[0].summary).toContain('Missing Greek Yogurt');
  });
});
```

### Integration Test

1. ✅ Add 5 foods to cart in modal
2. ✅ Enter note "Missing Greek Yogurt, please add"
3. ✅ Click Save
4. ✅ Navigate to Input page
5. ✅ Verify: 1 note (not 5) with all items in summary
6. ✅ Verify: Hover/click shows truncated summary with tooltip

---

## Backward Compatibility

⚠️ **Breaking Change**: FoodLogData interface changed

**Migration**:
- All code calling `onSave` must update to new interface
- No database migration needed (notes structure unchanged)
- Existing notes unaffected

**Verification**:
- Update all `FoodLogModal` usage points
- Check: TypeScript will catch missing `cart` property

---

## Success Criteria

✅ Single note created per food session (not per item)
✅ Note includes all food items in summary
✅ Truncation applies if >2 items ("and X more")
✅ Tooltip shows full list on hover
✅ User note preserved in note text
✅ No duplicate entries in Input page
✅ All tests passing
