# Design Document: Continuous Progress Ring & Arc Menu Refinements

**Change ID**: `continuous-progress-ring-implementation`
**Status**: DRAFT
**Created**: 2025-10-23
**Base Change**: `polish-mobile-dashboard-ui` (Phase 3)

---

## Overview

This change addresses 3 critical issues:

1. **Data Persistence Bug**: Arc menu modals don't save data (completely broken feature)
2. **Arc Menu Orientation**: Should be bottom-facing half circle enveloping plus button
3. **Progress Ring Redesign**: Replace discrete segments with continuous progress flow from 90° clockwise

---

## Issue 1: Arc Menu Modal Data Persistence

### Current Problem

DashboardMobile passes broken callback to modals:
```typescript
const handleDummySave = async () => {
  // Modals handle their own data saving
  handleModalClose();
};

<WorkoutLogModal
  open={openModal === 'sports'}
  onClose={handleModalClose}
  onSave={handleDummySave}  // ← Does nothing!
  currentDate={selectedDate}
/>
```

**Result**: Modals close but data never reaches store.

### Solution

Create proper save handlers that persist data:

```typescript
const handleWorkoutSave = async (data: WorkoutLogData) => {
  try {
    const store = useStore();

    // Convert modal data to tracking format
    const trackingData: TrackingEntry = {
      sports: {
        contribution: data.durationMin,
        type: data.sport,
        intensity: data.intensity,
        note: data.note,
      },
    };

    // Save to store
    await store.addTracking(data.date, trackingData);

    // Close modal - store update triggers re-render
    handleModalClose();
  } catch (error) {
    console.error('Error saving workout:', error);
    // Show error toast/alert
  }
};

const handlePushupSave = async (data: PushupLogData) => {
  try {
    const store = useStore();
    const trackingData: TrackingEntry = {
      pushups: {
        total: data.totalReps,
        session: data.sessionData,
        note: data.note,
      },
    };
    await store.addTracking(data.date, trackingData);
    handleModalClose();
  } catch (error) {
    console.error('Error saving pushups:', error);
  }
};

// Similar handlers for drink, food, weight...

// Pass correct handler to each modal:
<WorkoutLogModal
  open={openModal === 'sports'}
  onClose={handleModalClose}
  onSave={handleWorkoutSave}  // ← Now actually saves!
  currentDate={selectedDate}
/>
```

### Data Flow Diagram

```
User Input
    ↓
Modal.handleSave()
    ↓
onSave(data) callback
    ↓
Parent.handleWorkoutSave(data)
    ↓
useStore().addTracking(date, trackingData)
    ↓
Store updates (subscribes re-render)
    ↓
DashboardMobile re-renders
    ↓
StatCarouselWithProgressCircle re-renders with new tracking data
    ↓
Progress ring updates to show real data
```

### Files to Modify

**src/pages/dashboard/DashboardMobile.tsx**:
- Add `const store = useStore();` hook
- Replace `handleDummySave` with 5 handlers:
  - `handleWorkoutSave(data: WorkoutLogData)`
  - `handlePushupSave(data: PushupLogData)`
  - `handleDrinkSave(data: DrinkLogData)`
  - `handleFoodSave(data: FoodLogData)`
  - `handleWeightSave(data: WeightLogData)`
- Each handler: extract data → format for store → save → close modal → on error: log/show toast
- Pass correct handler to each modal

---

## Issue 2: Arc Menu Bottom-Facing Redesign

### Current Layout (Top-Facing)

```
      180°————0°
       /  ★  \
      /        \
   Nutrition  Sports
     (left)   (right)
      [+]
   Hydration Weight
     (left)   (right)
      \        /
       \  ★  /
      90° orientation
```

The arc opens UPWARD from the plus button. This doesn't envelop it.

### Target Layout (Bottom-Facing)

