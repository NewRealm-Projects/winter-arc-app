# Specification: EditIcon Spacing Fix

**Issue**: EditIcon cramped/overlapping with tile content
**File**: `src/components/ui/EditIcon.tsx` + Dashboard tiles
**Priority**: High

---

## Problem Analysis

### Current State
```jsx
<EditIcon
  onClick={handleEdit}
  ariaLabel={t('tracking.edit')}
/>
```

**Default positioning** (in EditIcon component):
```jsx
className="absolute top-3 right-3 p-2 ..."
```

### Issue Manifestation
- On Hydration tile (narrow content), EditIcon overlaps tile header
- Icon appears cramped, difficult to distinguish from content
- Visual hierarchy broken

### Root Cause
- `top-3` (12px) + `right-3` (12px) too close to tile edges
- No visual breathing room
- Tile content extends too close to corners

---

## Solution

### Approach 1: Increase Offset (Recommended)
Update EditIcon default positioning:

**Before**:
```jsx
className="absolute top-3 right-3 p-2 text-gray-400 hover:text-gray-600 ..."
```

**After**:
```jsx
className="absolute top-2 right-2 p-2 text-gray-400 hover:text-gray-600 ..."
```

**Rationale**:
- `top-2` (8px) + `right-2` (8px) provides breathing room
- Slightly closer to edge, still not cramped
- Consistent with tight spacing design

### Approach 2: Pad Tile Content (Alternative)
Update tile wrapper padding:

```jsx
<div className={`${getTileClasses(isTracked)} ${designTokens.padding.compact} pt-8`}>
  {/* Extra top padding creates space for icon */}
</div>
```

---

## Implementation: Approach 1

**File**: `src/components/ui/EditIcon.tsx`

```typescript
import { CSSProperties } from 'react';

interface EditIconProps {
  onClick: () => void;
  ariaLabel: string;
}

function EditIcon({ onClick, ariaLabel }: EditIconProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={ariaLabel}
      className="absolute top-2 right-2 p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors rounded-lg hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800"
      style={{ minWidth: '44px', minHeight: '44px' }}
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
        className="w-4 h-4"
      >
        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
      </svg>
    </button>
  );
}

export default EditIcon;
```

**Changes**:
- `top-3` → `top-2`
- `right-3` → `right-2`

---

## Testing

### Visual Inspection

**Hydration Tile** (most cramped):
```
BEFORE:
┌─ 💧 Hydration ✏️│ ← Icon overlaps
│ 39% / 3.82L      │
└──────────────────┘

AFTER:
┌─ 💧 Hydration  ✏️│ ← Icon has breathing room
│ 39% / 3.82L      │
└──────────────────┘
```

**All Tiles** (consistency check):
- Nutrition Tile: ✅ Proper spacing
- Pushup Tile: ✅ Proper spacing
- Weight Tile: ✅ Proper spacing

### Mobile Testing

**iPhone SE** (375px width):
- ✅ Icon still tappable (44×44px)
- ✅ No overlap with "⚖️" emoji or title
- ✅ Clean visual hierarchy

**Pixel 6** (412px width):
- ✅ Icon properly positioned
- ✅ No visual cramping

---

## Alternatives Considered

### Alternative 1: Absolute Positioning with Negative Margin
```jsx
className="absolute -top-1 -right-1 ..."
```
**Rejected**: Would place icon outside tile, confusing

### Alternative 2: Flex-Based Layout
```jsx
<div className="flex justify-between">
  <TileHeader />
  <EditIcon />
</div>
```
**Rejected**: Requires restructuring all tiles, breaking pattern

### Alternative 3: Conditional Offset (Small screens)
```jsx
const offset = viewport.width < 400 ? 'top-1' : 'top-2';
```
**Rejected**: Unnecessary complexity

---

## Rollback

If spacing still looks off after adjustment:
```bash
git checkout src/components/ui/EditIcon.tsx
```

Then try Approach 2 (padding tile content).

---

## Success Criteria

✅ EditIcon clearly visible without overlap
✅ Icon positioned consistently across all tiles
✅ 44×44px touch target maintained
✅ No visual regression on any tile
✅ Mobile responsive (375-1920px)
