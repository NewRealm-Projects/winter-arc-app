## RENAMED Requirements
- FROM: `### Requirement: Water Tile`
- TO: `### Requirement: Hydration Tile`

## MODIFIED Requirements

### Requirement: Hydration Tile
The system SHALL track daily hydration intake with user-defined drink presets, manual input, and goal progress.

#### Scenario: Hydration display
- **WHEN** viewing hydration tile
- **THEN** system SHALL display current hydration intake in liters (e.g., "2.5L")
- **AND** system SHALL calculate from manual tracking + smart contributions
- **AND** system SHALL show progress bar with percent of goal
- **AND** system SHALL display goal (e.g., "75% / 3.0L")
- **AND** system SHALL display "Hydration" title (not "Water")

#### Scenario: Preset buttons rendering
- **WHEN** viewing hydration tile AND user has saved presets
- **THEN** system SHALL render preset buttons in grid layout (2 columns mobile, 3 columns desktop)
- **AND** system SHALL display preset emoji, name, and amount for each button
- **AND** system SHALL render up to 5 preset buttons
- **AND** system SHALL sort presets by `order` field (0-4)
- **WHEN** viewing hydration tile AND user has <5 presets
- **THEN** system SHALL display "+ Add Preset" button
- **WHEN** viewing hydration tile AND user has 0 presets
- **THEN** system SHALL display empty state hint: "Add drink presets for quick tracking"

#### Scenario: Quick add via preset
- **WHEN** user clicks preset button (e.g., "Coffee 250ml ☕")
- **THEN** system SHALL increment hydration by preset amount with 180ms debounce
- **AND** system SHALL batch updates to avoid excessive writes
- **AND** system SHALL update progress bar immediately (optimistic update)

#### Scenario: Add new preset
- **WHEN** user clicks "+ Add Preset" button AND has <5 presets
- **THEN** system SHALL open PresetManagementModal in "add" mode
- **AND** system SHALL display form with fields: name (text, max 30 chars), amount (number, 50-5000ml), emoji (text, optional)
- **AND** system SHALL show emoji suggestions: 💧 🥤 ☕ 🍵 🥛 🧃 🍷 🍺
- **AND** system SHALL generate UUID for preset.id on save
- **AND** system SHALL set preset.order to next available slot (0-4)
- **AND** system SHALL validate: name length 1-30, amount 50-5000, total presets ≤5
- **AND** system SHALL save preset to `user.hydrationPresets` array
- **AND** system SHALL sync to Firestore `users/{userId}`
- **WHEN** user clicks "+ Add Preset" button AND has 5 presets
- **THEN** system SHALL display error: "Max 5 presets allowed"

#### Scenario: Edit existing preset
- **WHEN** user long-presses preset button OR clicks preset settings icon
- **THEN** system SHALL open PresetManagementModal in "edit" mode
- **AND** system SHALL pre-fill form with current preset values
- **AND** system SHALL allow modification of name, amount, emoji
- **AND** system SHALL preserve preset.id and preset.order
- **AND** system SHALL save updated preset to `user.hydrationPresets`
- **AND** system SHALL sync to Firestore

#### Scenario: Delete preset
- **WHEN** user clicks "Delete" button in PresetManagementModal
- **THEN** system SHALL show confirmation prompt: "Delete '{name}'? This cannot be undone."
- **WHEN** user confirms deletion
- **THEN** system SHALL remove preset from `user.hydrationPresets` array
- **AND** system SHALL reorder remaining presets (compact order field)
- **AND** system SHALL sync to Firestore
- **AND** system SHALL close modal

#### Scenario: Manual input (no preset required)
- **WHEN** user clicks "✏️ Edit" button
- **THEN** system SHALL open modal with numeric input field
- **AND** system SHALL allow input with ml/L parsing (e.g., "2.5L" → 2500ml)
- **AND** system SHALL replace total hydration with exact value on save
- **AND** system SHALL work regardless of preset count (0-5)

#### Scenario: Hydration goal calculation
- **WHEN** calculating hydration goal
- **THEN** system SHALL use formula: `Math.max(user.weight * 0.033, 2.0)` liters
- **AND** system SHALL default to 2.0L if weight unavailable

#### Scenario: Preset persistence and sync
- **WHEN** user adds, edits, or deletes preset
- **THEN** system SHALL update Zustand store immediately (optimistic update)
- **AND** system SHALL sync to Firestore `users/{userId}.hydrationPresets` asynchronously
- **AND** system SHALL handle sync failures gracefully (show error, allow retry)
- **AND** system SHALL reload presets from Firestore on app launch

## ADDED Requirements

### Requirement: Drink Preset Validation
The system SHALL validate drink preset data to ensure data integrity and UX constraints.

#### Scenario: Name validation
- **WHEN** user enters preset name
- **THEN** system SHALL require minimum 1 character
- **AND** system SHALL enforce maximum 30 characters
- **AND** system SHALL trim whitespace
- **AND** system SHALL reject empty strings after trimming

#### Scenario: Amount validation
- **WHEN** user enters preset amount
- **THEN** system SHALL require integer values only (no decimals)
- **AND** system SHALL enforce minimum 50ml
- **AND** system SHALL enforce maximum 5000ml
- **AND** system SHALL reject non-numeric input

#### Scenario: Emoji validation
- **WHEN** user enters preset emoji
- **THEN** system SHALL allow single character (emoji or text)
- **AND** system SHALL default to 💧 if empty
- **AND** system SHALL truncate to first character if multiple entered

#### Scenario: Max preset limit
- **WHEN** user has 5 presets
- **THEN** system SHALL disable "+ Add Preset" button
- **AND** system SHALL show tooltip: "Max 5 presets allowed. Delete one to add another."
- **WHEN** user attempts to add 6th preset programmatically
- **THEN** system SHALL reject with error and log warning
