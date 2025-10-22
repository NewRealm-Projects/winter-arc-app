# Input

Activity logging interface with quick-action modals, contextualized journaling, smart truncation, and custom notes.

## Purpose

Provide centralized hub for logging all daily activities (drinks, food, workouts, weight, pushups) with structured input forms, contextual activity summaries with smart truncation for readability, and freeform custom notes for journaling.

## Requirements

### Requirement: Input Page Layout
The system SHALL provide quick-action buttons for all loggable activities and custom note creation.

#### Scenario: Page display
- **WHEN** viewing Input page at `/input`
- **THEN** system SHALL display "Input" as page title
- **AND** system SHALL show QuickLogPanel with 5 action buttons
- **AND** system SHALL show "+ New Note" button for custom notes
- **AND** system SHALL show Notes section below (if notes exist)

#### Scenario: Navigation
- **WHEN** user navigates to Input page
- **THEN** bottom nav SHALL highlight "Input" tab
- **AND** route SHALL be `/input`

### Requirement: Quick Action Buttons
The system SHALL provide 5 quick-action buttons for logging activities.

#### Scenario: Button display
- **WHEN** viewing QuickLogPanel
- **THEN** system SHALL display 5 buttons in grid layout:
  - 🥤 Drink (blue)
  - 🍎 Food (green)
  - 💪 Pushups (purple)
  - 🏃 Workout (orange)
  - ⚖️ Weight (indigo)
- **AND** buttons SHALL be responsive (2 columns mobile, 5 columns desktop)

#### Scenario: Button click
- **WHEN** user clicks quick action button
- **THEN** system SHALL open corresponding modal (Drink/Food/Workout/Weight)
- **OR** navigate to pushup training page if Pushups clicked

### Requirement: Modal Notes Field
The system SHALL allow users to add contextual notes when logging activities.

#### Scenario: Notes field display
- **WHEN** any logging modal is open (Drink/Food/Workout/Weight/Pushup)
- **THEN** system SHALL display "Notes" textarea at bottom
- **AND** textarea SHALL have placeholder text
- **AND** textarea SHALL be optional (can be empty)

#### Scenario: Notes submission with activity context
- **WHEN** user enters text in Notes field and saves modal
- **THEN** system SHALL save activity data to tracking
- **AND** system SHALL create note entry with:
  - `activityType`: activity type (drink, food, workout, weight, pushup)
  - `activitySummary`: truncated summary for display (max 2 items)
  - `activityDetails`: full data for hover tooltip
  - `content`: user's note text
  - `timestamp`: creation time
- **AND** note SHALL appear in Notes section feed with context label

### Requirement: Activity Summary Generation
The system SHALL generate concise summaries of logged activities for note context.

#### Scenario: Drink summary
- **WHEN** user logs drink with notes
- **THEN** system SHALL generate summary: "{amount}ml {beverage}" (e.g., "250ml Water")
- **AND** activityDetails SHALL contain same data (single item, no truncation needed)

#### Scenario: Food summary - single item
- **WHEN** user logs 1 food item with notes
- **THEN** system SHALL generate summary: "{foodName} {grams}g" (e.g., "Chicken breast 150g")
- **AND** activityDetails SHALL contain same data

#### Scenario: Food summary - manual entry
- **WHEN** user logs manual macro entry with notes
- **THEN** system SHALL generate summary: "Meal: {calories} kcal, {protein}g P" (e.g., "Meal: 450 kcal, 35g P")

#### Scenario: Food summary - multiple items (truncated)
- **WHEN** user logs 3+ food items with notes
- **THEN** system SHALL generate summary showing first 2 items: "{item1}, {item2} and X others"
- **EXAMPLE**: "Chicken 150g, Rice 200g and 3 others"
- **AND** activityDetails SHALL contain full list of all items with amounts
- **AND** X SHALL equal total items minus 2

#### Scenario: Workout summary
- **WHEN** user logs workout with notes
- **THEN** system SHALL generate summary: "{sport} • {duration}min • {intensity}" (e.g., "Cardio • 45min • Moderate")
- **WHEN** sport is "Rest"
- **THEN** system SHALL generate summary: "Rest day"

#### Scenario: Weight summary
- **WHEN** user logs weight with notes
- **THEN** system SHALL generate summary:
  - With body fat: "{weight}kg • {bodyFat}%" (e.g., "75kg • 18%")
  - Without body fat: "{weight}kg" (e.g., "75kg")

#### Scenario: Pushup summary
- **WHEN** user logs pushups with notes
- **THEN** system SHALL generate summary: "{count} reps" (e.g., "50 reps")

### Requirement: Summary Truncation with Tooltip
The system SHALL truncate long activity summaries and provide full details on hover.

#### Scenario: Truncation threshold
- **WHEN** generating activity summary
- **THEN** system SHALL use `SUMMARY_MAX_ITEMS = 2` constant
- **AND** summaries with ≤2 items SHALL display in full
- **AND** summaries with >2 items SHALL truncate

