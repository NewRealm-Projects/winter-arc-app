# Notes (Smart Notes System)

## ADDED Requirements

### Requirement: Smart Note Entry
The system SHALL allow users to create text-based notes with automatic activity detection.

#### Scenario: Create smart note
- **WHEN** user enters text and clicks "Hinzufügen"
- **THEN** system SHALL create SmartNote with timestamp, raw text, and pending status
- **AND** system SHALL display optimistic UI immediately
- **AND** system SHALL process note with AI detection in background

#### Scenario: Note processing
- **WHEN** note is processed
- **THEN** system SHALL extract events (drink, protein, food, pushups, workout, rest, weight, bfp)
- **AND** system SHALL generate summary text
- **AND** system SHALL assign confidence score per event (0-1)
- **AND** system SHALL update note status to completed

#### Scenario: Note display
- **WHEN** viewing notes list
- **THEN** system SHALL display notes chronologically (newest first)
- **AND** system SHALL show relative timestamp (e.g., "5 minutes ago")
- **AND** system SHALL render event badges per note
- **AND** system SHALL mark low-confidence events with warning icon

### Requirement: Food Event Tracking
The system SHALL support food entries with complete macronutrient tracking.

#### Scenario: Food event with full macros
- **WHEN** note contains food event
- **THEN** system SHALL extract label (food name)
- **AND** system SHALL extract calories (optional, kcal)
- **AND** system SHALL extract proteinG (optional, grams)
- **AND** system SHALL extract carbsG (optional, grams)
- **AND** system SHALL extract fatG (optional, grams)

#### Scenario: Food event display
- **WHEN** rendering food event badge
- **THEN** system SHALL show label and macros in compact format
- **AND** system SHALL format as "🍽️ {label} · {calories} kcal · {proteinG}g P · {carbsG}g C · {fatG}g F"
- **AND** system SHALL hide missing fields gracefully

#### Scenario: Partial macro data
- **WHEN** food event has only some macros (e.g., just calories and protein)
- **THEN** system SHALL display available fields only
- **AND** system SHALL not show "0g" for missing macros

### Requirement: Tracking Integration
The system SHALL sync extracted events to dashboard tracking automatically.

#### Scenario: Auto-tracking enabled
- **WHEN** auto-tracking is enabled AND note is processed
- **THEN** system SHALL aggregate events per day
- **AND** system SHALL sync to smartContributions in Zustand store
- **AND** system SHALL merge with manual tracking via useCombinedTracking

#### Scenario: Protein from food notes
- **WHEN** food event has proteinG field
- **THEN** system SHALL add proteinG to daily protein contribution
- **AND** system SHALL appear in Dashboard ProteinTile total

#### Scenario: Carbs and fat tracking
- **WHEN** food event has carbsG or fatG fields
- **THEN** system SHALL aggregate per day in smartContributions
- **AND** system SHALL make available via useCombinedTracking hook

#### Scenario: Auto-tracking toggle
- **WHEN** user disables auto-tracking
- **THEN** system SHALL still detect events but NOT sync to dashboard
- **AND** system SHALL preserve user preference in localStorage

### Requirement: Note Management
The system SHALL allow editing and deleting notes.

#### Scenario: Edit note
- **WHEN** user clicks "Bearbeiten" button
- **THEN** system SHALL show textarea with raw text
- **AND** system SHALL allow modifications
- **WHEN** user clicks "Speichern"
- **THEN** system SHALL update note with new text
- **AND** system SHALL re-process note with AI detection

#### Scenario: Delete note
- **WHEN** user clicks "Löschen" button
- **THEN** system SHALL show confirmation dialog
- **WHEN** user confirms
- **THEN** system SHALL remove note from storage
- **AND** system SHALL update smartContributions to exclude deleted note events

#### Scenario: Retry processing
- **WHEN** note remains in pending status (processing failed)
- **THEN** system SHALL show "Erneut prüfen" button
- **WHEN** user clicks retry
- **THEN** system SHALL re-run AI processing

### Requirement: Image Attachments
The system SHALL support image attachments per note.

#### Scenario: Attach images
- **WHEN** user clicks "Foto aufnehmen oder wählen"
- **THEN** system SHALL open file picker or camera
- **AND** system SHALL allow multiple image selection
- **AND** system SHALL display thumbnails before submission

#### Scenario: Remove attachment
- **WHEN** user clicks × on attachment thumbnail
- **THEN** system SHALL remove attachment from pending list

#### Scenario: Submit with attachments
- **WHEN** user submits note with images
- **THEN** system SHALL include attachments in SmartNote
- **AND** system SHALL display thumbnails in note card

### Requirement: Event Badges
The system SHALL display visual badges for all detected event types.

#### Scenario: Drink event badge
- **WHEN** note contains drink event
- **THEN** system SHALL display "🥤 {volumeMl} ml {beverage}" badge

#### Scenario: Protein event badge
- **WHEN** note contains protein event
- **THEN** system SHALL display "🧬 {grams} g" badge
- **AND** system SHALL show source label if available (e.g., "Whey Protein")

#### Scenario: Pushups event badge
- **WHEN** note contains pushups event
- **THEN** system SHALL display "💪 ×{count}" badge

#### Scenario: Workout event badge
- **WHEN** note contains workout event
- **THEN** system SHALL display "🏋️ {sport} · {durationMin} min · {intensity}" badge
- **AND** system SHALL translate sport to German label (e.g., "hiit_hyrox" → "Hyrox/HIIT")

#### Scenario: Rest event badge
- **WHEN** note contains rest event
- **THEN** system SHALL display "😴 Rest-Day" badge
- **AND** system SHALL show reason if available

#### Scenario: Weight event badge
- **WHEN** note contains weight event
- **THEN** system SHALL display "⚖️ {kg} kg" badge

#### Scenario: Body fat event badge
- **WHEN** note contains bfp event
- **THEN** system SHALL display "📉 {percent} %" badge

#### Scenario: Low confidence warning
- **WHEN** event confidence < 0.5
- **THEN** system SHALL append "⚠︎ prüfen" warning to badge

## Technical Notes

### Implementation Files
- `src/pages/NotesPage.tsx` - Main notes UI
- `src/features/notes/pipeline.ts` - AI processing pipeline
- `src/features/notes/trackingSync.ts` - Dashboard integration
- `src/store/noteStore.ts` - IndexedDB storage

### Data Model
```typescript
interface SmartNote {
  id: string;
  ts: number;
  raw: string;
  summary: string;
  events: Event[];
  pending: boolean;
  attachments?: SmartNoteAttachment[];
}

interface FoodEvent {
  kind: 'food';
  id: string;
  confidence: number;
  label: string;
  calories?: number;
  proteinG?: number;
  carbsG?: number;    // NEW
  fatG?: number;      // NEW
}
```

### Dependencies
- Zustand (state management)
- IndexedDB (noteStore persistence)
- date-fns (timestamp formatting)
- useCombinedTracking (dashboard sync)
