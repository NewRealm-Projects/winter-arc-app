# Training Load & Recovery System

## ADDED Requirements

### Requirement: Daily Check-In
The system SHALL allow users to track daily recovery metrics (sleep quality, recovery score, illness status) for training load calculation.

#### Scenario: Open check-in modal
- **WHEN** user clicks "Check-In" button in UnifiedTrainingCard
- **THEN** system SHALL open modal with recovery form
- **AND** system SHALL pre-fill with existing check-in data if available

#### Scenario: Enter sleep quality
- **WHEN** user adjusts sleep quality slider
- **THEN** system SHALL accept values from 1-10
- **AND** system SHALL display current value in real-time
- **AND** system SHALL show labels "Schlecht" (min) and "Sehr gut" (max)

#### Scenario: Enter recovery score
- **WHEN** user adjusts recovery score slider
- **THEN** system SHALL accept values from 1-10
- **AND** system SHALL display current value in real-time
- **AND** system SHALL show labels "Schlecht" (min) and "Sehr gut" (max)

#### Scenario: Mark illness status
- **WHEN** user toggles illness switch
- **THEN** system SHALL toggle between healthy (false) and sick (true)
- **AND** system SHALL show red toggle background when sick
- **AND** system SHALL show hint "Training load is reduced when sick"

#### Scenario: Save check-in
- **WHEN** user clicks "Speichern" button
- **THEN** system SHALL validate sleep score (clamp 1-10)
- **AND** system SHALL validate recovery score (clamp 1-10)
- **AND** system SHALL save DailyCheckIn to Firestore
- **AND** system SHALL recalculate training load with new inputs
- **AND** system SHALL update local store optimistically
- **AND** system SHALL display success toast
- **WHEN** save fails
- **THEN** system SHALL revert optimistic update
- **AND** system SHALL display error toast

### Requirement: Training Load Calculation
The system SHALL compute daily training load based on workouts, pushups, sleep quality, recovery score, and illness status.

#### Scenario: Calculate training load
- **WHEN** user completes check-in OR tracks workout/pushups
- **THEN** system SHALL aggregate all workouts for the day
- **AND** system SHALL extract pushup reps from tracking
- **AND** system SHALL compute base load from workouts (duration × intensity)
- **AND** system SHALL apply sleep modifier (sleep score affects load)
- **AND** system SHALL apply recovery modifier (recovery score affects load)
- **AND** system SHALL apply sick modifier (load reduced by 50% if sick)
- **AND** system SHALL store result as DailyTrainingLoad

#### Scenario: Training load formula (v1 algorithm)
- **WHEN** computing training load
- **THEN** system SHALL calculate session load from workouts (duration × intensity multiplier)
- **AND** system SHALL resolve intensity multiplier as:
  - If numeric intensity (1-10): `0.6 + 0.1 × intensity`
  - If category: easy=0.8, mod=1.0, hard=1.3, race=1.6
  - Default: 1.0 (moderate)
- **AND** system SHALL calculate pushup adjustment: `min(pushupsReps/100 × sessionLoad, 0.2 × sessionLoad)`
- **AND** system SHALL calculate wellness modifier: `0.6 + 0.04 × recoveryScore + 0.02 × sleepScore - (sick ? 0.3 : 0)`
- **AND** wellness modifier SHALL be clamped to range [0.4, 1.4]
- **AND** system SHALL calculate final load: `(sessionLoad + pushupAdj) × wellnessMod`
- **AND** final load SHALL be clamped to range [0, 1000]

#### Scenario: Store training load
- **WHEN** training load is calculated
- **THEN** system SHALL store DailyTrainingLoad document in Firestore
- **AND** system SHALL include load (number), components (breakdown), inputs (raw scores)
- **AND** system SHALL tag with calcVersion: 'v1'
- **AND** system SHALL update local Zustand store (trainingLoad map)

### Requirement: Weekly Training Statistics
The system SHALL aggregate training load data for the current week (Mon-Sun) and calculate weekly statistics.

#### Scenario: Calculate weekly stats
- **WHEN** viewing UnifiedTrainingCard
- **THEN** system SHALL use useTrainingLoadWeek hook
- **AND** system SHALL aggregate 7 days starting Monday
- **AND** system SHALL calculate average load (sum / 7)
- **AND** system SHALL calculate streak days (days with load ≥ 100% of max)
- **AND** system SHALL calculate average completion percent

#### Scenario: Determine badge level
- **WHEN** weekly average load is calculated
- **THEN** system SHALL assign badge level based on thresholds:
  - **Low**: average load < 200
  - **Optimal**: average load 200-599
  - **High**: average load ≥ 600
