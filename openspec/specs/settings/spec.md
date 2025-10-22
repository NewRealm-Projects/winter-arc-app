# Settings

User preferences, profile management, groups, and account controls.

## Purpose

Provide centralized settings interface for activities, notifications, appearance, profile editing, group management, and account actions.

## Requirements

### Requirement: Tabbed Navigation
The system SHALL organize settings into General, Profile, and Account sections.

#### Scenario: Section switching
- **WHEN** user clicks section tab (General/Profile/Account)
- **THEN** system SHALL highlight active tab
- **AND** system SHALL display corresponding settings panel
- **AND** system SHALL show section description below tabs

### Requirement: Activity Toggle
The system SHALL allow enabling/disabling tracked activities.

#### Scenario: Activity management
- **WHEN** viewing General settings
- **THEN** system SHALL display toggle switches for: Pushups, Sports, Water, Protein
- **AND** system SHALL indicate current state (Yes/No)
- **WHEN** user toggles activity
- **THEN** system SHALL update `enabledActivities` array in Firestore
- **AND** system SHALL prevent disabling last activity (minimum 1 required)

#### Scenario: Weight tracking exception
- **WHEN** viewing activity toggles
- **THEN** system SHALL display info: "Weight is always tracked and cannot be disabled"

### Requirement: Notifications
The system SHALL support daily reminder notifications with custom time.

#### Scenario: Enable notifications
- **WHEN** user enables notifications toggle
- **THEN** system SHALL request browser notification permission
- **AND** system SHALL schedule notification for configured time (default 20:00)
- **AND** system SHALL store preference in localStorage

#### Scenario: Change notification time
- **WHEN** user clicks "Change Time" button AND notifications enabled
- **THEN** system SHALL open time modal with time picker
- **WHEN** user saves new time
- **THEN** system SHALL reschedule notification for new time
- **AND** system SHALL calculate time until next notification

#### Scenario: Test notification
- **WHEN** user clicks "Test Notification" button AND permission granted
- **THEN** system SHALL send immediate test notification with configured time
- **WHEN** permission denied or not granted
- **THEN** system SHALL alert user

### Requirement: Appearance Toggle
The system SHALL provide dark mode toggle using ThemeToggle component.

#### Scenario: Theme switching
- **WHEN** viewing General settings
- **THEN** system SHALL display ThemeToggle button
- **WHEN** user toggles theme
- **THEN** system SHALL switch between light/dark mode
- **AND** system SHALL persist preference

### Requirement: PWA Installation
The system SHALL support Progressive Web App installation with platform-specific instructions.

#### Scenario: Install prompt
- **WHEN** user clicks "Install" button AND install prompt available
- **THEN** system SHALL trigger browser install prompt
- **AND** system SHALL await user choice (accepted/dismissed)
- **AND** system SHALL clear prompt if accepted

#### Scenario: iOS install instructions
- **WHEN** user clicks "Show Instructions" AND is iOS device
- **THEN** system SHALL display iOS-specific installation guide
- **WHEN** user is Android/Desktop
- **THEN** system SHALL display generic installation guide

#### Scenario: Already installed
- **WHEN** app is already installed (standalone mode)
- **THEN** system SHALL disable install button
- **AND** system SHALL display "Already installed" message

### Requirement: Profile Editing
The system SHALL allow editing user profile fields.

#### Scenario: Edit mode
- **WHEN** user clicks "Edit Profile" button in Profile section
- **THEN** system SHALL enter edit mode with pre-filled inputs:
  - Language (DE/EN buttons)
  - Nickname (text)
  - Height (number, cm)
  - Weight (number, kg)
  - Body Fat (number, %, step 0.1, optional)
  - Max Pushups (number)
- **WHEN** user saves
- **THEN** system SHALL validate inputs
- **AND** system SHALL update Firestore with `updateUser`
- **AND** system SHALL update local state
- **AND** system SHALL exit edit mode

#### Scenario: Profile summary
- **WHEN** not in edit mode
- **THEN** system SHALL display profile summary with labels:
  - Language (flag + name)
  - Nickname
  - Gender (Male/Female/Diverse)
  - Height (cm)
  - Weight (kg)
  - Body Fat (%, if available)
  - Max Pushups

### Requirement: Group Management
The system SHALL support joining groups via group code.

#### Scenario: Join group
- **WHEN** user has no groupCode
- **THEN** system SHALL display "Join or Create Group" button
- **WHEN** user clicks button
- **THEN** system SHALL show group code input (uppercase auto-transform)
- **WHEN** user enters code and submits
- **THEN** system SHALL call `joinGroup(groupCode, userId)`
- **AND** system SHALL update user's groupCode in Firestore
- **AND** system SHALL update local state
- **AND** system SHALL display success alert

#### Scenario: Display current group
- **WHEN** user has groupCode
- **THEN** system SHALL display group code in large font with mono styling
- **AND** system SHALL provide "Leave Group" button

### Requirement: Account Actions
The system SHALL provide logout and account deletion options.

#### Scenario: Logout
- **WHEN** user clicks "Logout" button in Account section
- **THEN** system SHALL call Firebase `signOut(auth)`
- **AND** system SHALL clear user state
- **AND** system SHALL redirect to login

#### Scenario: Delete account
- **WHEN** user clicks "Delete Account" button
- **THEN** system SHALL display red warning styling
- **AND** system SHALL (placeholder - not implemented) initiate account deletion flow

### Requirement: Legal Documents
The system SHALL display privacy policy and terms of service in modals.

#### Scenario: View legal document
- **WHEN** user clicks "Privacy Policy" or "Terms of Service" button
- **THEN** system SHALL open modal with formatted legal content
- **AND** system SHALL display document title, intro, sections, last updated date
- **WHEN** user presses Escape OR clicks close button OR clicks overlay
- **THEN** system SHALL close modal

### Requirement: Debug Tools (Development Only)
The system SHALL show Sentry error test button in dev/debug mode.

#### Scenario: Debug tools visibility
- **WHEN** `import.meta.env.DEV` is true OR `VITE_ENABLE_DEBUG_TOOLS=true`
- **THEN** system SHALL display Debug Tools section in Account tab
- **WHEN** user clicks "Trigger Test Error"
- **THEN** system SHALL throw test error captured by Sentry
- **AND** system SHALL display Sentry DSN configuration status

## Technical Notes

### Implementation Files
- `src/pages/SettingsPage.tsx` - Settings UI with tabbed sections

### State Management
- localStorage: `notification-enabled`, `pwa-install-dismissed`
- Zustand: `user`, `pwaInstallPrompt`

### Dependencies
- Firebase Auth (logout)
- Firestore (profile updates, group join)
- ThemeToggle component (dark mode)
- UserAvatar component (profile picture display)
- Notification API (browser)

### Design Patterns
- **Tabbed sections**: General, Profile, Account
- **Conditional rendering**: Show/hide based on state (groupCode, edit mode)
- **Platform detection**: iOS vs Android install instructions
- **Modal overlays**: Legal documents, time picker
- **Privacy**: Profile pictures not mentioned (removed feature per code comments)
