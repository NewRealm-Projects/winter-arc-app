# Design: Food & Macro Tracking

## Context

The Winter Arc app currently has:
- **Smart Notes** (`NotesPage.tsx`) - AI-powered note system with automatic activity detection
- **Tracking Sync** (`trackingSync.ts`) - Combines notes events with manual tracking
- **Food Event** - Basic support for `calories` and `proteinG`, but no carbs/fat
- **Dashboard Integration** - Protein from food notes already syncs to Dashboard via `useCombinedTracking()`

This design extends food tracking to include complete macro tracking (Protein, Carbs, Fat, Calories).

## Goals

1. **Complete Macro Tracking** - Track all macronutrients (P/C/F) in food notes
2. **Visual Feedback** - Show macro breakdown in Notes UI
3. **Dashboard Integration** - Leverage existing protein sync, document it properly
4. **Minimal Disruption** - Additive changes only, no breaking changes
5. **Future-Proof** - Prepare for potential Calories Tile on Dashboard

## Non-Goals

- Food database/API integration (out of scope)
- Barcode scanning
- AI parsing of macro ratios from text (future enhancement)
- Meal planning features

## Design Decisions

### Decision 1: Extend FoodEvent Interface

**Choice:** Add optional `carbsG` and `fatG` fields to `FoodEvent`

**Rationale:**
- Backward compatible (optional fields)
- Consistent with existing `proteinG` field
- Simple to implement and test
- No migration required

**Alternatives Considered:**
- New `MacroEvent` type → Rejected: Adds complexity, breaks existing food events
- Nested `macros` object → Rejected: Inconsistent with existing flat structure

```typescript
// Before
interface FoodEvent {
  kind: 'food';
  id: string;
  confidence: number;
  label: string;
  calories?: number;
  proteinG?: number;
}

// After
interface FoodEvent {
  kind: 'food';
  id: string;
  confidence: number;
  label: string;
  calories?: number;
  proteinG?: number;
  carbsG?: number;  // NEW
  fatG?: number;    // NEW
}
```

### Decision 2: Tracking Sync Strategy

**Choice:** Extend existing `trackingSync.ts` to aggregate carbs/fat

**Rationale:**
- Leverages existing sync infrastructure
- Protein sync already works (`case 'food'` in `buildContributionFromEvent`)
- Consistent with how other nutrients are handled
- Central place for all tracking logic

**Implementation:**
```typescript
// trackingSync.ts - buildContributionFromEvent()
case 'food':
  if (typeof event.proteinG === 'number') {
    contribution.protein = (contribution.protein ?? 0) + event.proteinG;
  }
  // NEW: Add carbs and fat
  if (typeof event.carbsG === 'number') {
    contribution.carbsG = (contribution.carbsG ?? 0) + event.carbsG;
  }
  if (typeof event.fatG === 'number') {
    contribution.fatG = (contribution.fatG ?? 0) + event.fatG;
  }
  if (typeof event.calories === 'number') {
    contribution.calories = (contribution.calories ?? 0) + event.calories;
  }
  break;
```

**Alternatives Considered:**
- Separate macro sync service → Rejected: Adds unnecessary complexity
- Real-time sync per note → Rejected: Current batch sync is efficient

### Decision 3: UI Presentation

**Choice:** Inline macro badges in `EventBadges` component

**Rationale:**
- Consistent with existing event display pattern
- Compact and readable
- Easy to scan multiple food entries
- Mobile-friendly

**Format:**
```tsx
// Compact format
🍽️ Chicken · 300 kcal · 30g P · 5g C · 10g F

// With missing fields
🍽️ Salad · 150 kcal · 5g P
```

**Alternatives Considered:**
- Separate macro summary card → Rejected: Too much space on mobile
- Pie chart per food → Rejected: Visual clutter
- Expandable details → Future enhancement (keep it simple first)

### Decision 4: Dashboard Integration - Unified Nutrition Tile

