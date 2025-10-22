# Implementation Tasks: Mobile Dashboard Carousel Redesign

**Change ID**: `redesign-mobile-dashboard-input`
**Status**: PENDING
**Last Updated**: 2025-10-22

---

## 1. Phase 1: Core Carousel Components (2 days)

### 1.1 StatCarousel Component
- [ ] 1.1.1 Create `src/components/dashboard/StatCarousel.tsx`
- [ ] 1.1.2 Implement carousel state management (active index, auto-rotation)
- [ ] 1.1.3 Add auto-rotation timer (4s interval, pause on interaction)
- [ ] 1.1.4 Integrate `react-swipeable` for swipe gestures
- [ ] 1.1.5 Add pagination dots component
- [ ] 1.1.6 Implement smooth transitions (CSS transforms)
- [ ] 1.1.7 Add keyboard navigation (arrow keys)
- [ ] 1.1.8 Write unit tests for carousel logic
- [ ] 1.1.9 Write unit tests for auto-rotation behavior

### 1.2 CarouselItem Component
- [ ] 1.2.1 Create `src/components/dashboard/CarouselItem.tsx`
- [ ] 1.2.2 Design stat card layout (icon, label, value, progress)
- [ ] 1.2.3 Add tap-to-expand functionality
- [ ] 1.2.4 Style for mobile (270px height, full width)
- [ ] 1.2.5 Ensure touch target size ≥56px
- [ ] 1.2.6 Add dark mode support
- [ ] 1.2.7 Write unit tests for individual stat rendering

### 1.3 Carousel Integration
- [ ] 1.3.1 Create carousel data model (5 stats: Sports, Pushup, Hydration, Nutrition, Weight)
- [ ] 1.3.2 Connect to Zustand store for real-time data
- [ ] 1.3.3 Add loading skeleton for carousel items
- [ ] 1.3.4 Handle empty/missing data gracefully
- [ ] 1.3.5 Test carousel with mock data
- [ ] 1.3.6 Test carousel with real Firebase data

---

## 2. Phase 2: Dynamic Progress Circle (1 day)

### 2.1 Progress Circle Component
- [ ] 2.1.1 Create `src/components/dashboard/DynamicProgressCircle.tsx`
- [ ] 2.1.2 Implement SVG circle with 5 color bands
- [ ] 2.1.3 Calculate progress per stat (20% each)
- [ ] 2.1.4 Render multi-color arc based on completion
- [ ] 2.1.5 Add center text (total completion percentage)
- [ ] 2.1.6 Animate progress changes (smooth transitions)
- [ ] 2.1.7 Add ARIA labels for accessibility
- [ ] 2.1.8 Style for mobile (120px diameter)

### 2.2 Progress Calculation Logic
- [ ] 2.2.1 Create `src/utils/progressCalculation.ts`
- [ ] 2.2.2 Implement per-stat progress calculation (0-20%)
- [ ] 2.2.3 Implement total progress aggregation (0-100%)
- [ ] 2.2.4 Handle edge cases (missing data, 0%, 100%)
- [ ] 2.2.5 Write unit tests for progress calculations
- [ ] 2.2.6 Write unit tests for color band rendering

### 2.3 Color Band Configuration
- [ ] 2.3.1 Define color palette for 5 stats
- [ ] 2.3.2 Ensure WCAG AA contrast compliance
- [ ] 2.3.3 Add dark mode color variants
- [ ] 2.3.4 Test color visibility on different devices

---

## 3. Phase 3: Compressed Week + Weight Chart (1 day)

### 3.1 Compressed Week Card
- [ ] 3.1.1 Create `src/components/dashboard/CompressedWeekCard.tsx`
- [ ] 3.1.2 Display 7 dates (MON 21, TUE 22, etc.)
- [ ] 3.1.3 Highlight current day
- [ ] 3.1.4 Add tap-to-expand functionality
- [ ] 3.1.5 Create full week modal (reuse existing WeeklyTile content)
- [ ] 3.1.6 Ensure 100px max height on mobile
- [ ] 3.1.7 Add loading skeleton
- [ ] 3.1.8 Write unit tests for week card rendering

### 3.2 Weight Chart Compact
- [ ] 3.2.1 Create `src/components/dashboard/WeightChartCompact.tsx`
- [ ] 3.2.2 Minimize existing WeightTile chart to 120px height
- [ ] 3.2.3 Show last 7 days of weight data
- [ ] 3.2.4 Add tap-to-expand functionality
- [ ] 3.2.5 Create full chart modal (reuse existing WeightTile content)
- [ ] 3.2.6 Ensure responsive scaling
- [ ] 3.2.7 Write unit tests for compact chart

### 3.3 Modal Implementations
- [ ] 3.3.1 Create `src/components/dashboard/WeekDetailsModal.tsx`
- [ ] 3.3.2 Create `src/components/dashboard/WeightChartModal.tsx`
- [ ] 3.3.3 Use AppModal component for consistency
- [ ] 3.3.4 Add close handlers (Escape, background click)
- [ ] 3.3.5 Test modal scrolling on small screens

