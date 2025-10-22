# Dashboard Delta Specification

**Change ID**: `redesign-mobile-dashboard-input`
**Capability**: `dashboard`
**Type**: ADDED, MODIFIED

---

## ADDED Requirements

### Requirement: Mobile Carousel Dashboard Layout
The system SHALL provide carousel-based mobile dashboard (< 481px) with compressed week card, stat carousel, progress circle, and arc menu.

#### Scenario: Mobile layout detection
- **WHEN** viewport width < 481px
- **THEN** system SHALL render mobile carousel layout
- **AND** system SHALL hide desktop layout components
- **WHEN** viewport width >= 481px
- **THEN** system SHALL render desktop layout (unchanged)
- **AND** system SHALL hide mobile carousel components

#### Scenario: Mobile dashboard component order
- **WHEN** rendering mobile dashboard
- **THEN** system SHALL display components in order:
  1. CompressedWeekCard (~100px height)
  2. StatCarousel (~270px height)
  3. DynamicProgressCircle (~120px height)
  4. WeightChartCompact (~120px height)
  5. ArcMenu (~30px collapsed, 150px expanded)
- **AND** total height SHALL NOT exceed 603px (viewport minus safe areas)

---

### Requirement: Compressed Week Card
The system SHALL display compressed week dates with current day highlighted, max 100px height on mobile.

#### Scenario: Week dates display
- **WHEN** viewing compressed week card
- **THEN** system SHALL display 7 dates in format "MON 21, TUE 22, WED 23..." horizontally
- **AND** system SHALL highlight current day with distinct background color
- **AND** system SHALL show progress dots below each date
- **AND** component height SHALL be <= 100px

#### Scenario: Tap to expand week details
- **WHEN** user taps compressed week card
- **THEN** system SHALL open WeekDetailsModal (AppModal size="lg")
- **AND** modal SHALL display full WeeklyTile content (7 circles, streaks, navigation)
- **AND** user SHALL be able to interact with full week view in modal

#### Scenario: Horizontal scroll for dates
- **WHEN** 7 dates overflow 375px viewport width
- **THEN** system SHALL enable horizontal scroll with `overflow-x-auto`
- **AND** system SHALL preserve current day visibility (scroll to current on load)

---

### Requirement: Stat Carousel
The system SHALL display carousel showing one stat at a time with auto-rotation and swipe gestures.

#### Scenario: Carousel stats configuration
- **WHEN** loading carousel
- **THEN** system SHALL display 5 stats in order: Sports, Pushup, Hydration, Nutrition, Weight
- **AND** each stat SHALL show icon, label, current value, and progress bar
- **AND** carousel item height SHALL be 270px

#### Scenario: Auto-rotation
- **WHEN** carousel is idle (no user interaction)
- **THEN** system SHALL auto-rotate to next stat after 4 seconds
- **AND** pagination dots SHALL update to show current stat
- **AND** rotation SHALL continue in loop (stat 5 → stat 1)

#### Scenario: Pause on user interaction
- **WHEN** user swipes carousel OR taps carousel item
- **THEN** system SHALL pause auto-rotation for 10 seconds
- **AND** system SHALL resume auto-rotation after 10 seconds

#### Scenario: Swipe gesture navigation
- **WHEN** user swipes left
- **THEN** system SHALL transition to next stat with smooth animation (300ms)
- **WHEN** user swipes right
- **THEN** system SHALL transition to previous stat with smooth animation
- **AND** swipe threshold SHALL be 50px minimum

#### Scenario: Carousel item tap
- **WHEN** user taps carousel item
- **THEN** system SHALL open corresponding modal for stat details (e.g., Sports → SportModal)
- **AND** modal SHALL display full tile content from desktop version

#### Scenario: Pagination dots
- **WHEN** viewing carousel
- **THEN** system SHALL display 5 pagination dots below carousel
- **AND** active dot SHALL be highlighted
- **AND** inactive dots SHALL be dimmed

---

### Requirement: Dynamic Progress Circle
The system SHALL display SVG circle with 5 color bands showing multi-stat completion.

#### Scenario: Progress calculation
- **WHEN** calculating progress circle
- **THEN** system SHALL allocate 20% of circle to each stat (5 stats = 100%)
- **AND** each stat SHALL contribute 0-20% based on completion (e.g., 50% hydration → 10% fill)
- **AND** total progress SHALL be sum of all stat contributions (0-100%)

