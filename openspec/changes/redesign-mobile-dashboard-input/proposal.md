# OpenSpec Proposal: Mobile Dashboard Carousel Redesign

**Status**: PROPOSED
**Type**: Mobile UI/UX Redesign (375px viewport)
**Priority**: High
**Created**: 2025-10-22
**Target**: Optimize Dashboard for mobile with carousel-based stat visualization
**Scope**: Dashboard page (mobile-only, 375px-480px viewport)
**Desktop**: No changes - keep current layout unchanged

---

## Why

The current mobile dashboard violates the "One Screen Rule" by requiring vertical scrolling and displays too many tiles simultaneously, creating visual clutter on small screens. Users need to see multiple stats at once but struggle with limited screen real estate (375px × 667px). A carousel-based approach with consolidated progress visualization will:

1. **Eliminate scrolling**: Fit all primary content within 100vh viewport
2. **Reduce cognitive load**: Show one stat focus at a time with auto-rotation
3. **Improve discoverability**: Circular progress shows multi-stat completion at a glance
4. **Enhance mobile UX**: Swipe gestures for natural touch interaction
5. **Quick access**: Arc menu provides fast input without navigating to Input page

This redesign maintains all functionality while optimizing for mobile-first interaction patterns.

---

## What Changes

### Dashboard Page (Mobile Only)

**Current Mobile Layout** (~610px height - requires scroll):
```
┌────────────────────┐
│ WeeklyTile         │  ~110px (7 circles)
├────────────────────┤
│ UnifiedTraining    │  ~200px (full card)
├────────────────────┤
│ Pushup Tile        │  ~150px (2-col grid)
│ Water Tile         │
├────────────────────┤
│ Nutrition Tile     │  ~150px (2-col grid)
│ Weight Tile        │
└────────────────────┘
```

**New Mobile Layout** (~603px height - NO scroll):
```
┌────────────────────┐
│ Compressed Week    │  ~15% screen (~90px)
│ MON 21 TUE 22...   │  Current day highlighted
├────────────────────┤
│                    │
│       ╔═══════╗    │  ~45% screen (~270px)
│       ║  ●●●  ║    │  Stat Carousel inside circle
│       ║  ◌◌◌  ║    │  • Stat name (Sports, Pushup, etc.)
│     ◐◑◑◑◑◐ Sports   │  • Stat icon
│       ║  85%  ║    │  • Current value (0/5, 2L/3L, etc.)
│       ║  ✓    ║    │  • Check mark if complete
│       ╚═══════╝    │
│                    │  Circle Outline = Progress Bar
│  Colors: 🔵🟢🟡🟠🔴  │  • Multi-color bands (20% each)
│  Sports ✓ Water ✓   │  • Animated fill based on stats
│  Pushup ◐ Diet ○    │  • Total %: sum of all stats
│  Weight (30% fill)   │
│                    │
├────────────────────┤
│ Weight Chart       │  ~20% screen (~120px)
│ [Mini Graph]       │  Minimized version
├────────────────────┤
│       [ + ]        │  ~8% screen (~48px button)
│      Add Stats     │  Large, visible button
│                    │  Tap to show arc menu
└────────────────────┘
```

### Key Changes

1. **Compressed Week Card** (NEW)
   - Top bar showing dates (MON 21, TUE 22, WED 23, etc.)
   - Current day highlighted
   - Max 15% of screen height
   - Tap to expand full week view

2. **Dynamic Progress Circle with Integrated Carousel** (NEW)
   - Stat carousel **displayed INSIDE** the circle (not separate)
   - Circle contains:
     - Stat name (Sports, Pushup, Hydration, Nutrition, Weight)
     - Stat icon (emoji or SVG)
     - Current value (0/5 sets, 2L/3L water, 1500/2000 kcal, etc.)
     - Completion indicator (✓ or percentage)
   - Auto-rotates every 4 seconds
   - Swipe left/right to manually navigate
   - **Circle outline = progress bar** with dynamic color bands:
     - 5 color bands (one per stat)
     - Each stat = 20% of circle circumference
     - Progress scales with completion:
       - 50% hydration = 10% fill (half of 20%)
       - Full sports + half nutrition = 30% fill (color banded)
     - Multi-stat display with distinct colors
     - Center displays total completion percentage
   - Max 45% of screen height

4. **Weight Chart** (MODIFIED)
   - Minimized to 20% of screen
   - Same data as desktop, condensed view
   - Tap to expand full chart modal

5. **Arc Menu with Prominent Plus Button** (NEW)
   - Large, visible plus button (48px+ for AAA touch target)
   - Clear "+" icon with "Add Stats" label below
   - Positioned at bottom center of screen
   - Clicking plus button reveals half-circle arc menu (slides up animation)
   - Arc menu contains 5 slices with stat icons:
     - 🏋️ Sports (training)
     - 💪 Pushups (workout)
     - 💧 Hydration (water)
     - 🍗 Nutrition (food)
     - ⚖️ Weight (body weight)
   - Each slice opens corresponding modal from Input page
   - Replaces desktop-style navigation bar on mobile
   - Arc menu collapses on escape key or backdrop click

