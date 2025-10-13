# User Authentication & Onboarding

## MODIFIED Requirements

### Requirement: Onboarding Flow
The system SHALL guide new users through a 10-step onboarding process to collect essential profile information.

#### Scenario: Complete onboarding sequence
- **WHEN** user signs up for the first time
- **THEN** system SHALL display onboarding flow with 10 steps:
  1. Language selection (de/en)
  2. Nickname input
  3. Profile picture upload (optional)
  4. Gender selection (male/female/diverse)
  5. Height input (cm)
  6. Body fat percentage input (optional)
  7. **Activity Level selection (NEW)**
  8. Max pushups input
  9. Activity tracking preferences
  10. Birthday input (optional)
- **AND** system SHALL show progress bar with percentage (Step X of 10, Y%)
- **AND** system SHALL allow back navigation to previous steps
- **AND** system SHALL validate required fields before proceeding

### Requirement: Activity Level Selection (NEW)
The system SHALL allow users to select their weekly activity level during onboarding for accurate calorie goal calculation.

#### Scenario: Activity level step (Step 7)
- **WHEN** user reaches Activity Level step (after Body Fat % input)
- **THEN** system SHALL display 5 activity level options:
  - **Sedentary**: Wenig Bewegung, Bürojob (🪑)
  - **Light**: 1-2x Sport pro Woche (🚶)
  - **Moderate**: 3-4x Sport pro Woche (**Default**, ⚡)
  - **Active**: 5-6x Sport pro Woche (🏃)
  - **Very Active**: Täglich Sport, körperlich anstrengender Job (💪)
- **AND** system SHALL pre-select 'Moderate' as default
- **AND** system SHALL display icon + label + description for each option
- **AND** system SHALL highlight selected option with gradient background
- **WHEN** user clicks activity level option
- **THEN** system SHALL update selection immediately
- **WHEN** user clicks "Weiter"
- **THEN** system SHALL proceed to Max Pushups step (Step 8)

#### Scenario: Activity level data persistence
- **WHEN** user completes onboarding
- **THEN** system SHALL save `activityLevel` to User document in Firestore
- **AND** system SHALL use selected activity level (or 'moderate' default) for TDEE calculation
- **AND** system SHALL store activity level in `user.activityLevel` field

#### Scenario: Skipping activity level
- **WHEN** user clicks "Weiter" without selecting (uses default)
- **THEN** system SHALL save 'moderate' as activity level
- **AND** system SHALL continue onboarding flow normally

### Requirement: Onboarding Completion
The system SHALL save all collected data to Firestore and initialize user state.

#### Scenario: Save user data
- **WHEN** user clicks "Fertig" on final step (Birthday)
- **THEN** system SHALL create User document with fields:
  - `language`: Language ('de' | 'en')
  - `nickname`: string
  - `gender`: Gender ('male' | 'female' | 'diverse')
  - `height`: number (cm)
  - `weight`: number (default: 0, set later via tracking)
  - `bodyFat`: number | undefined (%)
  - `activityLevel`: ActivityLevel ('sedentary' | 'light' | 'moderate' | 'active' | 'very_active', **NEW**)
  - `maxPushups`: number
  - `birthday`: string | undefined (YYYY-MM-DD)
  - `groupCode`: string (default: '')
  - `photoURL`: string | undefined (Firebase Storage URL)
  - `shareProfilePicture`: boolean (default: true)
  - `enabledActivities`: Activity[] (default: ['pushups', 'sports', 'water', 'protein'])
  - `createdAt`: Date
  - `pushupState`: PushupState
- **AND** system SHALL upload profile picture to Firebase Storage if provided
- **AND** system SHALL initialize pushup plan based on maxPushups
- **WHEN** save succeeds
- **THEN** system SHALL update Zustand store with user data
- **AND** system SHALL set `isOnboarded` to true
- **AND** system SHALL navigate to Dashboard

#### Scenario: Save error handling
- **WHEN** Firestore save fails
- **THEN** system SHALL display error message "Fehler beim Speichern der Daten"
- **AND** system SHALL remain on current onboarding step
- **AND** system SHALL allow user to retry

## Technical Notes

### Data Model

```typescript
// src/types/index.ts
export type ActivityLevel = 'sedentary' | 'light' | 'moderate' | 'active' | 'very_active';

export interface User {
  id: string;
  language: Language;
  nickname: string;
  gender: Gender;
  height: number; // cm
  weight: number; // kg
  bodyFat?: number; // %
  activityLevel?: ActivityLevel; // NEW - Default: 'moderate'
  maxPushups: number;
  birthday?: string; // YYYY-MM-DD
  groupCode: string;
  photoURL?: string;
  shareProfilePicture?: boolean;
  enabledActivities?: Activity[];
  createdAt: Date;
  pushupState: PushupState;
}
```

