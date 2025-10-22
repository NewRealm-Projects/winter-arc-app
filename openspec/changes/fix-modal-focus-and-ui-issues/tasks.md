# Implementation Tasks: Fix Modal Focus and UI Issues (REVISED)

## 1. Investigation & Root Cause Analysis ✅
- [x] 1.1 Debug AppModal focus trap behavior (identified `onClose` dependency issue)
- [x] 1.2 Reproduce focus jump bug in DrinkLogModal (confirmed on typing)
- [x] 1.3 Inspect modal container CSS (found `overflow-y-auto` clipping)
- [x] 1.4 Test focus ring visibility on all modal sizes (confirmed clipping)
- [x] 1.5 Document exact focus sequence: Type → Re-render → New `handleClose` → Effect runs → 50ms timeout → Focus stolen

## 2. Revert Previous Incomplete Fix
- [ ] 2.1 Revert changes to AppModal.tsx `useEffect` keyboard handler
- [ ] 2.2 Remove `isInputFocused` check (doesn't solve root cause)
- [ ] 2.3 Revert `p-1 -m-1` padding on content div (doesn't fix overflow)
- [ ] 2.4 Restore clean baseline before applying correct fix

## 3. Fix AppModal Focus Trap (Solution A - Ref-based)
- [ ] 3.1 Open `src/components/ui/AppModal.tsx` (line 46)
- [ ] 3.2 Add new ref after existing refs:
  ```typescript
  const hasInitiallyFocused = useRef(false);
  ```
- [ ] 3.3 Locate focus trap `useEffect` (line 70)
- [ ] 3.4 Wrap `focusFirstElement` logic in conditional:
  ```typescript
  if (!hasInitiallyFocused.current) {
    const focusFirstElement = () => { /* ... */ };
    const timeoutId = setTimeout(focusFirstElement, 50);
    hasInitiallyFocused.current = true;
    return () => clearTimeout(timeoutId);
  }
  ```
- [ ] 3.5 Reset ref when modal closes:
  ```typescript
  if (!open) {
    hasInitiallyFocused.current = false;
    return;
  }
  ```
- [ ] 3.6 Move keyboard handler outside conditional (runs every render):
  ```typescript
  const handleKeyDown = (event: KeyboardEvent) => { /* ... */ };
  document.addEventListener('keydown', handleKeyDown);
  return () => document.removeEventListener('keydown', handleKeyDown);
  ```
- [ ] 3.7 Update `useEffect` dependencies: Remove `onClose` and `initialFocusRef`
  ```typescript
  }, [open]); // Only depend on open
  ```
- [ ] 3.8 Add separate cleanup effect for focus restoration:
  ```typescript
  useEffect(() => {
    return () => {
      if (!open && previousActiveElement.current) {
        previousActiveElement.current.focus();
      }
    };
  }, [open]);
  ```

## 4. Fix Focus Ring Overflow
- [ ] 4.1 Locate content wrapper in `AppModal.tsx` (line 161)
- [ ] 4.2 Change overflow classes:
  ```tsx
  <!-- FROM: -->
  <div className="overflow-y-auto max-h-[calc(90vh-12rem)] p-1 -m-1">

  <!-- TO: -->
  <div className="overflow-y-auto overflow-x-visible max-h-[calc(90vh-12rem)]">
  ```
- [ ] 4.3 Remove `p-1 -m-1` (no longer needed)
- [ ] 4.4 Add comment explaining the fix:
  ```tsx
  {/* Content - overflow-x-visible allows focus rings to extend beyond scroll container */}
  ```
- [ ] 4.5 Test on Chrome, Firefox, Safari (verify overflow-x-visible works)
- [ ] 4.6 If clipping persists, apply outline alternative (see task 4.7)
- [ ] 4.7 **Fallback:** If `overflow-x-visible` doesn't work, replace all `focus:ring-2 focus:ring-blue-500` with:
  ```css
  focus:outline-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-500 focus-visible:outline-offset-2
  ```

## 5. Emoji Suggestions (Already Complete)
- [x] 5.1 ✅ `EMOJI_SUGGESTIONS` constant added to DrinkLogModal.tsx (line 36)
- [x] 5.2 ✅ Emoji suggestion buttons implemented (lines 254-270)
- [x] 5.3 ✅ Translation key `hydration.emojiSuggestions` exists in translations.ts
- [x] 5.4 ✅ Dark mode styling applied
- [x] 5.5 ✅ Responsive layout (wraps on narrow screens)

## 6. Testing - Focus Trap Fix
- [ ] 6.1 Manual test: Open DrinkLogModal → type in custom amount → verify continuous typing works
- [ ] 6.2 Manual test: Type "2500" without pausing → verify no focus jumps
- [ ] 6.3 Manual test: Type in preset name input → verify continuous typing
- [ ] 6.4 Manual test: Type in preset emoji input → verify continuous typing
- [ ] 6.5 Manual test: Open modal → verify first input receives focus (initial focus still works)
- [ ] 6.6 Manual test: Tab through inputs → verify focus trap cycles correctly
- [ ] 6.7 Manual test: Press Escape → verify modal closes and focus returns to trigger
- [ ] 6.8 Manual test: Click outside modal → verify modal closes (if not preventCloseOnBackdrop)
- [ ] 6.9 Test on all modals: FoodLogModal, WeightLogModal, WorkoutLogModal, PushupTile, HydrationTile
- [ ] 6.10 Verify no regressions in modals without initialFocusRef

## 7. Testing - Focus Ring Visibility
- [ ] 7.1 Manual test: Click into DrinkLogModal custom amount input → verify full 2px ring visible
- [ ] 7.2 Manual test: Check all 4 sides of ring (top, right, bottom, left) → verify none clipped
- [ ] 7.3 Test preset name input → verify ring fully visible
- [ ] 7.4 Test preset emoji input → verify ring fully visible
- [ ] 7.5 Test on mobile viewport (375px) → verify no horizontal scroll introduced
- [ ] 7.6 Test on desktop viewport (1920px) → verify rings look correct
- [ ] 7.7 Test light mode and dark mode
- [ ] 7.8 Test all modal sizes (sm, md, lg, xl)
- [ ] 7.9 Take screenshots for visual regression baseline

## 8. Testing - Emoji Suggestions (Already Working)
- [x] 8.1 ✅ Emoji suggestions appear when "Save as preset" checked
- [x] 8.2 ✅ Clicking emoji populates emoji input
- [x] 8.3 ✅ Dark mode styling looks correct
- [x] 8.4 ✅ Responsive layout wraps correctly

## 9. Automated Testing
- [ ] 9.1 Add E2E test: `tests/e2e/modal-focus-trap.spec.ts`
  ```typescript
  test('should not steal focus while typing in modal inputs', async ({ page }) => {
    await page.goto('/notes');
    await page.click('button:has-text("Drink")');
    await page.check('text=Save this drink as preset');

    const input = page.locator('input[placeholder*="Morning Water"]');
    await input.focus();
    await input.type('Morning Coffee');

    // Verify input still has focus and full text was typed
    await expect(input).toBeFocused();
    await expect(input).toHaveValue('Morning Coffee');
  });
  ```
- [ ] 9.2 Add E2E test: Tab navigation cycles correctly
- [ ] 9.3 Add E2E test: Escape closes modal and restores focus
- [ ] 9.4 Add visual regression test: Focus ring visibility
- [ ] 9.5 Update existing modal tests if behavior changed

## 10. Code Quality Checks
- [ ] 10.1 Run `npm run lint` → verify no errors
- [ ] 10.2 Run `npm run typecheck` → verify no type errors
- [ ] 10.3 Run `npm run test` → verify all tests pass
- [ ] 10.4 Run `npm run build` → verify production build succeeds
- [ ] 10.5 Check for console.log statements → remove debug logs
- [ ] 10.6 Verify no unused imports
- [ ] 10.7 Check code follows project style guide

## 11. Documentation
- [ ] 11.1 Update CHANGELOG.md:
  ```markdown
  ## [Unreleased]
  ### Fixed
  - Fixed modal focus jump bug when typing in inputs (caused by effect dependency on recreated onClose function)
  - Fixed focus ring visibility (added overflow-x-visible to modal content container)
  - Added emoji suggestions to DrinkLogModal preset creation
  ```
- [ ] 11.2 Add inline comment in `AppModal.tsx` explaining ref-based focus logic
- [ ] 11.3 Document why `onClose` was removed from dependencies
- [ ] 11.4 Update `openspec/specs/notes/spec.md` (archive after deployment)

## 12. Alternative Solution (If Needed)
- [ ] 12.1 **If Solution A fails:** Implement Solution B (useCallback in modals)
- [ ] 12.2 Open `src/components/notes/DrinkLogModal.tsx`
- [ ] 12.3 Import `useCallback` from React
- [ ] 12.4 Wrap `handleClose` in `useCallback`:
  ```typescript
  const handleClose = useCallback(() => {
    if (!saving) {
      // Reset form...
      onClose();
    }
  }, [saving, onClose]);
  ```
- [ ] 12.5 Repeat for FoodLogModal, WeightLogModal, WorkoutLogModal
- [ ] 12.6 Test if focus jump is resolved
- [ ] 12.7 Document why Solution A didn't work (create GitHub issue)

## 13. Deployment
- [ ] 13.1 Create feature branch: `<username>/fix-modal-focus-trap-v2`
- [ ] 13.2 Stage all changes: `git add src/components/ui/AppModal.tsx`
- [ ] 13.3 Commit with message:
  ```
  fix(ui): resolve modal focus jump and ring visibility issues

  - Add hasInitiallyFocused ref to prevent focus re-trigger on re-renders
  - Remove onClose from useEffect dependencies to avoid effect re-runs
  - Add overflow-x-visible to allow focus rings to extend beyond container
  - Emoji suggestions already implemented in DrinkLogModal

  Root cause: useEffect depended on onClose which was recreated on every
  render, causing effect to re-run and schedule new focus timeout.

  🤖 Generated with [Claude Code](https://claude.com/claude-code)
  Co-Authored-By: Claude <noreply@anthropic.com>
  ```
- [ ] 13.4 Push branch: `git push -u origin <username>/fix-modal-focus-trap-v2`
- [ ] 13.5 Create PR with detailed description
- [ ] 13.6 Wait for CI checks (TypeScript, ESLint, Tests, Build, Codacy)
- [ ] 13.7 Request code review
- [ ] 13.8 Address review feedback
- [ ] 13.9 Merge to main (squash and merge)
- [ ] 13.10 Archive OpenSpec change: `openspec archive fix-modal-focus-and-ui-issues --yes`

## 14. Verification (Post-Deploy)
- [ ] 14.1 Test on production/staging environment
- [ ] 14.2 Manually test DrinkLogModal focus behavior
- [ ] 14.3 Manually test focus ring visibility on all modals
- [ ] 14.4 Get user feedback on typing experience
- [ ] 14.5 Monitor Sentry for focus-related errors
- [ ] 14.6 Verify no performance regressions
- [ ] 14.7 Close related GitHub issues (if any)

## Summary

**Total Tasks:** 71 (broken down from original 79)
**Completed:** 10 (investigation + emoji suggestions)
**Remaining:** 61
**Critical Path:** Tasks 2-4 → 6-7 → 10-11 → 13

**Estimated Time:**
- Implementation: 1-2 hours
- Testing: 2-3 hours
- Documentation: 30 minutes
- Review & Deploy: 1-2 hours
- **Total: 5-8 hours**
