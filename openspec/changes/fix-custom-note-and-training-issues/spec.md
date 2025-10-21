# Specification: Custom Note & Training UI Fixes

**File**: Multiple
**Priority**: Medium
**Impact**: InputPage, Dashboard, i18n

---

## Issue 1: CustomNoteModal - Missing Translation

### Current Implementation

**CustomNoteModal.tsx (line 83)**:
```jsx
<label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
  {t('quickLog.noteTitle')} ({t('quickLog.optional')})
</label>
```

### Problem

Translation key `quickLog.optional` doesn't exist in `src/i18n/translations.ts`:

```typescript
// Missing in both DE and EN sections:
quickLog: {
  // ... keys defined
  // optional: 'Optional' ← MISSING
}
```

### Solution

Add `optional` key to both language sections:

**DE Section (line ~414 in translations.ts)**:
```typescript
quickLog: {
  title: 'Schnell loggen',
  drink: 'Getränk',
  // ... other keys
  optional: 'Optional',  // ← ADD THIS
  // ... rest of keys
}
```

**EN Section**:
```typescript
quickLog: {
  title: 'Quick Log',
  drink: 'Drink',
  // ... other keys
  optional: 'Optional',  // ← ADD THIS
  // ... rest of keys
}
```

### Expected Result

```
Before: Title (quickLog.optional)  ← Shows key
After:  Title (Optional)           ← Shows translated text
```

---

## Issue 2: CustomNoteModal - Focus Ring Clipping

### Current Implementation

**CustomNoteModal.tsx (lines 85-92)**:
```jsx
<input
  type="text"
  value={title}
  onChange={(e) => setTitle(e.target.value)}
  placeholder={t('quickLog.noteTitlePlaceholder')}
  className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
  disabled={saving}
/>
```

### Problem

Focus ring extends outside element boundary:
- No `ring-inset` → ring draws outside padding
- Ring offset pushes it further out
- Hits modal wall visually

### Solution

Add `focus:ring-inset` to input class:

**CustomNoteModal.tsx (line 90)**:
```jsx
className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-inset focus:ring-blue-500 outline-none"
```

**CustomNoteModal.tsx (line 105)** (textarea):
```jsx
className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-inset focus:ring-blue-500 outline-none resize-none"
```

### CSS Explanation

```css
/* Before: focus ring extends outward */
.focus\:ring-2 {
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.5);  /* Outside element */
}

/* After: focus ring insets inward */
.focus\:ring-inset {
  box-shadow: inset 0 0 0 3px rgba(59, 130, 246, 0.5);  /* Inside element */
}
```

### Expected Result

```
Before: Ring extends beyond element boundary ✗
After:  Ring contained within element ✓
```

---

## Issue 3: UnifiedTrainingCard - Remove Duplicate Sports Management

### Current State

**UnifiedTrainingCard.tsx** has:
1. Sports display section (lines 284-311)
2. "Manage Sports" button (line 309)
3. Sport management modal (lines 321-482)
4. State: `showSportModal`, `selectedSport`, `duration`, `intensity`, `draftSports`
5. Handlers: `updateDraftSport`, `toggleSportActive`, `saveSports`, `removeSport`, `handleManageSports`
6. Effects: Form sync useEffect hooks (lines 191-211)

### Problem

Sports editing already handled in **QuickLogPanel.tsx** via **WorkoutLogModal**:
- QuickLogPanel provides "Training" button in quick log section
- Opens WorkoutLogModal with full sports management UI
- Saves to same data structures

Result: Two separate UI entry points for same functionality

### Solution

**Remove from UnifiedTrainingCard.tsx**:

1. **Delete state** (lines 45-48):
```typescript
const [showSportModal, setShowSportModal] = useState(false);
const [selectedSport, setSelectedSport] = useState<SportKey>('hiit');
const [duration, setDuration] = useState<number>(60);
const [intensity, setIntensity] = useState<number>(5);
```

2. **Delete state** (line 98):
```typescript
const [draftSports, setDraftSports] = useState<Record<SportKey, SportEntry>>(currentSports);
```

