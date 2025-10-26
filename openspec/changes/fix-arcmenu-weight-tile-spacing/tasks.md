# Implementation Tasks: Fix ArcMenu Positioning & Weight Tile Spacing

**Change**: `fix-arcmenu-weight-tile-spacing`
**Priority**: CRITICAL
**Estimated Duration**: 1-2 hours

---

## Phase 1: Analysis & Measurement

### 1.1 Analyze Current Spacing
- [ ] Open browser DevTools on 375px mobile viewport
- [ ] Measure WeeklyTile height (currently ~110px)
- [ ] Measure UnifiedTrainingCard height (currently ~200px)
- [ ] Measure tracking tiles height (Pushup, Water, Protein, Weight)
- [ ] Measure total height consumed vs. available (603px)
- [ ] Identify gap values (gap-3 = 12px, gap-4 = 16px)
- [ ] Screenshot current layout for before/after comparison

### 1.2 Inspect ArcMenu Positioning
- [ ] Open ArcMenu.tsx and review SVG container setup
- [ ] Identify current positioning (absolute, relative, fixed)
- [ ] Locate plus button center calculation
- [ ] Identify SVG viewBox and arc path coordinates
- [ ] Measure gap between arc and button visually
- [ ] Document current positioning math

### 1.3 Test Current State
- [ ] Load dashboard on mobile viewport
- [ ] Confirm Weight tile is covered by plus button
- [ ] Confirm arc has gap from button
- [ ] Note exact positioning issues

---

## Phase 2: Create Unified ArcMenu Component

### 2.1 Refactor or Create ArcMenuUnified
- [ ] Create new `src/components/dashboard/ArcMenuUnified.tsx` (or refactor existing ArcMenu.tsx)
- [ ] Combine arc SVG and PlusButton into single component
- [ ] Use relative positioning (arc relative to button)
- [ ] Arc positioned: `absolute, bottom: 100%, left: 50%, transform: translateX(-50%)`

### 2.2 Implement Button + Arc Structure
- [ ] Wrapper div with `position: relative`
- [ ] PlusButton as child element
- [ ] ArcSVG with relative positioning (above button)
- [ ] Ensure arc SVG centered horizontally on button

### 2.3 Test Unified Component Positioning
- [ ] Reload dashboard on mobile viewport
- [ ] Visually confirm arc surrounds button concentrically
- [ ] No visible gap between arc center and button
- [ ] Arc and button move together as unified unit
- [ ] Test arc expansion/collapse

---

## Phase 3: Compress Dashboard Layout

### 3.1 Reduce WeeklyTile Height
- [ ] Open `src/components/dashboard/WeeklyTile.tsx`
- [ ] Reduce circle sizes: from `w-10 h-10` to `w-8 h-8` (40px → 32px)
- [ ] Reduce padding: from `p-3` to `p-2` (12px → 8px)
- [ ] Measure new height (target: ~85px)
- [ ] Verify all 7 day circles still visible

### 3.2 Compress UnifiedTrainingCard
- [ ] Open `src/components/UnifiedTrainingCard.tsx`
- [ ] Reduce header padding: `p-3` → `p-2`
- [ ] Reduce graph height: from ~100px to ~70px
- [ ] Compress subheader spacing
- [ ] Measure new height (target: ~160px)
- [ ] Verify all sections still readable

### 3.3 Reduce Tracking Tiles Height
- [ ] Update tile padding: `p-3` → `p-2` (12px → 8px)
- [ ] Reduce internal gaps: `gap-3` → `gap-2` (12px → 8px)
- [ ] Adjust font sizes on mobile (optional, use text-sm for secondary content)
- [ ] Measure each tile height (target: ~60px per tile in 2-col grid)
- [ ] Target total for 4 tiles (2×2): ~120px

### 3.4 Update DashboardMobile with Flex Layout
- [ ] Open `src/pages/dashboard/DashboardMobile.tsx`
- [ ] Refactor outer container to use: `flex flex-col h-screen justify-end`
- [ ] Move content into inner container with: `flex-1 overflow-y-auto`
- [ ] Update gap/padding in content container: `gap-2 px-3 pt-4`
- [ ] Ensure ArcMenuUnified is direct child of outer flex container (naturally pushed to bottom)
- [ ] Remove old margin/padding workarounds for button positioning

### 3.5 Apply Proportional Clearance
- [ ] Add clearance between Weight tile and ArcMenuUnified
- [ ] Use: `margin-bottom: calc(100vh * 0.04)` or padding equivalent
- [ ] This ensures ~4% of viewport height clearance (scales automatically)
- [ ] Verify on multiple mobile viewports (375px, 414px, 480px)

### 3.6 Test Total Layout Height
- [ ] Open DevTools on mobile viewport
- [ ] Measure total dashboard height
- [ ] Confirm ≤ 603px (no scrolling needed)
- [ ] Verify all elements visible and readable

---

## Phase 4: Verify ArcMenu Integration

### 4.1 Confirm Plus Button Position
- [ ] Plus button sits below Weight tile
- [ ] Clear visual separation (24px+ space)
- [ ] Button center aligns with arc center
- [ ] No overlap with any dashboard content

### 4.2 Test ArcMenu Interaction
- [ ] Click plus button → Arc appears
- [ ] Arc surrounds button concentrically
- [ ] Each arc slice is clickable
- [ ] Modals open correctly on slice click
- [ ] Close button/escape key works

### 4.3 Visual Verification
- [ ] Compare before/after screenshots
- [ ] Confirm arc positioning fix visually correct
- [ ] Confirm weight tile fully visible
- [ ] Confirm no scrolling needed

---

## Phase 5: Testing & Validation

### 5.1 Run Existing Tests
- [ ] `npm run test:unit` - Verify no regressions
- [ ] `npm run typecheck` - Check TypeScript
- [ ] `npm run lint` - Check ESLint
- [ ] `npm run format:check` - Check Prettier
- [ ] `npm run build` - Verify build succeeds

### 5.2 Manual Mobile Testing
- [ ] Test on iPhone SE (375×667) if available
- [ ] Test on Pixel 6 (412×915) if available
- [ ] Test portrait orientation
- [ ] Test landscape orientation
- [ ] Verify touch targets are ≥56px

### 5.3 Desktop Verification
- [ ] Verify desktop layout unchanged (≥481px)
- [ ] Desktop dashboard still displays correctly
- [ ] No regressions on desktop

### 5.4 Visual Regression Tests
- [ ] Take screenshot on 375px viewport after changes
- [ ] Compare with before screenshot
- [ ] Create visual regression baseline if needed

---

## Completion Checklist

- [ ] All tasks in Phases 1-5 completed
- [ ] Unit tests passing (195+)
- [ ] TypeScript 0 errors
- [ ] ESLint 0 errors
- [ ] Prettier OK
- [ ] Build successful
- [ ] ArcMenu concentric with plus button
- [ ] Weight tile fully visible
- [ ] No scrolling needed on mobile
- [ ] All elements readable and usable
- [ ] Desktop unchanged
- [ ] Before/after screenshots compared
- [ ] Manual device testing completed (if possible)

---

**Notes**:
- Test frequently on mobile viewport while making changes
- Use DevTools measurement tools to verify spacing
- Keep desktop breakpoint unchanged (≥481px)
- Only modify mobile-specific code (< 481px)
