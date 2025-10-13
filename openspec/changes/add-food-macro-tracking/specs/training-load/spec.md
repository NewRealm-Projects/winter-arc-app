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

#### Scenario: Training load formula
- **WHEN** computing training load
- **THEN** system SHALL use formula: `load = baseFromWorkouts + modifierSleep + modifierRecovery + modifierSick`
- **AND** system SHALL calculate baseFromWorkouts as sum of (workout.duration × workout.intensity × 10)
- **AND** system SHALL include pushups as workout (1 pushup ≈ 0.5 load units)
- **AND** modifierSleep SHALL be `(sleepScore - 5) × 20` (neutral at 5)
- **AND** modifierRecovery SHALL be `(recoveryScore - 5) × 20` (neutral at 5)
- **AND** modifierSick SHALL be `-load × 0.5` if sick (halves total load)

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
- **AND** system SHALL calculate streak days (days with load ≥ 100%)
- **AND** system SHALL calculate average completion percent

#### Scenario: Determine badge level
- **WHEN** weekly average load is calculated
- **THEN** system SHALL assign badge level based on thresholds:
  - **Low**: average load < 200
  - **Optimal**: average load 200-599
  - **High**: average load ≥ 600
- **AND** system SHALL display badge with color:
  - Low: Blue (`bg-blue-500/20 text-blue-300`)
  - Optimal: Green (`bg-green-500/20 text-green-300`)
  - High: Red (`bg-red-500/20 text-red-300`)

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

### Training Load Formula
```typescript
// v1 Algorithm
const baseFromWorkouts = workouts.reduce((sum, w) => {
  return sum + (w.durationMinutes * (w.intensity ?? 5) * 10);
}, 0);
const pushupsLoad = pushupsReps * 0.5;
const baseLoad = baseFromWorkouts + pushupsLoad;

const modifierSleep = (sleepScore - 5) * 20;
const modifierRecovery = (recoveryScore - 5) * 20;
const modifierSick = sick ? -(baseLoad * 0.5) : 0;

const load = Math.max(0, baseLoad + modifierSleep + modifierRecovery + modifierSick);
```

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
