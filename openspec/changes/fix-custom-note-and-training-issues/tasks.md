# Tasks: Fix Custom Note & Training Issues

## Phase 1: Translation (1 task)

### Task 1: Add Missing `quickLog.optional` Translation
**Goal**: Make CustomNoteModal display properly translated "(Optional)" text

**Files**:
- `src/i18n/translations.ts`

**Changes**:

1. **German Section** (find line with `noteTitlePlaceholder: 'z.B. Trainingsziele'`):
```typescript
quickLog: {
  // ... existing keys
  noteTitlePlaceholder: 'z.B. Trainingsziele',
  optional: 'Optional',  // ← ADD THIS LINE
  noteContent: 'Inhalt',
  // ... rest
}
```

2. **English Section** (find corresponding `noteTitlePlaceholder: 'e.g. Training goals'`):
```typescript
quickLog: {
  // ... existing keys
  noteTitlePlaceholder: 'e.g. Training goals',
  optional: 'Optional',  // ← ADD THIS LINE
  noteContent: 'Content',
  // ... rest
}
```

**Reason**: Fixes "quickLog.optional" showing as literal key instead of translated text

---

## Phase 2: Modal Focus Ring (1 task)

### Task 2: Fix CustomNoteModal Focus Ring Clipping
**Goal**: Keep focus ring inside input boundary (ring-inset)

**File**: `src/components/notes/CustomNoteModal.tsx`

**Changes**:

1. **Line 90** (Title input):
```jsx
// BEFORE:
className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"

// AFTER:
className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-inset focus:ring-blue-500 outline-none"
```

2. **Line 105** (Content textarea):
```jsx
// BEFORE:
className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none resize-none"

// AFTER:
className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-inset focus:ring-blue-500 outline-none resize-none"
```

**Change**: Add `focus:ring-inset` class

**Reason**: Prevents focus ring from extending outside element boundary

---

## Phase 3: Clean Up Training Card (1 task)

### Task 3: Remove Duplicate Sports Management from UnifiedTrainingCard
**Goal**: Eliminate redundant sports UI, keep card focused on metrics

**File**: `src/components/UnifiedTrainingCard.tsx`

**Changes**:

1. **Remove state declarations** (lines 45-48):
```typescript
// DELETE:
const [showSportModal, setShowSportModal] = useState(false);
const [selectedSport, setSelectedSport] = useState<SportKey>('hiit');
const [duration, setDuration] = useState<number>(60);
const [intensity, setIntensity] = useState<number>(5);
```

2. **Remove draftSports state** (line 98):
```typescript
// DELETE:
const [draftSports, setDraftSports] = useState<Record<SportKey, SportEntry>>(currentSports);
```

3. **Remove handler functions** (lines 127-188):
```typescript
// DELETE entire functions:
const updateDraftSport = useCallback(...) { ... };
const toggleSportActive = useCallback(...) { ... };
const saveSports = () => { ... };
const removeSport = () => { ... };
const handleManageSports = () => { ... };
```

4. **Remove useEffects** (lines 191-211):
```typescript
// DELETE both useEffect hooks for draftSports sync
```

5. **Remove "Manage Sports" button** (lines 304-310):
```jsx
// DELETE:
<button
  type="button"
  onClick={handleManageSports}
  className="w-full rounded-lg border border-blue-500/40 bg-blue-600/20 py-1.5 text-xs font-medium text-blue-100 transition-colors hover:bg-blue-600/30"
>
  {t('tracking.manageSports')}
</button>
```

6. **Remove Sport Management Modal** (lines 321-482):
```jsx
// DELETE entire <AppModal> with open={showSportModal}
```

**Result**: Keep only:
- Sports status display section (read-only)
- Check-in modal (remains)

**Reason**: Sports editing is handled in QuickLogPanel/WorkoutLogModal - single source of truth

---

## Phase 4: Testing (1 task)

### Task 4: Quality Assurance & Visual Testing
**Goal**: Verify fixes work correctly, no regressions

**Test Checklist**:

- [ ] **CustomNoteModal Translation**:
  - [ ] Open modal by clicking "📝 New Note" in QuickLogPanel
  - [ ] Title shows "(Optional)" not "(quickLog.optional)" ✅

- [ ] **Focus Ring Fix**:
  - [ ] Click title input field in CustomNoteModal
  - [ ] Focus ring appears INSIDE input boundary ✅
  - [ ] Focus ring doesn't hit modal wall ✅
  - [ ] Works in both light and dark mode ✅

- [ ] **Training Card Cleanup**:
  - [ ] "Manage Sports" button removed from Training card ✅
  - [ ] Sports still display as read-only icons ✅
  - [ ] Training load graph displays correctly ✅
  - [ ] Check-in button still works ✅

- [ ] **No Regressions**:
  - [ ] TypeScript: No errors (`npm run typecheck`) ✅
  - [ ] ESLint: No warnings (`npm run lint`) ✅
  - [ ] Tests: All pass (`npm run test:unit`) ✅
  - [ ] Build: Succeeds (`npm run build`) ✅

---

## Summary

| Phase | Task | Complexity | Est. Time |
|-------|------|-----------|-----------|
| 1 | Add translation key | Trivial | 2 min |
| 2 | Fix focus ring | Trivial | 2 min |
| 3 | Remove sports UI | Low | 15 min |
| 4 | Testing & QA | Low | 10 min |
| **Total** | **3 tasks** | **Low** | **~30 min** |

---

## Success Criteria

✅ CustomNoteModal displays "(Optional)" properly
✅ Focus ring stays inside input boundary
✅ UnifiedTrainingCard has no "Manage Sports" button
✅ All sports management routed through QuickLogPanel
✅ No TypeScript errors
✅ No ESLint warnings
✅ All tests passing
✅ Build succeeds

---

## Rollback

If issues arise:
```bash
git checkout src/components/UnifiedTrainingCard.tsx src/components/notes/CustomNoteModal.tsx src/i18n/translations.ts
```
