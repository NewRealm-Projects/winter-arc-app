# Design Document: Polish Mobile Dashboard UI

**Change ID**: `polish-mobile-dashboard-ui`
**Status**: DRAFT
**Created**: 2025-10-22
**Base Change**: `redesign-mobile-dashboard-input` (Phase 1-5)

---

## Table of Contents

1. [Overview](#overview)
2. [Issue Breakdown & Solutions](#issue-breakdown--solutions)
3. [Visual Design Changes](#visual-design-changes)
4. [Technical Implementation](#technical-implementation)
5. [Component Modifications](#component-modifications)
6. [Layout Height Analysis](#layout-height-analysis)
7. [Testing Plan](#testing-plan)

---

## Overview

This polish phase addresses 5 critical usability issues discovered after Phase 1-5 implementation:

1. Progress circle click detection broken (always opens Sports)
2. Arc menu positioned incorrectly (doesn't surround plus button)
3. Layout oversizing (plus button overlaps Weight tile)
4. Progress circle visual clutter (unnecessary icons and dots)
5. Settings icon non-functional (empty click handler)

**Goal**: Create a polished, intuitive mobile dashboard that properly handles user interactions and maintains layout constraints.

---

## Issue Breakdown & Solutions

### Issue #1: Progress Circle Click Handler

**Current Code** (DashboardMobile.tsx line 98):
```typescript
<div onClick={handleCarouselClick} className="flex-1 flex items-center justify-center min-h-0">
  <div className="w-full max-w-xs">
    <StatCarouselWithProgressCircle />
  </div>
</div>

const handleCarouselClick = () => {
  setOpenModal('sports');  // <-- ALWAYS 'sports'!
};
```

**Problem**: Container-level click handler fires regardless of which segment was clicked.

**Solution**:
1. Remove container-level click handler
2. Move click detection into StatCarouselWithProgressCircle component
3. For each SVG segment `<path>` element, add:
   ```typescript
   onClick={() => onSegmentClick(statId)}
   ```
4. Update DashboardMobile to handle stat-specific callbacks:
   ```typescript
   const handleSegmentClick = (stat: 'sports' | 'pushup' | 'hydration' | 'nutrition' | 'weight') => {
     setOpenModal(stat);
   };
   ```

**Implementation**:
- Add `onSegmentClick` prop to StatCarouselWithProgressCircle
- Map SVG paths to stat IDs in component
- Pass stat ID as parameter to click handler

---

### Issue #2: Arc Menu Horizontal Positioning

**Current Visual Problem**:
- Arc appears disconnected from plus button
- Slices not distributed evenly around button
- May be rotated incorrectly or positioned off-center

**Expected Behavior**:
```
       Nutrition
         (left)
      🥩

   Hydration ---- Weight
   (bottom-left)  (center)
   💧           ⚖️

      Pushup ---- Sports
      (bottom-right) (right)
      💪          🏃
```

**Arc Should**:
- Be centered on plus button position
- Span 180° from left (180°) to right (0°)
- Have 5 slices evenly distributed (36° each)
- Appear visually "around" the button, not disconnected

**Current SVG Configuration** (ArcMenu.tsx):
```typescript
const SVG_SIZE = 280;
const CENTER_X = SVG_SIZE / 2;
const CENTER_Y = SVG_SIZE / 2;
const RADIUS = 100;
const ICON_RADIUS = 75;
```

**Issue**: SVG positioned with `absolute bottom-16` relative to container - may not align with plus button horizontally.

**Solution**:
1. Adjust SVG positioning to center relative to plus button
2. Verify angle calculations are correct (180° → 0° for horizontal left-to-right)
3. Test on multiple viewports to ensure visual alignment
4. May need to adjust SVG_SIZE, RADIUS, or container positioning

**Verification Points**:
- [ ] Slice borders are clean and aligned
- [ ] No visual gaps between slices
- [ ] Center point aligns with plus button
- [ ] Tested on: iPhone SE (375px), Pixel 3 (375px), Galaxy S10e (360px)

---

### Issue #3: Layout Sizing & Height Optimization

**Current Problem**:
- Plus button overlaps or sits on Weight tile
- Total layout height exceeds 603px constraint
- Visual hierarchy broken

**Current Component Heights** (estimated):
```
DashboardHeader:           ~48px (48px header + gaps)
CompressedWeekCard:        ~60px (calculated)
StatCarouselWithProgressCircle: ~200px+ (flex-1, takes remaining space)
WeightChartCompact:        ~120px+
Gaps (gap-1 = 4px × 3):   ~12px
ArcMenu (plus button):     ~56px (w-14 h-14)
Total:                     ~496px (before safe areas)

Safe areas:
- Top (safe-pt):           ~44px (iPhone notch)
- Bottom (safe-pb):        ~34px (home indicator)
Total safe areas:          ~78px

Actual viewport:           ~603px
Overhead:                  ~496 + ~78 = ~574px (fits!)
But visual overlap suggests layout constraints not working.
```

**Root Cause**: Possible issues:
- Flex layout not properly distributing space
- Gaps too large relative to component sizes
- Safe area padding being applied multiple times
- Min-height constraints conflicting with max-content

**Solution**:

1. **DashboardHeader**: Reduce height
   - Currently: ~48px
   - Target: ~40px
   - Reduce padding: `py-1` instead of `py-2`

2. **CompressedWeekCard**: Optimize
   - Currently: ~60-70px
   - Target: ~55px
   - Reduce button padding

3. **StatCarouselWithProgressCircle**: Constrain height
   - Currently: `flex-1` (takes all remaining space, can be 250px+)
   - Target: ~180-200px max
   - Keep flex-1 but add max-h-xs or max-h-sm constraint

4. **WeightChartCompact**: Reduce
   - Currently: ~120px+
   - Target: ~100px
   - Reduce chart height

5. **Gaps**: Tighten spacing
   - Currently: `gap-1` (4px)
   - Target: `gap-0.5` (2px) or eliminate gaps
   - Or use `space-y-0.5` for tighter vertical stacking

6. **ArcMenu**: Position absolutely fixed
   - Already fixed at `bottom-6`
   - Ensure it's below all tiles in z-order

**Revised Height Calculation**:
```
DashboardHeader:              ~40px
CompressedWeekCard:           ~55px
Gap:                          ~2px
StatCarouselWithProgressCircle: ~180px
Gap:                          ~2px
WeightChartCompact:           ~100px
Safe areas:                   ~44px (top) + ~34px (bottom)
Total:                        ~457px ✅ (well under 603px)
```

---

### Issue #4: Progress Circle Visual Design

**Current Design**:
- 5 colored segments (Sports, Pushup, Hydration, Nutrition, Weight)
- Each segment has emoji icon (🏃, 💪, 💧, 🥩, ⚖️)
- Pagination dots showing active slide (5 dots)
- Icons clutter the visual hierarchy

**Problems**:
- Icons distract from progress visualization
- Pagination dots redundant with carousel auto-rotation
- No visual link between carousel position and progress ring

**New Design**:

**Progress Circle Segments**:
```
BEFORE (with icons):
┌─────────────────┐
│    🏃🥩💧      │
│   💪   ⚖️     │  ← Icons clutter
│  Progress Ring │
│    (5 arcs)    │
└─────────────────┘

AFTER (no icons):
┌─────────────────┐
│                 │
│   Progress Ring │  ← Clean, minimal
│  (5 segments)   │
│  Active: Enlarged│  ← Visual highlight
└─────────────────┘
```

**Active Segment Highlighting**:

When carousel rotates to a new stat, highlight its progress ring segment:

```typescript
// Example: Carousel at index 2 (Hydration)
activeSegmentIndex: 2

// Apply to SVG path element for hydration:
const isActive = segmentIndex === activeSegmentIndex;
const style = {
  transform: isActive ? 'scale(1.1)' : 'scale(1)',
  opacity: isActive ? '1' : '0.8',
  transition: 'all 200ms cubic-bezier(0.2, 0.8, 0.2, 1)',
};
```

**Visual Changes**:
1. Remove emoji/icon `<text>` elements from SVG
2. Remove `.querySelectorAll('g[role="img"]')` logic
3. Add active segment styling:
   - Scale: 1.0 → 1.1 (10% larger)
   - Opacity: 0.8 → 1.0
   - Stroke: Optional slight saturation increase
4. Remove pagination dots container
5. Add event handler to update active segment on carousel rotation

**Implementation in StatCarouselWithProgressCircle**:
```typescript
const [activeSegmentIndex, setActiveSegmentIndex] = useState(0);

// When carousel rotates:
const handleCarouselChange = (newIndex: number) => {
  setActiveSegmentIndex(newIndex);
};

// In SVG rendering:
<path
  d={slicePath}
  fill={slice.color}
  opacity={activeSegmentIndex === index ? '1' : '0.8'}
  style={{
    transform: `scale(${activeSegmentIndex === index ? 1.1 : 1})`,
    transformOrigin: `${CENTER_X}px ${CENTER_Y}px`,
    transition: 'all 200ms cubic-bezier(0.2, 0.8, 0.2, 1)',
  }}
  onClick={() => onSegmentClick(slice.id)}
/>
```

---

### Issue #5: Settings Icon Navigation

**Current Code** (DashboardMobile.tsx line 89):
```typescript
<DashboardHeader onSettingsClick={() => {}} />  // <-- Empty!
```

**Problem**: Settings icon is clickable but handler does nothing.

**Solution**:
```typescript
import { useNavigate } from 'react-router-dom';

function DashboardMobileContent() {
  const navigate = useNavigate();

  const handleSettingsClick = () => {
    navigate('/settings');
  };

  return (
    <>
      {/* ... */}
      <DashboardHeader onSettingsClick={handleSettingsClick} />
      {/* ... */}
    </>
  );
}
```

**Verification**:
- [ ] Settings icon is visible and clickable
- [ ] Clicking navigates to `/settings` route
- [ ] Settings page loads correctly from dashboard
- [ ] Back navigation works if implemented

---

## Visual Design Changes

### Before vs After

```
BEFORE (Issues):
┌──────────────────────┐ ← DashboardHeader (48px)
│  W 43  ⚙️             │
├──────────────────────┤ ← CompressedWeekCard (70px)
│ Mo21 Tu22 We23...    │
├──────────────────────┤ ← Gap
│                      │
│   Progress Circle    │ ← StatCarouselWithProgressCircle
│   with icons 🥩💧   │ (250px, too large)
│   (Carousel)         │
│   ●●●●● (dots)       │ ← Pagination (redundant)
│                      │
├──────────────────────┤ ← Gap
│ Weight Chart         │ ← WeightChartCompact (120px)
│ [line graph]         │
│                      │
│    [+] (plus button) │ ← OVERLAPS Weight tile!
│  (ArcMenu 56px)      │
└──────────────────────┘
STATUS: ❌ Layout broken, icons clutter, settings broken

AFTER (Polished):
┌──────────────────────┐ ← DashboardHeader (40px)
│  W 43  ⚙️ (→Settings)│
├──────────────────────┤ ← CompressedWeekCard (55px)
│ Mo21 Tu22 We23...    │
├──────────────────────┤ ← Minimal gap (2px)
│                      │
│   Progress Circle    │ ← StatCarouselWithProgressCircle
│   Clean, highlighted │ (180px, optimized)
│   segment on rotate  │
│   (No icons/dots)    │
│                      │
├──────────────────────┤ ← Minimal gap (2px)
│ Weight Chart         │ ← WeightChartCompact (100px)
│ [line graph]         │
│                      │
├──────────────────────┤ ← Safe area buffer
                       │
      [⊕] (plus)       │ ← ArcMenu below tiles
    ╱   \  ╲           │   (Fixed bottom position)
   🥩  💧  ⚖️           │   Arc positioned properly
   💪     🏃            │
│
└──────────────────────┘
STATUS: ✅ Everything fits, clean design, functional
```

---

## Technical Implementation

### Files to Modify

1. **src/components/dashboard/ArcMenu.tsx**
   - Verify/adjust SVG positioning
   - Ensure slices centered around plus button
   - Test angle calculations

2. **src/components/dashboard/StatCarouselWithProgressCircle.tsx**
   - Add `onSegmentClick` prop
   - Remove icon rendering from SVG
   - Remove pagination dots
   - Add active segment highlighting logic
   - Handle carousel rotation events

3. **src/pages/dashboard/DashboardMobile.tsx**
   - Remove container-level carousel click handler
   - Add segment-specific click handler
   - Add settings navigation
   - Reduce gaps: `gap-1` → `gap-0.5`

4. **Component height adjustments**:
   - DashboardHeader: Reduce padding
   - CompressedWeekCard: Optimize height
   - StatCarouselWithProgressCircle: Add max-height constraint
   - WeightChartCompact: Reduce chart height

### Props Changes

**StatCarouselWithProgressCircle**:
```typescript
interface StatCarouselWithProgressCircleProps {
  onSegmentClick?: (stat: 'sports' | 'pushup' | 'hydration' | 'nutrition' | 'weight') => void;
  onCarouselChange?: (index: number) => void;
  activeSegmentIndex?: number;
}
```

---

## Component Modifications

### StatCarouselWithProgressCircle Changes

**Remove**:
- Icon rendering loop
- Pagination dots component
- Carousel-level click handler

**Add**:
- Active segment highlighting with scale/opacity
- Segment click handler
- Carousel rotation event emission
- Max-height constraint

### DashboardMobile Changes

**Remove**:
- Container-level `onClick={handleCarouselClick}`
- Always-'sports' handler

**Add**:
- `handleSegmentClick` for stat-specific modals
- Settings navigation handler
- Reduced gaps in layout

---

## Layout Height Analysis

### Mobile Viewport Constraints

**iPhone SE (375×667)**:
```
Viewport height:       667px
Status bar:           -20px
Safe top (notch):     -24px
Safe bottom:          -34px
Usable height:        ~589px (target: stay under 603px)

Current allocation:
DashboardHeader:        48px
CompressedWeekCard:     70px
Carousel:              200px (flex-1, too much)
WeightChart:           120px
Safe areas:             78px
Total:                 516px (plus gaps)

Optimized allocation:
DashboardHeader:        40px
CompressedWeekCard:     55px
Carousel:              180px (constrained)
WeightChart:           100px
Safe areas:             78px
Gaps:                    4px
Total:                 457px ✅ (under 589px)
```

**Pixel 3 (375×751)**:
```
Usable height:        ~721px
Same allocation works with more breathing room ✅
```

**Galaxy S10e (360×760)**:
```
Usable height:        ~726px
Slightly narrower (360px) but height is fine ✅
```

---

## Testing Plan

### Unit Tests (Vitest)

1. **ArcMenu positioning**:
   - Verify SVG center alignment
   - Test slice boundaries

2. **Segment click detection**:
   - Clicking each segment opens correct modal
   - Adjacent segments don't trigger wrong modal

3. **Active segment highlighting**:
   - Correct segment highlighted on carousel rotation
   - Styling applied correctly (scale, opacity)
   - Animation timing is smooth

4. **Settings navigation**:
   - Clicking settings icon navigates to /settings
   - Navigation works from dashboard context

### Manual Testing (Real Devices)

**Device 1: iPhone SE (375×667)**
- [ ] All components visible without scroll
- [ ] Plus button below Weight tile (no overlap)
- [ ] Arc menu positioned around plus button
- [ ] Click each progress segment, verify correct modal opens
- [ ] Carousel rotates, segment highlighting updates
- [ ] Settings icon navigates to Settings page

**Device 2: Pixel 3 (375×751)**
- [ ] Repeat all iPhone SE tests
- [ ] Verify extra height is handled gracefully

**Device 3: Galaxy S10e (360×760)**
- [ ] Layout fits within narrower viewport
- [ ] Touch targets still 56px+
- [ ] No horizontal scroll

### Visual Regression Testing

1. Capture baseline screenshots of:
   - Progress circle (no icons, clean look)
   - Arc menu (properly positioned)
   - Full dashboard layout
   - Segment highlighting (active state)

2. Run on all devices, compare to baseline

---

## Performance Considerations

- SVG rendering: No new paths, just styling updates (no performance impact)
- Carousel rotation: Active segment update is local state change (negligible)
- Click detection: Per-segment handlers replace single container handler (same or better)
- Layout: Constrained heights may improve rendering performance (less overflow checking)

---

## Accessibility

- **Segment click targets**: 56px+ recommended, verify with real devices
- **Arc menu slices**: Already have aria-label attributes
- **Settings icon**: Ensure has aria-label or accessible name
- **Visual indicators**: Scale/opacity changes should be clear without relying solely on color

---

## Rollout Plan

1. Implement all changes in feature branch
2. Run unit tests (target: all 296+ passing)
3. Manual testing on real devices
4. Visual regression testing
5. Code review and approval
6. Merge to main
7. Deploy to staging
8. Final verification on production-like environment

---

**Estimated Completion**: 3-4 hours implementation + 1 hour testing = 4-5 hours total
