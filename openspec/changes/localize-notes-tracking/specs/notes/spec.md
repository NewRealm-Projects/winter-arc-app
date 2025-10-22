# Notes (Structured Quick Logging System)

## REMOVED Requirements

### ~~Requirement: Smart Note Entry~~ [REMOVED]
AI-powered free-form text parsing removed due to cost and reliability issues.

### ~~Requirement: Note processing~~ [REMOVED]
Gemini API integration removed entirely.

### ~~Requirement: Note Management (Edit/Retry)~~ [REMOVED]
Edit and retry functionality removed with AI processing.

## MODIFIED Requirements

### Requirement: Food Event Tracking [MODIFIED]
The system SHALL support food entries with complete macronutrient tracking via **embedded database or manual entry**.

#### Scenario: Food database search [NEW]
- **WHEN** user opens food log modal
- **THEN** system SHALL provide search input with autocomplete
- **AND** system SHALL query embedded food database (200+ items)
- **AND** system SHALL support category filtering (fruits, vegetables, proteins, etc.)
- **AND** system SHALL display results with name and nutrition preview

#### Scenario: Food serving selection [NEW]
- **WHEN** user selects food from database
- **THEN** system SHALL display common serving sizes (e.g., "1 medium (120g)")
- **AND** system SHALL allow custom portion input in grams
- **AND** system SHALL calculate nutrition via `calculateNutrition(foodItem, portionGrams)`
- **AND** system SHALL display real-time nutrition preview

#### Scenario: Manual food entry [NEW]
- **WHEN** food not in database
- **THEN** system SHALL provide manual entry tab
- **AND** system SHALL accept food name, calories, protein, carbs, fat inputs
- **AND** system SHALL validate inputs (0-10000 kcal, 0-500g macros)
- **AND** system SHALL auto-calculate calories from macros option (4-4-9 rule)

#### Scenario: Food event creation [MODIFIED]
- **WHEN** user saves food log
- **THEN** system SHALL create `FoodEvent` with label, calories, proteinG, carbsG, fatG
- **AND** system SHALL set `source: 'manual'` and `confidence: 1.0`
- **AND** system SHALL update DailyTracking directly (no intermediate note)

### Requirement: Tracking Integration [MODIFIED]
The system SHALL sync structured log entries to dashboard tracking **immediately**.

#### Scenario: Direct tracking update [NEW]
- **WHEN** user saves any quick log entry
- **THEN** system SHALL update DailyTracking in Firestore immediately (<100ms)
- **AND** system SHALL use optimistic UI updates
- **AND** system SHALL queue updates when offline
- **AND** system SHALL sync when reconnected

#### Scenario: Event history storage [NEW]
- **WHEN** structured log entry is saved
- **THEN** system SHALL create Event record with timestamp
- **AND** system SHALL store in `users/{userId}/events/{eventId}` collection
- **AND** system SHALL display in TodayActivitySection timeline

### Requirement: Event Badges [MODIFIED]
The system SHALL display visual badges for all **manually logged** event types.

#### Scenario: Food event badge [MODIFIED]
- **WHEN** viewing food event
- **THEN** system SHALL display "🍎 {label} · {calories} kcal"
- **AND** system SHALL show macros if available: "· {proteinG}g P · {carbsG}g C · {fatG}g F"
- **AND** system SHALL hide missing fields gracefully

#### ~~Scenario: Low confidence warning~~ [REMOVED]
No confidence warnings needed for manual entries (always 1.0).

## ADDED Requirements

### Requirement: Quick Log Panel [NEW]
The system SHALL provide quick action buttons for all tracking types.

#### Scenario: Quick action display
- **WHEN** viewing Notes Page
- **THEN** system SHALL display QuickLogPanel with 5 action buttons:
  - 🥤 Drink
  - 🍎 Food
  - 💪 Pushups
  - 🏃 Workout
  - ⚖️ Weight
- **AND** system SHALL use responsive grid layout (2 cols mobile, 5 cols desktop)
- **AND** system SHALL use consistent tile styling