#### Scenario: Truncated summary display
- **WHEN** viewing note with truncated summary (>2 items)
- **THEN** system SHALL display: "{item1}, {item2} and {X} others"
- **AND** text SHALL have visual indicator (e.g., dotted underline on "and X others")
- **AND** cursor SHALL change to pointer on hover

#### Scenario: Hover tooltip
- **WHEN** user hovers over truncated summary
- **THEN** system SHALL display tooltip with full list of all items
- **AND** tooltip SHALL show each item on separate line
- **AND** tooltip SHALL position appropriately (avoid viewport overflow)

#### Scenario: Keyboard accessibility
- **WHEN** user focuses truncated summary via keyboard (Tab)
- **THEN** system SHALL show tooltip on focus
- **AND** tooltip SHALL hide on blur
- **AND** tooltip SHALL have proper ARIA attributes (aria-label or aria-describedby)

#### Scenario: Mobile touch support
- **WHEN** user taps truncated summary on mobile
- **THEN** system SHALL toggle tooltip visibility
- **AND** tap outside tooltip SHALL close it

### Requirement: Notes Section Display
The system SHALL display user notes with activity context labels in reverse chronological order.

#### Scenario: Notes section header
- **WHEN** viewing Notes section on Input page
- **THEN** system SHALL display "Notes" as section title
- **AND** system SHALL NOT display subtitle

#### Scenario: Note card display
- **WHEN** note is displayed in feed
- **THEN** system SHALL show:
  - Activity badge with icon and type (e.g., "🥤 Drink", "🍎 Food", "📝 Note")
  - Activity summary below badge (with truncation if needed)
  - Note content text
  - Timestamp (relative, e.g., "2 hours ago")
  - Edit and Delete buttons

#### Scenario: Activity badge colors
- **WHEN** rendering activity badge
- **THEN** system SHALL use color coding:
  - Drink: Blue (`bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400`)
  - Food: Green (`bg-green-50 text-green-600 dark:bg-green-900/20 dark:text-green-400`)
  - Pushup: Purple (`bg-purple-50 text-purple-600 dark:bg-purple-900/20 dark:text-purple-400`)
  - Workout: Orange (`bg-orange-50 text-orange-600 dark:bg-orange-900/20 dark:text-orange-400`)
  - Weight: Indigo (`bg-indigo-50 text-indigo-600 dark:bg-indigo-900/20 dark:text-indigo-400`)
  - Custom: Gray (`bg-gray-50 text-gray-600 dark:bg-gray-900/20 dark:text-gray-400`)

#### Scenario: Notes feed
- **WHEN** notes exist in system
- **THEN** system SHALL display notes in reverse chronological order (newest first)
- **AND** system SHALL support pagination (20 notes per page)

#### Scenario: Legacy SmartNotes
- **WHEN** legacy AI-generated SmartNotes exist
- **THEN** system SHALL display them in Notes section
- **AND** system SHALL show generic "📝 Note" badge if no activity metadata
- **AND** system SHALL sort them alongside new manual notes by timestamp

### Requirement: Custom Note Creation
The system SHALL allow users to create standalone notes without logging activity.

#### Scenario: New Note button
- **WHEN** viewing Input page
- **THEN** system SHALL display "+ New Note" button prominently
- **AND** button SHALL be accessible via keyboard (Tab + Enter)

#### Scenario: Custom Note modal
- **WHEN** user clicks "+ New Note"
- **THEN** system SHALL open CustomNoteModal with:
  - Title input field (optional, for summary)
  - Multi-line content textarea (required)
  - Save and Cancel buttons

#### Scenario: Save custom note
- **WHEN** user fills custom note and saves
- **THEN** system SHALL create note entry with:
  - `activityType: 'custom'`
  - `activitySummary`: title text or first 50 chars of content
  - `content`: full note text
  - `timestamp`: creation time
- **AND** note SHALL appear in feed with "📝 Note" badge

#### Scenario: Custom note validation
- **WHEN** user attempts to save empty custom note
- **THEN** system SHALL show validation error
- **AND** system SHALL not create note entry

### Requirement: Drink Logging Modal
The system SHALL provide structured drink logging interface with notes.

#### Scenario: Modal fields
- **WHEN** Drink modal is open
- **THEN** system SHALL display beverage type dropdown (Water, Protein, Coffee, Tea, Other)
- **AND** system SHALL display amount input (ml)
- **AND** system SHALL display date selector (defaults to selected date)
- **AND** system SHALL display "Notes" textarea

#### Scenario: Save drink log with notes
- **WHEN** user fills drink form with notes and clicks save
- **THEN** system SHALL add amount to daily water tracking
- **AND** system SHALL create note entry with drink context if Notes field is not empty
- **AND** modal SHALL close and show success feedback

### Requirement: Food Logging Modal
The system SHALL provide structured food logging with database search, manual entry, and notes.