**Choice:** Replace ProteinTile with comprehensive NutritionTile (all macros)

**Rationale:**
- **Mobile-first**: One large tile is more space-efficient than 4 separate tiles
- **Holistic view**: Users see complete nutrition at a glance (Cal/P/C/F)
- **Smart defaults**: Auto-calculate calorie goal from body composition
- **Existing sync works**: Protein from food notes already syncs perfectly
- **Better UX**: Macro ratios visible in one place (e.g., 30% protein, 40% carbs, 30% fat)

**Approach:**
1. **Replace `ProteinTile.tsx`** with `NutritionTile.tsx`
2. Extend `SmartTrackingContribution` to include `calories`, `carbsG`, `fatG`
3. Aggregate all macros from food notes in `trackingSync.ts`
4. Add `src/utils/nutrition.ts` for calorie goal calculation

**NutritionTile Design:**
```tsx
// NutritionTile.tsx - Comprehensive macro tracking
┌─────────────────────────────────────┐
│ 🍽️ Ernährung              1850/2200 │ ← Header + Daily total/goal
├─────────────────────────────────────┤
│ ████████████░░░░░░░░░░░░░░ 84%     │ ← Calorie progress bar
│                                      │
│ Kalorien: 1850 / 2200 kcal         │ ← Macro breakdown
│ Protein:   140 / 160 g   (88%)     │
│ Kohlenhydr: 180 / 220 g   (82%)    │
│ Fett:       60 / 73 g    (82%)     │
│                                      │
│ 💡 Ziel basiert auf Gewicht & KFA   │ ← Smart goal hint
│ 🔗 Enthält Essen aus Notizen        │ ← Sync hint (if applicable)
│                                      │
│ [+ Schnell hinzufügen] [✏️ Bearbeiten]│ ← Action buttons
└─────────────────────────────────────┘
```

**Calorie Goal Calculation (Smart Defaults with Activity Level):**
```typescript
// src/utils/nutrition.ts
export type ActivityLevel = 'sedentary' | 'light' | 'moderate' | 'active' | 'very_active';

const ACTIVITY_MULTIPLIERS: Record<ActivityLevel, number> = {
  sedentary: 30,    // Wenig Bewegung, Bürojob
  light: 35,        // 1-2x Sport/Woche
  moderate: 40,     // 3-4x Sport/Woche (Default)
  active: 45,       // 5-6x Sport/Woche
  very_active: 50,  // Täglich Sport, körperlich anstrengender Job
};

function calculateTDEE(
  weight: number,
  activityLevel: ActivityLevel = 'moderate',
  bodyFat?: number
): number {
  const multiplier = ACTIVITY_MULTIPLIERS[activityLevel];

  if (bodyFat) {
    // Use Lean Body Mass (LBM) for more accurate TDEE
    const leanMass = weight * (1 - bodyFat / 100);
    return Math.round(leanMass * multiplier);
  }
  // Fallback: Use adjusted bodyweight multiplier
  const fallbackMultiplier = multiplier * 0.8; // 80% of LBM multiplier
  return Math.round(weight * fallbackMultiplier);
}

function calculateProteinGoal(weight: number): number {
  return Math.round(weight * 2.0); // 2g per kg (existing logic)
}

function calculateCarbsGoal(tdee: number): number {
  return Math.round((tdee * 0.40) / 4); // 40% of calories from carbs (4 kcal/g)
}

function calculateFatGoal(tdee: number): number {
  return Math.round((tdee * 0.30) / 9); // 30% of calories from fat (9 kcal/g)
}
```

