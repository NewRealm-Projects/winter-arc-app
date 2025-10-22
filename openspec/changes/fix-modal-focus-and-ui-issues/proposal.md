# Fix Modal Focus and UI Issues (UPDATED)

## Why

The Notes Page quick log modals (DrinkLogModal, FoodLogModal, WeightLogModal, WorkoutLogModal) have three critical UX issues that severely impact usability:

### 1. Focus Jump Bug (Critical)

**Symptom:** When typing in the DrinkLogModal input fields (custom amount, preset name, preset emoji), focus jumps from the input field to the modal container, then to the Close button after each keystroke. User must manually re-click the input field to continue typing.

**Impact:** Makes text input nearly unusable - user cannot type multi-character values without repeatedly clicking back into the field. This breaks the entire "save drink as preset" flow.

**Root Cause (CORRECTED):**
The `AppModal.tsx` `useEffect` has dependencies `[open, onClose]` (line 135). The `onClose` prop is actually the `handleClose` function from DrinkLogModal (line 101-113), which is recreated on every render because it's not wrapped in `useCallback`.

**Flow:**
1. User types in input → state updates (`setPresetName`)
2. DrinkLogModal re-renders
3. New `handleClose` function created (new reference)
4. AppModal `useEffect` sees new `onClose` reference
5. Effect runs again → `setTimeout(focusFirstElement, 50)` schedules
6. After 50ms → focuses first focusable element (Close button)
7. User loses focus on input

**Previous attempt failed because:** Adding `isInputFocused` check in keyboard handler doesn't prevent the `useEffect` from re-running. The effect still schedules the 50ms timeout that steals focus.

### 2. Focus Ring Overflow (Medium)

**Symptom:** Input element focus rings (`focus:ring-2 focus:ring-blue-500`) are visually cut off at modal edges. The 2px ring is partially or fully hidden behind the modal container's boundaries.

**Impact:** Visual feedback for focused inputs is incomplete, giving the appearance of a buggy or unpolished interface. Users may not clearly see which input is focused.

**Root Cause (CORRECTED):**
The content wrapper has `overflow-y-auto` (line 161 in AppModal.tsx) which clips horizontal overflow. Focus rings extend 2px beyond input borders and get clipped by the scrollable container.

**Previous attempt failed because:** Adding `p-1 -m-1` adds padding but doesn't change the overflow behavior. `overflow-y-auto` still clips horizontally on some browsers.

### 3. Missing Emoji Suggestions (Low)

**Symptom:** The DrinkLogModal's "save as preset" section has an emoji input field, but lacks the emoji suggestion buttons (💧 🥤 ☕ 🍵 🥛 🧃 🍷 🍺) that exist in `PresetManagementModal.tsx`.

**Impact:** Inconsistent UX between Dashboard and Notes Page preset creation. Users on mobile may struggle to find and input emoji characters without quick suggestions.

**Root Cause:** Feature was partially implemented - checkbox and inputs were added, but emoji suggestions UI was not copied from `PresetManagementModal.tsx`.

**Status:** ✅ Already implemented successfully in DrinkLogModal.tsx lines 254-270.

## What Changes

### 1. Fix AppModal Focus Trap Logic (REVISED APPROACH)

**File:** `src/components/ui/AppModal.tsx`

**Solution A: Track Initial Focus with Ref (Recommended)**

Add a ref to track whether we've already focused on modal open, preventing re-focus on subsequent re-renders:

```typescript
const hasInitiallyFocused = useRef(false);

useEffect(() => {
  if (!open) {
    hasInitiallyFocused.current = false; // Reset on close
    return;
  }

  // Focus management - only run once on modal open
  if (!hasInitiallyFocused.current) {
    const focusFirstElement = () => {
      if (initialFocusRef?.current) {
        initialFocusRef.current.focus();
        return;
      }
      const focusable = dialogRef.current?.querySelectorAll<HTMLElement>(getFocusableSelectors());
      focusable?.[0]?.focus();
    };

    const timeoutId = setTimeout(focusFirstElement, 50);
    hasInitiallyFocused.current = true;

    // Cleanup only the timeout
    return () => clearTimeout(timeoutId);
  }

  // Keyboard handler - runs on every render to stay updated
  const handleKeyDown = (event: KeyboardEvent) => {
    if (event.key === 'Escape') {
      event.preventDefault();
      onClose();
      return;
    }

    if (event.key === 'Tab') {
      const focusable = dialogRef.current?.querySelectorAll<HTMLElement>(getFocusableSelectors());
      if (!focusable || focusable.length === 0) {
        event.preventDefault();
        return;
      }

      const first = focusable[0];
      const last = focusable[focusable.length - 1];

      if (event.shiftKey) {
        if (document.activeElement === first) {
          event.preventDefault();
          last.focus();
        }
      } else if (document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }
  };

  document.addEventListener('keydown', handleKeyDown);
  return () => {
    document.removeEventListener('keydown', handleKeyDown);
  };
}, [open]); // Remove onClose and initialFocusRef from dependencies

// Separate effect for cleanup on close
useEffect(() => {
  return () => {
    if (!open && previousActiveElement.current) {
      previousActiveElement.current.focus();
    }
  };
}, [open]);
```

