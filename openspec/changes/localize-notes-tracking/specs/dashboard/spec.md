# Dashboard

## MODIFIED Requirements

### Requirement: Water Tile [MODIFIED]
Documentation update only - behavior unchanged.

#### Scenario: Smart contributions source [MODIFIED]
- **WHEN** calculating water intake
- **THEN** system SHALL sum manual tracking + smart contributions
- **AND** smart contributions SHALL come from **structured drink logs** (previously from AI-parsed notes)
- **NOTE**: Contribution source changed but aggregation logic unchanged

### Requirement: Protein Tile [MODIFIED]
Documentation update only - behavior unchanged.

#### Scenario: Smart contributions source [MODIFIED]
- **WHEN** calculating protein intake
- **THEN** system SHALL sum manual tracking + smart contributions
- **AND** smart contributions SHALL come from **structured food logs** (previously from AI-parsed notes)
- **NOTE**: Contribution source changed but aggregation logic unchanged

## Technical Notes

### Data Sources [MODIFIED]
- `tracking/{userId}/entries/{dateKey}` - Daily tracking entries [UNCHANGED]
- `trainingLoad` state - 7-day training load map [UNCHANGED]
- `checkIns` state - Daily check-in data [UNCHANGED]
- `smartContributions` - **Structured quick log contributions** (previously "Smart Notes AI contributions")

### Dependencies [UNCHANGED]
All existing dependencies remain unchanged. The dashboard continues to use `useCombinedTracking` which merges manual + smart contributions - only the **source** of smart contributions changed (from AI-parsed notes to structured logs).

## ADDED Notes

### Integration with Structured Logging
The dashboard tiles (Water, Protein, Nutrition) now receive contributions from the **structured quick logging system** instead of AI-parsed notes. This provides:

- **Faster updates**: <100ms (previously 2-8s)
- **More reliable data**: No AI parsing errors
- **Offline support**: Contributions queue when offline
- **Zero cost**: No external API dependency

The existing `useCombinedTracking` hook and aggregation logic in `trackingSync.ts` remain unchanged - they continue to merge manual tracking with smart contributions as before.
