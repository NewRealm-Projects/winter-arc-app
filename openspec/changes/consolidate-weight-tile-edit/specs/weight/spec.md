# Specification: Weight Tile Consolidation

## Component: WeightTile

**File**: `src/components/WeightTile.tsx`
**Status**: Proposed Changes

---

## REMOVED: Add Weight Button

```jsx
// ❌ REMOVED: Lines 273-281
<div className="text-center">
  <button
    onClick={() => { setShowInput(true); }}
    className="w-full px-3 py-2 text-sm bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400 rounded-lg hover:bg-purple-100 dark:hover:bg-purple-900/30 transition-colors font-medium"
  >
    {t('tracking.addWeight')}
  </button>
</div>
```

**Reason**: Moving entry trigger to EditIcon for UI consistency

---

## ADDED: EditIcon in Header

### Import
```typescript
import EditIcon from './ui/EditIcon';
```

### Props Handler
```typescript
const handleEdit = () => {
  setShowInput(true);
};
```

### Render Structure
```jsx
// Wrapper with relative positioning
<div className={`${glassCardHoverClasses} ${designTokens.padding.compact} relative`}>
  {/* Header with EditIcon */}
  <div className="flex items-center justify-between mb-3">
    <div>
      <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
        {t('tracking.weight')}
      </h3>
      <div className="text-[10px] text-gray-500 dark:text-gray-400">
        {displayDayLabel}
      </div>
    </div>
  </div>

  {/* EditIcon in top-right corner */}
  <EditIcon onClick={handleEdit} ariaLabel={t('tracking.edit')} />

  {/* Rest of tile content remains unchanged */}
  {/* Chart, time range selector, weight display, modal */}
</div>
```

---

## MODIFIED: Tile Wrapper

### Before
```jsx
<div className={`${glassCardClasses} ${designTokens.padding.compact} text-white`}>
```

### After
```jsx
<div className={`${glassCardHoverClasses} ${designTokens.padding.compact} text-white relative`}>
```

**Changes**:
- Add `relative` class for absolute EditIcon positioning
- (Optional) Add `glassCardHoverClasses` if not already present

---

## UNCHANGED: Modal & Functionality

✅ Modal structure remains identical
✅ Validation logic unchanged
✅ State management unchanged
✅ Chart display unchanged

### Modal Trigger Path
**Before**: User clicks bottom "Add Weight" button
**After**: User clicks top-right EditIcon
**Result**: Same modal opens, same functionality

---

## Accessibility

### Touch Target
- EditIcon button: 44×44px (WCAG AA standard)
- Located in top-right corner (easy thumb reach on mobile)

### Keyboard Navigation
- EditIcon is a button with proper `aria-label`
- Focusable via Tab key
- Keyboard-activated via Enter/Space

### Screen Readers
- AriaLabel: "Edit weight" (or localized equivalent)
- Clear button purpose when navigating

---

## Visual Changes

### Before (with button)
```
┌─ Weight ─────────────────────────────┐
│                                      │
│  [Chart visualization]               │
│                                      │
│  [Time range selector buttons]       │
│                                      │
│  Current: 75kg                       │
│  BMI: 24.5                           │
│                                      │
│  ┌────────────────────────────────┐  │
│  │      + Add Weight              │  │ ← Button at bottom
│  └────────────────────────────────┘  │
└──────────────────────────────────────┘
```

### After (with EditIcon)
```
┌─ Weight ────────────────────────── ✏️ │ ← EditIcon top-right
│                                      │
│  [Chart visualization]               │
│                                      │
│  [Time range selector buttons]       │
│                                      │
│  Current: 75kg                       │
│  BMI: 24.5                           │
│  (More space for chart/data)         │
│                                      │
└──────────────────────────────────────┘
```

**Benefits**:
✅ Consistent with other tiles
✅ More vertical space for chart
✅ Cleaner visual hierarchy

---

## Testing Scenarios

### Scenario 1: Click EditIcon Opens Modal
1. Render WeightTile
2. Locate EditIcon in top-right
3. Click/tap EditIcon
4. Modal opens with weight/body fat inputs
5. ✅ PASS if modal appears

### Scenario 2: Save Weight via Modal
1. Click EditIcon
2. Enter weight: 75
3. Enter body fat (optional): 18
4. Click Save
5. Modal closes
6. Weight display updates to "75kg"
7. ✅ PASS if tracking updated

### Scenario 3: Cancel Without Saving
1. Click EditIcon
2. Enter weight: 80
3. Click Cancel
4. Modal closes
5. Weight remains as was before
6. ✅ PASS if no changes persisted

### Scenario 4: Mobile Touch Target
1. Render on mobile device (375px width)
2. EditIcon is at least 44×44px
3. Tap EditIcon
4. Modal opens
5. ✅ PASS if easily tappable

---

## Git Changes Summary

**Files Modified**:
- `src/components/WeightTile.tsx`

**Changes**:
- Remove "Add Weight" button (lines 273-281)
- Add `relative` class to wrapper
- Add EditIcon import & render
- Add `handleEdit` handler

**Lines Changed**: ~30-40
**Complexity**: Low
**Risk**: Very Low (functionality identical, only UI trigger changed)

---

## Rollback

If issues arise:
```bash
git checkout src/components/WeightTile.tsx
```

This restores the "Add Weight" button immediately.