#### Scenario: Food database search
- **WHEN** user types in search field
- **THEN** system SHALL fuzzy-search embedded food database
- **AND** system SHALL show matching foods with nutrition per 100g
- **AND** user SHALL select food and enter portion size

#### Scenario: Manual macro entry
- **WHEN** user switches to manual entry tab
- **THEN** system SHALL display inputs for calories, protein, carbs, fat
- **AND** system SHALL allow direct numeric entry

#### Scenario: Notes field
- **WHEN** Food modal is open
- **THEN** system SHALL display "Notes" textarea
- **AND** notes SHALL be saved with food context and summary (truncated if >2 items)

### Requirement: Workout Logging Modal
The system SHALL provide structured workout logging interface with notes.

#### Scenario: Workout form
- **WHEN** Workout modal is open
- **THEN** system SHALL display sport type dropdown (HIIT, Cardio, Gym, Swimming, Soccer, Rest)
- **AND** system SHALL display duration buttons (30/45/60/90/120 min) and custom input
- **AND** system SHALL display intensity selector (Easy/Moderate/Hard)
- **AND** system SHALL display "Notes" textarea

#### Scenario: Rest day
- **WHEN** user selects "Rest" sport type
- **THEN** system SHALL disable duration and intensity fields
- **AND** system SHALL allow only notes entry
- **AND** summary SHALL be "Rest day"

### Requirement: Weight Logging Modal
The system SHALL provide weight and body composition logging with notes.

#### Scenario: Weight form
- **WHEN** Weight modal is open
- **THEN** system SHALL display weight input (kg)
- **AND** system SHALL display optional body fat % input
- **AND** system SHALL auto-calculate and display BMI
- **AND** system SHALL display "Notes" textarea

#### Scenario: Save weight with notes
- **WHEN** user enters weight with notes and saves
- **THEN** system SHALL save to daily tracking
- **AND** system SHALL update user profile current weight
- **AND** system SHALL create note entry with weight context

### Requirement: Pushup Logging Modal
The system SHALL provide quick pushup logging interface with notes.

#### Scenario: Pushup form
- **WHEN** Pushup modal is open
- **THEN** system SHALL display add/set exact toggle
- **AND** system SHALL display numeric input
- **AND** system SHALL display current total as reference
- **AND** system SHALL display "Notes" textarea

#### Scenario: Add mode
- **WHEN** user selects "Add" mode and enters amount with notes
- **THEN** system SHALL increment current total by amount
- **AND** system SHALL create note entry with pushup context

#### Scenario: Set exact mode
- **WHEN** user selects "Set Exact" mode and enters amount
- **THEN** system SHALL replace current total with exact amount

## Technical Notes

### Implementation Files
- `src/pages/InputPage.tsx` - Main Input page (renamed from NotesPage)
- `src/components/notes/QuickLogPanel.tsx` - Quick action buttons
- `src/components/notes/CustomNoteModal.tsx` - Custom note creation modal (NEW)
- `src/components/notes/NoteCard.tsx` - Note display with activity badges (MODIFIED)
- `src/components/ui/TruncatedSummary.tsx` - Truncated text with hover tooltip (NEW)
- `src/components/notes/DrinkLogModal.tsx` - Drink logging modal
- `src/components/notes/FoodLogModal.tsx` - Food logging modal
- `src/components/notes/WorkoutLogModal.tsx` - Workout logging modal
- `src/components/notes/WeightLogModal.tsx` - Weight logging modal
- `src/components/notes/PushupLogModal.tsx` - Pushup logging modal
- `src/utils/activitySummary.ts` - Activity summary generators with truncation logic (NEW)

### Data Sources
- `tracking/{userId}/entries/{dateKey}` - Daily tracking data
- `notes/{userId}/notes/{noteId}` - User notes with activity metadata
- `noteStore` - Local notes management (Zustand)

### Note Metadata Schema
```typescript
interface Note {
  id: string;
  userId: string;
  timestamp: Date;
  content: string;
  activityType?: 'drink' | 'food' | 'workout' | 'weight' | 'pushup' | 'custom';
  activitySummary?: string; // Truncated display text (max 2 items)
  activityDetails?: string[]; // Full list for tooltip (if truncated)
  // Legacy SmartNote fields (optional, for backward compatibility)
  raw?: string;
  summary?: string;
  events?: Event[];
}
```

### Truncation Constants
```typescript
const SUMMARY_MAX_ITEMS = 2; // Show first 2 items before "and X others"
```

### Dependencies
- Zustand (state management)
- date-fns (date formatting)
- Embedded food database (foodDatabase.ts)
- Fuzzy search (foodSearch.ts)
- Tooltip library or custom implementation (for truncated summaries)

### Design Patterns
- **Structured input**: All modals use forms, no AI parsing
- **Offline-first**: All operations work without network
- **Contextualized notes**: Activity metadata for journaling context
- **Smart truncation**: Long summaries truncate with hover-to-expand
- **Unified interface**: Consistent modal design across all logging types
- **Flexible journaling**: Both activity-linked and standalone notes
