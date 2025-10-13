# Dashboard Integration for Food Macros

## MODIFIED Requirements

### Requirement: Nutrition Tile (REPLACED ProteinTile)
The system SHALL track all daily macronutrients (calories, protein, carbs, fat) in a unified tile with smart goal calculation based on body composition.

#### Scenario: Nutrition tile display
- **WHEN** viewing nutrition tile
- **THEN** system SHALL display all 4 macros: Calories, Protein, Carbs, Fat
- **AND** system SHALL show current/goal for each macro with percentage (e.g., "1850 / 2200 kcal (84%)")
- **AND** system SHALL calculate from manual tracking + smart contributions
- **AND** system SHALL show primary progress bar for calories
- **AND** system SHALL display compact macro breakdown:
  - Kalorien: X / Y kcal (Z%)
  - Protein: X / Y g (Z%)
  - Kohlenhydrate: X / Y g (Z%)
  - Fett: X / Y g (Z%)

#### Scenario: Smart goal calculation - TDEE
- **WHEN** calculating calorie goal
- **THEN** system SHALL use formula based on body composition:
  - **IF** user has body fat % → TDEE = Lean Body Mass × 40 kcal
    - Lean Body Mass = weight(kg) × (1 - bodyFat/100)
  - **ELSE** → TDEE = weight(kg) × 32 kcal (moderate activity baseline)
- **AND** system SHALL display hint "💡 Ziel basiert auf Gewicht & KFA"

#### Scenario: Smart goal calculation - Protein
- **WHEN** calculating protein goal
- **THEN** system SHALL use formula: `weight(kg) × 2.0` grams (2g per kg bodyweight)
- **AND** system SHALL maintain existing protein goal logic

#### Scenario: Smart goal calculation - Carbs
- **WHEN** calculating carbs goal
- **THEN** system SHALL use formula: `(TDEE × 0.40) / 4` grams (40% of calories from carbs)
- **AND** system SHALL assume 4 kcal per gram of carbs

#### Scenario: Smart goal calculation - Fat
- **WHEN** calculating fat goal
- **THEN** system SHALL use formula: `(TDEE × 0.30) / 9` grams (30% of calories from fat)
- **AND** system SHALL assume 9 kcal per gram of fat

#### Scenario: Quick-add macros
- **WHEN** user clicks "Schnell hinzufügen" button
- **THEN** system SHALL open tabbed modal with 4 tabs: Kalorien, Protein, Kohlenhydrate, Fett
- **AND** each tab SHALL provide quick-add buttons:
  - Kalorien: +100, +200, +300 kcal
  - Protein: +10g, +20g, +30g
  - Kohlenhydrate: +25g, +50g, +100g
  - Fett: +10g, +20g, +30g
- **WHEN** user clicks quick-add button
- **THEN** system SHALL increment respective macro immediately

#### Scenario: Edit macros (exact input)
- **WHEN** user clicks "Bearbeiten" button
- **THEN** system SHALL open modal with input fields for all 4 macros
- **AND** system SHALL allow numeric input for calories (kcal), protein (g), carbs (g), fat (g)
- **AND** system SHALL pre-fill with current values
- **WHEN** user clicks save
- **THEN** system SHALL replace total macros with exact values
- **AND** system SHALL update `tracking[date]` with all 4 macro values

#### Scenario: Macros from food notes (NEW)
- **WHEN** user adds food note with macro fields (calories, proteinG, carbsG, fatG)
- **THEN** system SHALL sync all macros to daily smartContributions
- **AND** system SHALL include in NutritionTile totals via useCombinedTracking
- **AND** system SHALL aggregate all food events per day
- **WHEN** user has both manual macro entry AND food notes
- **THEN** system SHALL sum manual + smart contributions for each macro

#### Scenario: Nutrition tile hints
- **WHEN** any macros come from food notes (smartContributions > 0)
- **THEN** system SHALL display hint "🔗 Enthält Essen aus Notizen"
- **WHEN** goals are auto-calculated from body composition
- **THEN** system SHALL display hint "💡 Ziel basiert auf Gewicht & KFA"
- **WHEN** user has manual goals OR no smart contributions
- **THEN** system SHALL hide respective hints (clean UI)

#### Scenario: Missing body composition data
- **WHEN** user has no weight data
- **THEN** system SHALL display "Gewicht festlegen" message for all goal calculations
- **WHEN** user has weight but no body fat %
- **THEN** system SHALL use fallback TDEE calculation (32 kcal per kg)
- **AND** system SHALL hide "KFA" part of hint ("💡 Ziel basiert auf Gewicht")

#### Scenario: Mobile layout
- **WHEN** viewing on mobile viewport (< 768px)
- **THEN** system SHALL display macros in compact 2-column grid:
  - Row 1: Kalorien (full width with progress bar)
  - Row 2: Protein | Kohlenhydrate
  - Row 3: Fett | (empty)
- **WHEN** viewing on desktop viewport (≥ 768px)
- **THEN** system SHALL use tile-grid-2 for flush alignment with other tiles

## Technical Notes

### Macro Data Flow
```
Food Note (NotesPage)
  ↓
FoodEvent {calories, proteinG, carbsG, fatG}
  ↓
trackingSync.ts (case 'food')
  ↓
smartContributions.{calories, protein, carbsG, fatG} += event values
  ↓
useCombinedTracking()
  ↓
NutritionTile displays combined totals (manual + smart)
```

### Goal Calculation Flow
```
User Profile (weight, bodyFat, gender)
  ↓
nutrition.ts utilities
  ↓
calculateTDEE(weight, bodyFat, gender)
  ↓
TDEE = Lean Body Mass × 40 kcal (or weight × 32 kcal fallback)
  ↓
Macro Goals:
  - Protein: weight × 2.0 g
  - Carbs: (TDEE × 0.40) / 4 g
  - Fat: (TDEE × 0.30) / 9 g
  ↓
NutritionTile displays goals with current/goal percentages
```

### Implementation Notes
- NutritionTile **replaces** ProteinTile (single unified tile)
- Protein sync from food notes is **already implemented** in `trackingSync.ts:66-72`
- Need to extend sync for `calories`, `carbsG`, `fatG` in same pattern
- Goal calculations abstracted to `src/utils/nutrition.ts` for testability
- Modal uses AppModal component with tabbed interface (4 tabs)

### Breaking Changes
- **Visual Change**: ProteinTile UI is replaced with NutritionTile
- **No Data Migration**: Existing tracking data remains compatible
- **Backward Compatible**: Manual protein tracking continues to work

### Future Enhancements
- User-customizable macro ratios (e.g., 40/30/30 vs 30/40/30)
- Activity level adjustment (sedentary, moderate, very active)
- Goal presets (Maintenance, Cut, Bulk)
- Macro ratio visualization (pie chart or bar chart)