```
      0°————180°
       /  ★  \
      /        \
   Sports    Nutrition
   (right)    (left)
      [+]
   Weight    Hydration
  (right)    (left)
      \        /
       \  ★  /
     270° orientation
```

The arc opens DOWNWARD, enveloping the plus button.

### Angle Mapping

**Current (top-opening)**:
- Start: 180° (left)
- End: 0° (right)
- Sweeping across top (90° is downward)

**Target (bottom-opening)**:
- Start: 0° (top, but pointing down from 270°)
- End: 180° (bottom)
- Sweeping across bottom (270° is downward)

**Rotation needed**: Add 180° to all angles

```typescript
// Current
const startAngle = 180 - index * 36;  // 180, 144, 108, 72, 36
const endAngle = startAngle - 36;     // 144, 108, 72, 36, 0

// Target (add 180°)
const startAngle = (180 + 180 - index * 36) % 360;  // 0, 324, 288, 252, 216
const endAngle = (startAngle - 36 + 360) % 360;     // 324, 288, 252, 216, 180
```

Or simpler: flip the order and angles:
```typescript
// Bottom-opening: 0° to 180° (or -180° to 0°)
const startAngle = index * 36;        // 0, 36, 72, 108, 144
const endAngle = startAngle + 36;     // 36, 72, 108, 144, 180
```

### Slice Order

**Current (top-opening, left-to-right)**:
1. Nutrition (180°)
2. Hydration (144°)
3. Weight (108°)
4. Pushup (72°)
5. Sports (36°)

**Target (bottom-opening, should wrap around)**:
Reorder based on bottom-opening visual flow:
```
      Sports  Nutrition
        ↓       ↓
        [+]
        ↓       ↓
     Weight  Hydration
               ↓
           Pushups
```

Let's say bottom-opening with angles 0° (right) to 180° (left) clockwise:
1. Sports (0° right)
2. Pushup (90° bottom)
3. Hydration (180° left)
4. Weight (opposite)
5. Nutrition (opposite)

Actually, for visual clarity with bottom-opening, let's use:
- 0° = right
- 90° = bottom
- 180° = left
- 270° = top

Order:
1. Nutrition (top-left, ~315°)
2. Hydration (bottom-left, ~225°)
3. Pushup (bottom, ~180°)
4. Weight (bottom-right, ~135°)
5. Sports (top-right, ~45°)

This wraps around the bottom enveloping the plus button.

### Files to Modify

**src/components/dashboard/ArcMenu.tsx**:
- Update slice ordering in SLICES array for visual flow
- Update angle calculations: change from 180°-0° range to 0°-180° (or -90° to 90°)
- Adjust icon radius calculations for new angles
- Update SVG positioning if needed (may need `bottom-6` to `top-6` or similar)
- Test visual alignment on multiple device sizes

---

## Issue 3: Progress Ring Continuous Flow Redesign

### Current Design (Discrete Segments)

```
        Sports
         ████
      🔴 Red   🟢 Green
    ╱              ╲
   ╱  Pushup        ╲
  💧 Water    💪   🥩 Protein
   ╲  (⚖️)         ╱
    ╲              ╱
      🟡 Yellow  🟣 Purple
         Hydration
         Nutrition
```

5 separate colored arcs, one per stat. Active segment scales up. No connection to progress values.

### Target Design (Continuous Flow)

```
        ████████ ← Single continuous arc
        ↑
       90° START

     (flows clockwise
      around circle)
```

Single arc that:
1. Starts at 90° (top)
2. Flows clockwise
3. Represents combined progress of all stats
4. Segments within arc proportional to each stat's progress
5. No gaps between stats
6. No dots or separators

### Example Calculation

