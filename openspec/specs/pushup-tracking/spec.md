# Pushup Tracking

Progressive pushup training system with quick input and guided workout mode.

## Purpose

Provide adaptive pushup training with progressive overload, structured workout sessions, and flexible quick-entry tracking for daily pushup goals.

## Requirements

### Requirement: Progressive Plan Generation
The system SHALL generate daily pushup plans with automatic progression based on training history.

#### Scenario: Initial plan from max pushups
- **WHEN** user has no training history
- **THEN** system SHALL calculate initial total as `maxPushups * 2.5`
- **AND** system SHALL generate 5-set plan with descending reps
- **AND** system SHALL distribute reps with gap of `Math.max(2, Math.floor(total / 25))`

#### Scenario: Progressive plan from history
- **WHEN** user has previous training data
- **THEN** system SHALL retrieve last pushup total from history
- **AND** system SHALL increment total by 1 rep (progressive overload)
- **AND** system SHALL generate 5-set plan with new total
- **AND** system SHALL ensure all sets have minimum 1 rep

#### Scenario: Plan distribution calculation
- **WHEN** generating 5-set plan for total N
- **THEN** system SHALL calculate average as `N / 5`
- **AND** system SHALL set middle set (Set 3) to rounded average
- **AND** system SHALL create descending pattern: `[avg+gap*2, avg+gap, avg, avg-gap, avg-gap*2]`
- **AND** system SHALL correct sum discrepancies by adjusting Set 1

### Requirement: Training Initialization
The system SHALL initialize pushup training plan during onboarding based on max pushups.

#### Scenario: Calculate base reps from max
- **WHEN** user provides max pushups value
- **THEN** system SHALL calculate base reps as `Math.max(3, Math.floor(0.45 * maxPushups))`
- **AND** system SHALL set default to 5 sets
- **AND** system SHALL set rest time to 60 seconds
- **AND** system SHALL store as `pushupState` in user profile

### Requirement: Quick Input Mode
The system SHALL provide modal for quick pushup entry with add or set-exact modes.

#### Scenario: Add mode input
- **WHEN** user opens pushup tile modal AND selects "Add" mode
- **THEN** system SHALL display current total for the day
- **AND** system SHALL allow numeric input of pushups to add
- **AND** system SHALL increment existing total by input amount on save
- **AND** system SHALL support Enter key to save

#### Scenario: Set exact mode input
- **WHEN** user opens pushup tile modal AND selects "Set Exact" mode
- **THEN** system SHALL allow numeric input of total pushups
- **AND** system SHALL replace existing total with input amount on save
- **AND** system SHALL support Enter key to save

#### Scenario: Quick input validation
- **WHEN** user enters pushup amount
- **THEN** system SHALL validate amount >= 0
- **AND** system SHALL disable save button if invalid
- **AND** system SHALL update tracking for selected date (today or historical)

### Requirement: Training Mode Workflow
The system SHALL provide guided workout mode with countdown, sets, and rest timers.

#### Scenario: Start countdown
- **WHEN** user enters training mode
- **THEN** system SHALL display 3-second countdown (3, 2, 1)
- **AND** system SHALL auto-start workout after countdown completes

#### Scenario: Active set execution
- **WHEN** user is in active set (no rest timer)
- **THEN** system SHALL display current set number (1-5)
- **AND** system SHALL display target reps for current set
- **AND** system SHALL provide tap circle to increment rep counter
- **AND** system SHALL display "Complete Set" button with current rep count

#### Scenario: Set completion
- **WHEN** user completes set OR reaches target reps
- **THEN** system SHALL save reps for current set
- **AND** system SHALL increment current set number
- **AND** system SHALL start 60-second rest timer
- **AND** system SHALL prevent auto-complete if rest timer is active

#### Scenario: Rest timer
- **WHEN** rest timer is active
- **THEN** system SHALL display countdown in seconds
- **AND** system SHALL provide "Skip Rest" button
- **AND** system SHALL start next set automatically when timer reaches 0

#### Scenario: Workout completion
- **WHEN** user completes 5 sets
- **THEN** system SHALL calculate total reps across all sets
- **AND** system SHALL evaluate workout performance (pass/hold/fail)
- **AND** system SHALL save workout data with status and timestamp
- **AND** system SHALL update day tracking for active date
- **AND** system SHALL trigger AI motivation generation
- **AND** system SHALL display completion screen with stats

### Requirement: Workout Evaluation
The system SHALL evaluate workout performance and determine status based on set completion.

#### Scenario: Pass status
- **WHEN** user completes workout AND all 4 fixed sets meet base reps AND AMRAP set >= base reps
- **THEN** system SHALL assign status: "pass"
- **AND** system SHALL increment base reps by 1 for next workout

#### Scenario: Hold status
- **WHEN** user completes workout AND (3 fixed sets meet base reps OR 4 sets meet base AND AMRAP is base-1)
- **THEN** system SHALL assign status: "hold"
- **AND** system SHALL keep base reps unchanged for next workout

#### Scenario: Fail status
- **WHEN** user completes workout AND does not meet pass or hold criteria
- **THEN** system SHALL assign status: "fail"
- **AND** system SHALL decrement base reps by 1 (minimum 3) for next workout

