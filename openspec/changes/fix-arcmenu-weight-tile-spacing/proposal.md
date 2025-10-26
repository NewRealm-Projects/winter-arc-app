# OpenSpec Proposal: Fix ArcMenu Positioning & Weight Tile Spacing

**Status**: PROPOSED
**Type**: Mobile Dashboard Layout Bug Fix
**Priority**: CRITICAL
**Created**: 2025-10-26
**Target**: Fix ArcMenu half-circle positioning and Weight tile overlap on mobile
**Scope**: Dashboard page mobile layout (375px viewport)

---

## Problem Statement

### Issue 1: ArcMenu Half-Circle Misaligned with Plus Button

**Current Behavior**: The ArcMenu arc (half-circle SVG) floats above the plus button with a visible gap between them. The arc is not concentric with the plus button—it appears as two separate visual elements rather than one unified component.

**Expected Behavior**: The arc should be a perfect half-circle centered on the plus button, appearing as if the button is nestled at the bottom center of an inverted bowl shape. The arc and button should look like one cohesive unit.

**Root Cause**: SVG container/positioning is offset vertically and/or horizontally from the button's center point. The arc's geometric center does not align with the button's center.

**Visual Impact**: Poor UX—users see two disconnected elements instead of an integrated menu.

### Issue 2: Weight Tile Overlap with Plus Button

**Current Behavior**: The Weight tile is positioned too low on the screen, causing the plus button to visually overlap and cover part of the tile content (likely the header or chart area).

**Expected Behavior**: All dashboard elements (WeeklyTile, UnifiedTrainingCard, Pushup/Water/Protein tiles, Weight tile) should be resized and repositioned such that:
- The Weight tile is fully visible and unobstructed
- Clear visual separation exists between the Weight tile and the plus button
- The plus button appears distinctly below all tracking tiles
- Mobile viewport fits within 100vh with no scrolling (one-screen rule)

**Root Cause**: Overall dashboard layout spacing is too compressed. Component padding, gaps, and tile heights need adjustment to accommodate all elements plus adequate clearance for the plus button.

**Visual Impact**: Weight tile content is partially hidden; users cannot see complete weight data.

---

## Solution Overview

### Unified ArcMenu + Plus Button Component

**Key Decision**: Implement ArcMenu and plus button as a single unified component. This simplifies positioning logic and ensures the arc is naturally relative to the button.

**Component Structure**:
```tsx
<ArcMenuUnified>
  <PlusButton />
  <ArcSVG /> {/* positioned relative to PlusButton */}
</ArcMenuUnified>
```

**Positioning Strategy**:
- Arc SVG positioned relative to button within the unified component
- No viewport-centric calculations needed
- Button and arc move together as cohesive unit

**Files**:
- Create new `src/components/dashboard/ArcMenuUnified.tsx` (or refactor `ArcMenu.tsx`)
- Update `src/pages/dashboard/DashboardMobile.tsx` to use unified component

### Plus Button Placement (Flex Layout)

**Strategy**: Use Flexbox to position plus button at bottom of viewport.

**Changes**:
1. Update `DashboardMobile.tsx` layout:
   ```tsx
   <div className="flex flex-col h-screen justify-end">
     {/* dashboard content */}
     <ArcMenuUnified /> {/* naturally pushed to bottom */}
   </div>
   ```
2. Plus button sits at bottom with proportional clearance from Weight tile
3. Clearance calculation: `~4% of viewport height` (scales with screen size)
   - Example: 603px height × 0.04 ≈ 24px
   - Adapts automatically to smaller devices, preventing scrolling

### Resize Dashboard Elements

**Strategy**: Compress all dashboard tiles to accommodate plus button while maintaining readability. Measure current layout first.

**Phase 1 - Measurement**:
1. Measure current component heights (WeeklyTile, UnifiedTrainingCard, tracking tiles)
2. Identify gap sizes and padding values
3. Calculate total height consumed vs. available (603px)
4. Determine safe reduction targets

**Phase 2 - Compression**:
1. **WeeklyTile**: Reduce circle size to 32px (w-8 h-8)
   - Confirmed size, check readability after implementation

2. **All Tiles**: Reduce padding and gaps
   - Padding: `p-3` (12px) → `p-2` (8px)
   - Gaps: `gap-3` (12px) → `gap-2` (8px)
   - Apply mobile-only overrides (< 481px breakpoint)

3. **Font Sizing**: Judge based on visual inspection
   - Reduce secondary text only if needed
   - Maintain readability throughout

4. **Target Layout** (after measurement and compression):
```
┌────────────────────┐
│ WeeklyTile         │  (measure first)
├────────────────────┤
│ UnifiedTraining    │  (measure first)
├────────────────────┤
│ Pushup    Water    │  (measure first)
│ Protein   Weight   │
├────────────────────┤
│       [ + ]        │  (proportional clearance)
└────────────────────┘
TOTAL: within 603px available (no scrolling)
```

**Files**:
- `src/pages/dashboard/DashboardMobile.tsx` - Flex layout, gap/padding reduction
- Component files - Mobile-specific padding/gap overrides
- `src/components/dashboard/ArcMenuUnified.tsx` - Button positioning within unified component

