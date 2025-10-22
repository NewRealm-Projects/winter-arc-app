# Specification: Nutrition Rounding Fix

**Issue**: Fat value displays as "3.199999999999999g" instead of "3.2g"
**Files**: `src/utils/nutritionCalculator.ts`, display components
**Priority**: Medium

---

## Problem Analysis

### Current State
```javascript
const fat = 3.2;
const result = fat.toString(); // "3.2" ✅ OK

const calc = (10 / 3); // 3.333...
const result = calc.toString(); // "3.3333333333333335" ❌ UGLY
```

### Issue Manifestation
- User logs food: Chicken + Oil + Rice
- Math: Chicken fat (2.1g) + Oil fat (1.5g) = 3.6g
- But JavaScript calc: 2.1 + 1.5 = 3.5999999999999996g
- Display: "3.5999999999999996g" ❌

**User sees**: Data error/bug, loses trust

---

## Root Cause

### JavaScript Floating-Point Precision
```javascript
2.1 + 1.5 // → 3.6000000000000005
(10 - 8.7) // → 1.3000000000000003
0.1 + 0.2 // → 0.30000000000000004
```

**Why**: Binary representation can't perfectly store decimal numbers

### Where Issue Occurs
1. **FoodLogModal**: Total Nutrition display
2. **activitySummary.ts**: Food summary generation
3. **Input page**: Note summaries with food details

---

## Solution

### Utility Function

Create `formatNutritionValue()` helper:

```typescript
// File: src/utils/nutritionCalculator.ts

/**
 * Format nutrition value for display with proper rounding
 * @param value - Raw nutritional value
 * @param decimals - Decimal places to show (default: 1)
 * @returns Formatted string suitable for display
 */
export const formatNutritionValue = (
  value: number,
  decimals: number = 1
): string => {
  if (!Number.isFinite(value)) {
    return '0';
  }
  return Number(value.toFixed(decimals)).toString();
};

/**
 * Format complete nutrition result for display
 * @param result - NutritionResult object
 * @returns Object with formatted values
 */
export const formatNutritionForDisplay = (result: NutritionResult) => {
  return {
    calories: formatNutritionValue(result.calories, 0), // 263 kcal
    protein: formatNutritionValue(result.proteinG, 1), // 8.1g
    carbs: formatNutritionValue(result.carbsG, 1), // 54g
    fat: formatNutritionValue(result.fatG, 1), // 3.2g
  };
};
```

---

## Implementation

### 1. Update FoodLogModal Display

**File**: `src/components/notes/FoodLogModal.tsx`

```jsx
// BEFORE:
<div>
  <strong>Calories:</strong> {nutrition.calories} kcal
  <strong>Protein:</strong> {nutrition.proteinG}g
  <strong>Carbs:</strong> {nutrition.carbsG}g
  <strong>Fat:</strong> {nutrition.fatG}g
</div>

// AFTER:
import { formatNutritionForDisplay } from '../../utils/nutritionCalculator';

const displayNutrition = formatNutritionForDisplay(nutrition);

<div>
  <strong>Calories:</strong> {displayNutrition.calories} kcal
  <strong>Protein:</strong> {displayNutrition.protein}g
  <strong>Carbs:</strong> {displayNutrition.carbs}g
  <strong>Fat:</strong> {displayNutrition.fat}g
</div>
```

### 2. Update Activity Summary

**File**: `src/utils/activitySummary.ts`

