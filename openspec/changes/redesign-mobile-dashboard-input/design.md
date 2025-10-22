# Design Document: Mobile Dashboard Carousel Redesign

**Change ID**: `redesign-mobile-dashboard-input`
**Status**: DRAFT
**Created**: 2025-10-22
**Last Updated**: 2025-10-22

---

## Table of Contents

1. [Context](#context)
2. [Goals / Non-Goals](#goals--non-goals)
3. [Technical Decisions](#technical-decisions)
4. [Component Architecture](#component-architecture)
5. [Data Model & State Management](#data-model--state-management)
6. [User Experience Flow](#user-experience-flow)
7. [Risks / Trade-offs](#risks--trade-offs)
8. [Migration Plan](#migration-plan)
9. [Open Questions](#open-questions)

---

## Context

### Background

The current mobile dashboard (375px viewport) requires vertical scrolling due to:
- 7-circle week visualization (~110px)
- Full UnifiedTrainingCard (~200px)
- 2-column tile grid that stacks vertically on small screens (~300px)
- Total content height: ~610px (exceeds 603px usable viewport)

Users on mobile devices (iPhone SE, Pixel 3, Galaxy S10e) must scroll to view all tracking metrics, violating the "One Screen Rule" documented in `CLAUDE.md`. Additionally, the Input page requires navigation away from Dashboard to log activities, creating friction in the user flow.

### Constraints

**Technical**:
- Must maintain all existing functionality
- Zero breaking changes to API/Firebase integration
- Zustand store structure unchanged
- Desktop layout (481px+) completely unchanged
- Bundle size increase limited to <50KB

**Design**:
- Mobile viewport: 375px × 667px (iPhone SE)
- Usable content area: ~603px (after safe areas + bottom nav)
- Touch targets: ≥56px (Apple HIG)
- WCAG AA accessibility compliance
- Dark mode support mandatory

**Performance**:
- Lighthouse mobile score: ≥90
- 60fps animations (no jank)
- Auto-rotation without battery drain

### Stakeholders

- **Mobile Users**: Improved UX, no scrolling, carousel engagement
- **Desktop Users**: Completely unaffected (separate code path)
- **Developers**: Clear component structure, testable architecture
- **QA Team**: Comprehensive test coverage, visual regression tests

---

## Goals / Non-Goals

### Goals

1. **Eliminate mobile scrolling**: Fit entire dashboard in 603px viewport
2. **Improve focus**: Show one stat at a time via carousel (reduce cognitive load)
3. **Enhance progress visibility**: Multi-stat progress circle shows completion at a glance
4. **Quick input access**: Arc menu provides fast logging without navigating to Input page
5. **Touch-optimized**: Swipe gestures, large tap targets, mobile-first interactions
6. **Maintain functionality**: All existing features work identically
7. **Zero desktop impact**: Desktop users see no changes whatsoever

### Non-Goals

1. **Responsive redesign**: This is mobile-only (< 481px), NOT a full responsive rewrite
2. **Desktop changes**: No modifications to 481px+ layouts
3. **State management refactor**: Zustand stores remain unchanged
4. **API changes**: Firebase integration unchanged
5. **Tablet optimization**: 481-768px range uses current desktop layout
6. **Feature additions**: No new tracking metrics, just UI reorganization

---

## Technical Decisions

### Decision 1: Carousel-Based Stat Display

**What**: Show one stat at a time (Sports, Pushup, Hydration, Nutrition, Weight) with auto-rotation and swipe gestures.

**Why**:
- Reduces visual clutter on small screens
- Focuses attention on one metric at a time
- Enables larger touch targets (full-width carousel item)
- Auto-rotation keeps dashboard engaging
- Swipe gestures feel natural on mobile

**Alternatives Considered**:
1. **Accordion collapse**: Users must tap to expand each stat (more friction)
2. **Horizontal scroll**: Less discoverable, no auto-rotation
3. **Tab navigation**: Takes vertical space, less mobile-friendly
4. **Keep 2-column grid**: Requires scrolling (doesn't solve problem)

**Trade-offs**:
- **Pro**: Fits in viewport, touch-optimized, engaging UX
- **Con**: Auto-rotation may distract some users (mitigated by pause on interaction)
- **Con**: Additional library dependency (`react-swipeable`, 8KB gzipped)

### Decision 2: Dynamic Progress Circle with Integrated Carousel

**What**: SVG circle with stat carousel **integrated inside**:
- Circle outline = progress bar with 5 color bands (one per stat)
- Circle interior displays current stat (name, icon, value, completion indicator)
- Auto-rotates every 4 seconds + swipe to manually navigate

**Why**:
- **Single focal point**: Carousel + progress combined (efficient space usage)
- **Visual context**: Carousel inside progress circle shows which stat's progress you're viewing
- **Compact**: Fits in 45% of viewport vs 300px+ tile grid
- **Engaging**: Auto-rotation + interactive swipe gestures
- **Multi-stat visibility**: Color bands show all 5 stats' progress simultaneously

**How It Works**:
- Circle outline divided into 5 segments (Sports, Pushup, Hydration, Nutrition, Weight)
- Each segment can be 0-20% filled based on stat completion
- Carousel inside shows detailed info for currently displayed stat
- Color bands animate when stats update
- Pagination dots show which stat is active (5 dots for 5 stats)

**Alternatives Considered**:
1. **Separate carousel + progress circle**: Uses more space, less cohesive
2. **Single progress bar**: Less informative (no per-stat breakdown)
3. **Pie chart**: Harder to interpret, accessibility concerns
4. **Tile grid carousel**: Back to original scrolling problem

**Trade-offs**:
- **Pro**: Compact, visually unified, efficient space usage
- **Pro**: Auto-rotation keeps engagement without separate element
- **Con**: Requires complex SVG + React state management (mitigated by clear component architecture)
- **Con**: Color bands may confuse first-time users (mitigated by tooltip + legend)

### Decision 3: Prominent Plus Button with Arc Menu

**What**: Large, visible plus button (48px+ touch target) at bottom center that reveals a half-circle menu with 5 slices (Sports, Pushup, Water, Food, Weight).

**Why**:
- Provides quick input without navigating to Input page
- Natural touch gesture (tap plus, tap slice)
- Visually engaging (arc animation)
- Reuses existing Input page modals (no code duplication)

**Alternatives Considered**:
1. **Bottom sheet**: Standard but less visually distinct
2. **FAB with expanded list**: Linear, less mobile-friendly
3. **Keep current flow (navigate to Input)**: More friction
4. **Inline quick-add buttons**: Takes permanent vertical space

**Trade-offs**:
- **Pro**: Prominent, always visible (48px+), easy to tap
- **Pro**: Space-efficient (arc menu slides up only when tapped)
- **Pro**: Visually engaging (arc animation)
- **Con**: Custom SVG arc implementation (complexity, mitigated by clear code comments)

### Decision 4: Conditional Rendering Instead of Responsive CSS

**What**: Use `if (isMobile) { <MobileLayout /> } else { <DesktopLayout /> }` instead of Tailwind responsive classes.

**Why**:
- Clear separation of mobile vs desktop code paths
- Easier to test independently
- Desktop users guaranteed zero changes (separate component tree)
- Avoids Tailwind responsive class complexity (`md:hidden`, `lg:block`, etc.)

**Alternatives Considered**:
1. **Responsive CSS classes**: More Tailwind-idiomatic but clutters markup
2. **CSS media queries**: Less type-safe, harder to unit test
3. **Single component with many conditionals**: Harder to read/maintain

**Trade-offs**:
- **Pro**: Clear intent, testable, zero desktop impact
- **Con**: Some code duplication (mitigated by shared sub-components)

### Decision 5: `react-swipeable` for Gesture Detection

**What**: Use `react-swipeable` library (8KB gzipped) for swipe left/right gestures.

**Why**:
- Mature, well-tested library
- TypeScript support
- Handles edge cases (threshold, velocity, touch vs mouse)
- Small bundle impact

**Alternatives Considered**:
1. **Hammer.js**: Larger (25KB gzipped), more features than needed
2. **Custom implementation**: More work, harder to get right
3. **No swipe gestures**: Worse UX on touch devices

**Trade-offs**:
- **Pro**: Proven, small, type-safe
- **Con**: External dependency (acceptable given size/benefit)

---

## Component Architecture

### Component Hierarchy

```
Dashboard (Mobile)
├── CompressedWeekCard
│   └── WeekDetailsModal (AppModal)
├── StatCarousel
│   ├── CarouselItem (Sports)
│   ├── CarouselItem (Pushup)
│   ├── CarouselItem (Hydration)
│   ├── CarouselItem (Nutrition)
│   ├── CarouselItem (Weight)
│   └── PaginationDots
├── DynamicProgressCircle
├── WeightChartCompact
│   └── WeightChartModal (AppModal)
└── ArcMenu
    ├── PlusButton
    ├── ArcSlice (Sports) → SportModal
    ├── ArcSlice (Pushup) → PushupModal
    ├── ArcSlice (Water) → WaterModal
    ├── ArcSlice (Food) → FoodModal
    └── ArcSlice (Weight) → WeightModal
```

### New Components

#### 1. CompressedWeekCard

**File**: `src/components/dashboard/CompressedWeekCard.tsx`

**Purpose**: Display week dates (MON 21, TUE 22, etc.) with current day highlighted, max 100px height.

**Props**:
```typescript
interface CompressedWeekCardProps {
  weekStart: Date;
  weekEnd: Date;
  currentDay: Date;
  onTapExpand: () => void;
}
```

**Layout**:
```
┌──────────────────────────────────┐
│ Week of Oct 21 – Oct 27          │
│ MON 21 │ TUE 22 │ WED 23 │ ...   │ <- Current day highlighted
│ ○      │   ●    │   ○    │       │ <- Progress dots
└──────────────────────────────────┘
```

**Interactions**:
- Tap anywhere to expand full week modal
- Minimal height (80-100px total)
- Horizontal scroll if needed (7 dates may overflow on 375px)

---

#### 2. DynamicProgressCircle (with Integrated Carousel)

**File**: `src/components/dashboard/DynamicProgressCircle.tsx`

**Purpose**: SVG circle with **integrated stat carousel inside**:
- Circle outline = progress bar with 5 color bands (one per stat)
- Circle center = carousel displaying current stat details
- Auto-rotates every 4 seconds + swipe to navigate

**Props**:
```typescript
interface DynamicProgressCircleProps {
  stats: {
    id: 'sports' | 'pushup' | 'hydration' | 'nutrition' | 'weight';
    icon: ReactNode; // Emoji or SVG icon
    label: string;
    value: string | number; // e.g., "12/14 hrs", "2/3L", "1500/2000 kcal"
    progress: number; // 0-100 (maps to 0-20% of circle)
    color: string; // For progress band
  }[];
  size?: number; // Diameter in px, default 240
  autoRotateInterval?: number; // Default: 4000ms
  onStatTap?: (stat: typeof stats[0]) => void;
}
```

**Layout** (270px × 270px circle):
```
┌────────────────────────┐
│     ╔═════════╗        │
│     ║ 🏋️      ║        │  <- Stat icon (48px)
│   ╭─║ Sports  ║─╮      │  <- Stat label
│  ╱◐◑◑◑◑◐╲ 12/14 ║       │  <- Stat value
│ │ ║  85%   ║ │      │  <- Completion percentage (center)
│  ╲╲      ╱╱       │
│    ╰─────╯        │
│  ● ○ ○ ○ ○        │  <- Pagination dots (5 stats)
└────────────────────────┘
```

**State Management** (Auto-Rotation + Swipe):
```typescript
const [activeIndex, setActiveIndex] = useState(0);
const [isPaused, setIsPaused] = useState(false);

// Auto-rotation timer
useEffect(() => {
  if (isPaused) return;
  const timer = setInterval(() => {
    setActiveIndex((prev) => (prev + 1) % stats.length);
  }, autoRotateInterval);
  return () => clearInterval(timer);
}, [isPaused, autoRotateInterval, stats.length]);

// Swipe handling (pause rotation during interaction)
const handlers = useSwipeable({
  onSwipedLeft: () => {
    setIsPaused(true);
    setActiveIndex((prev) => (prev + 1) % stats.length);
    setTimeout(() => setIsPaused(false), 10000);
  },
  onSwipedRight: () => {
    setIsPaused(true);
    setActiveIndex((prev) => (prev - 1 + stats.length) % stats.length);
    setTimeout(() => setIsPaused(false), 10000);
  },
  trackMouse: true, // For desktop testing
});
```

**SVG Structure** (Progress Circle - Top Half with Dynamic Continuous Fill):

CRITICAL CLARIFICATIONS (2025-10-22):
- **Orientation**: Circle is TOP HALF only (180° arc from 180° to 360°), centered horizontally
- **Progress Fill**: CONTINUOUS dynamic fill, NOT divided sections
  - Example: If Sports=50%, Pushup=0%, Hydration=50%, Nutrition=0%, Weight=0%,
    then the arc shows 100% filled: 50% in Green (Sports) + 50% in Cyan (Hydration)
  - Progress wraps around in order: Sports → Pushup → Hydration → Nutrition → Weight
  - Each stat can contribute 0-20% to the 180° arc (360° / 5 stats ÷ 2 for half circle)
- **Positioning**: Circle sits CENTERED above the plus button (plus button is at bottom center, 56px)
- **Carousel**: StatCarousel component is INSIDE the circle, displaying current stat details
- **Clickability**: Arc sections are interactive - clicking on a section triggers onStatSelect(stat)

```svg
<svg viewBox="0 0 240 120" width="240px" height="120px">
  {/* Background half-circle (light gray) */}
  <path d="M 20 120 A 100 100 0 0 1 220 120" fill="none" stroke="#e5e7eb" strokeWidth="12" />

  {/* Dynamic progress fill (continuous, wrapping based on total progress) */}
  {/* Calculates total progress and wraps around arc in stat order */}
  {/* Example SVG output for 50% sports + 50% hydration:
      <path d="M 20 120 A 100 100 0 0 1 120 30" fill="none" stroke="#10B981" strokeWidth="12" /> (50% sports)
      <path d="M 120 30 A 100 100 0 0 1 220 120" fill="none" stroke="#06B6D4" strokeWidth="12" /> (50% hydration)
  */}

  {/* Inner circle background (for carousel content overlay) */}
  <circle cx="120" cy="120" r="70" fill="var(--card-bg)" />

  {/* Carousel content rendered as React component overlaid on SVG */}
  {/* Positioned at cx="120" cy="75" (center of circle) */}
  {/* Displays: stat icon (48px), label, value, completion indicator */}
</svg>
```

**Color Palette** (WCAG AA compliant):
```typescript
const STAT_COLORS = {
  sports: '#10B981', // Green (sports/training)
  pushup: '#3B82F6', // Blue (pushup workouts)
  hydration: '#06B6D4', // Cyan (water intake)
  nutrition: '#F59E0B', // Amber (food/nutrition)
  weight: '#8B5CF6', // Purple (body weight)
};
```

**Carousel Animations**:
- Auto-rotate: Smooth animation to next stat (smooth rotation of pagination dot)
- Swipe response: Immediate index change + pause rotation for 10s
- Content fade: Fade in/out when displaying different stats (300ms)
- Progress circle: Animated stroke fill (500ms ease-out)

---

#### 3. WeightChartCompact

**File**: `src/components/dashboard/WeightChartCompact.tsx`

**Purpose**: Minimized weight chart with swipe-able date range (7 days default, 30 days on swipe), max 120px height.

**Props**:
```typescript
interface WeightChartCompactProps {
  data7Days: { date: Date; weight: number }[];
  data30Days: { date: Date; weight: number }[];
  onTapExpand: () => void;
}
```

**Chart Type**: Line chart (simplified from WeightTile)

**Optimizations**:
- X-axis: Show only first/last date labels
- Y-axis: 2 gridlines (min/max)
- Data points: Small circles (4px radius)
- Line: 2px stroke

**Swipe Gestures**:
- Swipe left: Switch to 30-day view
- Swipe right: Switch to 7-day view
- Swipe threshold: 125px (1/3 screen width)
- Both views maintain 120px max height
- Smooth transition animation (200ms)

---

#### 4. ArcMenu with Plus Button

**File**: `src/components/dashboard/ArcMenu.tsx`

**Purpose**: Half-circle menu with 5 slices, slides up from plus button.

**Props**:
```typescript
interface ArcMenuProps {
  onStatSelect: (stat: 'sports' | 'pushup' | 'water' | 'food' | 'weight') => void;
}
```

**SVG Structure** (180° arc, 5 slices of 36° each):
```svg
<svg viewBox="0 0 200 100" width="100%" height="150px">
  {/* Arc background */}
  <path d="M 10 100 A 90 90 0 0 1 190 100" fill="white" stroke="#e5e7eb" />

  {/* 5 slices (36° each) */}
  {SLICES.map((slice, index) => {
    const startAngle = index * 36;
    const endAngle = (index + 1) * 36;
    return (
      <path
        key={slice.id}
        d={slicePath(startAngle, endAngle)}
        fill={slice.color}
        onClick={() => onStatSelect(slice.id)}
      />
    );
  })}

  {/* Icons */}
  {SLICES.map((slice, index) => {
    const angle = (index * 36) + 18; // Center of slice
    const { x, y } = polarToCartesian(angle, 60); // Radius 60
    return (
      <g key={slice.id} transform={`translate(${x}, ${y})`}>
        {slice.icon}
      </g>
    );
  })}
</svg>
```

**Animation**:
- Slide up from bottom (transform: translateY(150px) → translateY(0))
- Duration: 300ms ease-out
- Plus button rotates 45° when menu open

---

### Modified Components

#### Dashboard.tsx

**Changes**:
```typescript
import { useIsMobile } from '@/hooks/useIsMobile';

function Dashboard() {
  const isMobile = useIsMobile(); // < 481px

  if (isMobile) {
    return <DashboardMobile />;
  }

  // Desktop layout (unchanged)
  return <DashboardDesktop />;
}

function DashboardMobile() {
  return (
    <div className="min-h-screen-mobile safe-pt pb-32">
      {/* CRITICAL: Bottom Navigation Bar is HIDDEN on mobile dashboard */}
      {/* Layout.tsx BottomNav should be conditionally hidden: */}
      {/* if (location.pathname === '/dashboard' && isMobile) { return null; } */}
      {/* This prevents navigation bar from overlaying arc menu and carousel */}

      <CompressedWeekCard />
      <StatCarousel stats={carouselStats} />
      <DynamicProgressCircle stats={progressStats} />
      <WeightChartCompact data={weightData} />
      <ArcMenu onStatSelect={handleStatSelect} />
    </div>
  );
}

function DashboardDesktop() {
  // Existing layout (completely unchanged)
  return (
    <>
      <WeeklyTile />
      <UnifiedTrainingCard />
      <TileGrid columns={2}>
        <PushupTile />
        <WaterTile />
        <NutritionTile />
        <WeightTile />
      </TileGrid>
    </>
  );
}
```

---

## Data Model & State Management

### No Zustand Changes

All state management unchanged. Components read from existing stores:
- `useStore((state) => state.tracking)` - Tracking data
- `useStore((state) => state.user)` - User profile
- `useWeekContext()` - Week navigation

### Carousel Data Transformation

```typescript
// src/hooks/useCarouselStats.ts
export function useCarouselStats(): CarouselStat[] {
  const tracking = useStore((state) => state.tracking);
  const user = useStore((state) => state.user);

  return [
    {
      id: 'sports',
      icon: <DumbbellIcon />,
      label: 'Sports',
      value: `${tracking.sports?.duration || 0} hrs`,
      progress: calculateSportsProgress(tracking.sports, user.sportsGoal),
      color: STAT_COLORS.sports,
    },
    {
      id: 'pushup',
      icon: <PushupIcon />,
      label: 'Pushups',
      value: `${tracking.pushups || 0} / ${user.maxPushups}`,
      progress: calculatePushupProgress(tracking.pushups, user.maxPushups),
      color: STAT_COLORS.pushup,
    },
    // ... hydration, nutrition, weight
  ];
}
```

### Progress Calculation

```typescript
// src/utils/progressCalculation.ts
export function calculateStatProgress(stat: CarouselStat): number {
  // Each stat contributes 0-20% to total (5 stats total = 100%)
  const maxContribution = 20;
  return Math.min((stat.progress / 100) * maxContribution, maxContribution);
}

export function calculateTotalProgress(stats: CarouselStat[]): number {
  return stats.reduce((total, stat) => total + calculateStatProgress(stat), 0);
}
```

---

## User Experience Flow

### 1. Dashboard Load (Mobile)

**Steps**:
1. User opens app on mobile device (375px viewport)
2. `useIsMobile()` detects viewport < 481px
3. `DashboardMobile` renders
4. Components load in order:
   - CompressedWeekCard (fetch week data)
   - StatCarousel (fetch tracking data, start auto-rotation)
   - DynamicProgressCircle (calculate progress from tracking)
   - WeightChartCompact (fetch last 7 days weight)
   - ArcMenu (initially hidden)

**Loading States**:
- CompressedWeekCard: Skeleton (gray bars)
- StatCarousel: Skeleton (gray card with pulse animation)
- DynamicProgressCircle: Skeleton (gray circle)
- WeightChartCompact: Skeleton (gray chart area)

**Timing**:
- Initial render: <100ms
- Data fetch (Firebase): 500-1000ms
- Full interactive: <1.5s

---

### 2. Carousel Interaction

**Auto-Rotation**:
1. Carousel starts on first stat (Sports)
2. After 4 seconds, automatically transitions to next stat (Pushup)
3. Continues cycling through all 5 stats
4. Pagination dots show current position

**Manual Navigation**:
1. User swipes left → next stat
2. User swipes right → previous stat
3. Auto-rotation pauses for 10 seconds
4. Resumes after pause period

**Tap Interaction**:
1. User taps carousel item
2. Modal opens with detailed stat view (e.g., SportsModal)
3. User views details, closes modal
4. Returns to carousel (auto-rotation resumed)

---

### 3. Arc Menu Flow

**Open**:
1. User sees prominent plus button at bottom (48px-56px size, AAA touch target)
2. User taps plus button
3. Arc menu slides up from bottom (300ms animation)
4. 5 slices appear with icons (Sports, Pushup, Water, Food, Weight)

**Select Stat**:
1. User taps a slice (e.g., Water)
2. WaterModal opens (AppModal component)
3. User logs water intake (e.g., 500ml)
4. User taps "Save"
5. Modal closes
6. Tracking data updates (Zustand store)
7. Carousel and progress circle update automatically (reactive)

**Close**:
1. User taps outside arc menu → menu slides down
2. User taps Escape → menu slides down
3. User selects stat → menu slides down after modal opens

---

### 4. Week/Weight Expansion

**Week Details**:
1. User taps CompressedWeekCard
2. WeekDetailsModal opens (AppModal size="lg")
3. Shows full WeeklyTile content (7 circles, streaks, check-in)
4. User views details, closes modal
5. Returns to dashboard

**Weight Chart**:
1. User taps WeightChartCompact (shows last 7 days, compact view)
2. Chart displays with swipe capability:
   - Swipe left → 30-day view (compact)
   - Swipe right → Back to 7-day view
3. Both views maintain max 120px height
4. Detailed modal still available by tapping (AppModal size="lg")
   - Shows full WeightTile chart, BMI, add weight
5. User views/adds data, closes modal
6. Returns to dashboard

---

## Risks / Trade-offs

### Risk 1: Carousel Auto-Rotation Distraction

**Risk**: Users may find constant auto-rotation annoying or distracting.

**Severity**: Medium

**Mitigation**:
- Pause on user interaction (swipe, tap)
- Add settings toggle to disable auto-rotation
- Use reasonable interval (4 seconds, not too fast)
- Smooth transitions (no jarring movements)

**Acceptance**: User feedback after beta testing will determine if settings toggle is needed.

---

### Risk 2: Arc Menu Discoverability

**Risk**: Users may not understand the plus button's function without hint text.

**Severity**: Low

**Mitigation**:
- Plus button is prominent (48px-56px, AAA touch target)
- Clear "+" icon with "Add Stats" label below
- Show tooltip on first visit for first-time users
- Brief onboarding animation showing arc menu slide-up

**Acceptance**: Analytics will track arc menu usage. Target: >50% of users discover in first week.

---

### Risk 3: Performance on Older Devices

**Risk**: Animations (carousel, arc menu, progress circle) may lag on iPhone 6/7, older Androids.

**Severity**: Low-Medium

**Mitigation**:
- Use CSS transforms (GPU-accelerated)
- Avoid JavaScript-based animations
- Test on real devices (iPhone 6, Android 6.0)
- Add fallback: disable animations if `prefers-reduced-motion`

**Acceptance**: Lighthouse score must remain ≥90 on mid-tier devices (iPhone 8, Pixel 3).

---

### Risk 4: Bundle Size Increase

**Risk**: New components + `react-swipeable` may exceed 50KB budget.

**Severity**: Low

**Mitigation**:
- Code splitting: lazy load arc menu (only when opened)
- Tree shaking: import only needed functions from libraries
- Gzip compression in production
- Monitor with bundle analyzer

**Acceptance**: Total bundle size must be <650KB (current: <600KB, budget: +50KB).

---

### Risk 5: Touch Scrolling Interference

**Risk**: Swipe gestures may interfere with page scrolling (if any).

**Severity**: Low

**Mitigation**:
- Use `react-swipeable` with `preventScrollOnSwipe` option
- Test on real touch devices
- Ensure carousel swipe only triggers when horizontal (not vertical)

**Acceptance**: E2E tests must verify swipe works without breaking scroll.

---

## Migration Plan

### Phase 1: Development (8.5 days)

**Week 1 (Days 1-4)**:
- Implement core carousel (2 days)
- Implement progress circle (1 day)
- Implement compressed week + weight chart (1 day)

**Week 2 (Days 5-8.5)**:
- Implement arc menu (1.5 days)
- Dashboard integration (1 day)
- Testing & validation (1.5 days)
- Polish & documentation (0.5 days)

### Phase 2: Beta Testing (3-5 days)

**Internal Testing**:
- QA team tests on real devices (iPhone SE, Pixel 3)
- Identify edge cases (network errors, missing data)
- Fix critical bugs

**Beta Users** (if applicable):
- Deploy to 10% of mobile users (feature flag)
- Collect feedback via in-app survey
- Monitor analytics (carousel engagement, arc menu usage)

### Phase 3: Rollout (1 week)

**Gradual Rollout**:
- Day 1: 10% of mobile users
- Day 3: 25% of mobile users
- Day 5: 50% of mobile users
- Day 7: 100% of mobile users

**Monitoring**:
- Sentry error tracking (carousel crashes, modal issues)
- Lighthouse CI (performance regression)
- User feedback (support tickets, reviews)

### Rollback Plan

**Trigger Conditions**:
- Critical bugs affecting >5% of users
- Lighthouse score drops below 85
- Error rate >1% (Sentry)

**Rollback Steps**:
1. Set `CAROUSEL_DASHBOARD_ENABLED=false` in feature flag
2. Deploy flag update (< 5 minutes)
3. Verify users see old layout
4. Investigate and fix issues
5. Re-enable when stable

---

## Open Questions - Answered

### 1. Carousel Auto-Rotation Speed ✅

**Question**: Is 4 seconds per stat optimal, or should it be faster/slower?

**Decision**: **4 seconds per stat** - Confirmed as optimal initial value
- Auto-rotation pauses on user interaction (swipe, tap)
- Resumes after 10 seconds of inactivity
- Allows users to read stat details comfortably without rushing

---

### 2. Arc Menu Initial Visibility ✅

**Question**: Should plus button be more prominent (50% opacity) or stay subtle (30%)?

**Decision**: **Plus button can be more prominent (48px-56px AAA touch target)**
- Increase size for better touch comfort (56px-64px if layout allows)
- Must maintain constraint: ~8% of screen height minimum
- Clear "+" icon with "Add Stats" label below
- More discoverable than barely-visible button in reference image

---

### 3. Progress Circle Tap Behavior ✅

**Question**: Should tapping progress circle open a modal with stat breakdown, or no action?

**Decision**: **Show compact tracking tile modal**
- Tapping progress circle opens modal with compact version of desktop stat tile
- Displays corresponding stat (Sports, Pushup, Hydration, Nutrition, Weight)
- Reuses existing tile component in modal format
- Includes mini progress bar and recent data
- Provides deeper stat insights without leaving dashboard context

---

### 4. Weight Chart Data Range ✅

**Question**: Should compact chart show last 7 days or last 30 days?

**Decision**: **7 days default + swipe for 30 days (both compact)**
- Default view: Last 7 days of weight data (compact, ~120px)
- Swipe left → 30 days view (compact, same height)
- Swipe right → Back to 7 days
- Both maintain max 20% screen height (~120px)
- Use same compact styling and axis labels
- Detailed modal (AppModal size="lg") still available for full chart view

---

### 5. Swipe Sensitivity Threshold ✅

**Question**: How many pixels should trigger swipe (50px, 75px, 100px)?

**Decision**: **1/3 screen width ≈ 125 pixels**
- Mobile viewport: 375px width
- Swipe threshold: 375px / 3 ≈ 125 pixels horizontal movement
- Velocity threshold: 0.3 (standard swipe)
- Applies to: Carousel navigation (left/right between stats), weight chart view toggle (7-day ↔ 30-day)
- Provides natural, comfortable swipe detection on mobile

---

## Appendix

### A. Color Palette (WCAG AA Compliant)

```typescript
const STAT_COLORS = {
  sports: {
    light: '#10B981', // Green-500
    dark: '#34D399', // Green-400
  },
  pushup: {
    light: '#3B82F6', // Blue-500
    dark: '#60A5FA', // Blue-400
  },
  hydration: {
    light: '#06B6D4', // Cyan-500
    dark: '#22D3EE', // Cyan-400
  },
  nutrition: {
    light: '#F59E0B', // Amber-500
    dark: '#FBBF24', // Amber-400
  },
  weight: {
    light: '#8B5CF6', // Purple-500
    dark: '#A78BFA', // Purple-400
  },
};
```

### B. Animation Timings

```typescript
const ANIMATIONS = {
  carousel: {
    transition: '300ms cubic-bezier(0.4, 0.0, 0.2, 1)',
    autoRotate: 4000, // 4s per stat
    pauseOnInteraction: 10000, // 10s pause
  },
  arcMenu: {
    slideUp: '300ms ease-out',
    slideDown: '200ms ease-in',
  },
  progressCircle: {
    update: '500ms cubic-bezier(0.4, 0.0, 0.2, 1)',
  },
};
```

### C. Touch Target Sizes

```typescript
const TOUCH_TARGETS = {
  carousel: {
    width: '100%', // Full viewport width
    height: '270px',
  },
  arcSlice: {
    width: '56px',
    height: '56px',
  },
  plusButton: {
    width: '60px',
    height: '60px',
  },
  weekDate: {
    width: '48px',
    height: '48px',
  },
};
```

---

**Version**: 1.0
**Last Updated**: 2025-10-22
**Status**: READY FOR REVIEW
