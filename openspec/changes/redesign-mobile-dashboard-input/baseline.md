# Baseline Performance & Design Documentation

**Date**: 2025-10-22
**Baseline**: Current state before mobile redesign
**Purpose**: Reference point for performance and design metrics

---

## 1. Performance Baseline

### 1.1 Test Coverage & Quality

**Current Metrics**:
```
Test Files:     24 passed (24 total)
Tests:          195 passed | 2 skipped (197 total)
Duration:       12.77s
Coverage:       94.98% (all files)
  ├─ Statements: 94.98%
  ├─ Branch:     78.23%
  ├─ Functions:  94.23%
  └─ Lines:      94.98%
```

**Quality Checks**:
- ✅ TypeScript: No type errors
- ✅ ESLint: No warnings/errors
- ✅ Secret scan: No secrets detected
- ✅ All tests passing

**Top Coverage Areas**:
- DashboardPage: 100%
- Routes: 100%
- Sports utilities: 100%
- Tracking utilities: 100%
- WeeklyTile: 96.27%

**Lower Coverage Areas** (acceptable):
- Store (useStore): 82.67%
- Branch coverage (conditional logic): 78.23%

---

### 1.2 Build Performance

**Current Metrics**:
```
Build Time:     24.59s (TypeScript + Vite build)
Output:         dist/ (~1.9MB uncompressed, 441KB gzip)
Status:         ✅ Successful
```

**Build Warnings**:
- ⚠️ Firebase chunk (513.43 KB) > 200KB threshold
- ⚠️ Vendor chunk (524.86 KB) > 200KB threshold
- ⚠️ Monitoring chunk (243.71 KB) > 200KB threshold
- **Assessment**: EXPECTED (large third-party libraries)

---

### 1.3 Bundle Size Analysis

**Current Bundle Breakdown**:

| Chunk | Uncompressed | Gzip | Purpose |
|-------|-------------|------|---------|
| vendor | 524.86 KB | 159.11 KB | React, React Router, utils |
| firebase | 513.43 KB | 120.17 KB | Firebase SDK (largest) |
| index (main) | 179.02 KB | 56.75 KB | App logic |
| monitoring | 243.71 KB | 78.39 KB | Sentry + monitoring |
| DashboardPage | 48.70 KB | 14.16 KB | Dashboard lazy-loaded |
| InputPage | 68.12 KB | 15.80 KB | Input/Notes lazy-loaded |
| SettingsPage | 28.50 KB | 6.08 KB | Settings lazy-loaded |
| LeaderboardPage | 13.35 KB | 4.09 KB | Leaderboard lazy-loaded |
| utils | 31.97 KB | 8.66 KB | Shared utilities |
| CSS | 77.96 KB | 13.20 KB | Tailwind + custom styles |
| **TOTAL** | **~1.9 MB** | **~441 KB** | All combined |

**Assessment**:
- ✅ Main chunk: 56.75 KB (excellent)
- ✅ Total gzip: 441 KB (well under 600KB target)
- ⚠️ Firebase: 120.17 KB (unavoidable, third-party)
- ⚠️ Vendor: 159.11 KB (unavoidable, dependencies)

**Budget**: Can support ~50KB increase from mobile redesign

---

### 1.4 Lighthouse Baseline

**To be measured**: Run Lighthouse CI for baseline scores

Expected targets:
- Mobile: ≥90 (should maintain or improve with mobile redesign)
- Desktop: ≥90 (should remain unchanged)

---

## 2. Current Design Documentation

### 2.1 Dashboard Page Layout

**File**: `src/pages/DashboardPage.tsx`
**Current Viewport**: Desktop-first design
**Mobile Issues**: Scrolls (violates "One Screen Rule")

#### Current Layout (375px Mobile)
```
┌─────────────────────┐
│ WeeklyTile          │  110px (7 circles)
│ ○ ○ ○ ○ ○ ○ ○     │
├─────────────────────┤
│ UnifiedTrainingCard │  200px (graph + stats)
│ ┌─────────────────┐ │
│ │ Load graph:   │ │  (Trainingslast over 7 days)
│ │ Sport mgmt    │ │
│ └─────────────────┘ │
├─────────────────────┤
│ Tile Grid (2-col)   │  300px (4 tiles)
│ ┌────────┬────────┐ │
│ │Pushup  │ Water  │ │
│ ├────────┼────────┤ │
│ │Protein │Weight  │ │
│ └────────┴────────┘ │
└─────────────────────┘
```

**Components**:
1. **WeeklyTile** (`src/components/dashboard/WeeklyTile.tsx`):
   - 7 individual circles (Mon-Sun) with day labels
   - Current height: ~110px
   - Status indicators (flame 🔥, checkmark ✓)
   - Previous/Next week navigation

