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
├── DashboardHeader (NEW - includes Settings icon button)
├── CompressedWeekCard
│   └── WeekDetailsModal (AppModal, size="lg")
├── StatCarouselWithProgressCircle (UNIFIED - carousel inside circle)
│   ├── DynamicProgressCircle (SVG wrapper)
│   │   └── StatCarousel (carousel content inside)
│   │       ├── CarouselItem (Sports)
│   │       ├── CarouselItem (Pushup)
│   │       ├── CarouselItem (Hydration)
│   │       ├── CarouselItem (Nutrition)
│   │       ├── CarouselItem (Weight)
│   │       └── PaginationDots (inside circle)
│   └── StatDetailsModal (on carousel tap, size="md")
├── WeightChartCompact
│   └── WeightChartModal (AppModal, size="lg")
└── ArcMenu
    ├── PlusButton (always visible, 56-60px)
    ├── ArcSlices (hidden until tap, then slide up)
    │   ├── ArcSlice (Sports) → WorkoutLogModal (from notes/)
    │   ├── ArcSlice (Pushup) → PushupLogModal (from notes/)
    │   ├── ArcSlice (Water) → DrinkLogModal (from notes/)
    │   ├── ArcSlice (Food) → FoodLogModal (from notes/)
    │   └── ArcSlice (Weight) → WeightLogModal (from notes/)
    └── Backdrop (on click/escape, close menu)
```

**Architectural Decision: Unified Component**
- `StatCarouselWithProgressCircle` is a single, unified component
- Manages carousel + circle state together (cleaner than separate)
- Circle is SVG wrapper, carousel rendered inside via positioning
- Pagination dots inside circle (minimized, see Q11)

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
    icon: ReactNode; // Emoji or SVG icon (see Icon Sources below)
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

**Icon Sources** (from OnboardingPage.tsx, uses emoji strings):
```typescript
const STAT_ICONS = {
  sports: '🏃',      // Running (OnboardingPage step 9: activitySports)
  pushup: '💪',      // Flexed biceps (OnboardingPage step 9: activityPushups)
  hydration: '💧',   // Water droplet (OnboardingPage step 9: activityWater)
  nutrition: '🥩',   // Meat/protein (OnboardingPage step 9: activityProtein)
  weight: '⚖️',      // Scale (for weight tracking)
};
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

**SVG Structure** (Progress Circle - Full Circle with Dynamic Continuous Fill):

CRITICAL CLARIFICATIONS (2025-10-22):
- **Orientation**: Full circle (360° / 5 stats = 72° per stat)
- **Progress Fill**: CONTINUOUS dynamic fill, NOT divided sections
  - Example: If Sports=50%, Pushup=0%, Hydration=50%, Nutrition=0%, Weight=0%,
    then the arc shows 100% filled: 50% in Green (Sports) + 50% in Cyan (Hydration)
  - Progress wraps around in order: Sports → Pushup → Hydration → Nutrition → Weight
  - Each stat can contribute 0-20% to the full circle (360° / 5 stats)
- **Positioning**: Full circle centered in middle of mobile screen (above the Arc Menu)
- **Carousel**: StatCarousel component is INSIDE the circle, displaying current stat details
- **Clickability**: Circle sections are interactive - clicking on a section triggers onStatSelect(stat)

