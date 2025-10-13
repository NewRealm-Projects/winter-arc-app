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
- **THEN** system SHALL use formula based on body composition and activity level:
  - **IF** user has body fat % → TDEE = Lean Body Mass × Activity Multiplier
    - Lean Body Mass = weight(kg) × (1 - bodyFat/100)
    - Activity Multipliers:
      - Sedentary: 30 kcal/kg LBM (wenig Bewegung, Bürojob)
      - Light: 35 kcal/kg LBM (1-2x Sport/Woche)
      - Moderate: 40 kcal/kg LBM (3-4x Sport/Woche, **Default**)
      - Active: 45 kcal/kg LBM (5-6x Sport/Woche)
      - Very Active: 50 kcal/kg LBM (täglich Sport, körperlicher Job)
  - **ELSE** → TDEE = weight(kg) × (Activity Multiplier × 0.8) (fallback ohne KFA)
- **AND** system SHALL use user's `activityLevel` field (default: 'moderate')
- **AND** system SHALL display hint "💡 Ziel basiert auf Gewicht, KFA & Aktivität"

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
- **THEN** system SHALL display hint "💡 Ziel basiert auf Gewicht, KFA & Aktivität"
- **WHEN** user has no KFA
- **THEN** system SHALL display hint "💡 Ziel basiert auf Gewicht & Aktivität"
- **WHEN** user has manual goals OR no smart contributions
- **THEN** system SHALL hide respective hints (clean UI)

#### Scenario: Missing body composition data
- **WHEN** user has no weight data
- **THEN** system SHALL display "Gewicht festlegen" message for all goal calculations
- **WHEN** user has weight but no body fat %
- **THEN** system SHALL use fallback TDEE calculation (Activity Multiplier × 0.8 × weight)
- **AND** system SHALL hide "KFA" part of hint ("💡 Ziel basiert auf Gewicht & Aktivität")
- **WHEN** user has no activity level set
- **THEN** system SHALL default to 'moderate' (40 kcal/kg LBM or 32 kcal/kg without KFA)

#### Scenario: Mobile layout
- **WHEN** viewing on mobile viewport (< 768px)
- **THEN** system SHALL display macros in compact 2-column grid:
  - Row 1: Kalorien (full width with progress bar)
  - Row 2: Protein | Kohlenhydrate
  - Row 3: Fett | (empty)
- **WHEN** viewing on desktop viewport (≥ 768px)
- **THEN** system SHALL use tile-grid-2 for flush alignment with other tiles

#### Scenario: Error Handling - Invalid weight
- **WHEN** weight ≤ 0 OR weight is NaN OR weight is undefined
- **THEN** system SHALL return null for all goal calculations (TDEE, Protein, Carbs, Fat)
- **AND** system SHALL display "Gewicht festlegen" placeholder in NutritionTile
- **AND** system SHALL show "⚠️ Setze dein Gewicht in den Einstellungen" hint
- **AND** system SHALL disable quick-add buttons (no goal to track towards)

#### Scenario: Error Handling - Invalid body fat percentage
- **WHEN** bodyFat < 0 OR bodyFat > 100
- **THEN** system SHALL use fallback TDEE calculation (ignore invalid bodyFat)
- **AND** system SHALL log warning to console: "Invalid body fat percentage: {value}"
- **AND** system SHALL calculate TDEE as: weight × (Activity Multiplier × 0.8)
- **AND** system SHALL hide "KFA" from goal hint (only show "Gewicht & Aktivität")

#### Scenario: Error Handling - Extreme calorie values
- **WHEN** calculated TDEE > 5000 kcal OR < 1000 kcal
- **THEN** system SHALL log warning: "Extreme TDEE calculated: {tdee} kcal"
- **AND** system SHALL still display value (may be valid for athletes/small users)
- **AND** system SHALL NOT cap or modify calculated value
- **AND** system SHALL allow user to override with manual goal in Settings (future enhancement)

#### Scenario: Error Handling - Save macro failure
- **WHEN** updateDayTracking() fails (Firestore error, network error)
- **THEN** system SHALL display error toast "Fehler beim Speichern"
- **AND** system SHALL revert optimistic UI update
- **AND** system SHALL allow user to retry save operation
- **AND** system SHALL log error to Sentry with context (userId, date, macro values)

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

### Quick-Add Modal UI Structure

```tsx
// NutritionTile.tsx - Quick-Add Modal
<AppModal
  open={showQuickAddModal}
  onClose={() => setShowQuickAddModal(false)}
  title="Makros hinzufügen"
  subtitle="Wähle ein Makro und füge es schnell hinzu"
  icon={<span className="text-2xl">🍽️</span>}
  size="md"  // 512px max-width
  footer={
    <ModalSecondaryButton onClick={() => setShowQuickAddModal(false)}>
      Schließen
    </ModalSecondaryButton>
  }
>
  <div className="space-y-4">
    {/* Tab Navigation */}
    <div className="flex gap-2 border-b border-gray-200 dark:border-gray-700">
      {['Kalorien', 'Protein', 'Kohlenhydrate', 'Fett'].map((tab) => (
        <button
          key={tab}
          onClick={() => setActiveTab(tab)}
          className={`px-4 py-2 text-sm font-semibold border-b-2 transition ${
            activeTab === tab
              ? 'border-orange-500 text-orange-600 dark:text-orange-400'
              : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
          }`}
        >
          {tab}
        </button>
      ))}
    </div>

    {/* Tab Content */}
    <div className="grid grid-cols-3 gap-2">
      {activeTab === 'Kalorien' && [100, 200, 300].map((amount) => (
        <button
          key={amount}
          onClick={() => addCalories(amount)}
          className="px-4 py-3 bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-700 text-orange-600 dark:text-orange-400 rounded-lg hover:bg-orange-100 dark:hover:bg-orange-900/30 transition font-medium text-sm"
        >
          +{amount} kcal
        </button>
      ))}
      {/* Similar for Protein, Carbs, Fat */}
    </div>
  </div>
</AppModal>
```