3. **Delete handlers** (lines 127-188):
```typescript
const updateDraftSport = ...
const toggleSportActive = ...
const saveSports = ...
const removeSport = ...
const handleManageSports = ...
```

4. **Delete useEffects** (lines 191-211):
```typescript
useEffect(() => {
  if (!showSportModal) { return; }
  setDraftSports(normalizeSports(currentSports));
}, [showSportModal, currentSports]);

useEffect(() => {
  if (!showSportModal) { return; }
  const sportData = draftSports[selectedSport as keyof typeof draftSports];
  // ... sync logic
}, [showSportModal, selectedSport, draftSports]);
```

5. **Delete "Manage Sports" button** (lines 304-310):
```jsx
<button
  type="button"
  onClick={handleManageSports}
  className="w-full rounded-lg border border-blue-500/40 bg-blue-600/20 py-1.5 text-xs font-medium text-blue-100 transition-colors hover:bg-blue-600/30"
>
  {t('tracking.manageSports')}
</button>
```

6. **Delete sport modal** (lines 321-482):
```jsx
<AppModal
  open={showSportModal}
  onClose={() => setShowSportModal(false)}
  title={t('tracking.manageSports')}
  size="md"
>
  {/* Entire modal content */}
</AppModal>
```

### Updated UI Flow

```
Before:
Dashboard (UnifiedTrainingCard)
  ├─ "Manage Sports" button → Opens Sport Modal
  └─ Edit sports here

Input Page (QuickLogPanel)
  └─ "Training" button → Opens WorkoutLogModal
     └─ Edit sports here

PROBLEM: Two places to manage sports!


After:
Dashboard (UnifiedTrainingCard)
  ├─ Read-only sports display
  └─ (No edit UI)

Input Page (QuickLogPanel)
  └─ "Training" button → Opens WorkoutLogModal
     └─ Edit sports here ✓

SOLUTION: Single, clear entry point!
```

### Files to Modify

- **src/components/UnifiedTrainingCard.tsx**: Remove duplicate logic
- **src/i18n/translations.ts**: Add `quickLog.optional`
- **src/components/notes/CustomNoteModal.tsx**: Update focus ring classes

---

## Testing

### Unit Tests

```typescript
describe('CustomNoteModal', () => {
  it('should display "(Optional)" for title field', () => {
    const { getByText } = render(<CustomNoteModal open={true} onClose={vi.fn()} onSave={vi.fn()} />);
    expect(getByText(/\(Optional\)/)).toBeTruthy();
  });

  it('should not show translation key in output', () => {
    const { queryByText } = render(<CustomNoteModal open={true} onClose={vi.fn()} onSave={vi.fn()} />);
    expect(queryByText(/quickLog\.optional/)).toBeNull();
  });

  it('title input should have ring-inset class', () => {
    const { getByPlaceholderText } = render(<CustomNoteModal open={true} onClose={vi.fn()} onSave={vi.fn()} />);
    const input = getByPlaceholderText(/Training goals/);
    expect(input.className).toContain('focus:ring-inset');
  });
});

describe('UnifiedTrainingCard', () => {
  it('should NOT have "Manage Sports" button', () => {
    const { queryByText } = render(<UnifiedTrainingCard />);
    expect(queryByText(/Manage Sports/i)).toBeNull();
  });

  it('should display active sports as read-only icons', () => {
    // Verify sports display without edit UI
  });
});
```

### Visual Tests

**CustomNoteModal**:
- [ ] Title field shows "(Optional)" not translation key
- [ ] Focus ring stays inside input boundary (no clipping)
- [ ] Works on light and dark themes

**UnifiedTrainingCard**:
- [ ] No "Manage Sports" button visible
- [ ] Sports displayed as read-only icons
- [ ] No visual regressions in layout

---

## Time Estimate

- Translation key addition: 2 min
- Focus ring fix: 2 min
- Training card cleanup: 15 min
- Testing & QA: 10 min
- **Total: ~30 min**

---

## Risk Assessment

**Risk Level**: Low

- Simple translation addition (string only)
- CSS class addition (non-breaking)
- Removal of unused UI (properly scoped, no dependencies)
- Training card cleanup is fully isolated