2. **UnifiedTrainingCard** (`src/components/UnifiedTrainingCard.tsx`):
   - Header: Badge (Low/Mid/High) + Check-in button
   - Training load graph (7 days)
   - Sport management section with icons
   - Current height: ~200px

3. **Tile Grid** (2-column layout):
   - PushupTile: Input + quick buttons
   - WaterTile: Progress bar + preset buttons
   - NutritionTile: Macro display + modals
   - WeightTile: Chart + BMI info
   - Current height: ~300px
   - Grid gap: `gap-4`
   - Padding: `px-6` (desktop)

#### Responsive Behavior (Current)
```
Mobile (< 481px):  2-column grid (crowded)
Tablet (481-768px): 2-column grid (normal)
Desktop (≥768px):  2-column grid (spacious)
```

---

### 2.2 Input Page Layout (formerly Notes)

**File**: `src/pages/InputPage.tsx`
**Current**: TabBar-based interface

#### Current Layout (375px Mobile)
```
┌──────────────────┐
│ TabBar           │  50px (3 tabs)
│ Food│Water│Notes │
├──────────────────┤
│ Food Search      │  50px (search input)
│ ┌──────────────┐ │
│ │ Banana (105) │ │  ~70px per item
│ │ Apple (52)   │ │  Scrollable list
│ │ Chicken (165)│ │  800px+ total
│ │ ... [more]   │ │
│ └──────────────┘ │
└──────────────────┘
```

**Components**:
1. **TabBar**:
   - 3 tabs: Food | Water | Notes
   - Fixed at top
   - Height: ~50px
   - Current height consumption: 7.5% of viewport

2. **Food Log Tab**:
   - Search input (food database search)
   - Food item list (searchable, scrollable)
   - Each item: ~70px (name + calories)
   - Load more pagination

3. **Smart Note Feed**:
   - Activity history (recent notes)
   - Grouped by date
   - Editable/deletable items
   - Mixed activity types

#### Responsive Behavior (Current)
```
Mobile (< 481px):  Single tab view, must scroll
Tablet (481-768px): Single tab view, less scroll
Desktop (≥768px):  TabBar with side-by-side tabs
```

---

### 2.3 Other Pages (No Changes)

**Leaderboard Page**: Desktop-only design (scrollable)
**Settings Page**: Desktop-only design (scrollable)
**Pushup Training Page**: Full-screen training mode (mostly fit, conditional scroll)
**Onboarding Page**: Stepper design (some steps may scroll)

---

## 3. Breakpoints & Responsive Strategy

### Current Breakpoints
```typescript
// Tailwind config (from project)
screens: {
  'sm': '375px',   // iPhone SE / Pixel 3
  'md': '481px',   // Tablet start (current not used)
  'lg': '768px',   // Desktop start (current not used)
  'xl': '1024px',  // Wide desktop
  '2xl': '1280px'  // Ultra-wide
}
```

### Current Responsive Pattern
**NONE** - Project uses mostly desktop layout, applies to all screen sizes.
- No `md:` or `lg:` prefixes used
- No mobile-specific components
- Mobile just scales down desktop layout

---

## 4. Known Mobile Issues & Pain Points

### Issue 1: Vertical Scrolling (Dashboard)
- **Problem**: Dashboard requires scrolling on 375px viewport
- **Root Cause**: Content ~610px exceeds usable 603px
- **Impact**: Violates "One Screen Rule"

### Issue 2: Bottom Navigation Spacing
- **Problem**: `pb-32` (128px) bottom padding wastes space
- **Actual Nav Height**: ~60px
- **Wasted Space**: ~68px
- **Impact**: 11% of viewport consumed

### Issue 3: Tile Grid Density (Mobile)
- **Problem**: 2-column grid crowded on 375px
- **Item Width**: ~175px (too narrow for readable metrics)
- **Impact**: Difficult to read, uncomfortable touch targets

### Issue 4: Training Card Height
- **Problem**: UnifiedTrainingCard takes ~200px (33% of viewport)
- **Content**: Graph + stats + sport mgmt redundant on mobile
- **Impact**: Severely limits space for other tiles

### Issue 5: WeeklyTile Circle Labels
- **Problem**: 7 circles with labels don't fit well on 375px
- **Label Width**: ~50px per circle
- **Total Width**: 350px (exceeds safe area)
- **Impact**: Text overlap, poor UX

### Issue 6: TabBar Real Estate (Input Page)
- **Problem**: TabBar takes 50px on mobile
- **Alternative**: Could use quick buttons instead
- **Impact**: 7.5% of viewport consumed