**AppModal Props:**
- `open`: boolean (controlled state)
- `onClose`: () => void (close handler)
- `title`: string (modal header)
- `subtitle`: string (optional description)
- `icon`: ReactNode (optional icon)
- `size`: 'sm' | 'md' | 'lg' | 'xl' (default: 'md')
- `footer`: ReactNode (buttons)
- `preventCloseOnBackdrop`: boolean (default: false, allows Escape to close)

**Tab State Management:**
```typescript
const [showQuickAddModal, setShowQuickAddModal] = useState(false);
const [activeTab, setActiveTab] = useState<'Kalorien' | 'Protein' | 'Kohlenhydrate' | 'Fett'>('Kalorien');
```

### Mobile CSS Implementation

**Breakpoint:** `768px` (md: in Tailwind)

**Desktop Layout (≥ 768px):**
```tsx
<div className="tile-grid-2">
  {/* NutritionTile uses shared grid with other tracking tiles */}
  <NutritionTile />
  <PushupTile />
  <WaterTile />
</div>
```

**Mobile Layout (< 768px):**
```css
/* Tile Grid (shared across tracking tiles) */
.tile-grid-2 {
  display: grid;
  grid-template-columns: 1fr;
  gap: 0.75rem; /* 12px */
}

@media (min-width: 768px) {
  .tile-grid-2 {
    grid-template-columns: repeat(2, 1fr);
    gap: 1rem; /* 16px */
  }
}

/* NutritionTile Internal Layout */
.nutrition-tile {
  display: flex;
  flex-direction: column;
  gap: 1rem; /* 16px */
}

.nutrition-tile__macros {
  display: grid;
  grid-template-columns: 1fr; /* Mobile: Full width */
  gap: 0.75rem; /* 12px */
}

@media (min-width: 768px) {
  .nutrition-tile__macros {
    grid-template-columns: repeat(2, 1fr); /* Desktop: 2 columns */
    gap: 1rem; /* 16px */
  }
}
```

**Compact Macro Display (Mobile):**
```tsx
<div className="space-y-2">
  {/* Calories - Full width with progress bar */}
  <div className="col-span-full">
    <div className="flex justify-between text-sm mb-1">
      <span className="text-gray-600 dark:text-gray-400">Kalorien</span>
      <span className="font-bold">1850 / 2200 kcal (84%)</span>
    </div>
    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
      <div className="bg-gradient-to-r from-orange-400 to-orange-600 h-2 rounded-full" style={{ width: '84%' }} />
    </div>
  </div>

  {/* Protein & Carbs - 2 column grid on mobile */}
  <div className="grid grid-cols-2 gap-2 text-xs">
    <div>
      <span className="text-gray-500 dark:text-gray-400">Protein</span>
      <p className="font-semibold">140 / 160 g (88%)</p>
    </div>
    <div>
      <span className="text-gray-500 dark:text-gray-400">Kohlenhydrate</span>
      <p className="font-semibold">180 / 220 g (82%)</p>
    </div>
  </div>

  {/* Fat - Full width or 1 column */}
  <div className="text-xs">
    <span className="text-gray-500 dark:text-gray-400">Fett</span>
    <p className="font-semibold">60 / 73 g (82%)</p>
  </div>
</div>
```

**Padding & Spacing:**
- Tile padding: `p-3` (12px) mobile, `p-4` (16px) desktop (from `designTokens.padding.compact`)
- Internal gaps: `gap-2` (8px) mobile, `gap-4` (16px) desktop
- Button gaps: `gap-1.5` (6px) consistently

### Implementation Notes
- NutritionTile **replaces** ProteinTile (single unified tile)
- Protein sync from food notes is **already implemented** in `trackingSync.ts:66-72`
- Need to extend sync for `calories`, `carbsG`, `fatG` in same pattern
- Goal calculations abstracted to `src/utils/nutrition.ts` for testability
- Modal uses AppModal component with tabbed interface (4 tabs)
- Uses `getTileClasses()` for consistent glass styling (from `theme/tokens.ts`)
- Responsive grid uses Tailwind's `md:` breakpoint (768px)

### Breaking Changes
- **Visual Change**: ProteinTile UI is replaced with NutritionTile
- **No Data Migration**: Existing tracking data remains compatible
- **Backward Compatible**: Manual protein tracking continues to work

### Future Enhancements
- User-customizable macro ratios (e.g., 40/30/30 vs 30/40/30)
- Goal presets (Maintenance, Cut, Bulk)
- Macro ratio visualization (pie chart or bar chart)
- Manual goal overrides (allow user to set custom TDEE in Settings)