### Components Created

**New Components**:
- `CompressedWeekCard.tsx` - Week dates with current day highlight
- `DynamicProgressCircle.tsx` - SVG circle with:
  - Multi-stat color band outline (progress bar)
  - Integrated carousel display inside circle
  - Auto-rotate + swipe gesture support
  - Stat name, icon, value, and completion indicator
  - Pagination dots (5 for each stat)
- `ArcMenu.tsx` - Half-circle menu (slides up from bottom)
  - Contains 5 stat slices with icons
  - Plus button (48px+) trigger
  - Modal connections for each stat
- `WeightChartCompact.tsx` - Minimized weight chart
- `DashboardMobileCarousel.tsx` - Mobile layout wrapper

**Modified Components**:
- `Dashboard.tsx` - New mobile layout with conditional rendering
- `WeightTile.tsx` - Add compact mode prop

**Reused Components**:
- `AppModal.tsx` - For stat details and input modals
- Existing modals from Input page (Food, Water, Notes, Training)

### Desktop (481px+)

**NO CHANGES** - Desktop layout remains completely unchanged.

---

## Impact

### Affected Specs

- `openspec/specs/dashboard/spec.md` - Mobile dashboard layout
- `openspec/specs/ui-components/spec.md` - New carousel and arc menu components
- `openspec/specs/weight/spec.md` - Compact chart mode

### Affected Code

**New Files** (~1,200 lines):
- `src/components/dashboard/CompressedWeekCard.tsx`
- `src/components/dashboard/StatCarousel.tsx`
- `src/components/dashboard/CarouselItem.tsx`
- `src/components/dashboard/DynamicProgressCircle.tsx`
- `src/components/dashboard/ArcMenu.tsx`
- `src/components/dashboard/WeightChartCompact.tsx`

**Modified Files** (~300 lines changed):
- `src/pages/Dashboard.tsx` - Conditional mobile layout
- `src/components/WeightTile.tsx` - Add compact mode

**Tests** (~800 lines):
- `src/components/dashboard/__tests__/StatCarousel.test.tsx`
- `src/components/dashboard/__tests__/DynamicProgressCircle.test.tsx`
- `src/components/dashboard/__tests__/ArcMenu.test.tsx`
- `tests/e2e/mobile-dashboard-carousel.spec.ts`

### Breaking Changes

**NONE** - All changes are additive and mobile-only. Desktop users see no changes.

### Non-Breaking Enhancements

- ✅ Mobile users get improved UX (no scrolling, carousel navigation)
- ✅ Quick input via arc menu (no need to navigate to Input page)
- ✅ Better progress visibility (dynamic circle shows all stats)
- ✅ Touch-optimized gestures (swipe, tap, arc menu)
- ✅ Auto-rotation keeps dashboard engaging

---

## Technical Requirements

### Mobile Viewport

- **Target**: iPhone SE (375px × 667px)
- **Usable Height**: ~603px (after safe areas + bottom nav)
- **Breakpoint**: < 481px = mobile, >= 481px = desktop (unchanged)

### Touch Targets

- Carousel items: Full width × 270px height
- Arc menu slices: 56px × 56px minimum
- Week date taps: 48px × 48px minimum
- Progress circle: 120px diameter (center tap)

### Performance

- **Carousel Animation**: 60fps (CSS transforms, GPU-accelerated)
- **Auto-Rotation**: Every 4 seconds (pausable on user interaction)
- **Swipe Detection**: Hammer.js or react-swipeable (< 10KB)
- **Bundle Size**: +50KB max (new components + swipe library)
- **Lighthouse Mobile**: Maintain ≥90 score

### Accessibility

- **Carousel Navigation**: Arrow keys for desktop, swipe for mobile
- **Progress Circle**: ARIA labels for screen readers
- **Arc Menu**: Keyboard accessible (Tab + Enter)
- **Color Contrast**: WCAG AA compliant (4.5:1)

---

## Implementation Phases

### Phase 1: Core Carousel (2 days)

**Goal**: Build carousel with auto-rotate and swipe gestures

- [ ] Create `StatCarousel.tsx` component
- [ ] Create `CarouselItem.tsx` for individual stats
- [ ] Implement auto-rotation timer (4s interval)
- [ ] Add swipe gesture support (left/right)
- [ ] Add pagination dots below carousel
- [ ] Unit tests for carousel logic

**Acceptance Criteria**:
- Carousel auto-rotates through 5 stats
- Swipe left/right changes stat
- Pause on user interaction
- Smooth 60fps animations

