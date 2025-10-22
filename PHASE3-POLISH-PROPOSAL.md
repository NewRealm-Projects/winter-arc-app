# Phase 3 Polish Proposal - Ready for Implementation

**Status**: PROPOSED & STASHED
**Created**: 2025-10-22 23:15 UTC
**Stash Reference**: `stash@{0}`
**Base**: `miket/feature-redesign-mobile-dashboard-input` branch

---

## Quick Summary

Created comprehensive OpenSpec proposal and design document for Phase 3 polish refinements to the mobile dashboard. Documents are stashed and ready for implementation after rest.

**Stash Command to Restore**:
```bash
git stash pop  # Restores the latest stash
```

---

## Issues Addressed

### 1. ❌ Progress Circle Click Issue
**Problem**: Clicking anywhere on the progress circle always opens the Sports modal
**Solution**: Add per-segment click detection instead of container-level handler

### 2. ❌ Arc Menu Horizontal Positioning
**Problem**: Arc menu not properly positioned around plus button, appears disconnected
**Solution**: Verify/adjust SVG angle calculations and positioning logic

### 3. ❌ Layout Sizing
**Problem**: Plus button overlaps Weight tile, violates 603px viewport constraint
**Solution**: Reduce component heights and gaps to fit within constraints

### 4. ❌ Progress Circle Visual Clutter
**Problem**: Icons and pagination dots make progress ring confusing
**Solution**:
- Remove icons from segments
- Remove pagination dots
- Highlight active segment by enlarging it (scale 1.1) when carousel rotates

### 5. ❌ Settings Icon Non-Functional
**Problem**: Settings icon has empty click handler
**Solution**: Wire it to navigate to `/settings` page

---

## Proposal Documents Location

All documents stashed in:
```
openspec/changes/polish-mobile-dashboard-ui/
├── proposal.md      (Problem statement, solutions overview, timeline)
└── design.md        (Detailed technical design, visual mockups, testing plan)
```

---

## Key Details from Proposal

### Timeline
- **Estimated Effort**: 3-4 hours implementation + 1 hour testing
- **Total**: 4-5 hours

### Components to Modify
1. `src/pages/dashboard/DashboardMobile.tsx`
   - Remove container-level carousel click handler
   - Add segment-specific click handler
   - Add settings navigation
   - Reduce gaps from `gap-1` to `gap-0.5`

2. `src/components/dashboard/StatCarouselWithProgressCircle.tsx`
   - Add `onSegmentClick` prop
   - Remove icon rendering
   - Remove pagination dots
   - Add active segment highlighting (scale + opacity)

3. `src/components/dashboard/ArcMenu.tsx`
   - Verify SVG positioning and angle calculations
   - Test on real devices for alignment

### Height Optimization Targets
```
DashboardHeader:              40px  (from 48px)
CompressedWeekCard:           55px  (from 70px)
StatCarouselWithProgressCircle: 180px (from 200px+)
WeightChartCompact:          100px  (from 120px+)
Safe areas:                   78px
Gaps:                          4px
─────────────────────────────────
Total:                       457px  (under 603px limit ✅)
```

### Active Segment Highlighting
```javascript
// When carousel rotates to new stat:
const isActive = segmentIndex === activeSegmentIndex;
const style = {
  transform: isActive ? 'scale(1.1)' : 'scale(1)',
  opacity: isActive ? '1' : '0.8',
  transition: 'all 200ms cubic-bezier(0.2, 0.8, 0.2, 1)',
};
```

---

## Acceptance Criteria Checklist

These will need to be verified during implementation:

- [ ] Clicking any segment opens correct modal (not always Sports)
- [ ] Arc menu positioned correctly around plus button
- [ ] Layout fits entirely in 603px viewport (no scroll)
- [ ] Plus button below Weight tile (no overlap)
- [ ] Progress circle has no icons, only colored segments
- [ ] Active segment highlighted when carousel rotates
- [ ] Pagination dots removed
- [ ] Settings icon navigates to Settings page
- [ ] All existing tests passing (296+)
- [ ] New tests for segment click and settings nav
- [ ] TypeScript: 0 errors
- [ ] ESLint: 0 errors

---

## Testing Devices

Must test on:
- iPhone SE (375×667)
- Pixel 3 (375×751)
- Galaxy S10e (360×760)

---

## Restore & Continue Workflow

When you're ready to implement:

```bash
# 1. Restore stashed proposal and design
git stash pop

# 2. Create detailed implementation tasks from design.md
# (Consider using /openspec:apply command)

# 3. Implement changes across the 3 main components

# 4. Run tests locally
npm run test:unit

# 5. Commit when all criteria met
git commit -m "polish(dashboard): implement phase 3 refinements - segment click detection, arc menu positioning, layout optimization, progress circle highlighting, settings navigation"

# 6. Push and create PR
git push -u origin miket/feature-redesign-mobile-dashboard-input
```

---

## Related Files

**Main Proposal**: `openspec/changes/polish-mobile-dashboard-ui/proposal.md`
- Full problem statement
- Why these issues matter
- Solution overview
- Technical details
- Testing strategy
- Risks and mitigations

**Design Document**: `openspec/changes/polish-mobile-dashboard-ui/design.md`
- Detailed breakdown of each issue
- Before/after visual comparisons
- Exact code changes needed
- Layout height analysis
- Component modification specs
- Performance considerations
- Accessibility notes

---

## Current Status

✅ Phase 1-5 Complete (296 tests passing, 93.7% coverage)
✅ Translation key fix (tracking.protein)
⏸️ Phase 3 Polish Proposed & Stashed (awaiting implementation)

---

**Good night! Come back fresh and ready to tackle these refinements.** 🚀

The proposal is thoughtfully documented and ready whenever you want to continue.
