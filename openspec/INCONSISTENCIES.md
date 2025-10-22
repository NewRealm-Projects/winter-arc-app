# Feature Inconsistencies Report

Generated: 2025-10-13
**Updated**: 2025-10-13 (Post-Cleanup)

This document lists inconsistencies found between code implementation, documentation (CLAUDE.md), and project structure.

---

## 🔴 Critical Inconsistencies

### 1. ✅ RESOLVED - Deprecated File with Active Tests

**Location**: `src/components/TrainingLoadTile.tsx.deprecated`

**Issue**: TrainingLoadTile.tsx has been renamed to `.deprecated` (replaced by UnifiedTrainingCard), but active tests still exist:
- `src/__tests__/TrainingLoadTile.test.tsx` (still present)

**Resolution**: ✅ **DELETED** `src/__tests__/TrainingLoadTile.test.tsx` on 2025-10-13

**Impact**: Test file references non-existent component
**Recommendation**: ~~Delete `src/__tests__/TrainingLoadTile.test.tsx`~~ **COMPLETED**

---

## ⚠️ Major Inconsistencies

### 2. ✅ RESOLVED - Inconsistent Modal Implementation

**Issue**: Some modals use inline implementations instead of unified `AppModal` component

**Resolution**: ✅ **MIGRATED** all 4 tiles to use `AppModal` on 2025-10-13:
- `WaterTile.tsx` - Migrated to AppModal with icon, footer buttons
- `ProteinTile.tsx` - Migrated to AppModal with icon, footer buttons
- `WeightTile.tsx` - Migrated to AppModal with icon, footer buttons
- `PushupTile.tsx` - Migrated to AppModal with icon, footer buttons, mode toggle

**Expected**: All should use `<AppModal>` component from `src/components/ui/AppModal.tsx`

**Impact**: ~~Inconsistent UX~~ **NOW CONSISTENT** - All modals use AppModal with accessibility, focus trap, theme support

**Recommendation**: ~~Refactor all inline modals~~ **COMPLETED**

---

### 3. Missing Check-in Button Location

**CLAUDE.md Reference**:
> Check-in Button jetzt in `UnifiedTrainingCard` (vorher in `WeeklyTile`)

**Code Reality**:
- ✅ Check-in button IS in UnifiedTrainingCard:240 (`Check-In` button)
- ✅ NO check-in button in WeeklyTile.tsx (correctly removed)

**Status**: ✅ RESOLVED - Documentation is accurate

---

### 4. ✅ RESOLVED - Profile Picture Handling Inconsistency

**Settings Comment** (`SettingsPage.tsx:129-131`):
```typescript
// REMOVED: Manual profile picture upload functionality (UI removed)
// Profile pictures are automatically synced from Google OAuth (handled by useAuth.ts)
// Users see initials in colored avatar if no Google picture is available
```

**Resolution**: ✅ **CLARIFIED** comment on 2025-10-13 to distinguish manual upload (removed) vs. auto-sync (active)

**Auth Code Reality** (`useAuth.ts:36-52`):
- Profile pictures ARE uploaded from Google OAuth automatically ✅
- Pictures ARE stored in Firebase Storage ✅
- `shareProfilePicture` field IS managed ✅

**Impact**: ~~Misleading comments~~ **NOW CLEAR**

**Recommendation**: ~~Update settings comment~~ **COMPLETED**

---

## ℹ️ Minor Inconsistencies

### 5. Water Debounce Timing

**Implementation**: `WaterTile.tsx:9` - `WATER_DEBOUNCE_MS = 180`

**CLAUDE.md Reference**:
> **Debouncing**: Water tile uses 180ms debounce for quick-add

**Status**: ✅ CONSISTENT

---

### 6. Training Load Tile Naming

**CLAUDE.md**: Refers to "TrainingLoadTile" as deprecated

**Code**:
- `TrainingLoadTile.tsx.deprecated` exists
- `UnifiedTrainingCard.tsx` is active replacement