### Phase 2: Progress Circle (1 day)

**Goal**: SVG circle with multi-stat color bands

- [ ] Create `DynamicProgressCircle.tsx` component
- [ ] Calculate progress per stat (20% each)
- [ ] Render color bands based on completion
- [ ] Add center text (total percentage)
- [ ] Animate progress changes
- [ ] Unit tests for progress calculation

**Acceptance Criteria**:
- Circle shows 5 color bands (one per stat)
- Each stat contributes 0-20% to total
- Smooth transitions on data change
- Center shows total completion %

### Phase 3: Compressed Week + Weight Chart (1 day)

**Goal**: Top week bar and minimized weight chart

- [ ] Create `CompressedWeekCard.tsx` component
- [ ] Show 7 dates with current day highlighted
- [ ] Tap to expand full week modal
- [ ] Create `WeightChartCompact.tsx` component
- [ ] Minimize chart to 120px height
- [ ] Tap to expand full chart modal

**Acceptance Criteria**:
- Week card shows MON-SUN dates
- Current day visually highlighted
- Weight chart fits in 120px
- Both expand to modals on tap

### Phase 4: Arc Menu (1.5 days)

**Goal**: Half-circle menu for quick inputs

- [ ] Create `ArcMenu.tsx` component
- [ ] SVG arc with 5 equal slices
- [ ] Icons for each stat (Sports, Pushup, Water, Food, Weight)
- [ ] Click opens corresponding modal
- [ ] Animate arc appearance (slide up from bottom)
- [ ] Close on outside click or Escape

**Acceptance Criteria**:
- Plus button barely visible until hover/tap
- Arc menu slides up smoothly
- Each slice opens correct modal
- Keyboard accessible (Tab navigation)
- Closes on background click

### Phase 5: Dashboard Integration (1 day)

**Goal**: Wire up all components in Dashboard.tsx

- [ ] Update `Dashboard.tsx` with conditional rendering
- [ ] Add mobile layout (< 481px)
- [ ] Keep desktop layout unchanged (>= 481px)
- [ ] Connect carousel to real data (Zustand store)
- [ ] Connect progress circle to tracking data
- [ ] Wire arc menu to modal handlers

**Acceptance Criteria**:
- Mobile shows new layout (no scroll)
- Desktop unchanged
- All stats display real data
- Arc menu opens correct modals
- Auto-rotation works with live data

### Phase 6: Testing & Validation (1.5 days)

**Goal**: Comprehensive testing on real devices

- [ ] Unit tests for all new components (>80% coverage)
- [ ] E2E tests for carousel navigation
- [ ] E2E tests for arc menu interaction
- [ ] Visual regression tests (375px, 768px, 1920px)
- [ ] Manual testing on iPhone SE, Pixel 3
- [ ] Accessibility audit (WCAG AA)
- [ ] Performance testing (Lighthouse ≥90)

**Acceptance Criteria**:
- All tests pass (195+ existing + 50+ new)
- TypeScript, ESLint, Prettier clean
- Lighthouse mobile ≥90
- No accessibility violations
- Works on real iOS/Android devices

### Phase 7: Polish & Documentation (0.5 days)

**Goal**: Final touches and documentation

- [ ] Dark mode verification
- [ ] Animation timing tweaks
- [ ] Add haptic feedback (if supported)
- [ ] Update CLAUDE.md with carousel patterns
- [ ] Create Storybook stories for new components
- [ ] Bundle size check (<650KB total)

**Acceptance Criteria**:
- Dark mode works correctly
- Animations feel smooth (60fps)
- Documentation complete
- Storybook stories pass
- Bundle size within budget

---

## Success Criteria

✅ **Dashboard fits in single mobile viewport** (100vh, no scrolling)
✅ **Carousel auto-rotates** through 5 stats every 4 seconds
✅ **Swipe gestures work** (left/right navigation)
✅ **Progress circle displays** multi-stat completion with color bands
✅ **Arc menu provides quick input** without navigating to Input page
✅ **Week card shows dates** with current day highlighted (max 15% screen)
✅ **Weight chart minimized** to 20% of screen
✅ **All touch targets ≥56px** (carousel, arc menu slices, week dates)
✅ **Desktop layout completely unchanged** (481px+ uses current design)
✅ **All existing tests pass** (195+ coverage maintained)
✅ **No breaking changes** to API/state management
✅ **Lighthouse mobile score ≥90**
✅ **Works on iOS Safari and Chrome Mobile** (375px actual devices)
✅ **Bundle size increase <50KB** (new components + swipe library)
✅ **WCAG AA compliant** (color contrast, keyboard navigation)

---

## Risk Assessment

### Low Risk

