# Tasks: Fix CustomNoteModal Outline Clipping

## Phase 1: Apply Margin Fix (1 task)

### Task 1: Add Negative Margin to CustomNoteModal Inputs
**Goal**: Prevent focus ring from clipping at modal edges

**File**: `src/components/notes/CustomNoteModal.tsx`

**Changes**:

1. **Line 90** (Title Input):
```jsx
// BEFORE:
className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-inset focus:ring-blue-500 outline-none"

// AFTER (add -mx-1 at end):
className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-inset focus:ring-blue-500 outline-none -mx-1"
```

2. **Line 105** (Content Textarea):
```jsx
// BEFORE:
className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-inset focus:ring-blue-500 outline-none resize-none"

// AFTER (add -mx-1 at end):
className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-inset focus:ring-blue-500 outline-none resize-none -mx-1"
```

**Change**: Add `-mx-1` Tailwind class (4px negative margin on left and right)

**Reason**: Creates space for focus ring to render without clipping at modal edges

---

## Phase 2: Testing (1 task)

### Task 2: Visual Testing & Quality Check
**Goal**: Verify outline fix works, no regressions

**Test Checklist**:

- [ ] **Focus Ring Visibility**:
  - [ ] Click title input → focus ring visible, no clipping ✅
  - [ ] Click content textarea → focus ring visible, no clipping ✅
  - [ ] Unfocused state looks normal ✅

- [ ] **Modal Integration**:
  - [ ] Input still appears full-width in normal state ✅
  - [ ] No visual overflow or layout shift ✅
  - [ ] Works in light mode ✅
  - [ ] Works in dark mode ✅

- [ ] **No Regressions**:
  - [ ] TypeScript: No errors (`npm run typecheck`) ✅
  - [ ] ESLint: No warnings (`npm run lint`) ✅
  - [ ] Tests: All pass (`npm run test:unit`) ✅
  - [ ] Build: Succeeds (`npm run build`) ✅

---

## Summary

| Phase | Task | Complexity | Est. Time |
|-------|------|-----------|-----------|
| 1 | Add -mx-1 margin class | Trivial | 2 min |
| 2 | Testing & QA | Low | 5 min |
| **Total** | **2 tasks** | **Trivial** | **~7 min** |

---

## Success Criteria

✅ Focus ring stays inside modal boundary
✅ No clipping at left/right edges
✅ Input appears full-width in unfocused state
✅ Works on light and dark themes
✅ No TypeScript errors
✅ No ESLint warnings
✅ All tests passing
✅ Build succeeds

---

## Rollback

If issues arise:
```bash
git checkout src/components/notes/CustomNoteModal.tsx
```