**Tests**:
- `src/__tests__/TrainingLoadTile.test.tsx` still exists (orphaned)

**Recommendation**: Delete orphaned test file

---

### 7. ✅ RESOLVED - History Page Feature Flag

**CLAUDE.md**:
> **Status**: ⚫ Archived 2025-10-04 (redundant with week navigation)
> **Reactivate**: Set `HISTORY_ENABLED=true` in `src/config/features.ts`, uncomment routes

**Resolution**: ✅ **VERIFIED** `src/config/features.ts` exists with `HISTORY_ENABLED=false` flag

**Code Reality**: `src/config/features.ts` exists and is properly configured

**Impact**: ~~Cannot reactivate~~ **CAN NOW REACTIVATE** by setting flag to true

**Recommendation**: ~~Create features.ts~~ **ALREADY EXISTS**

---

### 8. AI Quotes Feature Status

**CLAUDE.md**:
> ⚫ **AI Quotes** (2025-10-04): Gemini API removed, no user value. Fallback quotes remain.

**Code Check Needed**: Verify if fallback quotes logic exists or was fully removed

**Status**: ⚠️ NEEDS VERIFICATION

---

## 📋 Documentation vs Code Alignment

### Correct Implementations

✅ **UnifiedTrainingCard**: Correctly replaced TrainingLoadTile + SportTile
✅ **WeeklyTile**: Check-in button correctly removed
✅ **Pushup Algorithm**: Matches documented formula (0.45 * maxReps)
✅ **Water Goal**: Matches documented formula (weight * 0.033L, min 2.0L)
✅ **Protein Goal**: Matches documented formula (weight * 2.0g)
✅ **OpenSpec**: Correctly initialized with AGENTS.md and project.md
✅ **project.md**: Fully populated with tech stack, conventions, architecture
✅ **AGENTS_LEGACY.md**: Renamed from AGENTS.md to avoid conflict with openspec/AGENTS.md
✅ **All Modals**: Now using unified AppModal component

---

## 🔧 Recommended Actions

### ✅ Priority 1 (Critical) - COMPLETED (2025-10-13)
1. ✅ **Delete orphaned test file**: `src/__tests__/TrainingLoadTile.test.tsx` **DONE**
2. ✅ **Refactor modals**: Convert inline modals in Water/Protein/Weight/Pushup tiles to use `AppModal` **DONE**

### ✅ Priority 2 (Major) - COMPLETED (2025-10-13)
3. ✅ **Clarify profile picture handling**: Update SettingsPage.tsx comment to reflect "manual upload removed, auto-sync active" **DONE**
4. ✅ **Create features config**: Add `src/config/features.ts` with `HISTORY_ENABLED` flag **VERIFIED (already exists)**

### Priority 3 (Minor) - REMAINING
5. **Verify AI Quotes**: Check if fallback quotes exist, document accordingly
6. **Update CLAUDE.md**: Add note that TrainingLoadTile tests were removed

---

## ✅ Validated Specs

All 5 capability specs have been documented and validated:

1. **user-auth** (9 requirements) - ✅ Valid
2. **pushup-tracking** (9 requirements) - ✅ Valid
3. **dashboard** (7 requirements) - ✅ Valid
4. **leaderboard** (7 requirements) - ✅ Valid
5. **settings** (10 requirements) - ✅ Valid

**Total**: 42 requirements across 5 capabilities

---

## 📊 Summary

| Category | Count |
|----------|-------|
| Critical Issues | ~~1~~ **0** (RESOLVED) |
| Major Issues | ~~3~~ **0** (RESOLVED) |
| Minor Issues | ~~4~~ **2** (remaining) |
| Verified Correct | ~~6~~ **9** (+3 new) |
| Resolved Issues | **4** (2025-10-13) |

**Overall Health**: ✅ **EXCELLENT** - All critical and major issues resolved. Only 2 minor issues remain.
