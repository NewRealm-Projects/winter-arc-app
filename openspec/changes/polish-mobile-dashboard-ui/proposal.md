# OpenSpec Proposal: Polish Mobile Dashboard UI - Phase 3 Refinements

**Status**: PROPOSED
**Type**: Mobile UI/UX Polish & Bug Fixes
**Priority**: High
**Created**: 2025-10-22
**Target**: Fix critical usability issues in mobile dashboard carousel redesign
**Scope**: Dashboard page mobile layout (375px-480px viewport)
**Base Change**: `redesign-mobile-dashboard-input`

---

## Problem Statement

The mobile dashboard carousel implementation has several usability issues that need urgent fixing:

### Issue 1: Progress Circle Click Handler Always Opens Sports Modal
**Current Behavior**: Clicking anywhere on the progress circle, even near adjacent stat segments, always opens the Sports modal instead of the corresponding stat's modal.

**Root Cause**: The carousel click handler on the main container (line 98 in DashboardMobile.tsx) with `onClick={handleCarouselClick}` that always opens 'sports' modal, regardless of where user clicks.

**Impact**: Users cannot interact with the progress circle to view other stats directly - they must swipe the carousel instead.

### Issue 2: Arc Menu Positioning (Horizontal Flip)
**Current Behavior**: Arc menu appears to open in the wrong position relative to the plus button. The arc should fully surround the plus button with the 5 slices arranged horizontally around it.

**Root Cause**: SVG positioning with `absolute bottom-16` and improper angle calculations for horizontal distribution. Arc should open downward with slices arranged left-to-right.

**Impact**: Menu feels disconnected from the button, unclear which slices correspond to which positions.

### Issue 3: Overall Layout Sizing
**Current Behavior**: Plus button (ArcMenu) overlaps or sits on top of the Weight tile instead of appearing below it. This violates the single-screen layout constraint.

**Root Cause**:
- Container height constraints (`h-screen`) not accounting for safe areas
- Component heights not optimized for mobile
- Insufficient gap/padding adjustments

**Impact**:
- Visual overlap and confusion
- Potential touch target conflicts
- Layout doesn't respect viewport constraints

### Issue 4: Progress Bar Visual Design
**Current Behavior**: Progress circle has emoji icons for each stat segment, pagination dots showing active slide.

**Issues**:
- Icons clutter the circle interface
- Pagination dots redundant with carousel auto-rotation
- No visual feedback linking active carousel slide to progress ring

**Desired Behavior**:
- Remove icons from progress circle segments
- Highlight the currently active stat's segment by enlarging it slightly (scale up, increased opacity)
- Remove pagination dots entirely
- Active segment should be visually distinct and linked to carousel position

### Issue 5: Settings Icon Non-Functional
**Current Behavior**: Settings icon in DashboardHeader doesn't navigate to Settings page when clicked.

**Root Cause**: `onSettingsClick={() => {}}` handler in DashboardMobile.tsx is empty (line 89).

**Impact**: Users cannot access settings from mobile dashboard.

---

## Why These Matter

1. **Circle Click**: Critical for usability - users need to tap stats to view details
2. **Arc Menu Positioning**: Affects discoverability and menu understanding
3. **Layout Sizing**: Breaks the core "One Screen Rule" constraint
4. **Visual Feedback**: Improves carousel-to-progress-ring linkage and reduces confusion
5. **Settings Navigation**: Accessibility issue - users get stuck with no way to configure app

---

## Solution Overview

### 1. Progress Circle Click Detection
- Replace container-level click handler with segment-level click handlers
- Map SVG path elements to stat IDs dynamically
- Open correct modal based on which segment was clicked
- Implement click target boundaries to prevent mis-clicks on adjacent segments

### 2. Arc Menu Repositioning
- Adjust SVG angle calculations to properly distribute slices horizontally (0° to 180°)
- Verify SVG viewBox dimensions and positioning
- Test on multiple device sizes (iPhone SE, Pixel 3, Galaxy S10e)
- Ensure visual alignment with plus button

### 3. Layout Height Optimization
- Reduce component padding on mobile:
  - DashboardHeader: from current to more compact
  - CompressedWeekCard: optimize height (~50-70px)
  - StatCarouselWithProgressCircle: take appropriate flex space
  - WeightChartCompact: reduce height (~100px)
  - Gaps: reduce from `gap-1` to tighter spacing
- Target total height: ~603px usable (100vh - safe areas - navigation)
- Plus button should render below all tiles, not overlap

### 4. Progress Circle Visual Redesign
- **Remove icons**: Delete emoji rendering from circle segments
- **Highlight active segment**:
  - On carousel slide change, identify corresponding segment
  - Apply visual highlight:
    - `scale(1.1)` transform (10% larger)
    - `opacity: 1` (full opacity while others at 0.8)
    - Optional: slightly thicker stroke or different color saturation
  - Animate transition between segments (200ms cubic-bezier)
