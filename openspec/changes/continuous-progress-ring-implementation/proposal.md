# OpenSpec Proposal: Continuous Progress Ring & Arc Menu Refinements - Phase 4

**Status**: PROPOSED
**Type**: Mobile Dashboard UX/Data Persistence Bug Fix + Visual Redesign
**Priority**: CRITICAL
**Created**: 2025-10-23
**Target**: Fix data persistence bug in Arc menu modals + redesign progress ring for continuous progress visualization
**Scope**: Dashboard page mobile layout, progress circle visualization, modal data flow
**Base Change**: `polish-mobile-dashboard-ui` (Phase 3 complete)

---

## Problem Statement

### Issue 1: Arc Menu Modals Don't Save Data (CRITICAL BUG)
**Current Behavior**: Clicking Arc menu slices opens modals (WorkoutLogModal, DrinkLogModal, etc.), but entering data and clicking "Save" doesn't persist any data. Dashboard entries (both mobile carousel and desktop dashboard) remain unchanged. No data reaches the tracking store.

**Root Cause**: DashboardMobile passes `handleDummySave` callback that only closes modal without saving:
```typescript
const handleDummySave = async () => {
  // Modals handle their own data saving
  handleModalClose();
};

<WorkoutLogModal onSave={handleDummySave} ... />
```

The comment is misleading - modals DO NOT handle their own saving. They expect parent component to persist data via the `onSave` callback. Currently, nothing is saved.

**Impact**:
- Users cannot input data through Arc menu
- Data persistence completely broken for mobile dashboard
- Progress circle cannot display real tracking data
- Feature is non-functional

**Example**: User opens Arc menu, clicks "Sports", enters 60 min workout, clicks "Save" → Modal closes but nothing happens. Dashboard shows no new data.

### Issue 2: Arc Menu Opens from Top Instead of Bottom
**Current Behavior**: Arc menu SVG opens as top-facing half circle (180° to 0°) above the plus button. Plus button sits at bottom, arc extends upward.

**Expected Behavior**: Arc should be bottom-facing half circle that envelops the plus button, with slices opening downward around it. Button at center, slices extending downward and around.

**Root Cause**: SVG angle calculations and positioning designed for top-opening (180° left to 0° right). Need to rotate 180° for bottom-opening (0° top to 180° bottom).

**Impact**: Menu doesn't visually envelop button, user confusion about menu layout.

### Issue 3: Progress Ring Shows Discrete Segments Instead of Continuous Flow
**Current Behavior**: Progress circle displays 5 separate colored arcs (one per stat: sports, pushup, hydration, nutrition, weight). Each segment scales up when active. No connection to actual progress values.

**Expected Behavior**: Single continuous progress bar flowing clockwise from 90° (top of circle). Bar fills to reflect completion of all stats in sequence:
- Start at 90° (top)
- Flow clockwise around circle
- Each stat contributes based on its progress %
- Continuous visual flow (no gaps between stats)
- No pagination or segment separation

**Example**: If stats are:
- Sports: 100% (fully complete)
- Pushup: 50% (half done)
- Hydration: 0% (not started)
- Nutrition: 75% (mostly done)
- Weight: 100% (complete)

Progress bar should:
- Fill from 90° (top) for 72° (100% of sports) → reaches 18°
- Continue from 18° for 36° (50% of pushup) → reaches 342° (306° - 36°)
- Skip 0° (hydration not started) → jump to next stat
- Continue from 342° for 27° (75% of nutrition) → reaches 315°
- Continue from 315° for 72° (100% of weight) → reaches 243°

**Impact**:
- No visual representation of actual progress
- Users cannot see completion status at a glance
- Carousel and progress ring disconnected
- Misleading UI (active segment highlight not tied to real data)

---

## Why These Matter

1. **Data Persistence**: Feature completely non-functional without saving
2. **Arc Menu Positioning**: Visual confusingness, poor UX
3. **Continuous Progress**: Shows real progress, not just carousel state

---

## Solution Overview

### 1. Fix Modal Data Persistence

