## MODIFIED Requirements

### Requirement: Daily Check-In
The system SHALL allow users to track daily recovery metrics (sleep quality, recovery score, illness status) for training load calculation with improved reliability and error handling.

#### Scenario: Save check-in
- **WHEN** user clicks "Speichern" button
- **THEN** system SHALL validate sleep score (clamp 1-10)
- **AND** system SHALL validate recovery score (clamp 1-10)
- **AND** system SHALL show loading state while saving
- **AND** system SHALL save DailyCheckIn to Firestore
- **AND** system SHALL recalculate training load with new inputs
- **AND** system SHALL update local store via Firestore subscription (NOT optimistic update)
- **AND** system SHALL display success toast
- **WHEN** save fails
- **THEN** system SHALL retry up to 3 times with exponential backoff (1s, 2s, 4s)
- **AND** system SHALL display error toast only after all retries fail
- **AND** system SHALL log retry attempts to Sentry as breadcrumbs

**Reason for Change**: Remove race conditions from optimistic updates, add retry logic for reliability

#### Scenario: Save completes quickly
- **WHEN** user clicks "Speichern" button
- **THEN** system SHALL complete save in <1 second (P95)
- **AND** system SHALL NOT perform weekly aggregation during save
- **AND** system SHALL write exactly 2 Firestore documents (DailyCheckIn, DailyTrainingLoad)

**Reason for Change**: Defer expensive weekly aggregation to improve save performance

### Requirement: Training Load Calculation
The system SHALL compute daily training load based on workouts, pushups, sleep quality, recovery score, and illness status using a corrected formula.

#### Scenario: Training load formula (v1 algorithm - corrected)
- **WHEN** computing training load
- **THEN** system SHALL calculate base load from workouts AND pushups together (duration × intensity multiplier)
- **AND** system SHALL resolve intensity multiplier as:
  - If numeric intensity (1-10): `0.6 + 0.1 × intensity`
  - If category: easy=0.8, mod=1.0, hard=1.3, race=1.6
  - Default: 1.0 (moderate)
- **AND** system SHALL include pushups in base load calculation: `pushupsReps × 0.15/10 × 0.9`
- **AND** system SHALL calculate wellness modifier: `0.6 + 0.04 × recoveryScore + 0.02 × sleepScore - (sick ? 0.3 : 0)`
- **AND** wellness modifier SHALL be clamped to range [0.4, 1.4]
- **AND** system SHALL calculate final load: `baseLoad × wellnessMod`
- **AND** final load SHALL be clamped to range [0, 1000]

**Reason for Change**: Fix incorrect pushup calculation (was capped at 20% of session load, now included in base load)

#### Scenario: Pushups contribute fairly to load
- **WHEN** user has 100 pushups tracked for a day
- **THEN** pushups SHALL contribute ~1.35 units to base load
- **WHEN** user has 200 pushups tracked
- **THEN** pushups SHALL contribute ~2.7 units to base load
- **AND** contribution SHALL NOT be artificially capped

**Reason for Change**: Ensure pushups are counted correctly, not limited by arbitrary 20% cap

## ADDED Requirements

### Requirement: Real-Time Week Subscription
The system SHALL subscribe to training load data for the entire current week (7 days) to ensure the graph displays real-time updates.

#### Scenario: Subscribe to current week
- **WHEN** user views Dashboard with UnifiedTrainingCard
- **THEN** system SHALL determine current week (Mon-Sun)
- **AND** system SHALL subscribe to training load for all 7 days of current week
- **AND** system SHALL update Zustand store when any day's training load changes
- **AND** system SHALL unsubscribe when component unmounts

#### Scenario: Graph updates in real-time
- **WHEN** user completes check-in for Monday
- **THEN** TrainingLoadGraph SHALL update Monday's value immediately
- **WHEN** user switches to view a different date (e.g., Tuesday)
- **THEN** graph SHALL show updated values for all 7 days without manual refresh
- **AND** all 7 days SHALL reflect latest Firestore data

#### Scenario: Efficient subscription management
- **WHEN** user navigates between weeks
- **THEN** system SHALL unsubscribe from previous week's 7 days
- **AND** system SHALL subscribe to new week's 7 days
- **AND** system SHALL maintain at most 7 active training load subscriptions per user

**Reason for Addition**: Fix stale graph data issue (previously only 1 day was subscribed)

### Requirement: Error Handling & Recovery
The system SHALL provide robust error handling with automatic retry and clear user feedback.

#### Scenario: Transient network error
- **WHEN** check-in save fails due to network error
- **THEN** system SHALL automatically retry after 1 second
- **WHEN** retry succeeds
- **THEN** system SHALL show success toast
- **AND** system SHALL NOT show error to user

#### Scenario: Persistent error after retries
- **WHEN** check-in save fails 3 times
- **THEN** system SHALL display error toast with message: "Failed to save check-in. Please check your connection and try again."
- **AND** system SHALL keep modal open with user's data intact
- **AND** system SHALL allow user to retry manually

#### Scenario: Permission denied error
- **WHEN** save fails due to Firestore permission error
- **THEN** system SHALL NOT retry
- **AND** system SHALL display error: "You don't have permission to save check-ins. Please contact support."
- **AND** system SHALL log error to Sentry with user context

**Reason for Addition**: Improve reliability and user experience for error cases

## Technical Notes

### Breaking Changes
- **Pushup calculation change**: Users with pushup data will see different (more accurate) training load values
  - Values will increase slightly for users with high pushup counts
  - No data migration needed, values recalculate on next check-in
  - Acceptable: Values become MORE accurate

### Performance Improvements
- **Check-in save latency**: Reduced from 2-3s to <1s (P95)
- **Firestore reads**: Reduced by ~60% (removed weekly aggregation queries)
- **Firestore writes**: Reduced from ~10 docs to 2 docs per check-in

### Implementation Files
- `src/components/checkin/CheckInModal.tsx` - Remove optimistic update, add retry
- `src/hooks/useWeeklyTrainingLoadSubscription.ts` - NEW: Subscribe to 7 days
- `src/services/trainingLoad.ts` - Fix pushup calculation
- `src/services/checkin.ts` - Remove weekly aggregation
- `src/utils/retry.ts` - NEW: Exponential backoff utility

### Removed Functionality
- **Optimistic updates** - Replaced with subscription-only updates
- **Weekly aggregation on save** - Replaced with client-side calculation (useTrainingLoadWeek hook)
- **Tracking document updates** - No longer update `tracking/{userId}/entries/{date}` with progress metrics

### Migration
**None required** - All changes are backward-compatible at the data level
