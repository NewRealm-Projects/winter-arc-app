# Design: Training Load & Recovery System Documentation

## Context

The Training Load & Recovery system is a **fully implemented feature** in the Winter Arc app that:
- Tracks daily recovery metrics (sleep quality, recovery score, illness)
- Calculates training load based on workouts, pushups, and recovery
- Aggregates weekly statistics with badge system (Low/Optimal/High)
- Visualizes 7-day training load trend with area chart
- Integrates with sport tracking and check-in flow

**Implementation Status:**
- ✅ `UnifiedTrainingCard.tsx` - Main UI component
- ✅ `CheckInModal.tsx` - Recovery input form
- ✅ `TrainingLoadGraph.tsx` - 7-day visualization
- ✅ `useTrainingLoadWeek.ts` - Weekly aggregation hook
- ✅ `trainingLoad.ts` - Calculation service (v1 algorithm)
- ✅ `checkin.ts` - Save service with recalculation

**This proposal documents the existing system without code changes.**

## Goals

1. **Formal OpenSpec Documentation** - Create training-load capability spec
2. **Algorithm Transparency** - Document v1 formula with versioning
3. **Maintainability** - Clear spec for future refactoring
4. **Onboarding** - Help new developers understand the system

## Non-Goals

- Refactoring or optimizing existing code
- Changing UI/UX design
- Adding new features
- Improving algorithm accuracy

## Design Decisions

### Decision 1: Spec Scope - Document Everything

**Choice:** Document the complete system including UI, calculation, and data model

**Rationale:**
- Training Load is a core feature (used daily by users)
- Algorithm needs transparency (v1 versioning indicates future improvements)
- Complex data flow (Check-In → Calculation → Weekly Stats → UI)
- No existing documentation makes maintenance difficult

**What to Document:**
1. Daily Check-In flow (CheckInModal)
2. Training Load calculation (v1 algorithm)
3. Weekly statistics aggregation
4. Training Load Graph visualization
5. UnifiedTrainingCard UI structure
6. Data model (DailyCheckIn, DailyTrainingLoad)

**Alternatives Considered:**
- Document only API surface → Rejected: Algorithm details are critical
- Document only user flows → Rejected: Developer context needed
- Document only data model → Rejected: Incomplete picture

### Decision 2: Algorithm Versioning - Maintain v1 Tag

**Choice:** Keep `calcVersion: 'v1'` in spec and code

**Rationale:**
- Current algorithm is simple but functional
- Future improvements likely (machine learning, activity multipliers)
- Versioning enables safe A/B testing
- Backward compatibility for historical data

**v1 Algorithm:**
```typescript
// 1. Calculate intensity multiplier
const resolveMultiplier = (workout) => {
  if (typeof workout.intensity === 'number') {
    return 0.6 + 0.1 * clamp(workout.intensity, 1, 10);
  }
  return CATEGORY_MULTIPLIER[workout.category] ?? 1.0; // easy/mod/hard/race
};

// 2. Calculate session load from workouts
const sessionLoad = workouts.reduce((total, w) => {
  if (w.durationMinutes <= 0) return total;
  return total + w.durationMinutes * resolveMultiplier(w);
}, 0);

// 3. Pushup adjustment (capped at 20% of session load)
const pushupAdjRaw = (pushupsReps / 100) * sessionLoad;
const pushupAdj = Math.min(pushupAdjRaw, 0.2 * sessionLoad);

// 4. Wellness modifier (multiplicative)
const wellnessModRaw = 0.6 + 0.04 * recoveryScore + 0.02 * sleepScore - (sick ? 0.3 : 0);
const wellnessMod = clamp(wellnessModRaw, 0.4, 1.4);

// 5. Final load
const loadRaw = (sessionLoad + pushupAdj) * wellnessMod;
const load = Math.round(clamp(loadRaw, 0, 1000));
```

**Why This Formula:**
- Simple and transparent (no black box)
- Multiplicative wellness modifier (more intuitive than additive)
- Pushup bonus capped at 20% (prevents dominating calculation)
- Illness penalty of -0.3 (reduces load by ~30%)
- Scales with workout volume and intensity

**Future v2 Ideas:**
- Activity-specific multipliers (HIIT vs Cardio)
- Non-linear scaling (diminishing returns)
- Heart Rate Variability (HRV) integration
- Machine learning for personalized load

**Alternatives Considered:**
- Remove versioning → Rejected: Future-proofing needed
- Use v2 immediately → Rejected: Current v1 works well
- Hide algorithm details → Rejected: Transparency is better

### Decision 3: Badge System - Three Levels

**Choice:** Use 3-level badge system (Low/Optimal/High) based on weekly average load

**Rationale:**
- Simple and actionable (not overwhelming)
- Color-coded for quick recognition (Blue/Green/Red)
- Based on research: 200-600 is optimal training volume for most people
- Encourages balance (not too little, not too much)

**Badge Thresholds:**
| Badge | Weekly Avg Load | Color | Interpretation |
|-------|-----------------|-------|----------------|
| **Low** | < 200 | Blue | Minimal training, recovery week, or starting out |
| **Optimal** | 200-599 | Green | Balanced training, sustainable volume |
| **High** | ≥ 600 | Red | Intense training, risk of overtraining |

**Why These Thresholds:**
- < 200: Most users do < 2 workouts/week
- 200-599: 3-5 moderate workouts/week (standard recommendation)
- ≥ 600: 6+ workouts/week or very intense training

**Alternatives Considered:**
- 5-level system (Very Low/Low/Medium/High/Very High) → Rejected: Too granular
- Percentage-based (% of personal max) → Rejected: Hard to calibrate
- No badge system → Rejected: Users need quick feedback

