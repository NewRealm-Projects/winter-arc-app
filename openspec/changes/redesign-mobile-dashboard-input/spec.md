# Technical Specification: Mobile-Only Dashboard & Input Redesign

**Status**: SPECIFICATION
**Version**: 1.0
**Created**: 2025-10-21
**Scope**: Mobile only (< 481px)
**Desktop**: No changes

---

## Overview

Technical specification for the **mobile-only redesign** (375px viewport) of Dashboard and Input pages. This redesign eliminates scrolling and optimizes for touch interaction on small screens. Desktop (481px+) layouts remain completely unchanged.

---

## 1. DASHBOARD REDESIGN - DETAILED SPEC

### 1.1 Layout Structure

#### File: `src/pages/Dashboard.tsx`

**Current Structure**:
```jsx
<div className="dashboard-container">
  <WeeklyTile />
  <UnifiedTrainingCard />
  <TileGrid>
    <PushupTile />
    <WaterTile />
    <NutritionTile />
    <WeightTile />
  </TileGrid>
  <BottomNav />
</div>
```

**New Structure (Mobile-First)**:
```jsx
<div className="dashboard-container">
  {/* Responsive Header with status */}
  <DashboardHeader />

  {/* Primary: Weekly progress (visual engagement) */}
  <WeeklyTile isCompact={isMobile} />

  {/* Secondary: Training status (modal on mobile) */}
  {isMobile ? (
    <TrainingCardCompact onClick={openTrainingModal} />
  ) : (
    <UnifiedTrainingCard />
  )}

  {/* Main content: Tracking tiles (1-col mobile, 2-col desktop) */}
  <TileGrid columns={isMobile ? 1 : 2}>
    <PushupTile />
    <WaterTile />
    <NutritionTile />
    <WeightTile />
  </TileGrid>

  {/* Modals */}
  <TrainingCardModal open={showTrainingModal} onClose={() => setShowTrainingModal(false)} />
</div>
```

**Responsive Helper Hook**:
```typescript
// src/hooks/useResponsive.ts
export const useResponsive = () => {
  const [isMobile, setIsMobile] = useState(window.innerWidth < 481);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 481);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return { isMobile, isTablet: window.innerWidth >= 481 && window.innerWidth < 768 };
};
```

### 1.2 Component Specifications

#### DashboardHeader (NEW)

**File**: `src/components/dashboard/DashboardHeader.tsx`

**Purpose**: Show key metrics at a glance (mobile) or full header (desktop)

**Props**:
```typescript
interface DashboardHeaderProps {
  streak: number;
  weeklyAverage: number;
  todayCompletion: number;
}
```

**Layout**:
- Mobile (< 481px):
  ```
  ┌─────────────────────────┐
  │ 🔥 7-day ⭐ 85% 🎯 3/4 │
  └─────────────────────────┘
  Height: 40px
  ```

- Desktop (≥ 481px):
  ```
  ┌──────────────────────────────────────┐
  │ Today's Progress                     │
  │ 🔥 Streak: 7 days | ⭐ Avg: 85% | 🎯 3/4 │
  └──────────────────────────────────────┘
  Height: 60px
  ```

**Implementation**:
```typescript
export function DashboardHeader({ streak, weeklyAverage, todayCompletion }: DashboardHeaderProps) {
  const isMobile = useResponsive().isMobile;

  return (
    <div className={cn(
      "bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800",
      isMobile ? "px-3 py-2" : "px-6 py-3"
    )}>
      {isMobile ? (
        <div className="flex items-center justify-around text-sm">
          <div>🔥 {streak}</div>
          <div>⭐ {weeklyAverage}%</div>
          <div>🎯 {todayCompletion}/4</div>
        </div>
      ) : (
        <div className="text-sm">
          <span className="font-semibold">Today's Progress: </span>
          <span>🔥 Streak: {streak} days | ⭐ Avg: {weeklyAverage}% | 🎯 {todayCompletion}/4</span>
        </div>
      )}
    </div>
  );
}
```