- UI/CSS changes only (no backend changes)
- No state management changes (Zustand stores unchanged)
- No API changes (Firebase integration unchanged)
- Desktop completely unaffected (separate code path)
- Backward compatible (mobile users see improved UX)

### Medium Risk

- **Carousel complexity**: Auto-rotation + swipe gestures + animations
  - **Mitigation**: Use proven library (react-swipeable), extensive testing
- **Performance on older devices**: Animations may lag on iPhone 6/7
  - **Mitigation**: Use CSS transforms (GPU-accelerated), fallback to simpler animations
- **Arc menu usability**: Users may not discover plus button
  - **Mitigation**: Add tooltip/hint on first visit, make slightly more visible

### Potential Issues

1. **Touch scrolling interference**: Swipe may conflict with page scroll
   - **Mitigation**: Use touch event preventDefault, test on real devices
2. **Modal scrolling on small screens**: Arc menu modals may exceed viewport
   - **Mitigation**: Use AppModal with max-height: 90vh, scrollable content
3. **Auto-rotation distracting**: Users may find constant rotation annoying
   - **Mitigation**: Pause on interaction, add settings toggle to disable

---

## Rollback Strategy

If major issues arise:

1. **Feature Flag**: `CAROUSEL_DASHBOARD_ENABLED` in `src/config/features.ts`
   - Set to `false` to revert to current mobile layout
2. **Branch Protection**: Keep current layout in `backup/pre-carousel-redesign`
3. **Easy Revert**: `git revert <commit-sha>` restores old layout
4. **Gradual Rollout**: Enable for 10% of users first (if analytics available)

---

## Key Assumptions

1. **Mobile = 375px-480px**: Designing for iPhone SE, Pixel 3, Galaxy S10e
2. **Carousel is intuitive**: Users understand swipe gestures on mobile
3. **Arc menu is discoverable**: Plus button with tooltip guides users
4. **Auto-rotation acceptable**: 4-second interval not too fast/slow
5. **Desktop untouched**: No changes to 481px+ layouts (keep current behavior)
6. **Weight chart minimization**: Users okay with compact chart (can expand to modal)
7. **5 stats sufficient**: Sports, Pushup, Hydration, Nutrition, Weight cover core tracking

---

## Dependencies

### New Dependencies

- `react-swipeable` (8KB gzipped) - Swipe gesture detection
  - **Why**: Mature, well-tested, TypeScript support
  - **Alternatives**: Hammer.js (larger), custom implementation (more work)

### Existing Dependencies (No Changes)

- `react` (18.x) - Core framework
- `zustand` - State management (unchanged)
- `tailwindcss` - Styling (unchanged)
- `date-fns` - Date formatting (unchanged)

---

## References

- Current Dashboard: `src/pages/Dashboard.tsx`
- Current Input: `src/pages/InputPage.tsx`
- Tile components: `src/components/{Pushup,Hydration,Nutrition,Weight}Tile.tsx`
- Design tokens: `CLAUDE.md` - "Mobile-First (One Screen Rule)"
- Modal system: `src/components/ui/AppModal.tsx`
- Mobile viewport specs: iPhone SE (375×667), Pixel 3 (375×751)

---

## Open Questions - Answered

1. **Carousel auto-rotation speed**: ✅ **4 seconds per stat** - Confirmed as optimal initial value
   - Auto-rotation pauses on user interaction (swipe, tap)
   - Resumes after 10 seconds of inactivity

2. **Arc menu visibility**: ✅ **Plus button can be more prominent**
   - Increase size to 56px+ if needed for touch comfort
   - Must maintain constraint: ~8% of screen height (~48px minimum on 603px viewport)
   - Can extend to 56-64px if layout allows

3. **Progress circle tap behavior**: ✅ **Show compact tracking tile**
   - Tapping progress circle shows modal with compact version of desktop stat tile
   - Displays corresponding stat (Sports, Pushup, Hydration, Nutrition, Weight)
   - Reuses existing tile component in modal format
   - Includes mini progress bar and recent data

4. **Weight chart data**: ✅ **7 days default + swipe for 30 days**
   - Default view: Last 7 days of weight data (compact)
   - Swipe left → 30 days view (compact)
   - Swipe right → Back to 7 days
   - Both maintain max 20% screen height (~120px)
   - Use same compact styling as 7-day view

5. **Swipe sensitivity**: ✅ **1/3 screen width = ~125 pixels**
   - Mobile viewport: 375px width
   - Swipe threshold: 375px / 3 ≈ 125px horizontal movement
   - Velocity threshold: 0.3 (standard swipe)
   - Applies to: Carousel navigation, weight chart view toggle

---

**Author**: Claude Code
**Branch**: `miket/feature-redesign-mobile-dashboard-input`
**Scope**: Mobile Only (375px-480px)
**Desktop**: No Changes
**Status**: READY FOR IMPLEMENTATION
