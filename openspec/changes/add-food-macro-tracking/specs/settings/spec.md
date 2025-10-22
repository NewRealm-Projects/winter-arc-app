# Settings & Profile Management

## MODIFIED Requirements

### Requirement: Profile Editing
The system SHALL allow users to edit their profile information including body composition and activity level.

#### Scenario: Edit profile button
- **WHEN** user is on Settings page in "Profile" section
- **THEN** system SHALL display profile summary with current values:
  - Language (🇩🇪 Deutsch / 🇺🇸 English)
  - Nickname
  - Gender (Männlich/Weiblich/Divers)
  - Height (cm)
  - Weight (kg)
  - Body Fat % (if set)
  - Activity Level (**NEW**)
  - Max Pushups
- **AND** system SHALL show "Profil bearbeiten" button
- **WHEN** user clicks "Profil bearbeiten"
- **THEN** system SHALL enter edit mode with input fields pre-filled

#### Scenario: Edit Activity Level (NEW)
- **WHEN** user is in profile edit mode
- **THEN** system SHALL display Activity Level section with current selection highlighted
- **AND** system SHALL provide 5 radio button/toggle options:
  - 🪑 Wenig Bewegung, Bürojob (Sedentary)
  - 🚶 1-2x Sport pro Woche (Light)
  - ⚡ 3-4x Sport pro Woche (Moderate, **Default**)
  - 🏃 5-6x Sport pro Woche (Active)
  - 💪 Täglich Sport, körperlicher Job (Very Active)
- **WHEN** user selects different activity level
- **THEN** system SHALL update selection immediately (optimistic UI)
- **AND** system SHALL show visual feedback (gradient background on selected option)

#### Scenario: Save profile changes
- **WHEN** user clicks "Speichern"
- **THEN** system SHALL validate all required fields:
  - Nickname: non-empty string
  - Height: > 0
  - Weight: >= 0
  - Body Fat: 0-100 range (if provided)
  - Activity Level: valid ActivityLevel value
  - Max Pushups: > 0
- **AND** system SHALL call `updateUser(userId, updates)` with all modified fields
- **AND** system SHALL include `activityLevel` in updates object
- **WHEN** update succeeds
- **THEN** system SHALL update Zustand store with new profile data
- **AND** system SHALL exit edit mode
- **AND** system SHALL display success message "Profil aktualisiert"
- **AND** system SHALL **immediately recalculate TDEE and nutrition goals** in Dashboard

#### Scenario: Cancel profile editing
- **WHEN** user clicks "Abbrechen"
- **THEN** system SHALL discard all changes
- **AND** system SHALL restore original values
- **AND** system SHALL exit edit mode

#### Scenario: Activity Level impact on nutrition goals
- **WHEN** user changes Activity Level in Settings
- **AND** saves profile changes
- **THEN** system SHALL trigger TDEE recalculation in `nutrition.ts`
- **AND** system SHALL update calorie goal in NutritionTile
- **AND** system SHALL update carbs goal (40% of new TDEE)
- **AND** system SHALL update fat goal (30% of new TDEE)
- **AND** system SHALL display updated hint "💡 Ziel basiert auf Gewicht, KFA & Aktivität"
- **AND** system SHALL reflect new goals immediately (no page refresh required)

### Requirement: Activity Level Display
The system SHALL display current Activity Level in profile summary.

#### Scenario: Activity Level in profile summary
- **WHEN** viewing Settings profile section (not in edit mode)
- **THEN** system SHALL display Activity Level in profile summary list
- **AND** system SHALL show German label with icon:
  - "🪑 Wenig Bewegung, Bürojob" (sedentary)
  - "🚶 1-2x Sport/Woche" (light)
  - "⚡ 3-4x Sport/Woche" (moderate)
  - "🏃 5-6x Sport/Woche" (active)
  - "💪 Täglich Sport" (very_active)
- **AND** system SHALL position Activity Level after Body Fat% (if set) or after Weight

#### Scenario: Missing Activity Level (legacy users)
- **WHEN** user has no `activityLevel` field (legacy data)
- **THEN** system SHALL display "⚡ 3-4x Sport/Woche (Standard)" as default
- **AND** system SHALL use 'moderate' for all nutrition calculations
- **AND** system SHALL allow user to edit and save Activity Level (creates field)

## Technical Notes

### Implementation Files

- `src/pages/SettingsPage.tsx` - Settings UI and profile editing
- `src/services/firestoreService.ts` - `updateUser()` function
- `src/utils/nutrition.ts` - TDEE calculation with activity level
- `src/types/index.ts` - `ActivityLevel` type definition