#### WeeklyTile - Mobile Compact Mode

**File**: `src/components/dashboard/WeeklyTile.tsx` (modified)

**Current**: 7 circles (Mon-Sun) with labels
**New Mobile**: Arc/progress visualization

**Props Addition**:
```typescript
interface WeeklyTileProps {
  // ... existing props
  isCompact?: boolean;  // NEW: true on mobile, false on desktop
}
```

**Mobile Layout (isCompact=true)**:
```
┌────────────────────────────┐
│ Week Progress              │
├────────────────────────────┤
│                            │
│    ╱─────────────────╲     │ Arc showing 6/7 days complete
│   ╱                   ╲    │
│  │  6 / 7 Complete    │   │
│   ╲                   ╱    │
│    ╲─────────────────╱     │
│                            │
│ Mon ↭ Wed ↭ Fri ↭ Sun    │ Key days highlighted
│                            │
│ < Previous | Next >        │ Navigation
├────────────────────────────┤
```

**Desktop Layout (isCompact=false)** - unchanged:
```
Mon ◉ Tue ◉ Wed ◉ Thu ◉ Fri ◉ Sat ⭕ Sun ⭕
```

**Implementation**:
```typescript
export function WeeklyTile({ isCompact = false, ...props }: WeeklyTileProps) {
  if (isCompact) {
    return <WeeklyTileCompact {...props} />;
  }

  return <WeeklyTileExpanded {...props} />;
}

function WeeklyTileCompact({ weekData, onNavigate }: WeeklyTileProps) {
  const completedDays = weekData.filter(d => d.completed).length;
  const percentage = (completedDays / 7) * 100;

  return (
    <div className="p-3">
      <h3 className="text-sm font-semibold mb-4">Week Progress</h3>

      {/* Arc Progress Visualization */}
      <svg viewBox="0 0 200 120" className="w-full h-24 mb-4">
        {/* Arc background */}
        <path d="M 30 100 A 70 70 0 0 1 170 100" stroke="currentColor" strokeWidth="8" fill="none" opacity="0.1" />

        {/* Arc progress */}
        <path
          d="M 30 100 A 70 70 0 0 1 170 100"
          stroke="url(#arcGradient)"
          strokeWidth="8"
          fill="none"
          strokeDasharray={`${percentage * 1.96} 196`}
          className="transition-all duration-500"
        />

        {/* Center text */}
        <text x="100" y="110" textAnchor="middle" className="text-lg font-bold">
          {completedDays}/7
        </text>
      </svg>

      {/* Key days */}
      <div className="flex justify-around text-xs gap-2 mb-3">
        {['Mon', 'Wed', 'Fri', 'Sun'].map(day => (
          <div key={day} className="text-center">
            <div className="font-semibold">{day}</div>
            <div className={cn(
              "w-2 h-2 rounded-full mt-1",
              weekData[getDayIndex(day)].completed ? "bg-green-500" : "bg-gray-300"
            )} />
          </div>
        ))}
      </div>

      {/* Navigation */}
      <div className="flex justify-between items-center text-xs">
        <button onClick={() => onNavigate(-1)} className="px-2 py-1">← Previous</button>
        <span className="text-gray-500">Week of {formatDate(...)}</span>
        <button onClick={() => onNavigate(1)} className="px-2 py-1">Next →</button>
      </div>
    </div>
  );
}
```

#### TrainingCardCompact (NEW)

**File**: `src/components/dashboard/TrainingCardCompact.tsx`

**Purpose**: Minimal mobile version that opens modal when tapped

**Props**:
```typescript
interface TrainingCardCompactProps {
  badge: 'low' | 'mid' | 'high';
  streak: number;
  onClick: () => void;
}
```

**Layout**:
```
┌──────────────────────────┐
│ 🏋️ Training  [Mid] →    │ Tap to expand
└──────────────────────────┘
Height: 48px
```