- **Remove pagination dots**: Delete dot indicator component
- **Link carousel → circle**: Update progress circle whenever carousel rotates or user swipes

### 5. Settings Icon Navigation
- Replace empty handler with proper navigation:
  ```typescript
  const navigate = useNavigate();
  const handleSettingsClick = () => navigate('/settings');
  ```
- Or use routing context if available
- Add visual feedback (e.g., opacity change on press)

---

## Technical Details

### Changes Required

**src/pages/dashboard/DashboardMobile.tsx**:
- Remove `onClick={handleCarouselClick}` from main carousel container
- Implement per-segment click detection in StatCarouselWithProgressCircle
- Add settings navigation handler
- Adjust layout gaps and heights

**src/components/dashboard/ArcMenu.tsx**:
- Verify SVG angle calculations (currently 180° to 0° for left-to-right)
- Test positioning on multiple viewports
- May need SVG viewBox adjustment

**src/components/dashboard/StatCarouselWithProgressCircle.tsx**:
- Add active segment highlighting logic
- Remove icon rendering from progress circle
- Add event emitter/callback when carousel rotates to update progress ring
- Remove pagination dots component

**Styling adjustments**:
- Reduce gaps: `gap-1` → `gap-0.5` or eliminate
- Reduce padding on header, cards
- Optimize component heights for mobile viewport

### Data Flow

```
User clicks progress circle segment
  ↓
SVG path click handler fires
  ↓
Determine which stat was clicked (map SVG path to ID)
  ↓
Call onStatSelect(statId)
  ↓
Open corresponding modal (WorkoutLogModal, PushupLogModal, etc.)
  ↓
On successful save, modal closes
  ↓
DashboardMobile re-renders with updated data
```

### Testing Strategy

1. **Unit Tests**:
   - Test segment click detection accuracy
   - Test active segment highlighting with carousel rotation
   - Test settings navigation callback

2. **Manual Testing**:
   - iPhone SE (375×667): Test all click targets, layout fit
   - Pixel 3 (375×751): Verify no overlap
   - Galaxy S10e (360×760): Test responsive behavior
   - Test arc menu positioning on all devices
   - Test settings icon navigation

3. **Visual Regression**:
   - Capture screenshots of new progress circle (no icons, highlighted segment)
   - Compare arc menu positioning across devices
   - Verify layout height constraint (<603px)

---

## Acceptance Criteria

- [ ] Clicking any segment of progress circle opens correct modal
- [ ] Arc menu is positioned correctly around plus button with proper horizontal distribution
- [ ] Layout fits entirely within 603px viewport on all target devices (no scroll)
- [ ] Plus button appears below Weight tile (no overlap)
- [ ] Progress circle has no icons, only colored segments
- [ ] Active segment is visually enlarged/highlighted when carousel rotates
- [ ] Pagination dots removed from carousel
- [ ] Settings icon navigates to Settings page
- [ ] All existing tests still pass (296+)
- [ ] New tests added for segment click detection and settings navigation
- [ ] TypeScript: 0 errors
- [ ] ESLint: 0 errors
- [ ] No visual regression in other components

---

## Timeline

**Estimated Effort**: 3-4 hours

1. Fix circle click detection: 1 hour
2. Arc menu positioning: 30 mins
3. Layout height optimization: 1 hour
4. Progress circle visual redesign: 1 hour
5. Settings navigation: 15 mins
6. Testing & refinement: 30 mins

---

## Dependencies

- Base change: `redesign-mobile-dashboard-input` (Phase 1-5 complete)
- No new library dependencies required
- Existing component structure sufficient

---

## Risks & Mitigations

| Risk | Mitigation |
|------|-----------|
| Breaking existing carousel functionality | Comprehensive unit tests for carousel rotation |
| SVG geometry complexity for arc menu | Test on real devices early, iterate on positioning |
| Layout height conflicts on notched devices | Use safe area padding variables throughout |
| Visual regression in progress circle | Capture baselines, compare before/after screenshots |

---

## Open Questions

1. Should the active segment highlight be purely visual (scale/opacity) or include color change?
2. What's the preferred animation timing for segment transitions (200ms, 300ms)?
3. Should settings navigation use React Router or navigation context?
4. Are there any additional polish items for Phase 3?

---

## Related Changes

- Parent: `redesign-mobile-dashboard-input` (Phase 1-5 complete)
- Will be followed by: Final testing and optimization pass if needed

---

**Next Steps**: Once approved, create detailed design document and implementation tasks.