**Activity Level Examples:**
| Level | Multiplier (LBM) | Beschreibung | Beispiel 80kg, 15% KFA |
|-------|------------------|--------------|------------------------|
| Sedentary | 30 kcal/kg | Bürojob, wenig Bewegung | 2040 kcal |
| Light | 35 kcal/kg | 1-2x Sport/Woche | 2380 kcal |
| **Moderate** | **40 kcal/kg** | **3-4x Sport/Woche (Default)** | **2720 kcal** |
| Active | 45 kcal/kg | 5-6x Sport/Woche | 3060 kcal |
| Very Active | 50 kcal/kg | Täglich Sport, körperlicher Job | 3400 kcal |

**Quick-Add Modal:**
- Tab 1: Kalorien (+100, +200, +300 kcal)
- Tab 2: Protein (+10g, +20g, +30g)
- Tab 3: Kohlenhydrate (+25g, +50g, +100g)
- Tab 4: Fett (+10g, +20g, +30g)
- OR: Exact input fields for all 4 macros

**Alternatives Considered:**
- Separate tiles (Protein, Calories, Carbs, Fat) → **Rejected**: Clutters Dashboard on mobile
- CaloriesTile only → **Rejected**: Incomplete nutrition view
- Fixed calorie goal (2000 kcal) → **Rejected**: Not personalized for user's body composition

## Data Flow

```
User Input (Notes Page)
  ↓
SmartNote with FoodEvent {label, calories, proteinG, carbsG, fatG}
  ↓
noteStore.add()
  ↓
trackingSync.ts (on noteStore subscription)
  ↓
collectContributions() aggregates macros per day
  ↓
setSmartContributions() updates Zustand store
  ↓
useCombinedTracking() merges with manual tracking
  ↓
Dashboard Tiles (ProteinTile shows combined total)
```

## Risks & Trade-offs

### Risk 1: Data Quality

**Risk:** Users enter incorrect macros (e.g., protein > calories)

**Mitigation:**
- No validation initially (trust user input)
- Future: Add soft warnings for impossible values
- Future: AI parsing to cross-check macro ratios

### Risk 2: Performance

**Risk:** Aggregating macros per note adds CPU overhead

**Mitigation:**
- Sync is already debounced (runs on noteStore change, not per note)
- Contribution aggregation is O(n) where n = events, not notes
- No performance issues expected (tested with 100+ notes)

### Risk 3: UI Clutter

**Risk:** Showing all macros makes event badges too long

**Mitigation:**
- Use compact format (`30g P` not `30 grams of protein`)
- Only show present fields (hide missing macros)
- Future: Truncate on mobile, expand on click

## Migration Plan

**No migration needed** - Changes are additive and backward compatible.

1. Deploy code changes (extend `FoodEvent`, update `trackingSync.ts`, update UI)
2. Existing food events continue to work (carbsG/fatG default to `undefined`)
3. New food events can include all macros
4. No data migration script required

## Open Questions

1. **Q:** Should AI auto-parse macros from text like "300 kcal, 20P 30C 10F"?
   **A:** Future enhancement. Keep manual entry for MVP.

2. **Q:** Should we add a "Nutrition Goals" section in Settings?
   **A:** Future enhancement. Start with protein goal (already exists).

3. **Q:** Should calories be tracked on Dashboard?
   **A:** Optional. Can be separate change proposal based on user feedback.

4. **Q:** Should we validate macro ratios (1g P = 4 kcal, 1g C = 4 kcal, 1g F = 9 kcal)?
   **A:** Future enhancement. Trust user input for MVP to avoid blocking workflow.

## Success Metrics

- [ ] Users can add food notes with all macros (P/C/F/Cal)
- [ ] Macro badges display correctly in Notes UI
- [ ] Protein from food notes appears in Dashboard ProteinTile
- [ ] No performance regression (Lighthouse score ≥90)
- [ ] Test coverage ≥80% for new code

## References

- Existing code: `src/features/notes/trackingSync.ts`
- Existing code: `src/pages/NotesPage.tsx` (EventBadges)
- Existing code: `src/hooks/useCombinedTracking.ts`
- Related spec: `openspec/specs/dashboard/spec.md`