**Implementation**:
```typescript
export function TrainingCardCompact({ badge, streak, onClick }: TrainingCardCompactProps) {
  const badgeColor = {
    low: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
    mid: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
    high: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
  }[badge];

  const badgeLabel = {
    low: 'Low',
    mid: 'Mid',
    high: 'High',
  }[badge];

  return (
    <button
      onClick={onClick}
      className="w-full px-4 py-2 flex items-center justify-between bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"
    >
      <div className="flex items-center gap-2">
        <span className="text-lg">🏋️</span>
        <span className="font-semibold">Training</span>
      </div>
      <div className="flex items-center gap-2">
        <span className={cn("text-xs px-2 py-1 rounded-full font-semibold", badgeColor)}>
          {badgeLabel}
        </span>
        <span>→</span>
      </div>
    </button>
  );
}
```

#### TileGrid - Responsive Columns

**File**: `src/components/dashboard/TileGrid.tsx` (modified)

**Current**: Fixed 2 columns
**New**: Responsive via columns prop

**Props Change**:
```typescript
interface TileGridProps {
  children: ReactNode;
  columns?: 1 | 2;  // NEW: responsive columns
}
```

**Implementation**:
```typescript
export function TileGrid({ children, columns = 2 }: TileGridProps) {
  const gridCols = columns === 1 ? 'grid-cols-1' : 'grid-cols-2';

  return (
    <div className={cn(
      "grid gap-3 px-3 py-4 md:gap-4 md:px-6",
      gridCols
    )}>
      {children}
    </div>
  );
}
```

**In Dashboard.tsx**:
```typescript
<TileGrid columns={isMobile ? 1 : 2}>
  <PushupTile />
  <WaterTile />
  <NutritionTile />
  <WeightTile />
</TileGrid>
```

#### TrainingCardModal (NEW)

**File**: `src/components/dashboard/TrainingCardModal.tsx`

**Purpose**: Full training card content in modal (replaces on-page card on mobile)

**Props**:
```typescript
interface TrainingCardModalProps {
  open: boolean;
  onClose: () => void;
  trainingData: TrainingWeekData;
}
```

**Uses**: `AppModal` component with size="lg"

```typescript
export function TrainingCardModal({ open, onClose, trainingData }: TrainingCardModalProps) {
  return (
    <AppModal
      open={open}
      onClose={onClose}
      title="Training Load"
      size="lg"
      footer={
        <ModalPrimaryButton onClick={onClose}>Close</ModalPrimaryButton>
      }
    >
      <div className="space-y-4">
        {/* Copy full UnifiedTrainingCard content here */}
        <TrainingLoadVisualization data={trainingData} />
        <SportManagement />
        <WeeklyStats data={trainingData} />
      </div>
    </AppModal>
  );
}
```

---

## 2. INPUT PAGE REDESIGN - DETAILED SPEC

### 2.1 Layout Structure

#### File: `src/pages/InputPage.tsx`

**Current Structure**:
```jsx
<div className="input-page">
  <TabBar activeTab={activeTab} onTabChange={setActiveTab} />

  {activeTab === 'food' && <FoodLogTab />}
  {activeTab === 'water' && <WaterLogTab />}
  {activeTab === 'notes' && <NotesTab />}
  {activeTab === 'training' && <TrainingTab />}
</div>
```

**New Structure (Mobile-First)**:
```jsx
<div className="input-page">
  <PageHeader title="Log Activity" />

  {/* Quick action buttons (mobile) */}
  {isMobile && <QuickActionButtons />}

  {/* Activity feed (all activity) */}
  <ActivityFeed />

  {/* Modals for each action */}
  <FoodLogModal open={showFoodModal} onClose={() => setShowFoodModal(false)} />
  <WaterLogModal open={showWaterModal} onClose={() => setShowWaterModal(false)} />
  <NotesModal open={showNotesModal} onClose={() => setShowNotesModal(false)} />
  <TrainingModal open={showTrainingModal} onClose={() => setShowTrainingModal(false)} />

  {/* Desktop: TabBar for wider screens */}
  {!isMobile && <TabBar activeTab={activeTab} onTabChange={setActiveTab} />}
</div>
```