#### Scenario: Quick action click
- **WHEN** user clicks quick action button
- **THEN** system SHALL open corresponding modal (DrinkLogModal, FoodLogModal, etc.)
- **AND** system SHALL pre-populate with current date
- **AND** system SHALL focus first input field

### Requirement: Drink Quick Log [NEW]
The system SHALL allow quick logging of beverages with direct hydration integration.

#### Scenario: Drink log modal
- **WHEN** user clicks "Drink" quick action
- **THEN** system SHALL open DrinkLogModal
- **AND** system SHALL display beverage type selector (water, coffee, tea, protein, other)
- **AND** system SHALL display user's custom hydration presets
- **AND** system SHALL allow manual amount input (ml)
- **AND** system SHALL allow optional text note

#### Scenario: Save drink log
- **WHEN** user clicks "Save" in DrinkLogModal
- **THEN** system SHALL update `DailyTracking.water` by amount (ml)
- **AND** system SHALL create DrinkEvent for history
- **AND** system SHALL close modal and show success feedback
- **AND** system SHALL update HydrationTile immediately

### Requirement: Pushup Quick Log [NEW]
The system SHALL allow quick logging of pushups.

#### Scenario: Pushup log modal
- **WHEN** user clicks "Pushups" quick action
- **THEN** system SHALL open PushupLogModal
- **AND** system SHALL display count input with increment/decrement buttons
- **AND** system SHALL allow optional text note

#### Scenario: Save pushup log
- **WHEN** user clicks "Save" in PushupLogModal
- **THEN** system SHALL update `DailyTracking.pushups.total` by count
- **AND** system SHALL create PushupEvent for history
- **AND** system SHALL close modal

### Requirement: Workout Quick Log [NEW]
The system SHALL allow quick logging of workouts.

#### Scenario: Workout log modal
- **WHEN** user clicks "Workout" quick action
- **THEN** system SHALL open WorkoutLogModal
- **AND** system SHALL display sport dropdown (HIIT/Hyrox, Cardio, Gym, Swimming, Football, Other)
- **AND** system SHALL display duration input (minutes)
- **AND** system SHALL display intensity selector (Easy, Moderate, Hard)
- **AND** system SHALL allow optional text note

#### Scenario: Save workout log
- **WHEN** user clicks "Save" in WorkoutLogModal
- **THEN** system SHALL update `DailyTracking.sports` with sport entry
- **AND** system SHALL create WorkoutEvent for history
- **AND** system SHALL close modal

### Requirement: Weight Quick Log [NEW]
The system SHALL allow quick logging of weight and body fat.

#### Scenario: Weight log modal
- **WHEN** user clicks "Weight" quick action
- **THEN** system SHALL open WeightLogModal
- **AND** system SHALL display weight input (kg, decimal support)
- **AND** system SHALL display optional body fat input (%)
- **AND** system SHALL calculate and display BMI

#### Scenario: Save weight log
- **WHEN** user clicks "Save" in WeightLogModal
- **THEN** system SHALL update `DailyTracking.weight.value` and `bodyFat`
- **AND** system SHALL create WeightEvent for history
- **AND** system SHALL close modal
- **AND** system SHALL update WeightTile chart

### Requirement: Food Database [NEW]
The system SHALL provide embedded nutrition database for common foods.

#### Scenario: Database structure
- **WHEN** system loads
- **THEN** food database SHALL contain 200+ items
- **AND** each FoodItem SHALL include: id, name (DE/EN), category, calories, proteinG, carbsG, fatG per 100g
- **AND** each FoodItem SHOULD include common serving sizes
- **AND** database SHALL be embedded in bundle (~50KB gzipped)

#### Scenario: Database curation
- **WHEN** expanding database
- **THEN** system SHALL prioritize most commonly logged foods
- **AND** system SHALL source data from USDA FoodData Central
- **AND** system SHALL accept community contributions via PRs

#### Scenario: Search performance
- **WHEN** user searches food database
- **THEN** search SHALL complete in <50ms
- **AND** search SHALL support fuzzy matching (Levenshtein distance)
- **AND** search SHALL support both DE and EN names
- **AND** search SHALL support keyword matching