### Issue 7: No Quick Access to Common Actions
- **Problem**: Logging food/water/notes requires tab navigation
- **Current Taps**: Food: 3 taps (Tab → Search → Select)
- **Impact**: Poor discoverability of frequent actions

---

## 5. Design Tokens & Styling

### Current Mobile Spacing
```typescript
// Mobile padding (current)
px-3 (12px horizontal)  // Content padding
py-2 (8px vertical)     // Reduced vertical
py-4 (16px vertical)    // Content sections
gap-4 (16px)            // Grid gap

// Mobile safe areas
safe-pt: 20px           // Top notch
safe-pb: 16px           // Bottom gesture bar
pb-32: 128px            // Bottom nav padding
```

### Current Color Variables
```css
/* Light Mode */
--card-bg: #FFFFFF
--card-bg-hover: #FAFAFA
--shadow-card: 0 2px 8px rgba(0, 0, 0, 0.08)
--text-primary: #1F2937
--text-secondary: #6B7280

/* Dark Mode */
--card-bg: #1F2937
--card-bg-hover: #374151
--shadow-card: 0 2px 8px rgba(0, 0, 0, 0.4)
--text-primary: #F3F4F6
--text-secondary: #D1D5DB
```

### Touch Targets (Current)
```
Buttons:     py-2 to py-3 (8-12px) height    [TOO SMALL]
Tap areas:   Varies (24-44px)                [NEEDS AUDIT]
Spacing:     gap-4 (16px)                    [ACCEPTABLE]
```

---

## 6. Performance Regression Prevention

### Metrics to Monitor During Redesign
1. **Bundle Size**: Must stay <450KB gzip (was 441KB, +9KB allowed)
2. **Test Coverage**: Must stay ≥94% (was 94.98%)
3. **Build Time**: Should stay ~25s (was 24.59s)
4. **Lighthouse**: Must stay ≥90 mobile (to be measured)
5. **No Breaking Changes**: All APIs/data flows unchanged

### Quality Gates Before Merge
- [ ] TypeScript: No errors
- [ ] ESLint: No warnings
- [ ] Tests: All 195+ pass
- [ ] Coverage: ≥94%
- [ ] Build: Successful
- [ ] Lighthouse Mobile: ≥90
- [ ] Manual testing on 375px: No scrolling (Dashboard)

---

## 7. Comparison: Before vs After

### Success Metrics Post-Redesign

| Metric | Before | After | Target |
|--------|--------|-------|--------|
| Dashboard scroll | ❌ Yes | ✅ No | No scroll |
| Input quick access | ❌ Hidden tabs | ✅ Quick buttons | < 2 taps |
| Tile touch targets | ⚠️ 24-44px | ✅ 56px+ | 56px+ |
| Bottom nav spacing | ⚠️ 128px padding | ✅ Optimized | Fit viewport |
| Test coverage | 94.98% | TBD ≥94% | Maintain |
| Bundle size | 441KB | TBD <450KB | <450KB |
| Lighthouse mobile | TBD | TBD ≥90 | ≥90 |
| Desktop layout | Desktop-first | Unchanged | Unchanged |

---

## 8. Reference Files

**Core Files**:
- `src/pages/DashboardPage.tsx` - Dashboard layout
- `src/pages/InputPage.tsx` - Input/Notes layout
- `src/components/dashboard/WeeklyTile.tsx` - Week progress
- `src/components/UnifiedTrainingCard.tsx` - Training card
- `src/components/PushupTile.tsx` - Pushup tracking
- `src/components/HydrationTile.tsx` - Water tracking
- `src/components/NutritionTile.tsx` - Protein tracking
- `src/components/WeightTile.tsx` - Weight tracking

**Config Files**:
- `tailwind.config.ts` - Breakpoints
- `src/index.css` - CSS variables
- `CLAUDE.md` - Design tokens

**Test Files**:
- `src/__tests__/` - Unit tests
- `src/pages/__tests__/` - Page tests
- `vitest.config.ts` - Test configuration

---

## 9. Next Steps

After redesign completion, measure:
1. ✅ Dashboard on 375px: No scrolling
2. ✅ Input page: Quick buttons visible
3. ✅ All buttons: 56px+ height
4. ✅ Tests: All 195+ passing
5. ✅ Coverage: ≥94%
6. ✅ Bundle: <450KB gzip
7. ✅ Lighthouse: ≥90 mobile & desktop
8. ✅ Dark mode: Verified
9. ✅ Desktop: Unchanged (spot check)

---

**Generated**: 2025-10-22
**Status**: BASELINE ESTABLISHED
**Next Document**: design-current-state.md (visual reference)