### 2.2 Component Specifications

#### QuickActionButtons (NEW)

**File**: `src/components/input/QuickActionButtons.tsx`

**Purpose**: Quick access to all logging activities (mobile only)

**Layout**:
```
┌──────────────────────┐
│ 🍗 Food  │ 💧 Water │
├──────────────────────┤
│ 📝 Notes │ 🏋️ Train │
└──────────────────────┘
```

**Implementation**:
```typescript
interface QuickActionButtonsProps {
  onFoodClick: () => void;
  onWaterClick: () => void;
  onNotesClick: () => void;
  onTrainingClick: () => void;
}

export function QuickActionButtons({
  onFoodClick,
  onWaterClick,
  onNotesClick,
  onTrainingClick,
}: QuickActionButtonsProps) {
  const buttonClass = "flex-1 flex flex-col items-center gap-1 p-4 rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 font-semibold";

  return (
    <div className="grid grid-cols-2 gap-3 px-3 py-4">
      <button onClick={onFoodClick} className={buttonClass}>
        <span className="text-2xl">🍗</span>
        <span className="text-sm">Food</span>
      </button>
      <button onClick={onWaterClick} className={buttonClass}>
        <span className="text-2xl">💧</span>
        <span className="text-sm">Water</span>
      </button>
      <button onClick={onNotesClick} className={buttonClass}>
        <span className="text-2xl">📝</span>
        <span className="text-sm">Notes</span>
      </button>
      <button onClick={onTrainingClick} className={buttonClass}>
        <span className="text-2xl">🏋️</span>
        <span className="text-sm">Train</span>
      </button>
    </div>
  );
}
```

#### ActivityFeed (NEW)

**File**: `src/components/input/ActivityFeed.tsx`

**Purpose**: Show all activities (food, water, notes, training) mixed together

**Props**:
```typescript
interface ActivityFeedProps {
  activities: Activity[];
  onEdit: (activity: Activity) => void;
  onDelete: (id: string) => void;
}

type Activity =
  | FoodLogEntry
  | WaterLogEntry
  | CustomNote
  | TrainingEntry;
```

**Layout**:
```
┌─────────────────────────┐
│ Recent Activities       │
├─────────────────────────┤
│ Today                   │
│ ┌─────────────────────┐ │
│ │ 🍗 Banana          │ │
│ │ 105 kcal | 14:30   │ │
│ └─────────────────────┘ │
│ ┌─────────────────────┐ │
│ │ 💧 250ml Water     │ │
│ │ | 13:45            │ │
│ └─────────────────────┘ │
│                         │
│ Yesterday               │
│ ┌─────────────────────┐ │
│ │ 📝 Training notes   │ │
│ │ "Great workout..."  │ │
│ └─────────────────────┘ │
└─────────────────────────┘
```

**Implementation**:
```typescript
export function ActivityFeed({ activities, onEdit, onDelete }: ActivityFeedProps) {
  const grouped = groupBy(activities, activity => formatDate(activity.timestamp, 'YYYY-MM-DD'));

  return (
    <div className="space-y-4 px-3 py-4">
      {Object.entries(grouped).map(([date, dayActivities]) => (
        <div key={date}>
          <h3 className="text-xs font-semibold text-gray-500 uppercase mb-2">
            {formatRelativeDate(date)}
          </h3>

          <div className="space-y-2">
            {dayActivities.map(activity => (
              <ActivityCard
                key={activity.id}
                activity={activity}
                onEdit={onEdit}
                onDelete={onDelete}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function ActivityCard({ activity, onEdit, onDelete }: {
  activity: Activity;
  onEdit: (a: Activity) => void;
  onDelete: (id: string) => void;
}) {
  const renderContent = () => {
    if (activity.type === 'food') {
      return (
        <div className="flex items-center gap-2">
          <span>🍗</span>
          <div className="flex-1">
            <div className="font-semibold text-sm">{activity.name}</div>
            <div className="text-xs text-gray-500">{activity.calories} kcal</div>
          </div>
          <div className="text-xs text-gray-500">{formatTime(activity.timestamp)}</div>
        </div>
      );
    }
    // ... other activity types
  };

  return (
    <div
      className="p-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700"
      onClick={() => onEdit(activity)}
    >
      {renderContent()}
    </div>
  );
}
```