---

## Impact

### Affected Specs

- `openspec/specs/dashboard/spec.md` - Mobile dashboard layout and spacing requirements

### Affected Code

**Files Modified** (~200 lines changed):
- `src/pages/dashboard/DashboardMobile.tsx` - Flex layout (flex-col justify-end), gap/padding reduction
- `src/components/dashboard/ArcMenuUnified.tsx` (new/refactored) - Unified component with arc + button
- Mobile-specific overrides in component files - Apply `p-2`, `gap-2` for mobile < 481px

### Breaking Changes

**NONE** - All changes are mobile-only layout adjustments. Desktop layout remains unchanged.

---

## Acceptance Criteria

- [ ] ArcMenu half-circle is concentric with plus button (no gap between arc center and button center)
- [ ] Plus button visually sits below Weight tile with clear separation
- [ ] All dashboard elements fit within 100vh on iPhone SE (375×667)
- [ ] No vertical scrolling required on mobile
- [ ] Weight tile content is fully visible (no button overlap)
- [ ] Spacing is tight but elements are not cramped
- [ ] Visual hierarchy maintained despite compression
- [ ] All existing tests pass (195+)
- [ ] TypeScript: 0 errors
- [ ] ESLint: 0 errors
- [ ] Prettier: Format check OK
- [ ] Build successful
- [ ] Visual regression tests pass on mobile viewport

---

## Timeline

**Estimated Effort**: 1-2 hours

1. Analyze current spacing: 30 mins
2. Adjust component heights and gaps: 45 mins
3. Fix ArcMenu positioning: 30 mins
4. Test on mobile viewports: 15 mins

---

## Technical Details

### Flex Layout Strategy

**DashboardMobile Structure**:
```tsx
<div className="flex flex-col h-screen justify-end">
  {/* Dashboard content sections with overflow scroll */}
  <div className="flex-1 overflow-y-auto px-3 pt-4 gap-2">
    <WeeklyTile />
    <UnifiedTrainingCard />
    <div className="grid grid-cols-2 gap-2">
      <PushupTile />
      <WaterTile />
      <ProteinTile />
      <WeightTile />
    </div>
  </div>

  {/* ArcMenuUnified naturally pushed to bottom by justify-end */}
  <ArcMenuUnified />
</div>
```

**Key Benefits**:
- `justify-end` naturally pushes ArcMenuUnified to bottom
- Content section is flexible and scrollable if needed
- No manual positioning calculations required
- Button placement is consistent regardless of content height

### Unified ArcMenu + Button Component

**New Component**: `ArcMenuUnified.tsx`
- Combines arc SVG and plus button into single unit
- Arc positioned relative to button (not viewport)
- State management for expanded/collapsed
- Single component handles all related positioning

**Arc Positioning**:
```tsx
<div className="relative">
  <PlusButton />
  <ArcSVG
    style={{
      position: 'absolute',
      bottom: '100%',      // Arc sits above button
      left: '50%',         // Horizontally centered
      transform: 'translateX(-50%)', // Perfect centering
    }}
  />
</div>
```

### Clearance Calculation

**Proportional Clearance**:
- Formula: `viewport_height * 0.04` (~4%)
- Example: 603px * 0.04 ≈ 24px
- Automatically scales on smaller devices

**Application**:
```css
/* Add margin between Weight tile and ArcMenuUnified */
/* Or use: padding-bottom on content container */
margin-bottom: calc(100vh * 0.04);
```

This ensures no scrolling even on devices with different viewport heights.

---

## Technical Notes

### Measurement Tools

- Use browser DevTools inspector on mobile viewport (375px width)
- Check computed heights and gaps
- Use React DevTools to inspect component bounds

### Testing Strategy

1. Visual testing on mobile viewport in browser (375px)
2. Manual testing on physical devices (iPhone SE if available)
3. Screenshot comparison before/after
4. Verify no overflow or clipping

### Key Files to Investigate

- `src/pages/dashboard/DashboardMobile.tsx` - Layout structure
- `src/components/dashboard/ArcMenu.tsx` - Arc and button positioning
- `src/theme/tokens.ts` - Design token values (gaps, padding)
- Tailwind config - Breakpoints and spacing scale

---

## Risks & Mitigations

| Risk | Mitigation |
|------|-----------|
| Compression makes elements hard to interact with | Test touch targets are ≥56px, ensure usability |
| Content becomes unreadable | Monitor font sizes, use semantic sizing |
| Arc alignment still off after fix | Use absolute positioning and precise calculations |
| Desktop layout affected | Use mobile-only breakpoints, keep desktop classes unchanged |
| Regression in existing tests | Run full test suite after changes |

---

## Next Steps

Once approved:
1. Measure current spacing on mobile viewport
2. Implement dimension changes per acceptance criteria
3. Test on real devices
4. Update this proposal with implementation details
5. Create implementation tasks

---

**Author**: Claude Code
**Branch**: `miket/feature-redesign-mobile-dashboard-input`
**Status**: READY FOR REVIEW