```svg
<svg viewBox="0 0 240 240" width="240px" height="240px">
  {/* Background circle (light gray) */}
  <circle cx="120" cy="120" r="100" fill="none" stroke="#e5e7eb" strokeWidth="12" />

  {/* Dynamic progress fill (continuous, wrapping based on total progress) */}
  {/* Calculates total progress and wraps around full circle in stat order */}
  {/* Example SVG output for 50% sports + 50% hydration:
      <path d="M 120 20 A 100 100 0 0 1 170.7 29.3" fill="none" stroke="#10B981" strokeWidth="12" /> (50% sports = 36°)
      <path d="M 170.7 29.3 A 100 100 0 0 1 100 220" fill="none" stroke="#06B6D4" strokeWidth="12" /> (50% hydration = 36°)
  */}

  {/* Inner circle background (for carousel content overlay) */}
  <circle cx="120" cy="120" r="70" fill="var(--card-bg)" />

  {/* Carousel content rendered as React component overlaid on SVG */}
  {/* Positioned at cx="120" cy="120" (center of circle) */}
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

### Modal Reuse Patterns

The proposal integrates with existing modals from the Input page and dashboard pages. Here's how modal reuse works:

#### **1. Arc Menu → Stat Input Modals**
When user taps an Arc Menu slice (Sports, Pushup, Water, Food, Weight), one of these modals opens:
- **SportModal**: Reuses `WorkoutLogModal` from `src/components/notes/WorkoutLogModal.tsx`
- **PushupModal**: Reuses `PushupLogModal` from `src/components/notes/PushupLogModal.tsx`
- **WaterModal**: Reuses `DrinkLogModal` from `src/components/notes/DrinkLogModal.tsx`
- **FoodModal**: Reuses `FoodLogModal` from `src/components/notes/FoodLogModal.tsx`
- **WeightModal**: Reuses `WeightLogModal` from `src/components/notes/WeightLogModal.tsx`

These modals are already AppModal wrappers, just launched from a different UI entry point (ArcMenu vs Input page).

#### **2. Carousel Tap → Stat Details Modal**
When user taps the carousel to view full stat details:
- Opens a compact modal showing the detailed stat view (similar to existing tiles)
- Can use existing tile components wrapped in AppModal for reuse
- Example: `SportsModal` → Shows stat details + option to quick-add

#### **3. Week/Weight Expansion → Modals**
- **WeekDetailsModal**: Wraps `WeeklyTile` content in AppModal (size="lg")
- **WeightChartModal**: Wraps `WeightTile` content in AppModal (size="lg")

**Key Insight**: All modals use the unified `AppModal` component (which already exists), so no new modal components need to be created. We just wrap existing content or launch existing modals from new entry points.

---

### Modified Components

#### 1. DashboardPage.tsx

**Changes**:
```typescript
import { useIsMobile } from '@/hooks/useIsMobile';
import DashboardMobile from './dashboard/DashboardMobile';

function DashboardPage() {
  const isMobile = useIsMobile(); // < 481px

  if (isMobile) {
    return <DashboardMobile />;
  }

  // Desktop layout (completely unchanged from current DashboardPage)
  return <DashboardDesktop />;
}

function DashboardDesktop() {
  // Return existing DashboardPage content (unchanged)
  return (
    <div className="min-h-screen-mobile safe-pt pb-32 overflow-y-auto viewport-safe">
      <div className="mobile-container dashboard-container safe-pb px-3 pt-4 md:px-6 md:pt-8 viewport-safe">
        <div className="mx-auto max-w-[700px]">
          {/* All existing components unchanged */}
          <WeeklyTile />
          <UnifiedTrainingCard />
          {/* ... rest of existing desktop layout */}
        </div>
      </div>
    </div>
  );
}

export default DashboardPage;
```

#### 2. DashboardMobile.tsx (NEW)

**File**: `src/pages/dashboard/DashboardMobile.tsx`

```typescript
import { useTranslation } from '@/hooks/useTranslation';
import { useNavigate } from 'react-router-dom';
import DashboardHeader from '@/components/dashboard/DashboardHeader';
import CompressedWeekCard from '@/components/dashboard/CompressedWeekCard';
import StatCarouselWithProgressCircle from '@/components/dashboard/StatCarouselWithProgressCircle';
import WeightChartCompact from '@/components/dashboard/WeightChartCompact';
import ArcMenu from '@/components/dashboard/ArcMenu';

function DashboardMobile() {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const handleSettingsClick = () => {
    navigate('/settings');
  };

  return (
    <div className="min-h-screen-mobile safe-pt pb-32 overflow-y-auto viewport-safe">
      {/* CRITICAL: Bottom Navigation Bar is HIDDEN on mobile dashboard */}
      {/* Layout.tsx conditionally hides BottomNav: */}
      {/* if (location.pathname === '/dashboard' && isMobile) { return null; } */}

      <div className="mobile-container dashboard-container safe-pb px-3 pt-4 md:px-6 md:pt-8 viewport-safe">
        <div className="mx-auto max-w-[700px] space-y-4">
          {/* Header with week dates + settings button (right side) */}
          <DashboardHeader onSettingsClick={handleSettingsClick} />

          {/* Week card with dates */}
          <div className="animate-fade-in-up">
            <CompressedWeekCard />
          </div>

          {/* Unified carousel + progress circle component */}
          <div className="animate-fade-in-up delay-100">
            <StatCarouselWithProgressCircle />
          </div>

          {/* Weight chart with swipeable date range */}
          <div className="animate-fade-in-up delay-200">
            <WeightChartCompact />
          </div>
        </div>
      </div>

      {/* Arc Menu with Plus button (always visible, slides up on tap) */}
      <ArcMenu />
    </div>
  );
}