#### PageHeader

**File**: `src/components/input/PageHeader.tsx`

**Purpose**: Unified header for Input page

```typescript
export function PageHeader() {
  return (
    <div className="px-3 py-4 border-b border-gray-200 dark:border-gray-800">
      <h1 className="text-2xl font-bold">Log Activity</h1>
      <p className="text-sm text-gray-500">Track your daily habits</p>
    </div>
  );
}
```

---

## 3. MOBILE-ONLY IMPLEMENTATION (< 481px)

### 3.1 Conditional Rendering (No Responsive Classes)

**IMPORTANT**: This redesign uses **conditional rendering**, NOT responsive CSS classes.

```typescript
// In Dashboard.tsx / InputPage.tsx
const isMobile = typeof window !== 'undefined' && window.innerWidth < 481;

return (
  <>
    {isMobile ? (
      <MobileLayout />  {/* Compact, no-scroll version */}
    ) : (
      <CurrentLayout /> {/* Keep existing layout unchanged */}
    )}
  </>
);
```

**Why conditional rendering instead of responsive classes?**
- ✅ Cleaner separation of mobile vs desktop
- ✅ Avoid Tailwind breakpoint complexity
- ✅ Each version independently tested
- ✅ No "responsive" classes cluttering markup
- ✅ Desktop users unaffected (same current layout)

### 3.2 Mobile Breakpoint (375px)

```typescript
// Target viewport: iPhone SE, Pixel 3, Galaxy S10e
// Width: 375px (safe area: 351-365px)
// Height: 667px (usable: ~603px after notch & nav)
// Touch target: 56px minimum
// Max content height: 603px (MUST NOT SCROLL)
```

### 3.3 Touch Targets

**Mobile (375px) Requirements**:
- Minimum touch target: 44px × 44px
- Recommended: 56px × 56px
- All buttons must be at least 48px height
- Tile tap areas: full width (351px safe area), 48px+ height
- Spacing between buttons: 12px (gap-3)

### 3.4 Content Height Budget (375px viewport)

**Available Space**:
```
Total viewport: 667px
- Safe area top (notch): 20px
- Safe area bottom (gesture bar): 16px
- Bottom nav: 60px
= Usable content height: ~603px (603px = 603px max)

DASHBOARD LAYOUT:
┌────────────────────┐
│ WeeklyTile        │ ~60px
│ TrainingCompact   │ ~48px
│ TileGrid (4×1)    │ ~450px
│ Padding/gaps      │ ~45px
└────────────────────┘
= ~603px (NO SCROLL)

INPUT PAGE:
┌────────────────────┐
│ Header            │ ~40px
│ QuickButtons      │ ~100px
│ ActivityFeed      │ ~463px (SCROLLABLE - list content)
└────────────────────┘
= ~603px visible + scroll for list items (acceptable)
```

---

## 4. MOBILE-ONLY STYLING GUIDELINES

### Colors (No Changes)

Use existing theme variables (same for mobile):
```tsx
className="bg-white dark:bg-gray-800"
className="text-gray-900 dark:text-white"
className="border-gray-200 dark:border-gray-700"
```

### Spacing (Mobile Only)

Mobile-specific spacing (NO responsive classes):
```tsx
// Mobile: use tight spacing to fit 603px budget
className="px-3 py-2"  // Consistent mobile padding
className="gap-3"       // Consistent mobile gap

// NO `md:` or `lg:` prefixes
// Desktop uses different component entirely
```