```typescript
// BEFORE:
export const generateFoodSummary = (
  items: Array<{ name: string; grams: number }>,
  manualMacros?: NutritionResult
): ActivitySummaryResult => {
  // ... calculation ...
  return {
    summary: `Chicken 150g, Rice 200g`,
    details: ['Chicken 150g', 'Rice 200g']
  };
};

// AFTER:
import { formatNutritionValue } from './nutritionCalculator';

export const generateFoodSummary = (
  items: Array<{ name: string; grams: number }>,
  manualMacros?: NutritionResult
): ActivitySummaryResult => {
  // ... calculation ...

  // If we have totals with manual macros, format them
  if (manualMacros) {
    const formatted = {
      protein: formatNutritionValue(manualMacros.proteinG, 1),
      carbs: formatNutritionValue(manualMacros.carbsG, 1),
      fat: formatNutritionValue(manualMacros.fatG, 1),
    };

    return {
      summary: `Chicken 150g, Rice 200g (${formatted.protein}p / ${formatted.carbs}c / ${formatted.fat}f)`,
      details: [...items.map(i => i.name + ' ' + i.grams + 'g')]
    };
  }

  return {
    summary: `Chicken 150g, Rice 200g`,
    details: ['Chicken 150g', 'Rice 200g']
  };
};
```

### 3. Update Display in InputPage

**File**: `src/pages/InputPage.tsx`

```jsx
// When rendering note with activitySummary:
import { formatNutritionValue } from '../utils/nutritionCalculator';

{note.activitySummary && (
  <div className="text-xs text-white/70 italic">
    <TruncatedSummary
      summary={note.activitySummary}
      details={note.activityDetails}
      className="text-white/70"
    />
  </div>
)}
```

---

## Display Standards

### Decimal Places

| Macro | Decimals | Example |
|-------|----------|---------|
| Calories | 0 | 263 kcal |
| Protein | 1 | 8.1g |
| Carbs | 1 | 54g |
| Fat | 1 | 3.2g |
| Body Fat % | 1 | 18.5% |
| Weight | 1 | 75.2 kg |

---

## Testing

### Unit Tests

**File**: `src/__tests__/nutritionCalculator.test.ts`

```typescript
import { formatNutritionValue, formatNutritionForDisplay } from '../utils/nutritionCalculator';

describe('formatNutritionValue', () => {
  it('should round to 1 decimal place by default', () => {
    expect(formatNutritionValue(3.199999999999999)).toBe('3.2');
    expect(formatNutritionValue(8.1000000000000001)).toBe('8.1');
  });

  it('should round to specified decimal places', () => {
    expect(formatNutritionValue(3.567, 2)).toBe('3.57');
    expect(formatNutritionValue(263.4, 0)).toBe('263');
  });

  it('should handle edge cases', () => {
    expect(formatNutritionValue(0)).toBe('0');
    expect(formatNutritionValue(-5.6, 1)).toBe('-5.6');
    expect(formatNutritionValue(Infinity)).toBe('0');
    expect(formatNutritionValue(NaN)).toBe('0');
  });
});

describe('formatNutritionForDisplay', () => {
  it('should format all nutrition values correctly', () => {
    const nutrition = {
      calories: 263.4999999,
      proteinG: 8.1000000001,
      carbsG: 54.0,
      fatG: 3.199999999999999,
    };

    const result = formatNutritionForDisplay(nutrition);

    expect(result.calories).toBe('263');
    expect(result.protein).toBe('8.1');
    expect(result.carbs).toBe('54');
    expect(result.fat).toBe('3.2');
  });
});
```

### Visual Verification

**Before Fix**:
```
Total Nutrition
263 kcal | 8.1g p | 54g c | 3.199999999999999g f ❌
```

**After Fix**:
```
Total Nutrition
263 kcal | 8.1g p | 54g c | 3.2g f ✅
```

---

## Database Impact

✅ **No changes needed**: Raw values remain unrounded in database
- Storage: `3.199999999999999` (raw)
- Display: `3.2` (formatted)
- Calculations: Use raw values always

---

## Rollback

If rounding causes issues:
```bash
git checkout src/utils/nutritionCalculator.ts
```

---

## Success Criteria

✅ All nutrition values display with proper rounding
✅ No more "3.199999999999999" ugly numbers
✅ Consistent decimal places across all nutrients
✅ Database stores raw values unchanged
✅ All tests passing
