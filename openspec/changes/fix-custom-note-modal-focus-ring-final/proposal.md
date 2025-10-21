# OpenSpec Proposal: Fix CustomNoteModal Focus Ring Clipping (Final Investigation)

**Status**: PROPOSED
**Type**: UI/UX Bug Fix
**Priority**: High
**Created**: 2025-10-21
**Related Issue**: Issue 01 - CustomNoteModal focus ring still clipping at modal edges after -mx-2 adjustment

---

## Problem Analysis

**Manifestation**:
```
Focus ring clips at modal left and right edges
Even with -mx-2 (8px negative margin), ring still extends beyond modal boundary
Outline appears to be constrained by modal container
```

**Current Attempts**:
- ✗ Added `focus:ring-inset` - didn't fully contain ring
- ✗ Added `-mx-1` (4px margin) - insufficient space
- ✗ Added `-mx-2` (8px margin) - ring STILL clipping

**Root Cause Analysis**:
The issue is likely NOT just about input margins. Probable causes:
1. **Modal panel overflow**: AppModal or its content div has `overflow: hidden` or similar
2. **Modal padding**: Content padding may be creating constraints that even negative margins can't escape
3. **CSS box-shadow clip-path**: Focus ring box-shadow may be affected by parent clipping contexts
4. **Z-index stacking**: Modal panel may have overflow clipping due to stacking context

---

## Investigation Needed

### Step 1: Examine AppModal Structure
**File**: `src/components/ui/AppModal.tsx`

Check for:
- `overflow` properties on modal panel
- `position` and `overflow` on content wrapper
- Z-index and stacking context setup
- Padding and margin constraints

### Step 2: Understand Focus Ring Behavior
The `focus:ring-inset` creates an inset box-shadow:
```css
box-shadow: inset 0 0 0 3px rgba(59, 130, 246, 0.5);
```

Inset shadows are affected by:
- Parent `overflow` properties
- Parent `clip-path`
- Parent `border-radius` clipping
- Parent transform contexts

### Step 3: Verify Modal Constraints
Input is inside:
```
<AppModal>
  <div className="space-y-4">  ← Content wrapper
    <div>                        ← Input wrapper
      <input className="-mx-2"/> ← Input with negative margin
    </div>
  </div>
</AppModal>
```

If any parent has `overflow: hidden` or similar, it will clip the focus ring.

---

## Proposed Solutions (Priority Order)

### Solution 1: Remove Overflow Constraint on Modal (PREFERRED)
If AppModal panel has `overflow: hidden`, remove it to allow focus ring to render.

**File**: `src/components/ui/AppModal.tsx`

Check for and modify overflow properties that may be clipping the shadow.

### Solution 2: Apply Negative Margin at Wrapper Level
Apply `-mx-2` to the content wrapper div (space-y-4) instead of just the input.

**File**: `src/components/notes/CustomNoteModal.tsx`

```jsx
<div className="space-y-4 -mx-2">  // ← Add -mx-2 here too
  <div>
    <input className="-mx-2" />
  </div>
  <textarea className="-mx-2" />
</div>
```

### Solution 3: Increase Negative Margin Further
Try `-mx-4` (16px) to see if more space helps, but this is a band-aid if the real issue is overflow clipping.

### Solution 4: Use Alternative Focus Styling
Instead of ring-inset, use outline or a different focus indicator that doesn't depend on box-shadow.

---

## Testing Strategy

1. **Inspect Modal in DevTools**:
   - Check computed styles on AppModal panel
   - Check if any parents have `overflow: auto/hidden`
   - Check `clip-path` properties

2. **Test Overflow Removal**:
   - Temporarily remove `overflow: hidden` from modal
   - Check if focus ring renders cleanly

3. **Visual Testing**:
   - Focus on title input → verify no clipping
   - Focus on content textarea → verify no clipping
   - Test on light and dark themes
   - Test on different screen sizes

---

## Expected Root Cause

Most likely: **AppModal panel has `overflow: hidden` or similar constraint**

This would explain why:
- Negative margins don't help (overflow clips everything)
- Focus ring (box-shadow) gets clipped (shadows respect overflow)
- Even large margins don't work (overflow clips at edge regardless)

---

## Success Criteria

✅ Focus ring renders completely within modal boundary
✅ No visual clipping on left or right edges
✅ Works on light and dark themes
✅ No side effects on modal content display
✅ All tests passing

---

**Author**: Claude Code
**Branch**: `miket/fix-custom-note-modal-focus-ring-final`
