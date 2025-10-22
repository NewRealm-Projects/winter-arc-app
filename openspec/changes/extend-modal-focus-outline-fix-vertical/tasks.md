# Implementation Tasks

## 1. Code Changes

- [ ] 1.1 Update modal content wrappers: px-1 → p-1
  - Files:
    - `src/components/notes/FoodLogModal.tsx:277` (`space-y-4 px-1` → `space-y-4 p-1`)
    - `src/components/notes/DrinkLogModal.tsx:169` (`space-y-4 px-1` → `space-y-4 p-1`)
    - `src/components/notes/WorkoutLogModal.tsx:123` (`space-y-4 px-1` → `space-y-4 p-1`)
    - `src/components/notes/WeightLogModal.tsx:117` (`space-y-4 px-1` → `space-y-4 p-1`)
    - `src/components/notes/PushupLogModal.tsx:104` (`space-y-4 px-1` → `space-y-4 p-1`)
    - `src/components/hydration/PresetManagementModal.tsx:126` (`space-y-4 px-1` → `space-y-4 p-1`)
    - `src/components/checkin/CheckInModal.tsx:108` (`space-y-6 px-1` → `space-y-6 p-1`)
  - Reason: Extend horizontal padding to include vertical padding (all directions)

- [ ] 1.2 Update AppModal JSDoc documentation
  - File: `src/components/ui/AppModal.tsx:14-15`
  - Change: Update from `px-1` to `p-1` in documentation and example
  - Change: Update description from "4px horizontal padding" to "4px padding in all directions"

## 2. Testing

- [ ] 2.1 Manual keyboard navigation - vertical clipping check
  - Open FoodLogModal → Focus on "Manual Entry" tab button
  - Verify: Focus outline visible at top and bottom edges (no clipping)
  - Open any modal → Tab to first input field
  - Verify: Focus outline visible at top edge
  - Tab to last input field
  - Verify: Focus outline visible at bottom edge
  - Test in: Light mode and Dark mode

- [ ] 2.2 Visual regression test - tab buttons
  - Capture screenshot of modal with focused tab button
  - Verify: No clipping at top/bottom edges
  - Compare with Issue02.png to confirm fix

- [ ] 2.3 Edge case testing
  - Test modals with varying content heights (short vs tall)
  - Test with different zoom levels (100%, 125%, 150%)
  - Verify: Padding remains sufficient at all zoom levels

## 3. Accessibility Validation

- [ ] 3.1 WCAG 2.1 Level AA revalidation
  - Verify: Focus indicators still meet contrast requirements
  - Verify: No new layout shift or spacing issues introduced
  - Tool: axe DevTools

- [ ] 3.2 Complete keyboard navigation audit
  - Test full Tab cycle in all 7 modals
  - Verify: All focusable elements have unclipped outlines
  - Verify: Tab order remains logical

## 4. Documentation

- [ ] 4.1 Update CLAUDE.md (if modal pattern documented)
  - Change reference from `px-1` to `p-1` for modal content wrappers
  - Add note about vertical clipping prevention

- [ ] 4.2 Update CHANGELOG.md
  - Entry: `fix(ui): extend focus outline fix to prevent vertical clipping`
  - Reference: Related to previous fix-modal-focus-outline-clipping

## 5. Code Quality

- [ ] 5.1 Run linters
  - `npm run lint` - ESLint must pass
  - `npm run typecheck` - TypeScript must pass

- [ ] 5.2 Run tests
  - `npm run test:unit` - Vitest tests must pass
  - Coverage: Maintain ≥80% threshold

## 6. Review & Merge

- [ ] 6.1 Self-review
  - Verify: All 7 modals updated consistently
  - Verify: No layout regressions (check spacing with browser DevTools)
  - Verify: Screenshot evidence shows complete fix (horizontal + vertical)

- [ ] 6.2 Commit changes
  - Branch: Reuse existing `<username>/fix-modal-focus-outline` or create new
  - Commit: `fix(ui): extend focus outline fix to prevent vertical clipping`
  - Note: This extends the previous horizontal fix

- [ ] 6.3 Update pull request
  - Update description to include vertical clipping fix
  - Add Issue02.png as additional evidence
  - Update test plan to include vertical edge testing
