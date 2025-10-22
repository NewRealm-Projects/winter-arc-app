# Implementation Tasks

## 1. Code Changes

- [ ] 1.1 Update FoodLogModal content wrapper
  - File: `src/components/notes/FoodLogModal.tsx:277`
  - Change: `<div className="space-y-4">` → `<div className="space-y-4 px-1">`
  - Reason: Add 4px horizontal padding to prevent focus outline clipping

- [ ] 1.2 Audit other modal implementations for same issue
  - Search pattern: `<AppModal` usage across codebase
  - Check: CheckInModal, SportModal, and any other modals with form inputs
  - Fix: Apply `px-1` to content wrappers where focus outlines may be clipped

- [ ] 1.3 Document pattern in AppModal component
  - File: `src/components/ui/AppModal.tsx`
  - Add JSDoc comment explaining content wrapper padding requirement
  - Example: "Content wrappers should include `px-1` for focus ring visibility"

## 2. Testing

- [ ] 2.1 Manual testing - keyboard navigation
  - Open FoodLogModal (Food Log feature)
  - Tab through all input fields
  - Verify: Focus outlines are fully visible at all edges
  - Test in: Light mode and Dark mode

- [ ] 2.2 Visual regression test
  - File: `tests/e2e/modal.spec.ts` (if exists) or create new test
  - Capture screenshot of modal with focused input
  - Verify: No clipping artifacts at modal edges

- [ ] 2.3 Cross-browser testing
  - Test in: Chrome, Firefox, Safari, Edge
  - Verify: Focus outlines render correctly in all browsers
  - Check: Mobile viewport (iOS Safari, Android Chrome)

## 3. Accessibility Validation

- [ ] 3.1 WCAG 2.1 Level AA compliance check
  - Verify: Focus indicator contrast ratio ≥3:1
  - Verify: Focus indicator thickness ≥2px
  - Tool: axe DevTools or Lighthouse accessibility audit

- [ ] 3.2 Keyboard-only navigation test
  - Navigate entire modal using only keyboard (Tab, Shift+Tab, Enter, Esc)
  - Verify: All interactive elements are reachable and visually indicated
  - Verify: Focus trap works correctly within modal

## 4. Documentation

- [ ] 4.1 Update CLAUDE.md if needed
  - Add note about modal content wrapper padding pattern (if not already documented)
  - Reference: UI/UX Guidelines → Modals section

- [ ] 4.2 Update CHANGELOG.md
  - Entry: `fix(ui): resolve focus outline clipping in modal inputs`
  - Category: Bug Fixes / Accessibility

## 5. Code Quality

- [ ] 5.1 Run linters
  - `npm run lint` - ESLint must pass
  - `npm run typecheck` - TypeScript must pass
  - `npm run format:check` - Prettier must pass

- [ ] 5.2 Run tests
  - `npm run test:unit` - Vitest tests must pass
  - `npm run test:ui` - Playwright tests must pass (if modal tests exist)
  - Coverage: Maintain ≥80% coverage threshold

## 6. Review & Merge

- [ ] 6.1 Self-review changes
  - Verify: All modal content wrappers have proper padding
  - Verify: No layout regressions (spacing, alignment)
  - Verify: Screenshot evidence shows fixed outline

- [ ] 6.2 Commit changes
  - Branch: `<username>/fix-modal-focus-outline`
  - Commit: `fix(ui): resolve focus outline clipping in modals`
  - Include: Co-authored-by Claude footer

- [ ] 6.3 Create pull request
  - Title: `fix(ui): resolve focus outline clipping in modal inputs`
  - Description: Reference issue screenshot and WCAG compliance
  - Labels: `bug`, `accessibility`, `ui`