- **AND** system SHALL display badge with color:
  - Low: Blue (`bg-blue-500/20 text-blue-300 border-blue-500/40`)
  - Optimal: Green (`bg-green-500/20 text-green-300 border-green-500/40`)
  - High: Red (`bg-red-500/20 text-red-300 border-red-500/40`)

#### Scenario: Display weekly summary
- **WHEN** viewing UnifiedTrainingCard
- **THEN** system SHALL show subheader with:
  - Streak days: `{count}` (number of days at 100%+)
  - Ø Completion: `{percent}%` (average percent of max load)

### Requirement: Training Load Graph
The system SHALL display a 7-day area chart showing training load trend (Mon-Sun).

#### Scenario: Render training load graph
- **WHEN** viewing UnifiedTrainingCard
- **THEN** system SHALL render TrainingLoadGraph component
- **AND** system SHALL show 7 days (Mon-Sun) on X-axis
- **AND** system SHALL show load values on Y-axis (0 to max)
- **AND** system SHALL use blue gradient area chart
- **AND** system SHALL display day abbreviations (Mo, Di, Mi, Do, Fr, Sa, So)

#### Scenario: Graph interactivity
- **WHEN** user hovers over graph data point
- **THEN** system SHALL show tooltip with exact load value
- **AND** system SHALL format as "{load} Load"

#### Scenario: Graph scaling
- **WHEN** rendering graph Y-axis
- **THEN** system SHALL determine max load from week data
- **AND** system SHALL round max up to nearest 100
- **AND** system SHALL default to 1000 if all loads are 0
- **AND** system SHALL show ticks at [0, max/2, max]

### Requirement: Unified Training Card
The system SHALL display a unified card combining training load, weekly stats, current day recovery, and sport tracking.

#### Scenario: Display card header
- **WHEN** viewing Dashboard
- **THEN** system SHALL show UnifiedTrainingCard header with:
  - Icon: 💪
  - Title: "Training"
  - Badge: Low/Optimal/High (based on weekly average)
  - Check-In button (right side)

#### Scenario: Display current day stats
- **WHEN** viewing UnifiedTrainingCard
- **THEN** system SHALL show current day load value (bold, top-right of graph)
- **AND** system SHALL show sleep quality (e.g., "7.5/10")
- **AND** system SHALL show recovery score (e.g., "8/10")
- **AND** system SHALL show "—" if no check-in data exists

#### Scenario: Display sport status
- **WHEN** viewing UnifiedTrainingCard
- **THEN** system SHALL show sport section with:
  - Title: "Sport ({count})" (number of active sports today)
  - Sport icons: 🔥 (HIIT), 🏃 (Cardio), 🏋️ (Gym), 🏊 (Swimming), ⚽ (Soccer), 😴 (Rest)
  - "Training verwalten" button (opens sport modal)
- **WHEN** no sports tracked
- **THEN** system SHALL show placeholder "Keine Sportarten getrackt"

#### Scenario: Manage sports
- **WHEN** user clicks "Training verwalten" button
- **THEN** system SHALL open sport management modal
- **AND** system SHALL show grid of sport options (HIIT, Cardio, Gym, Swimming, Soccer, Rest)
- **WHEN** user selects sport
- **THEN** system SHALL allow duration input (minutes) and intensity input (1-10)
- **WHEN** user selects Rest Day
- **THEN** system SHALL not show duration/intensity fields
- **WHEN** user saves
- **THEN** system SHALL update tracking.sports for current date
- **AND** system SHALL recalculate training load

### Requirement: Data Model
The system SHALL persist check-in and training load data in Firestore.

#### Scenario: Store check-in data
- **WHEN** check-in is saved
- **THEN** system SHALL store DailyCheckIn document at `checkIns/{userId}/days/{date}`
- **AND** document SHALL include:
  - `date` (string, YYYY-MM-DD)
  - `sleepScore` (number, 1-10)
  - `recoveryScore` (number, 1-10)
  - `sick` (boolean)
  - `source` (string, 'manual')
  - `createdAt` (Timestamp)
  - `updatedAt` (Timestamp)

