# Tasks: Consolidate Weight Tile Edit UI

## Phase 1: UI Changes (3 tasks)

### Task 1: Update WeightTile Component - Remove Button
**Goal**: Remove the "Add Weight" button from the component

**Changes**:
1. Delete lines 273-281 in `src/components/WeightTile.tsx` (button section)
2. Update component to trigger modal via EditIcon instead
3. Simplify layout by removing text-center wrapper

**Files**:
- `src/components/WeightTile.tsx`

---

### Task 2: Add EditIcon to WeightTile
**Goal**: Add EditIcon component to top-right corner

**Changes**:
1. Ensure EditIcon is imported (already exists)
2. Update tile wrapper to use `relative` class
3. Add EditIcon element after header
4. Connect EditIcon's onClick to `setShowInput(true)`

**Pattern** (copy from other tiles):
```jsx
const handleEdit = () => setShowInput(true);

// In JSX:
<div className="relative">
  <div className="flex items-center justify-between">
    <div>
      <h3>{t('tracking.weight')}</h3>
      <div className="text-[10px]...">{displayDayLabel}</div>
    </div>
  </div>
  <EditIcon onClick={handleEdit} ariaLabel={t('tracking.edit')} />
  {/* rest of tile content */}
</div>
```

**Files**:
- `src/components/WeightTile.tsx`

---

### Task 3: Verify Modal Behavior
**Goal**: Ensure modal opens/closes correctly via EditIcon

**Verify**:
1. EditIcon click opens modal
2. Modal closes on cancel
3. Modal closes and resets on save
4. All input validation still works

**Files**:
- `src/components/WeightTile.tsx`

---

## Phase 2: Testing (2 tasks)

### Task 4: Unit & E2E Tests
**Goal**: Ensure functionality works end-to-end

**Test Cases**:
1. ✅ EditIcon is visible in WeightTile
2. ✅ Clicking EditIcon opens modal
3. ✅ Entering weight and clicking save updates tracking
4. ✅ Clicking cancel closes modal without saving
5. ✅ Modal resets after successful save

**Files**:
- `src/__tests__/WeightTile.test.tsx` (if exists, or create new)

---

### Task 5: Visual Regression & Mobile
**Goal**: Ensure UI looks correct on all viewports

**Verify**:
1. ✅ EditIcon positioned correctly (top-right)
2. ✅ 44x44px touch target on mobile
3. ✅ Chart displays without button space
4. ✅ Responsive on iPhone SE, Pixel 6, Galaxy S20

**Devices to Test**:
- Mobile: 375×667 (iPhone SE)
- Tablet: 768×1024
- Desktop: 1920×1080

**Files**:
- Screenshot tests (Playwright)

---

## Phase 3: Code Quality (1 task)

### Task 6: Final Checks
**Goal**: Ensure code quality and consistency

**Checklist**:
- ✅ TypeScript: No errors (`npm run typecheck`)
- ✅ ESLint: No errors/warnings (`npm run lint`)
- ✅ Prettier: Format correct (`npm run format:check`)
- ✅ Tests pass: All tests passing (`npm test`)
- ✅ Build succeeds: (`npm run build`)

**Files**:
- All modified files

---

## Summary

| Phase | Tasks | Effort |
|-------|-------|--------|
| UI Changes | 3 | ~15 min |
| Testing | 2 | ~20 min |
| Quality | 1 | ~5 min |
| **Total** | **6** | **~40 min** |

## Success Criteria

✅ Weight Tile EditIcon positioned top-right, matching other tiles
✅ All existing functionality preserved (modal, validation, saving)
✅ No TypeScript, ESLint, or test failures
✅ Mobile responsive (44x44px touch target)
✅ User can enter weight via EditIcon → Modal flow
