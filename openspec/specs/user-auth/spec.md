# User Authentication

Authentication and onboarding system for new and returning users.

## Purpose

Provide secure Google OAuth authentication with automatic profile sync, guided multi-step onboarding for new users, and seamless state management across sessions.

## Requirements

### Requirement: Google SSO Authentication
The system SHALL provide Google OAuth 2.0 authentication with automatic environment detection.

#### Scenario: Development login with popup
- **WHEN** user is on localhost or 127.0.0.1 AND clicks "Sign in with Google"
- **THEN** system SHALL open popup window with Google OAuth consent screen
- **AND** system SHALL use `signInWithPopup` with `browserPopupRedirectResolver`
- **AND** system SHALL provide instant feedback after authentication

#### Scenario: Production login with redirect
- **WHEN** user is on production domain AND clicks "Sign in with Google"
- **THEN** system SHALL redirect to Google OAuth consent screen
- **AND** system SHALL use `signInWithRedirect` to avoid COOP issues
- **AND** system SHALL reload page after successful authentication

#### Scenario: Redirect result handling
- **WHEN** page loads after OAuth redirect
- **THEN** system SHALL check for redirect result using `getRedirectResult`
- **AND** system SHALL extract authenticated user from result
- **AND** system SHALL handle any redirect errors gracefully

### Requirement: Demo Mode
The system SHALL provide demo authentication for testing without Firebase credentials.

#### Scenario: Demo login activation
- **WHEN** user clicks "Demo Mode (Testing)" button
- **THEN** system SHALL create demo user with preset data (nickname, stats, pushup state)
- **AND** system SHALL mark session as demo mode
- **AND** system SHALL redirect to dashboard
- **AND** system SHALL NOT attempt Firebase authentication

### Requirement: Auth State Management
The system SHALL maintain authentication state using Firebase `onAuthStateChanged` listener.

#### Scenario: User authenticated
- **WHEN** Firebase detects authenticated user
- **THEN** system SHALL fetch user document from Firestore `users/{userId}`
- **AND** system SHALL update global state with user data
- **AND** system SHALL set `isOnboarded` flag based on `birthday` field presence
- **AND** system SHALL clear demo mode marker

#### Scenario: User not authenticated
- **WHEN** Firebase detects no authenticated user AND demo mode is inactive
- **THEN** system SHALL clear user state
- **AND** system SHALL clear tracking data
- **AND** system SHALL clear cookies, localStorage, and sessionStorage
- **AND** system SHALL set `authLoading` to false

#### Scenario: New user first login
- **WHEN** authenticated user has no Firestore document
- **THEN** system SHALL create partial user object with defaults (language: 'de', empty nickname, etc.)
- **AND** system SHALL set `isOnboarded` to false
- **AND** system SHALL trigger onboarding flow

### Requirement: Profile Picture Sync
The system SHALL automatically sync Google profile pictures to Firebase Storage.

#### Scenario: New user with Google photo
- **WHEN** authenticated user has no Firestore document AND has Google photoURL
- **THEN** system SHALL upload Google photo to Firebase Storage
- **AND** system SHALL store uploaded URL in user document `photoURL` field
- **AND** system SHALL set `shareProfilePicture` to true by default

#### Scenario: Existing user missing photo
- **WHEN** authenticated user has Firestore document AND `photoURL` is empty AND Google photoURL exists
- **THEN** system SHALL upload Google photo to Firebase Storage
- **AND** system SHALL update user document with uploaded URL
- **AND** system SHALL merge `shareProfilePicture: true` if undefined

### Requirement: Data Migration
The system SHALL perform backward-compatible migrations for existing users.

#### Scenario: Migrate enabled activities
- **WHEN** authenticated user document lacks `enabledActivities` field
- **THEN** system SHALL set default activities: ['pushups', 'sports', 'water', 'protein']
- **AND** system SHALL update Firestore with default activities
- **AND** system SHALL update local state with migrated data

#### Scenario: Migrate days to entries
- **WHEN** authenticated user has legacy `tracking/{userId}/days` data
- **THEN** system SHALL call `migrateDaysToEntries` migration service
- **AND** system SHALL log migration count if successful
- **AND** system SHALL NOT block login on migration failure (non-critical error)

### Requirement: Error Handling
The system SHALL provide user-friendly error messages for authentication failures.

#### Scenario: Unauthorized domain error
- **WHEN** OAuth fails with `auth/internal-error` or `auth/unauthorized-domain`
- **THEN** system SHALL display message: "Firebase OAuth nicht konfiguriert. Bitte füge {domain} zu autorisierten Domains hinzu."
- **AND** system SHALL log Firebase Console fix instructions

#### Scenario: Popup blocked error
- **WHEN** OAuth fails with `auth/popup-blocked`
- **THEN** system SHALL display message: "Popup wurde blockiert. Versuche Redirect-Modus."
- **AND** system SHALL switch to redirect mode

#### Scenario: Network error
- **WHEN** OAuth fails with `auth/network-request-failed`
- **THEN** system SHALL display message: "Netzwerkfehler. Bitte überprüfe deine Internetverbindung."