#### Scenario: Store training load data
- **WHEN** training load is calculated
- **THEN** system SHALL store DailyTrainingLoad document at `trainingLoad/{userId}/days/{date}`
- **AND** document SHALL include:
  - `date` (string, YYYY-MM-DD)
  - `load` (number, computed total)
  - `components` (object):
    - `baseFromWorkouts` (number)
    - `modifierSleep` (number)
    - `modifierRecovery` (number)
    - `modifierSick` (number)
  - `inputs` (object):
    - `sleepScore` (number)
    - `recoveryScore` (number)
    - `sick` (boolean)
  - `calcVersion` (string, 'v1')
  - `createdAt` (Timestamp)
  - `updatedAt` (Timestamp)

## Technical Notes

### Implementation Files
- `src/components/UnifiedTrainingCard.tsx` - Main training card UI
- `src/components/checkin/CheckInModal.tsx` - Check-in modal form
- `src/components/TrainingLoadGraph.tsx` - 7-day area chart
- `src/hooks/useTrainingLoadWeek.ts` - Weekly statistics aggregation
- `src/services/trainingLoad.ts` - Load calculation logic
- `src/services/checkin.ts` - Save check-in + recalc load
- `src/store/useStore.ts` - Zustand state (checkIns, trainingLoad)

### Data Flow
```
User Check-In (CheckInModal)
  ↓
saveDailyCheckInAndRecalc()
  ↓
DailyCheckIn saved to Firestore
  ↓
computeDailyTrainingLoadV1()
  ↓
DailyTrainingLoad saved to Firestore
  ↓
Zustand store updated (checkIns, trainingLoad)
  ↓
UnifiedTrainingCard re-renders
  ↓
TrainingLoadGraph updates with new data
```

### Dependencies
- Zustand (state management)
- Firestore (checkIns, trainingLoad collections)
- date-fns (week calculations)
- recharts (TrainingLoadGraph)
- useCombinedDailyTracking (merge manual + smart tracking)

### Training Load Formula (v1 Algorithm)
```typescript
// 1. Calculate intensity multiplier
const resolveMultiplier = (workout) => {
  if (typeof workout.intensity === 'number') {
    return 0.6 + 0.1 * clamp(workout.intensity, 1, 10);
  }
  // Category-based: easy=0.8, mod=1.0, hard=1.3, race=1.6
  return CATEGORY_MULTIPLIER[workout.category] ?? 1.0;
};

// 2. Calculate session load from workouts
const sessionLoad = workouts.reduce((total, w) => {
  if (w.durationMinutes <= 0) return total;
  const multiplier = resolveMultiplier(w);
  return total + w.durationMinutes * multiplier;
}, 0);

// 3. Calculate pushup adjustment (capped at 20% of session load)
const pushupAdjRaw = (pushupsReps / 100) * sessionLoad;
const pushupAdj = Math.min(pushupAdjRaw, 0.2 * sessionLoad);

// 4. Calculate wellness modifier
const wellnessModRaw = 0.6 + 0.04 * recoveryScore + 0.02 * sleepScore - (sick ? 0.3 : 0);
const wellnessMod = clamp(wellnessModRaw, 0.4, 1.4);

// 5. Calculate final load
const loadRaw = (sessionLoad + pushupAdj) * wellnessMod;
const load = Math.round(clamp(loadRaw, 0, 1000));
```

**Why This Formula:**
- **Session Load:** Duration × Intensity Multiplier (scales with effort and workout type)
- **Pushups:** Bonus capped at 20% of session load (prevents dominating calculation)
- **Wellness Modifier:** Multiplicative approach (0.6 + 0.04×recovery + 0.02×sleep - sick penalty)
- **Illness Penalty:** -0.3 to wellness modifier (reduces overall load by ~30%)
- **Clamps:** Wellness ∈ [0.4, 1.4], Final load ∈ [0, 1000]

### Badge Level Thresholds
| Badge | Average Load | Color | Use Case |
|-------|--------------|-------|----------|
| Low | < 200 | Blue | Minimal training, recovery week |
| Optimal | 200-599 | Green | Balanced training |
| High | ≥ 600 | Red | Intense training, risk of overtraining |

### Integration Notes
- Training load calculation is **already implemented** in `src/services/trainingLoad.ts`
- Check-in flow is **already implemented** in `src/components/checkin/CheckInModal.tsx`
- UnifiedTrainingCard is **already implemented** and replaces deprecated TrainingLoadTile
- This spec documents the existing system for OpenSpec compliance

### Future Enhancements (v2 Ideas)
- Activity-specific multipliers (HIIT vs Cardio vs Strength)
- Non-linear scaling (diminishing returns at high volume)
- Heart Rate Variability (HRV) integration
- Machine learning for personalized load recommendations
- Custom badge thresholds per user
- Monthly/yearly trend analysis