### Shadows

Minimal on mobile (keep current):
```tsx
className="shadow-sm"  // 0 1px 2px
// No large shadows on compact mobile layouts
```

### Responsive Classes: NOT USED

⚠️ **DO NOT USE** Tailwind responsive prefixes in mobile components:
```tsx
// ❌ WRONG - Don't do this:
className="px-3 md:px-6 md:gap-4"

// ✅ CORRECT - Conditional rendering instead:
if (isMobile) {
  return <MobileCompact px-3 gap-3 />
} else {
  return <CurrentLayout /> // unchanged
}
```

---

## 5. STATE MANAGEMENT

**No changes to Zustand stores** - keep existing:
- `trackingStore` (pushup, water, nutrition, weight)
- `userStore` (profile)
- `leaderboardStore` (leaderboard)

**New local state** (InputPage component):
```typescript
const [showFoodModal, setShowFoodModal] = useState(false);
const [showWaterModal, setShowWaterModal] = useState(false);
const [showNotesModal, setShowNotesModal] = useState(false);
const [showTrainingModal, setShowTrainingModal] = useState(false);
const [selectedActivity, setSelectedActivity] = useState<Activity | null>(null);
```

---

## 6. API/BACKEND IMPACT

**No changes** - all data flows unchanged:
- Food logging: POST `/api/food` (same)
- Water logging: POST `/api/water` (same)
- Notes: POST `/api/notes` (same)
- Training: POST `/api/training` (same)

---

## 7. TESTING REQUIREMENTS

### Unit Tests

```typescript
// WeeklyTile.test.tsx
describe('WeeklyTile', () => {
  it('renders compact mode on mobile', () => {
    render(<WeeklyTile isCompact={true} />);
    expect(screen.getByText('Week Progress')).toBeInTheDocument();
  });

  it('renders expanded mode on desktop', () => {
    render(<WeeklyTile isCompact={false} />);
    expect(screen.getAllByRole('button').length).toBeGreaterThan(7);
  });
});
```

### E2E Tests

```typescript
// e2e/mobile-dashboard.spec.ts
test('mobile dashboard fits in viewport', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 667 });
  await page.goto('/dashboard');

  const scrollHeight = await page.evaluate(() => document.body.scrollHeight);
  expect(scrollHeight).toBeLessThanOrEqual(667 * 1.5); // Allow small scroll
});
```

---

## 8. PERFORMANCE TARGETS (Mobile Only)

- **Lighthouse Mobile**: ≥90 score (unchanged from current)
- **Bundle Size**: <650KB main chunk (no increase expected)
- **LCP**: <2.5s on mobile 4G (unchanged)
- **FID**: <100ms (unchanged)
- **CLS**: <0.1 (improved due to fixed layout)
- **Desktop Performance**: No changes (uses current layout)

---

## 9. MOBILE-ONLY ARCHITECTURE

**Key Implementation Principle**: Avoid responsive CSS - use conditional rendering instead.

```typescript
// Pattern used throughout mobile redesign:

function Dashboard() {
  const isMobile = useIsMobile();

  if (isMobile) {
    // MOBILE VERSION: Compact, no-scroll
    return (
      <>
        <WeeklyTileCompact />
        <TrainingCardCompact />
        <TileGridMobileOneColumn>
          <PushupTile />
          <HydrationTile />
          <NutritionTile />
          <WeightTile />
        </TileGridMobileOneColumn>
      </>
    );
  }

  // DESKTOP VERSION: Current layout unchanged
  return <CurrentDashboard />;
}
```

**Benefits**:
- ✅ Zero impact on desktop code
- ✅ Each version independently optimizable
- ✅ Easier to maintain and test
- ✅ No Tailwind responsive complexity
- ✅ Clear intent in code

---

**Version**: 2.0 (Mobile-Only)
**Last Updated**: 2025-10-22
**Scope**: Mobile (< 481px) only
**Desktop**: No changes