**Current flow (broken)**:
```
User clicks Arc slice
  ↓
Modal opens (WorkoutLogModal, etc.)
  ↓
User enters data + clicks Save
  ↓
onSave callback called (handleDummySave)
  ↓
Modal closes
  ↓
NO DATA SAVED ❌
```

**Fixed flow**:
```
User clicks Arc slice
  ↓
Modal opens with onSave handler that saves to store
  ↓
User enters data + clicks Save
  ↓
Modal calls onSave with data (e.g., WorkoutLogData)
  ↓
Parent component saves to tracking store via useStore
  ↓
Store updates, components re-render
  ↓
Dashboard displays new data ✅
```

**Implementation**:
- Create proper `onSave` handlers in DashboardMobile that:
  1. Accept modal data (WorkoutLogData, PushupLogData, etc.)
  2. Extract relevant fields
  3. Save to tracking store via `useStore().addTracking()` or similar
  4. Handle errors appropriately
  5. Close modal on success
- Replace `handleDummySave` with stat-specific handlers:
  - `handleWorkoutSave`: Save sports data
  - `handlePushupSave`: Save pushup data
  - `handleDrinkSave`: Save hydration data
  - `handleFoodSave`: Save nutrition data
  - `handleWeightSave`: Save weight data
- Pass correct handlers to each modal

### 2. Arc Menu Bottom-Facing Redesign

**Current**: SVG angles from 180° (left) to 0° (right), opens upward
**Target**: SVG angles from 0° (top) to 180° (bottom), opens downward

**Changes**:
- Rotate all angle calculations by 180°
- Adjust slice order to match bottom-opening layout
- Verify SVG container positioning relative to plus button
- Test on mobile viewports to ensure visual alignment

**Expected layout**:
```
        Top (90°)
           |
    Nutrition  Sports
   (left-up)  (right-up)
        [+]
   Hydration Weight
  (left-down)(right-down)
        |
   Pushups (bottom)
```

### 3. Continuous Progress Ring Redesign

**Current**: 5 separate colored arcs, one per stat
**Target**: Single continuous progress bar flowing clockwise from 90° (top)

**Key changes**:
- Remove individual stat segments from SVG
- Replace with single `<path>` element for progress arc
- Calculate total progress from all stats weighted by completion
- Draw continuous arc from 90° → 90° + (total_progress * 360°)
- Update ring in real-time when tracking data changes

**Calculation logic**:
```typescript
// For each stat:
// 1. Get current value and goal
// 2. Calculate progress % (0-100)
// 3. Allocate arc degrees: (progress / 100) * (360 / 5) = (progress / 100) * 72°
// 4. Sum all degrees
// 5. Draw continuous arc from startAngle through totalDegrees

Example:
- Sports: 100% → 72° allocated
- Pushup: 50% → 36° allocated
- Hydration: 0% → 0° allocated
- Nutrition: 75% → 54° allocated
- Weight: 100% → 72° allocated
Total: 234° of 360° available

Arc path: from 90° clockwise for 234° = 90° to (90° + 234°) = 90° to 324°
```

**Styling**:
- Single color gradient (or multi-color based on preference)
- Smooth transitions when data updates
- Remaining ring shown as light gray/faded background
- Hover/interaction on arc shows current stat contribution

---

## Technical Details

### Files to Modify

**src/pages/dashboard/DashboardMobile.tsx**:
- Replace `handleDummySave` with stat-specific handlers:
  - `handleWorkoutSave(data: WorkoutLogData)`
  - `handlePushupSave(data: PushupLogData)`
  - `handleDrinkSave(data: DrinkLogData)`
  - `handleFoodSave(data: FoodLogData)`
  - `handleWeightSave(data: WeightLogData)`
- Each handler saves to store and handles errors
- Pass correct handler to each modal

**src/components/dashboard/ArcMenu.tsx**:
- Rotate SVG angle calculations (add 180° to all angles)
- Update slice order for bottom-opening layout
- Adjust SVG container positioning if needed
- Verify icon positions relative to rotated slices