#### Scenario: User cancelled login
- **WHEN** OAuth fails with `auth/popup-closed-by-user`
- **THEN** system SHALL display message: "Login abgebrochen"

### Requirement: Onboarding Flow
The system SHALL guide new users through 9-step onboarding process.

#### Scenario: Language selection (Step 1)
- **WHEN** user is in step 1
- **THEN** system SHALL present language options (Deutsch, English)
- **AND** system SHALL allow selection via button
- **AND** system SHALL proceed when language is selected

#### Scenario: Nickname input (Step 2)
- **WHEN** user is in step 2
- **THEN** system SHALL prompt for nickname with input field
- **AND** system SHALL validate nickname is not empty
- **AND** system SHALL proceed when valid nickname is entered
- **AND** system SHALL support Enter key to submit

#### Scenario: Profile picture upload (Step 3)
- **WHEN** user is in step 3
- **THEN** system SHALL display profile picture preview (Google photo or placeholder)
- **AND** system SHALL allow file upload via button trigger
- **AND** system SHALL create blob preview for selected file
- **AND** system SHALL display sharing toggle (default: true)
- **AND** system SHALL allow skip (optional step)

#### Scenario: Gender selection (Step 4)
- **WHEN** user is in step 4
- **THEN** system SHALL present gender options (male, female, diverse)
- **AND** system SHALL allow selection via button
- **AND** system SHALL proceed when gender is selected

#### Scenario: Height input (Step 5)
- **WHEN** user is in step 5
- **THEN** system SHALL prompt for height in centimeters
- **AND** system SHALL validate height > 0
- **AND** system SHALL proceed when valid height is entered
- **AND** system SHALL support Enter key to submit

#### Scenario: Body fat input (Step 6)
- **WHEN** user is in step 6
- **THEN** system SHALL prompt for body fat percentage
- **AND** system SHALL allow decimal values (e.g., 15.5)
- **AND** system SHALL allow skip (optional step)
- **AND** system SHALL support Enter key to submit

#### Scenario: Max pushups input (Step 7)
- **WHEN** user is in step 7
- **THEN** system SHALL prompt for max pushups count
- **AND** system SHALL validate max pushups > 0
- **AND** system SHALL display calculated training plan base reps
- **AND** system SHALL proceed when valid count is entered
- **AND** system SHALL support Enter key to submit

#### Scenario: Activity selection (Step 8)
- **WHEN** user is in step 8
- **THEN** system SHALL display activity options (pushups, sports, water, protein)
- **AND** system SHALL allow multi-select via toggle buttons
- **AND** system SHALL validate at least one activity is selected
- **AND** system SHALL proceed when activities are selected

#### Scenario: Birthday input (Step 9)
- **WHEN** user is in step 9
- **THEN** system SHALL prompt for birthday with date picker
- **AND** system SHALL allow skip (optional step)
- **AND** system SHALL support Enter key to submit

#### Scenario: Onboarding completion
- **WHEN** user completes step 9
- **THEN** system SHALL validate user is authenticated
- **AND** system SHALL upload profile picture file to Firebase Storage (if selected)
- **AND** system SHALL initialize pushup training plan based on max pushups
- **AND** system SHALL save user data to Firestore `users/{userId}`
- **AND** system SHALL update global state with complete user object
- **AND** system SHALL set `isOnboarded` to true
- **AND** system SHALL redirect to dashboard

### Requirement: Birthday-Only Onboarding
The system SHALL support abbreviated onboarding for existing users missing birthday.

#### Scenario: Birthday-only prompt
- **WHEN** existing user lacks birthday field AND `birthdayOnly` prop is true
- **THEN** system SHALL display single-step birthday input
- **AND** system SHALL update only birthday field in Firestore
- **AND** system SHALL set `isOnboarded` to true after save

### Requirement: Sentry Integration
The system SHALL track authentication events and errors in Sentry.

#### Scenario: Auth breadcrumbs
- **WHEN** login starts
- **THEN** system SHALL add breadcrumb: "Auth: Login started" with environment details
- **WHEN** login succeeds
- **THEN** system SHALL add breadcrumb: "Auth: User authenticated" with userId
- **WHEN** login fails
- **THEN** system SHALL add breadcrumb: "Auth: Login failed" with error details

#### Scenario: Auth error capture
- **WHEN** user data loading fails
- **THEN** system SHALL capture exception in Sentry with context (uid)
- **AND** system SHALL log error to console
- **AND** system SHALL set user state to null

## Technical Notes

### Implementation Files
- `src/firebase/auth.ts` - Login flow (popup/redirect selection)
- `src/hooks/useAuth.ts` - Auth state listener, user sync, migrations
- `src/pages/LoginPage.tsx` - Login UI, error handling
- `src/pages/OnboardingPage.tsx` - Multi-step onboarding form

### Firebase Collections
- `users/{userId}` - User profile and settings

### Dependencies
- Firebase Auth (Google OAuth)
- Firebase Firestore (user data)
- Firebase Storage (profile pictures)
- Sentry (error tracking)
- Zustand (state management)

### Design Patterns
- Environment-based auth strategy (popup vs redirect)
- Automatic photo sync on first login
- Backward-compatible migrations
- Non-blocking migration errors
- Demo mode for testing without credentials