### Data Flow

```
Settings Page (Edit Mode)
  ↓
User selects new Activity Level
  ↓
User clicks "Speichern"
  ↓
updateUser(userId, { activityLevel: 'active', ... })
  ↓
Firestore update
  ↓
Zustand setUser({ ...user, activityLevel: 'active' })
  ↓
Dashboard NutritionTile re-renders
  ↓
nutrition.ts: calculateTDEE(weight, 'active', bodyFat)
  ↓
New calorie goal calculated
  ↓
Macro goals recalculated (P/C/F)
  ↓
UI updates with new goals immediately
```

### Profile Summary Item (NEW)

```typescript
// Add to profileSummaryItems array in SettingsPage.tsx
const activityLevelLabels: Record<ActivityLevel, string> = {
  sedentary: '🪑 Wenig Bewegung, Bürojob',
  light: '🚶 1-2x Sport/Woche',
  moderate: '⚡ 3-4x Sport/Woche',
  active: '🏃 5-6x Sport/Woche',
  very_active: '💪 Täglich Sport',
};

profileSummaryItems.push({
  label: t('settings.activityLevel'),
  value: activityLevelLabels[user?.activityLevel ?? 'moderate'],
});
```

### Edit Mode UI (NEW)

```tsx
// Add to profile edit form in SettingsPage.tsx (after bodyFat input)
<div className="flex flex-col gap-2">
  <span className="text-xs font-semibold uppercase tracking-[0.28em] text-white/50">
    {t('settings.activityLevel')}
  </span>
  <div className="space-y-2">
    {[
      { value: 'sedentary', label: '🪑 Wenig Bewegung, Bürojob' },
      { value: 'light', label: '🚶 1-2x Sport/Woche' },
      { value: 'moderate', label: '⚡ 3-4x Sport/Woche' },
      { value: 'active', label: '🏃 5-6x Sport/Woche' },
      { value: 'very_active', label: '💪 Täglich Sport' },
    ].map((option) => (
      <button
        key={option.value}
        type="button"
        onClick={() => setEditActivityLevel(option.value as ActivityLevel)}
        className={`w-full text-left rounded-xl border px-4 py-3 text-sm font-semibold transition ${
          editActivityLevel === option.value
            ? 'border-transparent bg-white text-winter-900 shadow-[0_14px_40px_rgba(15,23,42,0.35)]'
            : 'border-white/20 bg-white/10 text-white/80 hover:border-white/30 hover:bg-white/15'
        }`}
      >
        {option.label}
      </button>
    ))}
  </div>
</div>
```

### State Management

```typescript
// Add to SettingsPage.tsx state
const [editActivityLevel, setEditActivityLevel] = useState<ActivityLevel>('moderate');

// Update handleEditProfile()
const handleEditProfile = () => {
  if (!user) return;
  // ... existing fields
  setEditActivityLevel(user.activityLevel || 'moderate');
  setIsEditingProfile(true);
};

// Update handleSaveProfile()
const handleSaveProfile = async () => {
  if (!user) return;

  const updates = {
    // ... existing fields
    activityLevel: editActivityLevel, // NEW
  };

  const result = await updateUser(user.id, updates);

  if (result.success) {
    setUser({ ...user, ...updates });
    setIsEditingProfile(false);
    alert(t('settings.profileUpdated'));
  }
};
```

### Breaking Changes

**None** - Additive change only. Existing profiles without `activityLevel` use 'moderate' default.

### Migration

- **Existing users** without `activityLevel` field will see "⚡ 3-4x Sport/Woche (Standard)" in profile summary
- **On first edit**, Activity Level will be saved to Firestore and become persistent
- **No forced migration** - Only saved when user explicitly edits profile

### i18n Keys (NEW)

```json
{
  "settings.activityLevel": "Aktivitätslevel",
  "settings.activityLevelDescription": "Wie oft trainierst du pro Woche?",
  "settings.activityLevelSedentary": "Wenig Bewegung, Bürojob",
  "settings.activityLevelLight": "1-2x Sport pro Woche",
  "settings.activityLevelModerate": "3-4x Sport pro Woche",
  "settings.activityLevelActive": "5-6x Sport pro Woche",
  "settings.activityLevelVeryActive": "Täglich Sport, körperlicher Job"
}
```

### Future Enhancements

- Activity Level change history/log (track when user changes from 'moderate' to 'active')
- AI-suggested Activity Level based on workout frequency (analyze last 4 weeks of training data)
- Weekly Activity Level auto-adjustment (suggest increase if user consistently hits 5+ workouts/week)
- Activity Level trends chart (show how user's activity has evolved over months)
