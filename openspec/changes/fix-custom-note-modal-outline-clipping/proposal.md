# OpenSpec Proposal: Fix CustomNoteModal Outline Clipping

**Status**: PROPOSED
**Type**: UI/UX Bug Fix
**Priority**: Low
**Created**: 2025-10-21
**Related Issue**: Issue 08 - CustomNoteModal focus ring clipping at modal edges

---

## Problem Statement

**Manifestation**:
```
Title input focus ring clips/extends beyond modal boundary
Outline appears to hit modal wall on left and right edges
```

**Root Cause**:
The input elements use `w-full` (100% width) and have `focus:ring-2` applied. Even with `focus:ring-inset`, the focus ring extends slightly beyond the element boundary due to how CSS box-shadow focus rings work with full-width elements in padded containers.

**Why**:
- Input is `w-full` (fills container width)
- Modal content div has padding
- Focus ring (even with inset) creates visual overflow at edges
- Ring appears to "hit the wall" of the modal

---

## Solution: Add Input Margin

### Approach
Add small negative horizontal margin to inputs to offset them slightly from container edges, providing visual breathing room for the focus ring.

**File**: `src/components/notes/CustomNoteModal.tsx`

**Changes**:

1. **Title Input (line 90)**:
```jsx
// BEFORE:
className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-inset focus:ring-blue-500 outline-none"

// AFTER:
className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-inset focus:ring-blue-500 outline-none -mx-1"
```

2. **Content Textarea (line 105)**:
```jsx
// BEFORE:
className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-inset focus:ring-blue-500 outline-none resize-none"

// AFTER:
className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-inset focus:ring-blue-500 outline-none resize-none -mx-1"
```

**CSS Explanation**:
```css
/* Tailwind -mx-1 = margin: 0 -0.25rem (left and right) */
.-mx-1 {
  margin-left: -0.25rem;   /* 4px inward */
  margin-right: -0.25rem;  /* 4px inward */
}
```

This pulls the input 4px inward on each side, creating space for the focus ring to render without clipping.

---

## Why This Works

1. **Input still appears full-width** in normal state
2. **Focus ring has space to render** without hitting modal edge
3. **Minimal visual impact** (only 4px adjustment)
4. **Consistent with focus ring styling** from other components
5. **Non-breaking change** - works with all modal sizes

---

## Expected Result

```
BEFORE:
[════════════════════════════════════════]  ← Ring clips at edges
     Focus ring hits modal wall

AFTER:
  [══════════════════════════════════════]  ← Ring contained within modal
  Focus ring has breathing room (4px buffer)
```

---

## Testing

- [ ] Focus on title input → ring stays inside modal
- [ ] Focus on content textarea → ring stays inside modal
- [ ] Works on light and dark themes
- [ ] No visual regression on unfocused state
- [ ] No overflow or layout shifts

---

## Time Estimate

- Add `-mx-1` to 2 inputs: 2 min
- Testing: 5 min
- **Total: ~7 min**

---

## Risk Assessment

**Risk Level**: Very Low

- CSS-only change (no logic)
- Negative margin is well-supported
- 4px adjustment is minimal and imperceptible
- Easy to revert if needed

---

**Author**: Claude Code
**Branch**: `miket/fix-custom-note-modal-outline-clipping`