**Solution B: Wrap handleClose in useCallback in DrinkLogModal (Alternative)**

Alternatively, fix it at the modal level by memoizing the close handler:

```typescript
// In DrinkLogModal.tsx
const handleClose = useCallback(() => {
  if (!saving) {
    // Reset form logic...
    onClose();
  }
}, [saving, onClose]);
```

**Recommendation:** Use Solution A (ref-based) because it fixes the issue at the source (AppModal) and prevents future modals from having the same bug.

### 2. Fix Focus Ring Overflow (REVISED APPROACH)

**File:** `src/components/ui/AppModal.tsx` (line 161)

**Change:**
```tsx
<!-- FROM: -->
<div className="overflow-y-auto max-h-[calc(90vh-12rem)] p-1 -m-1">{children}</div>

<!-- TO: -->
<div className="overflow-y-auto overflow-x-visible max-h-[calc(90vh-12rem)]">{children}</div>
```

**Why:**
- `overflow-x-visible` allows horizontal overflow (focus rings) while maintaining vertical scroll
- Remove `p-1 -m-1` as it's no longer needed
- Focus rings can now extend beyond the scrollable area

**Alternative if overflow-x-visible doesn't work:**

If browsers clip overflow despite `overflow-x-visible`, use outline instead of ring:

```css
/* Replace focus:ring-2 focus:ring-blue-500 with: */
focus:outline-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-500 focus-visible:outline-offset-2
```

Outlines render outside the element's box and won't be clipped.

### 3. Emoji Suggestions Status

**File:** `src/components/notes/DrinkLogModal.tsx`

**Status:** ✅ ALREADY COMPLETED
- `EMOJI_SUGGESTIONS` constant added (line 36)
- Emoji suggestion buttons implemented (lines 254-270)
- Translation key `hydration.emojiSuggestions` already exists

**No further action needed.**

## Impact

### Affected Specs
- `openspec/specs/notes/spec.md` - **MODIFIED**: Update DrinkLogModal focus trap behavior

### Affected Code
**Modified:**
- `src/components/ui/AppModal.tsx` - Add `hasInitiallyFocused` ref, remove `onClose` dependency, fix overflow
- `src/components/notes/DrinkLogModal.tsx` - ✅ Already completed (emoji suggestions)
- `src/i18n/translations.ts` - ✅ No changes needed (key already exists)

**Testing Impact:**
- Manual test: Type multi-character values in DrinkLogModal inputs (should not jump)
- Manual test: Verify focus rings fully visible on all inputs
- E2E test: Modal focus stays on input during typing
- Visual regression test: Focus ring visibility

### User Experience
- **Before (Focus Bug)**: User types "2" → focus jumps to Close button → click input → type "5" → focus jumps → click input → type "0" (3 interruptions for "250")
- **After (Fixed)**: User types "250" continuously without interruption

- **Before (Focus Ring)**: Input focus ring clipped by scroll container, unclear which field is active
- **After (Fixed)**: Full focus ring visible on all sides

- **Before (Emoji)**: User manually types emoji or copies from elsewhere
- **After (Fixed)**: ✅ Already working - one-click emoji selection from 8 suggestions

### Performance Impact
- **Focus trap:** Fewer effect re-runs = fewer renders = better performance
- **Overflow:** No performance impact
- **Bundle size:** No change

### Migration
- No breaking changes
- No data migration required
- Existing modals automatically benefit from fix

## Rollback Plan

If focus trap fix causes issues:
1. Revert `useEffect` dependencies to `[open, onClose, initialFocusRef]`
2. Apply Solution B (useCallback in each modal) as temporary fix
3. Investigate deeper issues with focus management

If overflow fix causes layout issues:
1. Revert to `overflow-y-auto` only
2. Apply alternative outline-based focus ring approach