```
Stats:
- Sports: 100% complete → 72° arc (100% of 72° allocation)
- Pushup: 50% complete → 36° arc (50% of 72°)
- Hydration: 0% complete → 0° arc (0% of 72°)
- Nutrition: 75% complete → 54° arc (75% of 72°)
- Weight: 100% complete → 72° arc (100% of 72°)

Total progress: (72 + 36 + 0 + 54 + 72) / 360 = 234° of 360°

Visual:
- Start: 90° (top)
- Fill: 234° clockwise
- End: 90° + 234° = 324°

Arc path: M 120,40 A 80,80 0 0,1 150,150 (simplified)
```

### Color Scheme Options

**Option 1: Gradient by stat**
- First 72°: Sports color (green)
- Next 36°: Pushup color (blue)
- Skip 0°: Hydration (not shown if 0%)
- Next 54°: Nutrition color (orange)
- Next 72°: Weight color (purple)

**Option 2: Single gradient**
- Entire arc: single color gradient (e.g., green to blue)
- Cleaner visual
- Shows total progress at a glance

**Option 3: Blend of both**
- Arc color changes smoothly through stat colors
- Background: light gray remaining arc (360° - filled)

### Implementation

```typescript
// StatCarouselWithProgressCircle.tsx

interface ProgressSegment {
  statId: string;
  progress: number;  // 0-100
  degrees: number;   // calculated
  color: string;
}

const calculateProgressSegments = (tracking: TrackingEntry): ProgressSegment[] => {
  const goals = {
    sports: getGoal('sports'),
    pushup: getGoal('pushup'),
    hydration: getGoal('hydration'),
    nutrition: getGoal('nutrition'),
    weight: getGoal('weight'),
  };

  const allocatedDegreesPerStat = 72; // 360 / 5 stats

  return [
    {
      statId: 'sports',
      progress: Math.min((tracking.sports?.contribution || 0) / goals.sports * 100, 100),
      degrees: (Math.min((tracking.sports?.contribution || 0) / goals.sports, 1)) * allocatedDegreesPerStat,
      color: '#10B981', // green
    },
    {
      statId: 'pushup',
      progress: Math.min((tracking.pushups?.total || 0) / goals.pushup * 100, 100),
      degrees: (Math.min((tracking.pushups?.total || 0) / goals.pushup, 1)) * allocatedDegreesPerStat,
      color: '#3B82F6', // blue
    },
    // ... similar for other stats
  ];
};

const segments = calculateProgressSegments(currentTracking);
const totalDegrees = segments.reduce((sum, seg) => sum + seg.degrees, 0);

// Render arc
const startAngle = 90;
const endAngle = (90 + totalDegrees) % 360;

<path
  d={createArcPath(CENTER, CENTER, RADIUS, startAngle, endAngle)}
  stroke={gradient}  // or color blend
  strokeWidth="12"
  fill="none"
  strokeLinecap="round"
/>

// Render background (remaining arc)
const backgroundStartAngle = endAngle;
const backgroundEndAngle = 90;  // full circle back to start

<path
  d={createArcPath(CENTER, CENTER, RADIUS, backgroundStartAngle, backgroundEndAngle)}
  stroke="currentColor"
  strokeWidth="12"
  fill="none"
  opacity="0.1"
/>
```

### SVG Arc Path Calculation

For continuous arc from startAngle to endAngle:

```typescript
const createArcPath = (
  cx: number,
  cy: number,
  radius: number,
  startAngleDeg: number,
  endAngleDeg: number
): string => {
  const startRad = (startAngleDeg * Math.PI) / 180;
  const endRad = (endAngleDeg * Math.PI) / 180;

  const x1 = cx + radius * Math.cos(startRad);
  const y1 = cy + radius * Math.sin(startRad);
  const x2 = cx + radius * Math.cos(endRad);
  const y2 = cy + radius * Math.sin(endRad);

  // Determine if arc is > 180°
  const largeArcFlag = (endAngleDeg - startAngleDeg) % 360 > 180 ? 1 : 0;

  return `M ${x1} ${y1} A ${radius} ${radius} 0 ${largeArcFlag} 1 ${x2} ${y2}`;
};
```