---

## 4. Phase 4: Arc Menu (1.5 days)

### 4.1 Arc Menu Component
- [ ] 4.1.1 Create `src/components/dashboard/ArcMenu.tsx`
- [ ] 4.1.2 Implement SVG half-circle arc
- [ ] 4.1.3 Create 5 equal slices (Sports, Pushup, Water, Food, Weight)
- [ ] 4.1.4 Add icons for each stat
- [ ] 4.1.5 Implement tap-to-open modal logic
- [ ] 4.1.6 Add slide-up animation (from bottom)
- [ ] 4.1.7 Add close on background click
- [ ] 4.1.8 Add close on Escape key

### 4.2 Arc Menu Interaction
- [ ] 4.2.1 Create plus button (barely visible initially)
- [ ] 4.2.2 Add tooltip/hint for first-time users
- [ ] 4.2.3 Implement hover/tap state for plus button
- [ ] 4.2.4 Ensure 56px touch targets for arc slices
- [ ] 4.2.5 Add keyboard navigation (Tab + Enter)
- [ ] 4.2.6 Test on touch devices
- [ ] 4.2.7 Write unit tests for arc menu logic

### 4.3 Modal Connections
- [ ] 4.3.1 Connect arc menu to existing Input page modals
- [ ] 4.3.2 Reuse CustomNoteModal for Food, Water, Notes
- [ ] 4.3.3 Reuse Training modal for workout logging
- [ ] 4.3.4 Test modal open/close flow
- [ ] 4.3.5 Ensure modal data saves correctly

---

## 5. Phase 5: Dashboard Integration (1 day)

### 5.1 Dashboard Layout Update
- [ ] 5.1.1 Update `src/pages/Dashboard.tsx` with conditional rendering
- [ ] 5.1.2 Add mobile layout (< 481px)
- [ ] 5.1.3 Keep desktop layout unchanged (>= 481px)
- [ ] 5.1.4 Implement `useIsMobile` hook (or use existing)
- [ ] 5.1.5 Test breakpoint switching (resize window)

### 5.2 Component Wiring
- [ ] 5.2.1 Wire StatCarousel to Zustand store
- [ ] 5.2.2 Wire DynamicProgressCircle to tracking data
- [ ] 5.2.3 Wire CompressedWeekCard to week context
- [ ] 5.2.4 Wire WeightChartCompact to weight data
- [ ] 5.2.5 Wire ArcMenu to modal handlers
- [ ] 5.2.6 Test all components with real data

### 5.3 Layout Validation
- [ ] 5.3.1 Verify mobile layout fits in 603px (no scroll)
- [ ] 5.3.2 Measure component heights (CompressedWeek, Carousel, Progress, Weight, ArcMenu)
- [ ] 5.3.3 Adjust spacing/padding if needed
- [ ] 5.3.4 Test on iPhone SE (375×667)
- [ ] 5.3.5 Test on Pixel 3 (375×751)
- [ ] 5.3.6 Test on Galaxy S10e (360×760)

---

## 6. Phase 6: Testing & Validation (1.5 days)

### 6.1 Unit Tests
- [ ] 6.1.1 Write tests for `StatCarousel.tsx` (>80% coverage)
- [ ] 6.1.2 Write tests for `DynamicProgressCircle.tsx` (>80% coverage)
- [ ] 6.1.3 Write tests for `CompressedWeekCard.tsx` (>80% coverage)
- [ ] 6.1.4 Write tests for `ArcMenu.tsx` (>80% coverage)
- [ ] 6.1.5 Write tests for `WeightChartCompact.tsx` (>80% coverage)
- [ ] 6.1.6 Verify all existing tests still pass (195+)

### 6.2 E2E Tests
- [ ] 6.2.1 Create `tests/e2e/mobile-dashboard-carousel.spec.ts`
- [ ] 6.2.2 Test carousel auto-rotation
- [ ] 6.2.3 Test swipe gestures (left/right)
- [ ] 6.2.4 Test arc menu open/close
- [ ] 6.2.5 Test modal interactions
- [ ] 6.2.6 Test viewport fit (no scroll on 375px)
- [ ] 6.2.7 Run tests on multiple viewports (375px, 768px, 1920px)

### 6.3 Visual Regression Tests
- [ ] 6.3.1 Capture mobile carousel screenshots (375px)
- [ ] 6.3.2 Capture progress circle screenshots
- [ ] 6.3.3 Capture arc menu screenshots
- [ ] 6.3.4 Compare against baseline (if exists)
- [ ] 6.3.5 Approve new baselines

### 6.4 Accessibility Audit
- [ ] 6.4.1 Run axe DevTools on mobile layout
- [ ] 6.4.2 Test keyboard navigation (Tab, Arrow keys, Escape)
- [ ] 6.4.3 Test screen reader compatibility (NVDA, VoiceOver)
- [ ] 6.4.4 Verify color contrast ratios (WCAG AA)
- [ ] 6.4.5 Ensure all interactive elements have ARIA labels
- [ ] 6.4.6 Fix any accessibility violations

