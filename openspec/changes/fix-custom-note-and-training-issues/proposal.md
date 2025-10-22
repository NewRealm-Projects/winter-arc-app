# OpenSpec Proposal: Fix Custom Note & Training UI Issues

**Status**: PROPOSED
**Type**: UI/UX Bug Fix + Enhancement
**Priority**: Medium
**Created**: 2025-10-21
**Related Issues**: Issue 07 - CustomNoteModal & Training Card UI issues

---

## Problem Statement

Three UI/UX issues have been identified in InputPage and Dashboard:

### Issue 1: CustomNoteModal - Missing Translation Key
**Manifestation**:
```
Title (quickLog.optional)  ← Shows literal translation key instead of text
```

**Root Cause**:
- CustomNoteModal uses `t('quickLog.optional')` on line 83
- Translation key `quickLog.optional` does NOT exist in `src/i18n/translations.ts`
- Falls back to showing the key literal when translation is missing

**Impact**:
- Poor UX: Users see technical key instead of readable text
- Inconsistency: Other modals properly show "(Optional)" or localized equivalent

### Issue 2: CustomNoteModal - Focus Outline Hitting Modal Wall
**Manifestation**:
```
Title input focus ring clips/overlaps with modal border
```

**Root Cause**:
- Input elements have `focus:ring-2 focus:ring-offset-2`
- Ring offset extends beyond modal padding
- No `focus:ring-inset` to keep focus ring inside the element

**Impact**:
- Visual glitch: Focus ring appears to hit modal boundary
- Similar to earlier AppModal focus outline issues

### Issue 3: Training Card - Duplicate "Manage Sports" Functionality
**Manifestation**:
```
Dashboard: UnifiedTrainingCard "Manage Sports" button
Input Page: QuickLogPanel "Manage Sports" button (via sport modal)
```

**Root Cause**:
- UnifiedTrainingCard has dedicated "Manage Sports" UI (line 304-310)
- QuickLogPanel also allows managing sports via WorkoutLogModal
- Creates two separate entry points for same functionality

**Impact**:
- User confusion: Not clear which interface to use
- Information architecture issue: Unclear where sports management lives
- Maintenance burden: Two places managing same data

---

## Proposed Solutions

### Solution 1: Add Missing Translation Key
**File**: `src/i18n/translations.ts`

**Change**: Add `optional` to `quickLog` object in both DE and EN sections

```typescript
quickLog: {
  // ... existing keys
  optional: 'Optional',  // EN
  // or
  optional: 'Optional',  // DE
}
```

---

### Solution 2: Fix Focus Ring Clipping
**File**: `src/components/notes/CustomNoteModal.tsx`

**Change**: Update input/textarea focus classes to use `focus:ring-inset`

**Current (lines 90, 105)**:
```jsx
className="... focus:ring-2 focus:ring-blue-500 outline-none"
```

**Updated**:
```jsx
className="... focus:ring-2 focus:ring-inset focus:ring-blue-500 outline-none"
```

**Rationale**: `ring-inset` keeps focus ring inside element bounds, preventing overflow

---

### Solution 3: Remove Duplicate Sports Management from Training Card
**File**: `src/components/UnifiedTrainingCard.tsx`

**Changes**:
1. Remove "Manage Sports" button (lines 304-310)
2. Remove `showSportModal`, `selectedSport`, `duration`, `intensity` state (lines 45-48)
3. Remove sport modal handlers: `updateDraftSport`, `toggleSportActive`, `saveSports`, `removeSport`, `handleManageSports` (lines 127-188)
4. Remove `draftSports` state and sync effects (lines 98, 191-211)
5. Remove sport modal rendering (lines 321-482)
6. Remove sports sync useEffect hooks

**Rationale**:
- Sports management is properly handled in QuickLogPanel/WorkoutLogModal
- Training card should focus on displaying training load status, not data editing
- Reduces complexity and eliminates duplication

**Result**: Training card displays read-only sports status with improved UX

---

## Implementation Plan

**Phase 1**: Add Translation (1 task)
- Add `quickLog.optional` to DE and EN translations

**Phase 2**: Fix Focus Ring (1 task)
- Update CustomNoteModal input/textarea focus classes

**Phase 3**: Simplify Training Card (1 task)
- Remove duplicate sports management UI and state

**Phase 4**: Testing (1 task)
- Verify modal displays correctly
- Test sports status display in Training card
- Ensure no regressions

---

## Benefits

✅ Proper translation display in CustomNoteModal
✅ Professional focus ring appearance (no clipping)
✅ Single source of truth for sports management (QuickLogPanel)
✅ Cleaner Training card focused on metrics
✅ Reduced code complexity in UnifiedTrainingCard

---

## Alternative Solutions Considered

### Alternative 1: Keep Both Sports Managers
- **Rejected**: Creates redundancy and confusion

### Alternative 2: Only Remove Training Card Button
- **Rejected**: State and logic would remain unused, waste of code

### Chosen: Complete Cleanup
- **Accepted**: Single coherent interface, cleaner architecture

---

## Success Criteria

✅ Translation key `quickLog.optional` displays correct localized text
✅ Focus ring appears inside input boundary (no clipping)
✅ Training card displays sports status as read-only
✅ Sports management only via QuickLogPanel/WorkoutLogModal
✅ No visual regressions
✅ All tests passing
✅ Build succeeds

---

**Author**: Claude Code
**Branch**: `miket/fix-custom-note-and-training-issues`
