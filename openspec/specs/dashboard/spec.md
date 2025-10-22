# Dashboard

Main tracking interface with weekly overview, training metrics, and activity tiles.

## Purpose

Provide unified view of user progress with week navigation, training load monitoring, and quick-entry tiles for daily activities (pushups, water, protein, weight).

## Requirements

### Requirement: Weekly Tile
The system SHALL display weekly progress overview with day-by-day tracking circles.

#### Scenario: Week header display
- **WHEN** viewing weekly tile
- **THEN** system SHALL display "Week Overview" title
- **AND** system SHALL show current week range (e.g., "1. Jan – 7. Jan")
- **AND** system SHALL display streak days with fire emoji and count

#### Scenario: Day circles rendering
- **WHEN** loading week data
- **THEN** system SHALL fetch entries for all 7 days from `tracking/{userId}/entries/{dateKey}`
- **AND** system SHALL calculate progress percent, streak status, tasks completed/total
- **AND** system SHALL render 7 day circles (Mon-Sun) with progress indicators
- **AND** system SHALL mark today's circle distinctly
- **AND** system SHALL mark selected date circle distinctly

#### Scenario: Week navigation
- **WHEN** user clicks previous week button
- **THEN** system SHALL decrement week offset by 1
- **AND** system SHALL load data for previous week
- **WHEN** user clicks next week button AND not current week
- **THEN** system SHALL increment week offset by 1
- **WHEN** user clicks next week button AND is current week
- **THEN** system SHALL disable next button (cannot navigate to future)

#### Scenario: Day selection
- **WHEN** user clicks day circle
- **THEN** system SHALL set selectedDate to clicked date
- **AND** system SHALL update all tracking tiles to show selected date data

#### Scenario: Overflow handling
- **WHEN** week contains 7 day circles on mobile
- **THEN** system SHALL use `overflow-x-auto overflow-y-visible` for horizontal scroll
- **AND** system SHALL prevent circle clipping with padding

### Requirement: Unified Training Card
The system SHALL display combined training load and sport tracking in single card.

#### Scenario: Header with badge
- **WHEN** viewing training card
- **THEN** system SHALL display "Training" title with emoji (💪)
- **AND** system SHALL show badge level (Low/Optimal/High) based on weekly training load
- **AND** system SHALL provide "Check-In" button in top-right

#### Scenario: Weekly summary subheader
- **WHEN** viewing training card
- **THEN** system SHALL display streak days from week stats
- **AND** system SHALL display average completion percentage for week

#### Scenario: Training load graph
- **WHEN** viewing training card
- **THEN** system SHALL display 7-day training load graph
- **AND** system SHALL show current day's load value
- **AND** system SHALL render graph with height 100px

#### Scenario: Current day recovery metrics
- **WHEN** viewing training card
- **THEN** system SHALL display sleep score (1-10) or "—" if not tracked
- **AND** system SHALL display recovery score (1-10) or "—" if not tracked
- **AND** system SHALL fetch from checkIns, aggregated recovery, or defaults

#### Scenario: Sport status display
- **WHEN** viewing training card
- **THEN** system SHALL display active sports count
- **AND** system SHALL show emoji icons for active sports (🔥 HIIT, 🏃 Cardio, etc.)
- **AND** system SHALL display "No sports tracked" if none active
- **AND** system SHALL provide "Manage Sports" button

#### Scenario: Check-in modal
- **WHEN** user clicks Check-In button
- **THEN** system SHALL open CheckInModal for active date
- **AND** system SHALL allow user to input sleep score, recovery score, illness status
- **AND** system SHALL save check-in data and recompute training load

#### Scenario: Sport management modal
- **WHEN** user clicks "Manage Sports" button
- **THEN** system SHALL open sport modal with 6 sport options (HIIT, Cardio, Gym, Swimming, Soccer, Rest)
- **AND** system SHALL allow multi-select with checkboxes
- **AND** system SHALL provide duration input (30/60/90 min or custom) for active sports
- **AND** system SHALL provide intensity slider (1-10) for active sports
- **AND** system SHALL treat "Rest" as toggle (no duration/intensity)
- **AND** system SHALL save sport data to tracking on save

### Requirement: Water Tile
The system SHALL track daily water intake with quick-add buttons and goal progress.

#### Scenario: Water display
- **WHEN** viewing water tile
- **THEN** system SHALL display current water intake in liters (e.g., "2.5L")
- **AND** system SHALL calculate from manual tracking + smart contributions
- **AND** system SHALL show progress bar with percent of goal
- **AND** system SHALL display goal (e.g., "75% / 3.0L")

#### Scenario: Quick add water
- **WHEN** user clicks quick-add button (+250ml, +500ml, +1000ml)
- **THEN** system SHALL increment water by amount with 180ms debounce
- **AND** system SHALL batch updates to avoid excessive writes

#### Scenario: Edit water
- **WHEN** user clicks edit button
- **THEN** system SHALL open modal with input field
- **AND** system SHALL allow numeric input with ml/L parsing (e.g., "2.5L" → 2500ml)
- **AND** system SHALL replace total water with exact value on save