### 6.5 Performance Testing
- [ ] 6.5.1 Run Lighthouse on mobile (375px viewport)
- [ ] 6.5.2 Verify score ≥90 (Performance, Accessibility, Best Practices, SEO)
- [ ] 6.5.3 Measure bundle size (should be <650KB)
- [ ] 6.5.4 Test on real iPhone SE (iOS Safari)
- [ ] 6.5.5 Test on real Pixel 3 (Chrome Mobile)
- [ ] 6.5.6 Verify 60fps animations (no jank)

### 6.6 Manual Testing
- [ ] 6.6.1 Test carousel auto-rotation on real device
- [ ] 6.6.2 Test swipe gestures on real device
- [ ] 6.6.3 Test arc menu usability
- [ ] 6.6.4 Test all modals (open, close, save)
- [ ] 6.6.5 Test dark mode (all components)
- [ ] 6.6.6 Test landscape orientation (if supported)

---

## 7. Phase 7: Polish & Documentation (0.5 days)

### 7.1 Dark Mode
- [ ] 7.1.1 Verify all new components support dark mode
- [ ] 7.1.2 Test color visibility in dark mode
- [ ] 7.1.3 Fix any contrast issues

### 7.2 Animation Tuning
- [ ] 7.2.1 Adjust carousel transition timing
- [ ] 7.2.2 Adjust arc menu slide-up timing
- [ ] 7.2.3 Adjust progress circle animation timing
- [ ] 7.2.4 Add haptic feedback (if browser supports)

### 7.3 Documentation
- [ ] 7.3.1 Update `CLAUDE.md` with carousel patterns
- [ ] 7.3.2 Document arc menu usage
- [ ] 7.3.3 Document dynamic progress circle
- [ ] 7.3.4 Add Storybook stories for new components
- [ ] 7.3.5 Update README with mobile design changes

### 7.4 Bundle Size
- [ ] 7.4.1 Run bundle analyzer
- [ ] 7.4.2 Verify total bundle size <650KB
- [ ] 7.4.3 Optimize if needed (code splitting, lazy loading)
- [ ] 7.4.4 Document bundle size increase

---

## 8. Final Checks

### 8.1 Code Quality
- [ ] 8.1.1 Run TypeScript type checking (`npm run typecheck`)
- [ ] 8.1.2 Run ESLint (`npm run lint`)
- [ ] 8.1.3 Run Prettier (`npm run format:check`)
- [ ] 8.1.4 Fix all linting/formatting errors

### 8.2 Test Coverage
- [ ] 8.2.1 Verify overall coverage ≥80%
- [ ] 8.2.2 Verify new components have ≥80% coverage
- [ ] 8.2.3 Run full test suite (`npm run test:all`)
- [ ] 8.2.4 Ensure all tests pass

### 8.3 Build Verification
- [ ] 8.3.1 Run production build (`npm run build`)
- [ ] 8.3.2 Preview production build (`npm run preview`)
- [ ] 8.3.3 Test on production build
- [ ] 8.3.4 Verify no console errors

### 8.4 Git Pre-Commit Checks
- [ ] 8.4.1 Run pre-commit hook
- [ ] 8.4.2 Fix any hook failures
- [ ] 8.4.3 Verify branch name follows convention

---

## 9. Deployment Preparation

### 9.1 Feature Flag
- [ ] 9.1.1 Add `CAROUSEL_DASHBOARD_ENABLED` to `src/config/features.ts`
- [ ] 9.1.2 Set default to `true`
- [ ] 9.1.3 Test with flag `false` (should show old layout)
- [ ] 9.1.4 Test with flag `true` (should show new carousel layout)

### 9.2 Backup
- [ ] 9.2.1 Create backup branch `backup/pre-carousel-redesign`
- [ ] 9.2.2 Document rollback procedure

### 9.3 CHANGELOG
- [ ] 9.3.1 Update `CHANGELOG.md` with new features
- [ ] 9.3.2 Bump version in `package.json` (SemVer minor)

---

## Task Summary

**Total Tasks**: 150+
**Estimated Effort**: 8.5 days
**Priority**: High

**Phases**:
1. ✅ Core Carousel (2 days) - 27 tasks
2. ✅ Progress Circle (1 day) - 14 tasks
3. ✅ Compressed Week + Weight (1 day) - 13 tasks
4. ✅ Arc Menu (1.5 days) - 19 tasks
5. ✅ Dashboard Integration (1 day) - 17 tasks
6. ✅ Testing & Validation (1.5 days) - 30 tasks
7. ✅ Polish & Documentation (0.5 days) - 14 tasks
8. ✅ Final Checks (varies) - 12 tasks
9. ✅ Deployment Prep (varies) - 6 tasks

---

**Last Updated**: 2025-10-22
**Change ID**: `redesign-mobile-dashboard-input`
**Status**: PENDING APPROVAL