### Carousel Independence

**Important**: Carousel rotation should NOT affect the progress ring.

Current (broken):
- Carousel rotates → currentIndex changes → active segment highlights
- Progress ring tied to carousel, not actual data

Fixed:
- Carousel rotates → currentIndex changes → carousel displays correct stat
- Progress ring always shows actual tracking data
- Two independent visualizations

```typescript
// Carousel state
const [currentIndex, setCurrentIndex] = useState(0);

// Progress ring data (from tracking store, not carousel)
const trackingData = useStore((state) => state.tracking[selectedDate]);
const segments = calculateProgressSegments(trackingData);

// Render carousel based on currentIndex
<div className="carousel">
  {stats[currentIndex].label} - {stats[currentIndex].value}
</div>

// Render progress ring based on actual tracking data
<svg>
  <path d={createArcPath(...)} stroke="..." />  // based on segments
</svg>
```

### Files to Modify

**src/components/dashboard/StatCarouselWithProgressCircle.tsx**:
- Remove old `calculateBandAngles` and icon/pagination logic
- Add `calculateProgressSegments(tracking)` function
- Add `createContinuousArcPath(startAngle, endAngle)` function
- Remove SVG rendering of 5 discrete segments
- Add SVG rendering of continuous progress arc
- Accept tracking data as prop (from parent or custom hook)
- On carousel rotate: only update displayed stat, not progress ring
- Add smooth CSS transitions for arc updates

---

## Visual Mockup

```
Before (Phase 3 - Discrete Segments):
┌─────────────────────┐
│                     │
│    ████████ Sports  │  ← Separate segments
│   ██████ Pushup     │
│  ██████ Hydration   │
│  ██████ Nutrition   │
│  ██████ Weight      │
│                     │
│   [Current: Sports] │  ← Carousel state
│   100% complete     │
│   Swipe/Arrow Keys  │
│                     │
└─────────────────────┘

After (Phase 4 - Continuous Ring):
┌─────────────────────┐
│                     │
│      ▓▓▓▓▓▓▓▓      │  ← Single continuous arc
│    ▓▓        ▓▓    │     showing real progress
│   ▓▓            ▓▓  │
│  ▓▓              ▓▓│
│  ▓░░░░░░░░░░░░░░▓ │  ░ = remaining progress
│  ▓░            ░▓ │
│   ▓░          ░▓  │
│    ▓░░░░░░░░░▓   │
│      ░░░░░░░░      │
│                     │
│   [Current: Pushup]│  ← Carousel state
│   50% complete     │   (independent from ring)
│   Swipe/Arrow Keys │
│                     │
└─────────────────────┘
```

---

## Testing Strategy

### Unit Tests
1. `calculateProgressSegments` with known tracking data
2. `createArcPath` with various angle ranges
3. Modal save handlers with store mocking
4. Progress calculation: verify degrees match expected values

### Integration Tests
1. Arc menu modal → save → store update → progress ring update
2. Carousel rotate → carousel updates, progress ring unchanged
3. Tracking data change → progress ring updates

### Manual Testing
1. Open Arc menu, click slice
2. Enter data, click Save
3. Verify data persists on mobile AND desktop dashboard
4. Verify progress ring shows real data (not carousel state)
5. Rotate carousel with arrow keys / swipe
6. Verify progress ring doesn't change (only carousel)
7. Test on multiple devices: iPhone SE, Pixel 3, Galaxy S10e
8. Test with various tracking data combinations

---

## Performance Considerations

- Progress calculation runs on every tracking data change
- SVG path generation is lightweight (single arc, not 5)
- Memoize `calculateProgressSegments` if tracking data is deep
- Consider debouncing store updates if high frequency

---

## Accessibility

- Arc menu has proper ARIA labels
- Progress ring has `aria-label` describing total progress
- Carousel still has full keyboard navigation
- Progress ring is informational (no interaction), can be aria-hidden if needed