### Activity Level Descriptions

| Level | German Label | English Label | Icon | Multiplier | Target Audience |
|-------|--------------|---------------|------|------------|-----------------|
| `sedentary` | Wenig Bewegung, Bürojob | Little movement, office job | 🪑 | 30 kcal/kg LBM | Desk workers, <1h activity/week |
| `light` | 1-2x Sport pro Woche | 1-2x exercise per week | 🚶 | 35 kcal/kg LBM | Casual athletes |
| `moderate` | 3-4x Sport pro Woche (**Default**) | 3-4x exercise per week (**Default**) | ⚡ | 40 kcal/kg LBM | Regular exercisers |
| `active` | 5-6x Sport pro Woche | 5-6x exercise per week | 🏃 | 45 kcal/kg LBM | Active athletes |
| `very_active` | Täglich Sport, körperlicher Job | Daily exercise, physical job | 💪 | 50 kcal/kg LBM | Professional athletes, manual laborers |

### Onboarding Step Breakdown

| Step | Field | Required | Validation | Default Value |
|------|-------|----------|------------|---------------|
| 1 | `language` | ✅ | Must be 'de' or 'en' | 'de' |
| 2 | `nickname` | ✅ | Non-empty string | - |
| 3 | `photoURL` | ❌ | Valid file (if provided) | undefined |
| 4 | `gender` | ✅ | 'male' \| 'female' \| 'diverse' | 'male' |
| 5 | `height` | ✅ | > 0 | - |
| 6 | `bodyFat` | ❌ | 0-100 range | undefined |
| 7 | `activityLevel` | ✅ (**NEW**) | ActivityLevel type | **'moderate'** |
| 8 | `maxPushups` | ✅ | > 0 | - |
| 9 | `enabledActivities` | ✅ | Min 1 activity | ['pushups', 'sports', 'water', 'protein'] |
| 10 | `birthday` | ❌ | Valid date | undefined |

### UI Implementation

**Activity Level Step (src/pages/OnboardingPage.tsx:397+)**

```tsx
{!birthdayOnly && step === 7 && (
  <div className="space-y-4">
    <h2 className="text-fluid-h2 font-semibold text-white">Wie aktiv bist du?</h2>
    <p className="text-sm text-white/70">Dies hilft uns bei der Berechnung deines Kalorienziels</p>
    <div className="space-y-3">
      {[
        { value: 'sedentary', label: 'Wenig Bewegung, Bürojob', icon: '🪑' },
        { value: 'light', label: '1-2x Sport pro Woche', icon: '🚶' },
        { value: 'moderate', label: '3-4x Sport pro Woche (Empfohlen)', icon: '⚡' },
        { value: 'active', label: '5-6x Sport pro Woche', icon: '🏃' },
        { value: 'very_active', label: 'Täglich Sport, körperlicher Job', icon: '💪' },
      ].map((option) => (
        <button
          key={option.value}
          onClick={() => setActivityLevel(option.value)}
          className={`flex w-full items-center gap-3 rounded-2xl border px-5 py-3.5 transition-all ${
            activityLevel === option.value
              ? 'border-transparent bg-gradient-to-r from-winter-500/90 via-sky-500/90 to-winter-400/90 text-white shadow-[0_12px_40px_rgba(56,189,248,0.35)]'
              : 'border-white/10 bg-white/10 text-white/80 hover:border-white/20 hover:bg-white/10'
          }`}
        >
          <span className="text-2xl">{option.icon}</span>
          <span className="font-semibold text-white">{option.label}</span>
        </button>
      ))}
    </div>
  </div>
)}
```

### Breaking Changes

- **Step Numbering**: Max Pushups moves from Step 7 → Step 8, Activities from Step 8 → Step 9, Birthday from Step 9 → Step 10
- **totalSteps**: Changes from 9 → 10 in OnboardingPage.tsx:32
- **canProceed()**: Add validation for step 7 (activity level, always returns true since default exists)
- **handleComplete()**: Add `activityLevel` to newUser object

### Migration

- **Existing users** without `activityLevel` field will default to 'moderate' in nutrition calculations (handled in `nutrition.ts`)
- **No data migration required** - Backward compatible with existing User documents

### Future Enhancements

- Allow editing Activity Level in Settings page (see settings spec)
- Display current Activity Level in Dashboard NutritionTile hint
- Track Activity Level changes over time for trend analysis
- AI-suggested Activity Level based on workout frequency