#### Scenario: Deload guard
- **WHEN** calculated next base reps * 5 > 120 total volume
- **THEN** system SHALL reduce sets from 5 to 4
- **AND** system SHALL maintain base reps value

### Requirement: Completion Screen
The system SHALL display workout summary with performance metrics after training.

#### Scenario: Performance metrics
- **WHEN** workout is complete
- **THEN** system SHALL display total reps performed
- **AND** system SHALL calculate plan fulfillment percentage: `(total / planned) * 100`
- **AND** system SHALL display next challenge as `total + 1` reps

#### Scenario: Set breakdown
- **WHEN** viewing completion screen
- **THEN** system SHALL display all 5 sets with:
  - Set number
  - Target reps
  - Actual reps performed
  - Difference from target (± N)

#### Scenario: Motivational feedback
- **WHEN** total reps >= planned reps
- **THEN** system SHALL display: "Fantastisch! Du hast dein Ziel übertroffen."
- **WHEN** total reps < planned reps
- **THEN** system SHALL display: "Stark! Morgen wirst du noch stärker."

### Requirement: Pushup Tile Display
The system SHALL display pushup status and plan preview in dashboard tile.

#### Scenario: Tile header
- **WHEN** viewing pushup tile
- **THEN** system SHALL display pushup emoji (💪) and label
- **AND** system SHALL display current pushup count for selected date
- **AND** system SHALL highlight if count > 0

#### Scenario: Plan preview
- **WHEN** viewing pushup tile
- **THEN** system SHALL display "Today's Plan" or "Tomorrow's Plan" based on workout completion
- **AND** system SHALL show 5-set plan as: "S1 • S2 • S3 • S4 • S5 = Total reps"
- **AND** system SHALL display rest time: "60s"
- **AND** system SHALL provide "Start Workout" hint

#### Scenario: Navigate to training mode
- **WHEN** user clicks plan preview section
- **THEN** system SHALL navigate to `/tracking/pushup-training`

### Requirement: Pushup Training Page
The system SHALL provide a dedicated training summary at `/tracking/pushup-training`.

#### Scenario: Training summary content
- **WHEN** user opens `/tracking/pushup-training`
- **THEN** system SHALL display "Today's Plan" or "Tomorrow's Plan" with the selected date label
- **AND** system SHALL list 5 sets with target reps and AMRAP label on final set
- **AND** system SHALL surface planned total reps, today's logged reps, base reps, and rest time

#### Scenario: Training page actions
- **WHEN** user views `/tracking/pushup-training`
- **THEN** system SHALL provide a link back to the dashboard for logging pushups
- **AND** system SHALL provide a link to pushup history

### Requirement: Historical Data Retrieval
The system SHALL retrieve pushup history for plan generation from combined tracking data.

#### Scenario: Get last pushup total
- **WHEN** generating new plan
- **THEN** system SHALL search tracking records in reverse chronological order
- **AND** system SHALL return first non-zero pushup total found
- **AND** system SHALL return 0 if no history exists

#### Scenario: Count training days
- **WHEN** calculating progression
- **THEN** system SHALL count all days with pushup total > 0
- **AND** system SHALL return count for progression tracking

### Requirement: Multi-Date Support
The system SHALL support pushup tracking for any date via date selection.

#### Scenario: Today tracking
- **WHEN** selected date is today
- **THEN** system SHALL display "Heute" label
- **AND** system SHALL allow training mode activation

#### Scenario: Historical tracking
- **WHEN** selected date is not today
- **THEN** system SHALL display date as "dd.MM." format
- **AND** system SHALL load tracking data for selected date
- **AND** system SHALL allow quick input modification

## Technical Notes

### Implementation Files
- `app/utils/pushupAlgorithm.ts` - Plan generation, evaluation, history retrieval
- `app/components/PushupTile.tsx` - Dashboard tile, quick input modal
- `app/tracking/pushup-training/page.tsx` - Guided workout mode UI

### Data Model
```typescript
PushupState {
  baseReps: number;      // Current base reps per set
  sets: number;          // Number of sets (5 or 4 with deload)
  restTime: number;      // Rest between sets (60s)
}

PushupWorkout {
  reps: number[];        // 5 reps per set
  status: 'pass' | 'hold' | 'fail';
  timestamp: Date;
}

DailyTracking {
  pushups: {
    total: number;       // Total pushups for the day
    workout?: PushupWorkout;
  }
}
```

### Algorithms
- **Progressive Overload**: `total_today = last_total + 1`
- **Base Reps Init**: `baseReps = max(3, floor(0.45 * maxPushups))`
- **Set Distribution**: Descending pattern with gap-based spacing
- **Deload Guard**: Sets = 4 if `baseReps * 5 > 120`

### Dependencies
- Zustand (state management)
- date-fns (date formatting)
- React Router (navigation)
- Firebase Firestore (persistence)
- AI Service (motivation generation)

### Design Patterns
- Progressive overload (+1 rep/day)
- Auto-progression based on performance
- Deload mechanism for volume management
- Dual input modes (quick vs guided)
- Historical date support