### Requirement: Archived Notes View [NEW]
The system SHALL display legacy AI-processed notes in read-only view.

#### Scenario: Archive display
- **WHEN** viewing Notes Page
- **THEN** system SHALL display "Archived Notes" section below today's activity
- **AND** system SHALL load existing SmartNotes from noteStore
- **AND** system SHALL display chronologically (newest first)
- **AND** system SHALL show "Legacy Note" badge

#### Scenario: Archive read-only
- **WHEN** viewing archived note
- **THEN** system SHALL display raw text, summary, and events
- **AND** system SHALL NOT show edit/delete buttons
- **AND** system SHALL NOT allow modifications
- **AND** events SHALL still contribute to historical tracking

### Requirement: Today's Activity Timeline [NEW]
The system SHALL display all events logged today in chronological order.

#### Scenario: Timeline display
- **WHEN** viewing Notes Page
- **THEN** system SHALL display "Today's Activity" section
- **AND** system SHALL load all events for current date
- **AND** system SHALL sort chronologically (newest first)
- **AND** system SHALL display event badges with timestamps

#### Scenario: Empty state
- **WHEN** no events logged today
- **THEN** system SHALL display "No activity logged yet" message
- **AND** system SHALL show quick log panel prominently

## Technical Notes

### Implementation Files
**Removed:**
- `src/services/gemini.ts` [DELETED]

**Modified:**
- `src/features/notes/pipeline.ts` - Simplified to direct event creation
- `src/pages/NotesPage.tsx` - Complete UI overhaul

**New:**
- `src/components/notes/QuickLogPanel.tsx` - Quick action buttons
- `src/components/notes/DrinkLogModal.tsx` - Drink logging
- `src/components/notes/FoodLogModal.tsx` - Food logging with database
- `src/components/notes/WorkoutLogModal.tsx` - Workout logging
- `src/components/notes/WeightLogModal.tsx` - Weight logging
- `src/components/notes/PushupLogModal.tsx` - Pushup logging
- `src/components/notes/ArchivedNotesView.tsx` - Legacy notes view
- `src/components/notes/TodayActivitySection.tsx` - Event timeline
- `src/data/foodDatabase.ts` - Embedded nutrition data
- `src/utils/foodSearch.ts` - Fuzzy search implementation
- `src/utils/nutritionCalculator.ts` - Portion-based calculations

### Data Model
```typescript
interface FoodItem {
  id: string;
  name: { de: string; en: string };
  category: 'fruits' | 'vegetables' | 'proteins' | 'grains' | 'dairy' | 'snacks' | 'beverages';
  calories: number;      // per 100g
  proteinG: number;      // per 100g
  carbsG: number;        // per 100g
  fatG: number;          // per 100g
  fiberG?: number;       // per 100g, optional
  commonServings?: Array<{
    name: { de: string; en: string };
    grams: number;
  }>;
  keywords?: string[];   // Additional search terms
}

// Event now includes 'manual' source
interface Event {
  // ... existing fields
  source: 'heuristic' | 'llm' | 'manual'; // 'manual' added
}
```

### Dependencies
**Removed:**
- `@google/generative-ai` [REMOVED from package.json]

**Retained:**
- Zustand (state management)
- IndexedDB (noteStore for archived notes)
- date-fns (timestamp formatting)
- useCombinedTracking (dashboard sync)

**New:**
- Embedded food database (no external dependency)
- Levenshtein distance algorithm (for fuzzy search)

### Data Flow
**Before (AI-powered):**
```
User Input → parseHeuristic → Gemini API → mergeEvents → SmartNote → Dashboard
```

**After (Structured):**
```
User Input → Structured Form → Direct Event → DailyTracking → Dashboard
```

### Performance Impact
- **Latency**: 2-8s → <100ms (20-80x faster)
- **Cost**: $150-1500/month → $0/month
- **Offline**: 0% → 100% functional
- **Bundle size**: +50KB gzipped (food database)
- **Error rate**: ~5% → <0.1%