export default DashboardMobile;
```

#### 3. DashboardHeader.tsx (NEW)

**File**: `src/components/dashboard/DashboardHeader.tsx`

Purpose: Displays week information + Settings icon button (replaces bottom nav access on mobile)

```typescript
interface DashboardHeaderProps {
  onSettingsClick: () => void;
}

function DashboardHeader({ onSettingsClick }: DashboardHeaderProps) {
  // Render week dates + settings button (right side)
  // Settings button: Circular icon button, 48px, positioned top-right
  // Spacing: Ensure it doesn't overlap with WeekContext component
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
import { useWeekContext } from '../contexts/WeekContext';
import { format } from 'date-fns';

export function useCarouselStats(): CarouselStat[] {
  const tracking = useStore((state) => state.tracking);
  const user = useStore((state) => state.user);
  const { selectedDate } = useWeekContext(); // Use selected date, not hardcoded today

  const activeDate = format(parseISO(selectedDate), 'yyyy-MM-dd');
  const dayTracking = tracking[activeDate] ?? {};

  return [
    {
      id: 'sports',
      icon: '🏃',
      label: 'Sports',
      value: dayTracking.sports && countActiveSports(dayTracking.sports) > 0
        ? 'Completed'
        : 'Not Completed',
      // Sports progress: Binary (done if any sport logged)
      progress: countActiveSports(dayTracking.sports) > 0 ? 100 : 0,
      color: STAT_COLORS.sports,
    },
    {
      id: 'pushup',
      icon: '💪',
      label: 'Pushups',
      value: `${dayTracking.pushups?.total ?? 0} total`,
      // Pushup progress: Binary (done if any pushups logged)
      progress: (dayTracking.pushups?.total ?? 0) > 0 ? 100 : 0,
      color: STAT_COLORS.pushup,
    },
    {
      id: 'hydration',
      icon: '💧',
      label: 'Water',
      // Formatted display (e.g., "2.5L / 3L")
      value: `${formatMl(dayTracking.water ?? 0)} / ${formatMl(resolveWaterGoal(user))}`,
      // Hydration progress: Proportional to goal
      progress: getPercent(dayTracking.water ?? 0, resolveWaterGoal(user)),
      color: STAT_COLORS.hydration,
    },
    {
      id: 'nutrition',
      icon: '🥩',
      label: 'Calories',
      // Calories as primary metric (not protein)
      value: `${dayTracking.calories ?? 0} kcal`,
      // Nutrition progress: Proportional to TDEE goal
      progress: user?.weight && user?.activityLevel
        ? getPercent(dayTracking.calories ?? 0, calculateTDEE(user.weight, user.activityLevel, user.bodyFat))
        : 0,
      color: STAT_COLORS.nutrition,
    },
    {
      id: 'weight',
      icon: '⚖️',
      label: 'Weight',
      // Show all of above: current, goal, BMI, trend
      value: `${dayTracking.weight?.value ?? '—'} kg`,
      // Weight progress: Binary (logged if value exists)
      progress: (dayTracking.weight?.value ?? 0) > 0 ? 100 : 0,
      color: STAT_COLORS.weight,
    },
  ];
}
```

**Key Implementation Notes**:
- Carousel respects `WeekContext.selectedDate` (changes when user taps different date in CompressedWeekCard)
- Sports: "Completed" / "Not Completed" status (future: adjustable hours/goal)
- Pushups: Binary "x total" (future: adjustable goals)
- Hydration: Formatted display (e.g., "2.5L / 3L")
- Nutrition: Calories primary metric (for caloric tracking)
- Weight: All info displayed, with goal comparison and BMI
- Progress circle updates automatically when carousel advances
- Pagination dots update to show current stat position

### Progress Calculation (from existing codebase)

The proposal reuses calculations already defined in `src/utils/progress.ts` and `src/utils/calculations.ts`:

**Water Goal** (from `progress.ts:224-236`):
```typescript
// Resolves to either:
// 1. user.hydrationGoalLiters (custom) → convert to ml
// 2. OR calculateWaterGoal(user.weight) → 35ml per kg
// 3. DEFAULT: 3000ml (3L)
export function resolveWaterGoal(user?: Partial<Pick<User, 'weight' | 'hydrationGoalLiters'>> | null): number {
  // Returns ml (e.g., 3000 for 3L user)
}
```

**Protein Goal** (from `progress.ts:238-250`, confirmed in `calculations.ts:22-27`):
```typescript
// Resolves to either:
// 1. user.proteinGoalGrams (custom)
// 2. OR calculateProteinGoal(user.weight) → 2g per kg
// 3. DEFAULT: 0 if no weight
export function resolveProteinGoal(user?: Partial<Pick<User, 'weight' | 'proteinGoalGrams'>> | null): number {
  // Returns grams (e.g., 160g for 80kg user)
}
```

**Sport Progress**: Binary (done if `sportsCount > 0`), from `progress.ts:75`

**Pushup Progress**: Binary (done if `pushups.total > 0`), from `progress.ts:74`

**Progress Circle Calculation**:
```typescript
// src/utils/progressCalculation.ts (NEW - to be created)
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

## Implementation Decisions & Technical Notes

### Architectural Decisions Made

#### **1. Unified Component: StatCarouselWithProgressCircle**
- **Decision**: Single unified component (not separate Carousel + Circle)
- **Rationale**: Cleaner state management, carousel is visually inside circle
- **Structure**:
  - SVG circle as wrapper (progress bands + styling)
  - Carousel content rendered inside via CSS positioning
  - Pagination dots inside circle (minimized to ~6px each)
- **Benefits**: Shared state updates when carousel changes, simpler prop drilling

---

#### **2. Arc Menu - Visibility & Interaction**
- **Initial State**: Plus button visible (56-60px), arc slices **hidden** (not visible below)
- **On Tap**: Arc slices slide up from bottom with animation
- **On Escape/Backdrop Click**: Arc slides down and hides
- **Touch Target**: Plus button 56px (AAA compliance)
- **Animation**: 300ms ease-out slide-up, 200ms ease-in slide-down
- **Backdrop**: Semi-transparent overlay behind arc (prevents interaction with dashboard)

---

#### **3. Chart Library: Recharts**
- **Decision**: Use `recharts` (already in dependencies, ^3.2.1)
- **Rationale**:
  - Already used elsewhere in project (likely)
  - Mature, well-tested, React-native support
  - Consistent with existing codebase
- **WeightChartCompact**: Line chart with simplified axes (no animation overhead)

---

#### **4. Keyboard Navigation (Secondary Priority)**
- **Arrow Keys**:
  - ← / → navigate between carousel stats
  - Wraps around (next after weight → sports)
- **Enter / Space**: Tap current stat (open details modal)
- **Escape**: Close arc menu (if open)
- **Tab**: Focus pagination dots (optional, nice-to-have)
- **Implementation**: Attach handlers at component level, prevent default scroll

---

#### **5. prefers-reduced-motion Support**
- **Behavior**:
  - Disable auto-rotation (user must manually navigate)
  - All animations converted to instant transitions
  - Pagination dots clickable directly
- **Implementation**: Check `window.matchMedia('(prefers-reduced-motion: reduce)').matches`

---

#### **6. Code-Splitting Strategy**
- **Decision**: **Bundle together** (not code-split)
- **Rationale**:
  - Mobile components only used on mobile (<481px)
  - Bundle size increase <50KB (within budget)
  - Single import cleaner than lazy loading
- **Monitoring**: Use `npm run analyze` to verify bundle impact

---

#### **7. Feature Flag: MOBILE_CAROUSEL_DASHBOARD_ENABLED**
- **Location**: `src/lib/flags.ts` (check if this exists)
- **Purpose**: Toggle mobile carousel dashboard on/off
- **Fallback**: If flag false, render old desktop layout (temporary)
- **Rollout**: Initially true for all users, use for gradual rollout if needed

```typescript
// src/lib/flags.ts or config/features.ts
export const MOBILE_CAROUSEL_DASHBOARD_ENABLED =
  import.meta.env.VITE_MOBILE_CAROUSEL === 'true';
```

---

#### **8. Onboarding Modification: Weight Goal**
- **New Step**: Add weight goal question to onboarding flow
- **When Asked**: After current weight (consecutive step)
- **Default for Existing Users**: BMI 22 calculation
  - Formula: `weight / (1 - (1 - (weight / (height² / 703))))`
  - Simplified: Calculate LBM assuming ~15% body fat, target BMI 22
  - Example: 80kg user, 180cm tall → target ~71kg (BMI 22)
- **User Object Addition**: Add `goalWeight: number` field
- **Impact on Weight Carousel Stat**:
  - Show: "Current: 80kg | Goal: 71kg | BMI: 24.7"
  - Progress: Percentage towards goal weight

---

#### **9. Modal Size Recommendations**

| Modal | Size | Context |
|---|---|---|
| **WeekDetailsModal** | `lg` (672px) | Full week view with streaks |
| **WeightChartModal** | `lg` (672px) | Full weight chart + BMI |
| **StatDetailsModal** | `md` (512px) | Compact stat details (carousel tap) |
| **Input Modals** | Current | WorkoutLogModal, DrinkLogModal, etc. (existing) |

---

### Layout & Spacing Recommendations

#### **Mobile Dashboard Spacing** (based on "One Screen Rule")

```
Viewport: 375px width × 667px height
Usable: ~603px (after safe areas + bottom padding)

Layout structure:
┌─────────────────────────────┐
│ DashboardHeader (48px)       │ ← Settings button top-right
├─────────────────────────────┤
│ CompressedWeekCard (88px)    │ ← gap-4 = 16px
├─────────────────────────────┤
│ StatCarousel + Circle (260px)│ ← gap-4 = 16px
├─────────────────────────────┤
│ WeightChartCompact (120px)   │ ← gap-4 = 16px
└─────────────────────────────┘
Safe bottom padding: 32px (pb-32)
Total: ~32px + 88px + 16px + 260px + 16px + 120px + 16px + 32px = ~580px ✅

Recommended spacing:
- Between sections: gap-4 (16px)
- Section padding: px-3 (12px) mobile, px-6 (24px) desktop
- Internal card padding: p-4 (16px) - matches existing tiles
- Vertical spacing in cards: space-y-3 (12px) between elements
```

---

#### **DashboardHeader Settings Button Positioning**
- **Location**: Top right, inside header
- **Size**: 48px (standard touch target)
- **Icon**: Gear/settings icon (use lucide-react)
- **Spacing**:
  - Right margin: mr-3 (12px from edge)
  - Top margin: relative positioning within header
  - Ensure no overlap with week dates on left
- **Z-Index**: `z-10` (above carousel, below modals)

---

#### **Arc Menu Bottom Positioning**
- **Fixed**: `fixed bottom-[safe-area-bottom] left-1/2 -translate-x-1/2`
- **Z-Index**: `z-40` (above carousel but below modals)
- **Width**: Full width minus padding (px-3 on both sides)
- **Plus button**: Centered, 56px

---

### Future Improvements (Document for Later Implementation)

1. **Adjustable Sports Goals**
   - Currently: Binary "completed" (any activity = done)
   - Future: Allow users to set hour targets (e.g., "5 hours/week")
   - Storage: `user.sportsGoalHours` field

2. **Adjustable Activity Goals**
   - Currently: Hardcoded per-activity goals
   - Future: User-configurable in Settings
   - Examples: Pushup reps, hydration ml, protein grams

3. **Weight Goal Modification**
   - Currently: Set during onboarding only
   - Future: Editable in Settings page
   - Allow multiple goal types (BMI range, absolute weight, etc.)

4. **Training Load Integration**
   - Currently: Arc menu → Input modals
   - Future: Direct integration with training load calculation
   - Show training load progress in carousel

5. **Animations Performance**
   - Monitor on low-end devices (iPhone 6, Pixel 3)
   - May need to disable carousel auto-rotation on older devices
   - Implement device capability detection if needed

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

---

## Implementation Checklist & Phases

### Phase 1: Core Components (Days 1-4)

#### Day 1: Setup & Utilities
- [ ] Create `src/hooks/useIsMobile.ts` (matchMedia-based viewport detection)
- [ ] Create `src/hooks/useCarouselStats.ts` (data transformation from tracking store)
- [ ] Create `src/utils/progressCalculation.ts` (stat progress calculations)
- [ ] Add `react-swipeable` to dependencies (`npm install react-swipeable`)
- [ ] Create feature flag in `src/lib/flags.ts` → `MOBILE_CAROUSEL_DASHBOARD_ENABLED`

#### Day 2: Carousel & Progress Circle
- [ ] Create `src/components/dashboard/StatCarouselWithProgressCircle.tsx` (UNIFIED)
  - SVG circle with dynamic progress bands
  - Carousel inside circle
  - Auto-rotation + swipe handling
  - Pagination dots (inside circle, minimized)
  - Keyboard navigation (arrow keys, Enter, Escape)
  - prefers-reduced-motion support
- [ ] Test with mock data
- [ ] Verify Lighthouse score remains ≥90

#### Day 3: Week Card & Header
- [ ] Create `src/components/dashboard/CompressedWeekCard.tsx`
  - Week dates display
  - Tap to open WeekDetailsModal (AppModal size="lg")
  - Integration with WeekContext
- [ ] Create `src/components/dashboard/DashboardHeader.tsx`
  - Settings icon button (top-right, 48px)
  - Proper spacing with CompressedWeekCard
  - Navigation to /settings

#### Day 4: Weight Chart
- [ ] Create `src/components/dashboard/WeightChartCompact.tsx`
  - Recharts line chart (simplified)
  - 7-day default view
  - Swipe to toggle 30-day view
  - Tap to open WeightChartModal (AppModal size="lg")

### Phase 2: Arc Menu & Integration (Days 5-7)

#### Day 5: Arc Menu Component
- [ ] Create `src/components/dashboard/ArcMenu.tsx`
  - Plus button (56px, always visible)
  - Half-circle SVG with 5 slices (hidden initially)
  - Slide-up animation on tap
  - Backdrop click/Escape to close
  - Touch targets 56px+ for each slice
- [ ] Test arc geometry and positioning
- [ ] Verify plus button + arc menu fit in viewport

#### Day 6: Modal Integration
- [ ] Verify existing input modals work in mobile view:
  - [ ] WorkoutLogModal (Sports slice)
  - [ ] PushupLogModal (Pushup slice)
  - [ ] DrinkLogModal (Water slice)
  - [ ] FoodLogModal (Food slice)
  - [ ] WeightLogModal (Weight slice)
- [ ] Test modals from arc menu (not Input page)
- [ ] Suggest modifications if any don't fit mobile viewport
- [ ] Create `src/components/dashboard/StatDetailsModal.tsx` (carousel tap modal)

#### Day 7: Dashboard Integration
- [ ] Create `src/pages/dashboard/DashboardMobile.tsx`
- [ ] Modify `src/pages/DashboardPage.tsx` to use isMobile conditional
- [ ] Modify `src/components/Layout.tsx` to conditionally hide BottomNav on mobile dashboard
- [ ] Integrate all components in DashboardMobile
- [ ] Verify "One Screen Rule" (no scrolling, ~580px total height)

### Phase 3: Onboarding & Testing (Days 8-9)

#### Day 8: Onboarding Modifications
- [ ] Add weight goal question to OnboardingPage
  - Step 5.5 or 6 (after current weight)
  - Input field for target weight
  - Show BMI preview
- [ ] Calculate default weight goal for existing users (BMI 22)
  - Add migration script if needed
- [ ] Add `goalWeight: number` field to User type
- [ ] Update Firestore schema

#### Day 9: Testing & Polish
- [ ] Unit tests for useCarouselStats, useIsMobile, progress calculations
- [ ] E2E tests for carousel navigation (swipe, keyboard, auto-rotation)
- [ ] E2E tests for arc menu (tap, close, modal launch)
- [ ] Visual regression tests (Playwright) for all stat variations
- [ ] Mobile device testing (iPhone SE, Pixel 3, Galaxy S10e)
- [ ] Lighthouse CI validation (score ≥90)
- [ ] Bundle size check (`npm run analyze`) - should be <650KB total

### Phase 4: Documentation & Rollout (Days 10+)

#### Before Rollout
- [ ] Update CHANGELOG.md
- [ ] Bump version (SemVer)
- [ ] Review all accessibility (WCAG AA)
- [ ] Document future improvements in README
- [ ] Create user-facing changelog entry

#### Rollout Strategy
- [ ] Day 1: 10% of mobile users (feature flag)
- [ ] Day 3: 25% of mobile users
- [ ] Day 5: 50% of mobile users
- [ ] Day 7: 100% of mobile users
- [ ] Monitor Sentry for errors
- [ ] Monitor analytics for carousel engagement

---

## Files to Create/Modify

### New Files

```
src/
├── hooks/
│   ├── useIsMobile.ts (NEW)
│   └── useCarouselStats.ts (NEW)
├── utils/
│   └── progressCalculation.ts (NEW)
├── components/dashboard/
│   ├── DashboardHeader.tsx (NEW)
│   ├── CompressedWeekCard.tsx (NEW)
│   ├── StatCarouselWithProgressCircle.tsx (NEW - UNIFIED)
│   ├── WeightChartCompact.tsx (NEW)
│   ├── ArcMenu.tsx (NEW)
│   └── StatDetailsModal.tsx (NEW)
├── pages/dashboard/
│   └── DashboardMobile.tsx (NEW)
└── lib/
    └── flags.ts (MODIFY or CREATE)

tests/
├── unit/
│   ├── hooks/useIsMobile.test.ts (NEW)
│   └── hooks/useCarouselStats.test.ts (NEW)
└── e2e/
    └── mobile-dashboard.spec.ts (NEW)
```

### Modified Files

```
src/
├── pages/DashboardPage.tsx (MODIFY - add isMobile conditional)
├── pages/OnboardingPage.tsx (MODIFY - add weight goal step)
├── components/Layout.tsx (MODIFY - hide BottomNav on mobile dashboard)
├── types/index.ts (MODIFY - add goalWeight to User)
└── i18n/translations.ts (MODIFY - add weight goal labels)

tests/
└── e2e/mobile-devices.spec.ts (UPDATE - add carousel tests)
```

---

## Success Criteria

✅ **Functional**
- [ ] Carousel auto-rotates every 4 seconds
- [ ] Swipe left/right advances carousel (threshold 125px)
- [ ] Arc menu opens on plus button tap, closes on escape/backdrop
- [ ] Each arc slice launches correct modal
- [ ] All modals work correctly from both Input page and Arc menu
- [ ] WeekContext.selectedDate changes update carousel stats
- [ ] Keyboard navigation works (arrows, Enter, Escape)
- [ ] prefers-reduced-motion disables auto-rotation

✅ **Visual**
- [ ] One-screen rule maintained (~580px total, no scrolling)
- [ ] Progress circle renders without clipping
- [ ] Pagination dots visible inside circle
- [ ] Arc menu slides up smoothly, doesn't overlap carousel
- [ ] Settings button positioned top-right without overlap
- [ ] Dark mode looks correct
- [ ] All animations smooth (60fps on iPhone 8+)

✅ **Accessibility**
- [ ] Keyboard navigation complete (arrows, Enter, Escape)
- [ ] Touch targets 56px+ (AAA compliance)
- [ ] ARIA labels on all interactive elements
- [ ] Focus visible on all components
- [ ] prefers-reduced-motion respected
- [ ] Color contrast WCAG AA compliant

✅ **Performance**
- [ ] Lighthouse mobile score ≥90
- [ ] Bundle size <650KB (increase <50KB)
- [ ] No performance regression vs desktop
- [ ] Smooth swipe animations (no jank)
- [ ] Modals open/close quickly (<300ms)

✅ **Testing**
- [ ] Unit test coverage ≥70% for new utilities
- [ ] E2E tests for all user interactions
- [ ] Visual regression tests for stat variations
- [ ] Mobile device testing (3+ real devices)
- [ ] All existing tests still pass

---

**Version**: 2.0 (Fully Clarified Implementation)
**Last Updated**: 2025-10-22
**Status**: READY FOR IMPLEMENTATION