### Decision 4: Unified Training Card - Replace TrainingLoadTile

**Choice:** Use UnifiedTrainingCard that combines Training Load + Sport Tracking

**Rationale:**
- Training Load and Sports are tightly coupled (sports contribute to load)
- Single card is more space-efficient on mobile
- Check-In button placement (top-right of card)
- Weekly badge visible in header

**Card Structure:**
```
UnifiedTrainingCard
├── Header
│   ├── Icon (💪) + Title ("Training")
│   ├── Badge (Low/Optimal/High with color)
│   └── Check-In Button (top-right)
├── Subheader
│   ├── Streak Days (days with load ≥ 100%)
│   └── Ø Completion (average % of max load)
├── Section A: Training Load
│   ├── Current Day Load (bold number)
│   ├── Training Load Graph (7-day area chart)
│   └── Sleep/Recovery Stats (2-column grid)
└── Section B: Sport Status
    ├── Active Sport Icons (🔥 🏃 🏋️ 🏊 ⚽ 😴)
    └── "Training verwalten" Button
```

**Why This Structure:**
- Progressive disclosure (most important info at top)
- Graph is visually dominant (main value)
- Sleep/Recovery stats provide context
- Sport icons show "what contributed to today's load"

**Alternatives Considered:**
- Separate Training Load + Sport Tiles → Rejected: Takes too much space
- Hide graph by default (tap to expand) → Rejected: Graph is the main feature
- Show all 7 days of stats → Rejected: Clutters UI

## Data Flow

```
1. User Opens Check-In Modal (CheckInModal.tsx)
   ↓
2. User Enters Recovery Metrics
   - Sleep Quality: 1-10 slider
   - Recovery Score: 1-10 slider
   - Sick: Toggle (true/false)
   ↓
3. User Clicks "Speichern"
   ↓
4. saveDailyCheckInAndRecalc(dateKey, metrics)
   ↓
5. Save DailyCheckIn to Firestore
   - checkIns/{userId}/days/{date}
   ↓
6. Fetch Tracking Data (workouts, pushups)
   - buildWorkoutEntriesFromTracking()
   - resolvePushupsFromTracking()
   ↓
7. Calculate Training Load (v1 algorithm)
   - computeDailyTrainingLoadV1()
   ↓
8. Save DailyTrainingLoad to Firestore
   - trainingLoad/{userId}/days/{date}
   ↓
9. Update Zustand Store (optimistic update)
   - setCheckInForDate()
   - setTrainingLoadForDate()
   ↓
10. UnifiedTrainingCard Re-renders
    ↓
11. useTrainingLoadWeek() Recomputes Weekly Stats
    - Aggregate 7 days (Mon-Sun)
    - Calculate badge level
    ↓
12. TrainingLoadGraph Updates (7-day chart)
```

## Risks & Trade-offs

### Risk 1: Algorithm Simplicity

**Risk:** v1 algorithm is naive (doesn't account for activity type, fitness level, HRV)

**Mitigation:**
- Versioning allows future improvements (v2, v3)
- Current algorithm is "good enough" for most users
- Focus on transparency over accuracy

**Trade-off:** Simplicity vs Accuracy
- We chose simplicity (easier to understand and debug)
- Future v2 can add sophistication without breaking existing data

### Risk 2: Badge Inflation

**Risk:** Users may "game" the system to get Green badge

**Mitigation:**
- Optimal badge range is wide (200-599)
- High badge is clearly marked as "risk of overtraining"
- Focus on trends (graph) not just badge

**Trade-off:** Gamification vs Accuracy
- We chose gamification (motivational)
- But provide context (graph shows real trend)

### Risk 3: Illness Toggle Abuse

**Risk:** Users may toggle "sick" to reduce load artificially

**Mitigation:**
- Sick days are visible in UI (transparent)
- Load is halved, not zeroed (still shows effort)
- Focus on long-term trends (weekly average)

**Trade-off:** Trust vs Validation
- We chose trust (no validation)
- Alternative would be HRV integration (future enhancement)

## Migration Plan

**No migration needed** - This is documentation only.

If algorithm changes in future (v2):
1. Add `calcVersion: 'v2'` to new DailyTrainingLoad documents
2. Keep v1 calculation for historical data
3. Display version in UI (optional)

## Open Questions

1. **Q:** Should we document the TrainingLoadGraph component in detail (recharts config)?
   **A:** Yes, in Technical Notes section (helps with future styling changes)

2. **Q:** Should we document sport-to-load conversion (intensity multipliers)?
   **A:** Yes, critical for understanding how different sports contribute

3. **Q:** Should we document the badge color scheme (hex codes)?
   **A:** Yes, ensures consistency across app

4. **Q:** Should we document the UnifiedTrainingCard state management (draft sports)?
   **A:** Yes, complex logic (sport modal uses optimistic updates)

## Success Metrics

- [ ] Training Load spec is complete (all requirements documented)
- [ ] v1 algorithm is clearly explained with formula
- [ ] Badge thresholds are documented with rationale
- [ ] Data flow is clear (Check-In → Calculation → UI)
- [ ] Future enhancements are noted (v2 ideas)
- [ ] Developers can understand system without asking questions

## References

- Existing code: `src/components/UnifiedTrainingCard.tsx`
- Existing code: `src/components/checkin/CheckInModal.tsx`
- Existing code: `src/services/trainingLoad.ts`
- Existing code: `src/hooks/useTrainingLoadWeek.ts`
- Related CLAUDE.md section: Dashboard → UnifiedTrainingCard
