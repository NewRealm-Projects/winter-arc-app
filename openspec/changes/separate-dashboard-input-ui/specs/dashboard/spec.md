# Dashboard Spec Deltas

## MODIFIED Requirements

### Requirement: Water Tile
The system SHALL track daily water intake with edit capability and goal progress.

#### Scenario: Water display
- **WHEN** viewing water tile
- **THEN** system SHALL display current water intake in liters (e.g., "2.5L")
- **AND** system SHALL calculate from manual tracking + smart contributions
- **AND** system SHALL show progress bar with percent of goal
- **AND** system SHALL display goal (e.g., "75% / 3.0L")

#### Scenario: Edit water
- **WHEN** user clicks edit icon in top-right corner
- **THEN** system SHALL open modal with input field
- **AND** system SHALL allow numeric input with ml/L parsing (e.g., "2.5L" → 2500ml)
- **AND** system SHALL pre-fill with current value
- **AND** system SHALL replace total water with exact value on save

#### Scenario: Water goal calculation
- **WHEN** calculating water goal
- **THEN** system SHALL use formula: `Math.max(user.weight * 0.033, 2.0)` liters
- **AND** system SHALL default to 2.0L if weight unavailable

### Requirement: Protein Tile
The system SHALL track daily protein intake with edit capability and weight-based goal.

#### Scenario: Protein display
- **WHEN** viewing protein tile
- **THEN** system SHALL display current protein in grams (e.g., "150g")
- **AND** system SHALL calculate from manual tracking + smart contributions
- **AND** system SHALL show progress bar with percent of goal
- **AND** system SHALL display goal (e.g., "75% / 200g")

#### Scenario: Edit protein
- **WHEN** user clicks edit icon in top-right corner
- **THEN** system SHALL open modal with input field
- **AND** system SHALL allow numeric input with g/kg parsing (e.g., "0.5kg" → 500g)
- **AND** system SHALL pre-fill with current value
- **AND** system SHALL replace total protein with exact value on save

#### Scenario: Protein goal calculation
- **WHEN** calculating protein goal
- **THEN** system SHALL use formula: `user.weight * 2.0` grams (2g per kg bodyweight)
- **AND** system SHALL display "Set goal" message if weight unavailable

### Requirement: Pushup Tile
The system SHALL display pushup count with edit capability and training plan preview.

#### Scenario: Pushup display
- **WHEN** viewing pushup tile
- **THEN** system SHALL display current pushup count from combined tracking
- **AND** system SHALL show training plan preview (clickable to /tracking/pushup-training)

#### Scenario: Edit pushups
- **WHEN** user clicks edit icon in top-right corner
- **THEN** system SHALL open modal with add/set exact modes
- **AND** system SHALL allow quick add or exact value entry
- **AND** system SHALL update pushup count on save

### Requirement: Weight Tile
The system SHALL track weight history with line chart visualization and edit capability.

#### Scenario: Add or edit weight
- **WHEN** user clicks "Add Weight" button OR edit icon in top-right corner
- **THEN** system SHALL open modal with weight and body fat inputs
- **AND** system SHALL pre-fill with existing values if editing
- **AND** system SHALL calculate BMI using `calculateBMI(weight, height)`
- **AND** system SHALL save weight data with BMI to day tracking

## ADDED Requirements

### Requirement: Tile Edit Icon
The system SHALL provide consistent edit icon UI across all tracking tiles.

#### Scenario: Edit icon display
- **WHEN** viewing any tracking tile (Water, Protein, Pushup, Weight)
- **THEN** system SHALL display small edit icon (✏️) in top-right corner
- **AND** icon SHALL have hover state for discoverability
- **AND** icon SHALL be keyboard accessible (Tab + Enter)

#### Scenario: Edit icon click
- **WHEN** user clicks edit icon
- **THEN** system SHALL open tile's edit modal
- **AND** modal SHALL pre-fill with current date's values
- **AND** modal SHALL allow modification and save

#### Scenario: Edit icon positioning
- **WHEN** rendering edit icon
- **THEN** system SHALL use `absolute` positioning in top-right corner
- **AND** icon SHALL have minimum 44x44px touch target for mobile
- **AND** icon SHALL not overlap with tile content

## REMOVED Requirements

### Requirement: Quick add water
**Reason**: Consolidating all input functionality to Input page for clearer UI separation
**Migration**: Users should navigate to Input page → Drink modal for adding water

### Requirement: Quick add protein
**Reason**: Consolidating all input functionality to Input page for clearer UI separation
**Migration**: Users should navigate to Input page → Food modal for adding protein/macros