**src/components/dashboard/StatCarouselWithProgressCircle.tsx**:
- Remove discrete segment rendering (5 separate arcs)
- Replace with continuous progress arc calculation
- Accept tracking data as prop (from parent or hook)
- Calculate total progress from tracking data
- Draw single continuous arc instead of 5 segments
- Remove active segment highlighting logic (no longer relevant)
- Add smooth transitions for progress updates

**src/hooks/useCarouselStats.ts** (if exists):
- May need to refactor to return actual tracking data
- Or create new hook for continuous progress calculation

### Data Flow

**Modal Save → Store → Dashboard**:
```typescript
// DashboardMobile.tsx
const handleWorkoutSave = async (data: WorkoutLogData) => {
  try {
    const store = useStore();
    // Convert modal data to tracking format
    const trackingData = {
      sports: {
        contribution: data.durationMin,
        type: data.sport,
        intensity: data.intensity,
        note: data.note,
      }
    };
    // Save to store
    await store.addTracking(data.date, trackingData);
    // Close modal
    handleModalClose();
    // Store updates, StatCarouselWithProgressCircle re-renders with new data
  } catch (error) {
    console.error('Error saving workout:', error);
  }
};
```

### Progress Calculation

```typescript
// StatCarouselWithProgressCircle.tsx
const calculateContinuousProgress = (tracking: TrackingEntry) => {
  const stats = [
    { key: 'sports', goal: getGoal('sports') },
    { key: 'pushup', goal: getGoal('pushup') },
    { key: 'hydration', goal: getGoal('hydration') },
    { key: 'nutrition', goal: getGoal('nutrition') },
    { key: 'weight', goal: getGoal('weight') },
  ];

  let totalDegrees = 0;

  stats.forEach((stat) => {
    const value = tracking[stat.key]?.value || 0;
    const progress = Math.min(value / stat.goal, 1) * 100;
    const degreesForStat = (progress / 100) * 72; // 72° per stat (360° / 5)
    totalDegrees += degreesForStat;
  });

  return totalDegrees;
};

// Draw arc from 90° through totalDegrees
const startAngle = 90;
const endAngle = (90 + totalDegrees) % 360;
const arcPath = createArcPath(centerX, centerY, radius, startAngle, endAngle);
```

---

## Acceptance Criteria

- [ ] Arc menu modals save data to tracking store
- [ ] Dashboard reflects new data after modal save
- [ ] Desktop dashboard shows same data as mobile
- [ ] Arc menu opens as bottom-facing half circle around plus button
- [ ] Progress ring shows single continuous arc (not 5 segments)
- [ ] Progress ring fills based on actual tracking data
- [ ] Progress updates in real-time as data changes
- [ ] Progress arc flows clockwise from 90° (top)
- [ ] No pagination dots or segment markers
- [ ] Carousel rotation doesn't affect progress ring (ring shows real data, not carousel state)
- [ ] All tests pass (295+)
- [ ] TypeScript: 0 errors
- [ ] ESLint: 0 errors
- [ ] Build successful
- [ ] Visual regression tests pass

---

## Timeline

**Estimated Effort**: 2-3 hours

1. Fix data persistence: 1 hour
2. Arc menu rotation: 30 mins
3. Progress ring redesign: 1 hour
4. Testing & refinement: 30 mins

---

## Dependencies

- Base change: `polish-mobile-dashboard-ui` (Phase 3 complete)
- Tracking store hooks: `useStore`
- Modal components already exist (WorkoutLogModal, PushupLogModal, etc.)

---

## Risks & Mitigations

| Risk | Mitigation |
|------|-----------|
| Modal save handlers fail silently | Add console logging and error handling, test with breakpoints |
| Arc menu visual misalignment | Test on real devices (iPhone SE, Pixel 3, Galaxy S10e) |
| Progress calculation incorrect | Unit test with known tracking data, verify math |
| Progress ring doesn't update | Ensure component re-renders on store updates |
| Performance regression | Monitor re-render frequency, optimize if needed |

---

## Next Steps

Once approved: Create detailed design document with implementation tasks.