#### Scenario: Color band rendering
- **WHEN** rendering progress circle
- **THEN** system SHALL display 5 color bands in order:
  1. Sports (green #10B981)
  2. Pushup (blue #3B82F6)
  3. Hydration (cyan #06B6D4)
  4. Nutrition (amber #F59E0B)
  5. Weight (purple #8B5CF6)
- **AND** each band SHALL fill proportionally to stat completion
- **AND** unfilled portion SHALL be gray (#E5E7EB light, #374151 dark)

#### Scenario: Center percentage display
- **WHEN** viewing progress circle
- **THEN** system SHALL display total completion percentage in center (e.g., "68%")
- **AND** text SHALL be 24px font size, bold, theme-aware color

#### Scenario: Progress circle animation
- **WHEN** stat data updates
- **THEN** system SHALL animate progress band changes with 500ms transition
- **AND** animation SHALL use cubic-bezier easing

#### Scenario: Accessibility labels
- **WHEN** progress circle renders
- **THEN** system SHALL include ARIA label describing total progress (e.g., "Overall progress: 68%")
- **AND** system SHALL provide alt text for screen readers listing each stat completion

---

### Requirement: Weight Chart Compact
The system SHALL display minimized weight chart showing last 7 days, max 120px height on mobile.

#### Scenario: Compact chart rendering
- **WHEN** viewing weight chart compact
- **THEN** system SHALL display line chart with last 7 days of weight data
- **AND** chart height SHALL be 120px maximum
- **AND** system SHALL show X-axis labels for first and last date only
- **AND** system SHALL show 2 Y-axis gridlines (min/max)

#### Scenario: Tap to expand full chart
- **WHEN** user taps weight chart compact
- **THEN** system SHALL open WeightChartModal (AppModal size="lg")
- **AND** modal SHALL display full WeightTile content (30-day view, BMI, add weight)
- **AND** user SHALL be able to add/edit weight data in modal

#### Scenario: No data state
- **WHEN** no weight data exists
- **THEN** system SHALL display "Add weight" message with plus icon
- **AND** tapping SHALL open weight modal for first entry

---

### Requirement: Arc Menu for Quick Input
The system SHALL display half-circle arc menu with 5 stat slices for quick logging.

#### Scenario: Arc menu structure
- **WHEN** rendering arc menu
- **THEN** system SHALL create SVG half-circle arc (180°)
- **AND** arc SHALL be divided into 5 equal slices (36° each)
- **AND** slices SHALL correspond to: Sports, Pushup, Water, Food, Weight
- **AND** each slice SHALL display icon centered in slice area

#### Scenario: Plus button visibility
- **WHEN** arc menu is closed
- **THEN** system SHALL display plus button at 30% opacity
- **AND** button size SHALL be 60px diameter
- **WHEN** user hovers over plus button
- **THEN** opacity SHALL increase to 100%

#### Scenario: Arc menu open
- **WHEN** user taps plus button
- **THEN** system SHALL animate arc menu slide-up from bottom (300ms ease-out)
- **AND** plus button SHALL rotate 45° to form X icon
- **AND** arc height SHALL be 150px

#### Scenario: Arc menu close
- **WHEN** user taps outside arc menu OR presses Escape
- **THEN** system SHALL animate arc menu slide-down (200ms ease-in)
- **AND** plus button SHALL rotate back to 0°

#### Scenario: Stat slice selection
- **WHEN** user taps arc slice (e.g., Water)
- **THEN** system SHALL close arc menu
- **AND** system SHALL open corresponding modal (WaterModal from Input page)
- **AND** user SHALL be able to log activity in modal
- **AND** modal data SHALL save to Zustand store upon completion

#### Scenario: Touch target size
- **WHEN** rendering arc slices
- **THEN** each slice touch area SHALL be minimum 56px × 56px
- **AND** slices SHALL have hover/active states for visual feedback

#### Scenario: Keyboard accessibility
- **WHEN** arc menu is open
- **THEN** user SHALL be able to Tab through slices
- **AND** pressing Enter on focused slice SHALL open modal
- **AND** pressing Escape SHALL close arc menu

---

## MODIFIED Requirements

### Requirement: Mobile Dashboard Layout
The system SHALL provide mobile-optimized dashboard layout (< 481px) using carousel instead of tile grid.

**Previous**: Dashboard used 2-column tile grid on mobile, causing vertical scrolling.

**Modified**: Dashboard uses carousel-based layout with compressed components, fitting in 603px viewport.

#### Scenario: Desktop layout preservation
- **WHEN** viewport width >= 481px
- **THEN** system SHALL render desktop layout exactly as before (unchanged)
- **AND** desktop SHALL use existing components: WeeklyTile, UnifiedTrainingCard, 2-column TileGrid
- **AND** desktop behavior SHALL be identical to previous version

#### Scenario: Responsive breakpoint switching
- **WHEN** user resizes window from desktop to mobile
- **THEN** system SHALL switch from desktop to mobile layout at 481px threshold
- **AND** transition SHALL preserve selected date state
- **WHEN** user resizes from mobile to desktop
- **THEN** system SHALL switch to desktop layout without data loss

---

### Requirement: Week Navigation
The system SHALL support week navigation in both mobile compressed card and desktop weekly tile.

**Previous**: Week navigation only in desktop WeeklyTile.

**Modified**: Week navigation available in mobile CompressedWeekCard via modal expansion.

#### Scenario: Mobile week navigation
- **WHEN** user opens WeekDetailsModal from compressed card
- **THEN** modal SHALL display full week navigation (previous/next buttons)
- **AND** week offset changes SHALL update both modal and compressed card
- **AND** closing modal SHALL preserve week offset state

---

## Implementation Notes

### New Components Created
- `src/components/dashboard/CompressedWeekCard.tsx` - Mobile week dates
- `src/components/dashboard/StatCarousel.tsx` - Carousel container
- `src/components/dashboard/CarouselItem.tsx` - Individual stat cards
- `src/components/dashboard/DynamicProgressCircle.tsx` - Multi-stat progress SVG
- `src/components/dashboard/WeightChartCompact.tsx` - Minimized weight chart
- `src/components/dashboard/ArcMenu.tsx` - Half-circle quick input menu
- `src/components/dashboard/WeekDetailsModal.tsx` - Full week view modal
- `src/components/dashboard/WeightChartModal.tsx` - Full weight chart modal

### Modified Components
- `src/pages/Dashboard.tsx` - Added conditional rendering for mobile vs desktop
- `src/hooks/useIsMobile.ts` - Existing hook for viewport detection

### Data Sources (Unchanged)
- `tracking/{userId}/entries/{dateKey}` - Daily tracking entries
- `trainingLoad` state - 7-day training load map
- `checkIns` state - Daily check-in data
- `smartContributions` - Smart Notes AI contributions

### Dependencies Added
- `react-swipeable` (8KB gzipped) - Swipe gesture detection

### Design Tokens
```typescript
const CAROUSEL_CONFIG = {
  autoRotateInterval: 4000, // 4 seconds per stat
  pauseOnInteraction: 10000, // 10 seconds pause
  transitionDuration: 300, // 300ms animations
  swipeThreshold: 50, // 50px minimum swipe
};

const STAT_COLORS = {
  sports: '#10B981', // Green
  pushup: '#3B82F6', // Blue
  hydration: '#06B6D4', // Cyan
  nutrition: '#F59E0B', // Amber
  weight: '#8B5CF6', // Purple
};

const COMPONENT_HEIGHTS = {
  compressedWeek: 100, // Max 100px
  carousel: 270, // 270px
  progressCircle: 120, // 120px
  weightChart: 120, // 120px
  arcMenuCollapsed: 30, // 30px
  arcMenuExpanded: 150, // 150px
};
```

### Performance Requirements
- Carousel auto-rotation SHALL NOT cause battery drain (efficient timers)
- Swipe gesture detection SHALL NOT interfere with vertical scrolling
- SVG animations SHALL maintain 60fps on mid-tier devices (iPhone 8, Pixel 3)
- Bundle size increase SHALL be < 50KB (current ~600KB → max 650KB)

### Accessibility Requirements
- All carousel items SHALL have ARIA labels
- Arc menu SHALL support keyboard navigation (Tab, Enter, Escape)
- Progress circle SHALL provide screen reader descriptions
- Touch targets SHALL be minimum 56px (WCAG AAA)
- Color contrast SHALL meet WCAG AA (4.5:1)

### Testing Requirements
- Unit tests for carousel auto-rotation logic
- Unit tests for progress circle calculations
- E2E tests for swipe gestures
- E2E tests for arc menu interaction
- Visual regression tests for mobile layout (375px)
- Manual testing on real devices (iPhone SE, Pixel 3)

---

**Change ID**: `redesign-mobile-dashboard-input`
**Last Updated**: 2025-10-22
**Status**: PENDING APPROVAL