#### Scenario: Water goal calculation
- **WHEN** calculating water goal
- **THEN** system SHALL use formula: `Math.max(user.weight * 0.033, 2.0)` liters
- **AND** system SHALL default to 2.0L if weight unavailable

### Requirement: Protein Tile
The system SHALL track daily protein intake with quick-add buttons and weight-based goal.

#### Scenario: Protein display
- **WHEN** viewing protein tile
- **THEN** system SHALL display current protein in grams (e.g., "150g")
- **AND** system SHALL calculate from manual tracking + smart contributions
- **AND** system SHALL show progress bar with percent of goal
- **AND** system SHALL display goal (e.g., "75% / 200g")

#### Scenario: Quick add protein
- **WHEN** user clicks quick-add button (+10g, +20g, +30g)
- **THEN** system SHALL increment protein by amount immediately

#### Scenario: Edit protein
- **WHEN** user clicks edit button
- **THEN** system SHALL open modal with input field
- **AND** system SHALL allow numeric input with g/kg parsing (e.g., "0.5kg" → 500g)
- **AND** system SHALL replace total protein with exact value on save

#### Scenario: Protein goal calculation
- **WHEN** calculating protein goal
- **THEN** system SHALL use formula: `user.weight * 2.0` grams (2g per kg bodyweight)
- **AND** system SHALL display "Set goal" message if weight unavailable

### Requirement: Weight Tile
The system SHALL track weight history with line chart visualization and BMI calculation.

#### Scenario: Weight chart display
- **WHEN** viewing weight tile AND has data
- **THEN** system SHALL render line chart with weight (purple) and body fat (orange) lines
- **AND** system SHALL include onboarding weight from user.createdAt
- **AND** system SHALL show chart data for selected range (week/month/all)

#### Scenario: Range selection
- **WHEN** user selects time range
- **THEN** system SHALL filter chart data to last 7 days (week), 30 days (month), or all time
- **AND** system SHALL adjust date format (dd.MM for week/month, dd.MM.yy for all)

#### Scenario: Current weight display
- **WHEN** viewing weight tile
- **THEN** system SHALL display latest weight in kg (e.g., "75kg")
- **AND** system SHALL calculate from combined daily tracking or user profile
- **AND** system SHALL display BMI if height available

#### Scenario: Add weight
- **WHEN** user clicks "Add Weight" button
- **THEN** system SHALL open modal with weight and body fat inputs
- **AND** system SHALL calculate BMI using `calculateBMI(weight, height)`
- **AND** system SHALL save weight data with BMI to day tracking

#### Scenario: Edit weight
- **WHEN** user clicks edit icon AND weight exists for selected date
- **THEN** system SHALL open modal pre-filled with existing weight and body fat
- **AND** system SHALL allow modification and save

#### Scenario: No data state
- **WHEN** no weight data exists
- **THEN** system SHALL display "Noch keine Gewichtsdaten vorhanden" message

### Requirement: Tile Visual Design
The system SHALL use consistent tile styling across dashboard.

#### Scenario: Tile highlight
- **WHEN** activity is tracked for selected date
- **THEN** system SHALL apply `getTileClasses(true)` for highlighted appearance
- **AND** system SHALL use compact padding from design tokens

#### Scenario: Tile layout
- **WHEN** rendering tracking tiles
- **THEN** system SHALL use `tile-grid-2` for flush desktop alignment
- **AND** system SHALL ensure responsive mobile/desktop spacing

### Requirement: Multi-Date Support
The system SHALL support viewing and editing any date via week navigation.

#### Scenario: Selected date propagation
- **WHEN** user selects date from weekly tile
- **THEN** system SHALL update global selectedDate state
- **AND** system SHALL propagate to all tracking tiles
- **AND** system SHALL load tracking data for selected date

#### Scenario: Today vs historical label
- **WHEN** selected date is today
- **THEN** tiles SHALL display "Heute" label
- **WHEN** selected date is not today
- **THEN** tiles SHALL display date as "dd.MM." format

## Technical Notes

### Implementation Files
- `src/components/dashboard/WeeklyTile.tsx` - Week overview with day circles
- `src/components/UnifiedTrainingCard.tsx` - Combined training load + sports
- `src/components/PushupTile.tsx` - Pushup tracking tile
- `src/components/WaterTile.tsx` - Water intake tile
- `src/components/ProteinTile.tsx` - Protein intake tile
- `src/components/WeightTile.tsx` - Weight history tile

### Data Sources
- `tracking/{userId}/entries/{dateKey}` - Daily tracking entries
- `trainingLoad` state - 7-day training load map
- `checkIns` state - Daily check-in data
- `smartContributions` - Smart Notes AI contributions

### Dependencies
- Zustand (state management)
- date-fns (date manipulation)
- recharts (weight chart)
- WeekContext (week navigation)
- useCombinedTracking (manual + smart data)

### Design Patterns
- **Debouncing**: Water tile uses 180ms debounce for quick-add
- **Combined tracking**: All tiles merge manual + smart contributions
- **Multi-date**: All tiles respect selectedDate from week navigation
- **Progressive enhancement**: Tiles show goal progress when available
- **Responsive**: Mobile-first with desktop enhancements
