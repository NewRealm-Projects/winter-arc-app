# CLAUDE.md

**Claude Code Configuration & Development Guidelines**

This file provides comprehensive guidance for Claude Code (claude.ai/code) when working with the Winter Arc fitness tracking application. It ensures consistent development practices, maintains code quality, and serves as the single source of truth for project requirements.

**Version:** 2.0
**Last Updated:** 2025-10-01
**Project:** Winter Arc Fitness Tracker

## 🔄 Meta-Requirement: Documentation Updates

**CRITICAL: Whenever the user provides new requirements, feature requests, or identifies issues:**

1. **First, update this CLAUDE.md file** with the new requirements in the appropriate section
2. **Document the requirement clearly** with context, constraints, and expected behavior
3. **Then implement** the changes in the codebase
4. **Keep this file synchronized** with the actual implementation

This ensures all future development sessions have complete context and requirements.

## ✅ CRITICAL: Implementation Verification Requirement

**MANDATORY: After implementing ANY feature or fix, you MUST verify it actually works:**

1. **Never assume implementation = working functionality**
   - Code that compiles ≠ code that works correctly
   - Database writes ≠ UI updates
   - Function exists ≠ function is called

2. **Verification Steps (REQUIRED for EVERY implementation):**
   - [ ] Run the app and manually test the feature
   - [ ] Verify UI updates immediately after actions (logging, editing, deleting)
   - [ ] Check that data persists and displays correctly after refresh
   - [ ] Test edge cases (empty state, multiple entries, etc.)
   - [ ] Verify graphs/visualizations render with actual data
   - [ ] Confirm modals/screens open, close, and navigate correctly

3. **Known Problem Areas (CHECK THESE EVERY TIME):**
   - **Logging not updating**: Check if `loadAllData()` or equivalent is called after database writes
   - **Graphs not showing**: Verify data fetching, check console for errors, ensure minimum data points exist
   - **Empty displays**: Confirm state updates trigger re-renders, check query filters (dates, userId)
   - **WeeklyOverview empty**: Verify data aggregation logic and date range calculations

4. **Before Marking Task Complete:**
   - Test the feature yourself using the development server
   - Document any blockers or issues discovered during testing
   - Do NOT mark feature as "done" if it doesn't work as expected

**WHY THIS MATTERS:** Many prompts have been wasted fixing features that were "implemented" but never actually verified to work. This wastes user time and tokens.

## Project Overview

Winter Arc is a cross-platform fitness tracking application built with Expo/React Native. It runs on:
- Web browsers
- iOS devices
- Android devices

The app tracks:
- **Push-ups** - Count per day
- **Sport** - Simple checkbox (completed/not completed)
- **Protein** - Grams consumed per day
- **Water** - Milliliters consumed per day
- **Weight** - Daily weight tracking with BMI and body fat percentage

## Technology Stack

- **Framework**: Expo (React Native) with TypeScript
- **Backend**: Firebase (Authentication + Firestore)
- **Auth**: Google OAuth (Sign in with Google)
- **Navigation**: React Navigation (Stack Navigator with modals)
- **Deployment**: GitHub Actions → GitHub Pages
- **State Management**: React Context (AuthContext, ThemeContext)
- **Security**:
  - Socket.dev (Dependency scanning)
  - Firebase Security Rules (Access control)
  - Firebase App Check (Bot protection - Web only)

## Development Commands

```bash
# Start development server
npm start

# Run on specific platforms
npm run web       # Web browser
npm run android   # Android emulator/device
npm run ios       # iOS simulator (macOS only)

# Build for web
npm run build:web
```

## Project Structure

```
src/
├── components/          # Reusable UI components
│   ├── AnimatedGradient.tsx   # Gradient background wrapper
│   ├── GlassButton.tsx        # Glass-styled buttons
│   ├── GlassCard.tsx          # Glass-styled card container
│   ├── WeeklyOverview.tsx     # Week/month progress rings
│   └── WeightGraph.tsx        # Interactive weight graph with dual lines
├── contexts/            # React contexts
│   ├── AuthContext.tsx        # User authentication & data
│   └── ThemeContext.tsx       # Dark/light/auto theme
├── screens/             # Screen components
│   ├── LoginScreen.tsx        # Google OAuth login
│   ├── OnboardingScreen.tsx   # First-time user setup
│   ├── HomeScreen.tsx         # Main dashboard with inline logging
│   ├── WeightTrackerScreen.tsx   # 30-day weight graph view
│   ├── LeaderboardScreen.tsx     # Group rankings
│   ├── SettingsScreen.tsx        # Profile & app settings
│   ├── PushUpsScreen.tsx         # (DEPRECATED - unused)
│   ├── WaterScreen.tsx           # (DEPRECATED - unused)
│   ├── SportScreen.tsx           # (DEPRECATED - unused)
│   ├── ProteinScreen.tsx         # (DEPRECATED - unused)
│   └── NutritionScreen.tsx       # (DEPRECATED - unused)
├── services/            # External services
│   ├── firebase.ts            # Firebase initialization + App Check
│   ├── database.ts            # Firestore CRUD operations
│   └── notifications.ts       # Push notifications
└── types/               # TypeScript type definitions
    └── index.ts               # All type definitions

.github/
└── workflows/
    ├── deploy.yml             # Web deployment to GitHub Pages
    └── socket-security.yml    # Socket.dev security scanning

firestore.rules              # Firebase Security Rules
SECURITY_SETUP.md           # Security configuration guide
REQUIREMENTS_STATUS.md      # Latest requirements review
```

**Note:** PushUps, Water, Sport, Protein, and Nutrition screens are deprecated. All logging is now done inline on HomeScreen.

## Firebase Configuration

Before running the app, create a `.env` file based on `.env.example` and add Firebase credentials:

```bash
EXPO_PUBLIC_FIREBASE_API_KEY=...
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=...
EXPO_PUBLIC_FIREBASE_PROJECT_ID=...
EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=...
EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=...
EXPO_PUBLIC_FIREBASE_APP_ID=...
EXPO_PUBLIC_GOOGLE_CLIENT_ID=...
EXPO_PUBLIC_RECAPTCHA_SITE_KEY=...  # For Firebase App Check (optional)
```

## GitHub Actions Deployment

The app automatically deploys to GitHub Pages on every push to `main` branch.

**Required GitHub Secrets:**
- `EXPO_PUBLIC_FIREBASE_API_KEY`
- `EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN`
- `EXPO_PUBLIC_FIREBASE_PROJECT_ID`
- `EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET`
- `EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`
- `EXPO_PUBLIC_FIREBASE_APP_ID`
- `EXPO_PUBLIC_GOOGLE_CLIENT_ID`
- `EXPO_PUBLIC_RECAPTCHA_SITE_KEY` (optional - for App Check)
- `SOCKET_SECURITY_API_KEY` (optional - for Socket.dev scanning)

**Enable GitHub Pages:**
1. Go to repository Settings → Pages
2. Set Source to "gh-pages" branch
3. Save

## Authentication Flow

1. User lands on `LoginScreen`
2. Signs in with Google OAuth
3. `AuthContext` manages authentication state
4. New users go through onboarding (nickname, age, gender, weight, height, group code)
5. Authenticated users with completed onboarding see `HomeScreen`

## Onboarding Flow

New users must complete onboarding with:
- **Nickname** (required) - Display name
- **Age** (required) - 10-120 years
- **Gender** (required) - Male/Female/Other
- **Group Code** (optional) - Join a group (e.g., "boys")
- **Weight** (required) - In kg
- **Height** (required) - In cm
- **Body Fat %** (optional) - 3-50%

## Data Model

All entries are stored in Firestore with user ID association:

### Collections:
- **users**: User profiles with onboarding data
  - nickname, age, gender, weight, height, bodyFat, groupCode, onboardingCompleted

- **sportEntries**: Sport activity tracking
  - userId, date, completed (boolean)

- **pushUpEntries**: Push-up count tracking
  - userId, count, date, notes

- **proteinEntries**: Protein intake in grams
  - userId, grams, date, notes

- **waterEntries**: Water intake in ml
  - userId, amount, date

- **weightEntries**: Weight tracking with optional body fat
  - userId, weight, bodyFat, date

## Key Features

### 🏠 HomeScreen
- Greeting with nickname
- Weekly/Monthly overview with progress rings (0-100% per day)
- Quick stats showing today's progress
- Quick-add buttons for all tracking categories
- Navigation to Leaderboard (🏆) and Settings (⚙️)

### 📊 Logging System - **CRITICAL REQUIREMENTS**

**IMPORTANT: The logging system must follow these strict requirements:**

1. **NO Full-Screen Navigation**
   - Tracking screens MUST open as modals/popups, NOT full pages
   - Use `presentation: 'modal'` in React Navigation
   - Modals should overlay the HomeScreen

2. **Quick-Add Functionality**
   - Users must be able to log entries QUICKLY without forms
   - Each category has quick-add buttons (e.g., Water: 250ml, 500ml, 1000ml)
   - One tap should log the entry and auto-close the modal

3. **Inline Display**
   - Recent entries should be visible on the HomeScreen
   - Each tracking category shows last 3-5 entries inline
   - No need to navigate to see recent data
   - **CRITICAL**: Display must update immediately after logging (real-time)
   - If entries are being saved to database but not showing on screen, check:
     - loadAllData() is called after adding entry
     - State updates are triggering re-renders
     - Data fetching queries are correct

4. **Combined View**
   - Logging buttons and logged data should be in the same component
   - Example: Water card shows quick-add buttons + today's total + recent entries

5. **Auto-Close Behavior**
   - After successful logging, modal should auto-close after 1 second
   - Show brief success message
   - Return to HomeScreen automatically

6. **Edit/Delete Functionality**
   - Users must be able to correct/edit logged entries
   - Each displayed entry should have edit and delete options
   - Edit: Open inline form or modal to modify values
   - Delete: Confirm dialog, then remove from database
   - Update display immediately after edit/delete

### 📈 Weight Tracker - **CRITICAL REQUIREMENTS**

**IMPORTANT: Weight tracking must be a prominent, interactive graph on HomeScreen, NOT just a button.**

1. **Graph Display on HomeScreen**
   - Replace simple "Gewicht tracken" button with interactive mini-graph
   - Show last 7-14 days of weight data as line graph
   - Tapping graph opens detailed WeightTrackerScreen with 30-day view

2. **Dual-Line Graph**
   - **Primary Line (always visible)**: Weight in kg
   - **Secondary Line (when available)**: Body fat percentage
   - Both lines share same X-axis (dates), different Y-axes
   - Lines should be color-coded: Weight = #A29BFE (purple), Body Fat = #F9CA24 (gold)

3. **Body Fat Tracking Logic**
   - Body fat is **optional** when logging weight
   - If user logs weight WITHOUT updating body fat:
     - Weight entry is created/updated in database
     - Body fat value is NOT written to database (no duplicate entry)
     - Graph displays last known body fat value for continuity
   - If user logs weight WITH body fat:
     - Both weight and body fat are written to database
   - Example: User logs 80kg without body fat → Graph shows 80kg + previous body fat % (e.g., 18%)

4. **Quick-Add Weight on HomeScreen**
   - Inline input field or quick button to log today's weight
   - Optional body fat input (collapsed by default)
   - Auto-updates graph immediately after saving

5. **Detailed View (WeightTrackerScreen)**
   - Full 30-day graph with zoom/pan
   - Shows BMI calculation
   - Shows trends (weight change per week)
   - List of all weight entries with edit/delete options

### 🏆 Leaderboard
- Compare with friends using group codes
- Week/Month toggle for time periods
- Ranking with medals (🥇🥈🥉) for top 3
- Point system:
  - Sport days × 10 points
  - Push-ups × 1 point
  - Protein ÷ 10 points
  - Water ÷ 1000 points
- Highlights current user
- Shows detailed stats per member

### 🌓 Theme Support
- Light/Dark/Auto modes
- All screens fully themed
- Navigation headers use theme colors
- Consistent color scheme:
  - Push-ups: #FF6B6B (red)
  - Water: #4ECDC4 (cyan)
  - Sport: #95E1D3 (mint)
  - Protein: #F9CA24 (yellow)
  - Weight: #A29BFE (purple)

### ⚙️ Settings
- Profile management (nickname, group code)
- Theme toggle
- Push notification settings (Water @ 10:00, Workout @ 18:00)
- Logout

## Navigation Structure

```
Stack Navigator (with modal presentation)
├── Login (no header)
├── Onboarding (no header, one-time)
└── Main Flow
    ├── Home (no header) - Main dashboard with ALL inline logging
    └── Modals (all use presentation: 'modal')
        ├── WeightTracker - 30-day detailed graph view
        ├── Leaderboard - Group rankings
        └── Settings - Profile & app settings
```

**IMPORTANT:** Push-ups, Water, Sport, and Protein NO LONGER have separate screens. All logging is done inline on HomeScreen with quick-add buttons and inline edit/delete.

## Design Principles

1. **Speed First**: Logging should take < 3 seconds
2. **Minimal Taps**: One tap to log common actions
3. **Visual Feedback**: Immediate confirmation on all actions
4. **Dark Mode**: Full support across all screens
5. **Responsive**: Works on mobile and desktop browsers
6. **Offline-First**: Cache recent data for offline viewing
7. **Modal Over Pages**: Never navigate away from home for quick actions
8. **Glassmorphism/Liquid Glass**: Modern, ethereal aesthetic with transparency and blur effects

## Glassmorphism Design System

### Core Visual Style

The app uses a **Liquid Glass / Glassmorphism** design language for a modern, premium feel.

#### Glass Effect Properties
```css
/* Standard Glass Card */
background: rgba(255, 255, 255, 0.1);  /* Semi-transparent white */
backdrop-filter: blur(10px);            /* Blur background */
-webkit-backdrop-filter: blur(10px);   /* Safari support */
border: 1px solid rgba(255, 255, 255, 0.2);  /* Subtle border */
border-radius: 16px;
box-shadow: 0 8px 32px 0 rgba(31, 38, 135, 0.37);
```

#### Color Palette
- **Background Gradients**: Animated gradients (e.g., #667eea → #764ba2, #4ECDC4 → #556270)
- **Glass Overlays**: rgba(255, 255, 255, 0.05-0.2) for light mode, rgba(0, 0, 0, 0.1-0.3) for dark
- **Text**: High contrast white/black with opacity variations
- **Accent Colors**:
  - Push-ups: #FF6B6B (red/coral)
  - Water: #4ECDC4 (cyan)
  - Sport: #95E1D3 (mint)
  - Protein: #F9CA24 (gold)
  - Weight: #A29BFE (purple)

#### Visual Effects
- **Backdrop Blur**: 10-20px for depth
- **Hover States**:
  - `brightness(1.1)`
  - `transform: scale(1.02) translateY(-2px)`
  - Smooth glow effect
- **Transitions**: `0.3s cubic-bezier(0.4, 0, 0.2, 1)` for all interactions
- **Floating Animations**: Subtle vertical movement for cards
- **Micro-interactions**:
  - Button ripples on tap
  - Card tilt on hover (desktop)
  - Smooth loading skeletons with shimmer

### Component-Specific Glass Effects

#### GlassCard (Tracking Cards)
```tsx
// Used for: Push-ups, Water, Sport, Protein cards
- Background: rgba(255, 255, 255, 0.1) or rgba(28, 28, 30, 0.8) in dark
- Blur: 10px backdrop-filter
- Border: 1px solid rgba(255, 255, 255, 0.2)
- Shadow: Soft, elevated shadow
- Border-radius: 16px
- Padding: 20px
```

#### GlassButton (Quick-Add Buttons)
```tsx
// Category-colored buttons with glass overlay
- Semi-transparent category color
- Blur: 8px
- Hover: Brighter + slight scale
- Active: Scale down + brightness boost
- Ripple effect on tap
```

#### GlassNavigation (Header)
```tsx
// Sticky header with strong blur
- Background: rgba(255, 255, 255, 0.7) / rgba(0, 0, 0, 0.7)
- Blur: 20px (stronger for readability)
- Frosted glass appearance
- Subtle bottom border
```

### Animations & Interactions

#### Floating Effect (Cards)
```css
@keyframes float {
  0%, 100% { transform: translateY(0px); }
  50% { transform: translateY(-10px); }
}
/* Apply: animation: float 6s ease-in-out infinite; */
```

#### Shimmer Loading
```css
/* For skeleton screens */
background: linear-gradient(
  90deg,
  rgba(255,255,255,0.0) 0%,
  rgba(255,255,255,0.2) 50%,
  rgba(255,255,255,0.0) 100%
);
animation: shimmer 2s infinite;
```

#### Button Ripple
```tsx
// On tap: expand circular overlay from tap point
- Origin: Touch/click position
- Expand: 0 → 100% in 0.6s
- Fade: opacity 0.3 → 0
```

### Accessibility Considerations

**Critical for Glass Design:**
1. **Contrast Ratios**: Text must maintain WCAG AA (4.5:1) despite transparency
   - Use higher opacity text: rgba(255, 255, 255, 0.95) not 0.7
   - Add subtle text shadows for readability on complex backgrounds

2. **Safari Fallbacks**:
   ```css
   @supports not (backdrop-filter: blur(10px)) {
     background: rgba(255, 255, 255, 0.95);  /* Solid fallback */
   }
   ```

3. **Performance**:
   - Use `will-change: transform` for animated elements
   - Limit backdrop-filter to visible cards only
   - Optimize with `transform: translateZ(0)` for GPU acceleration

4. **Touch Targets**: Minimum 44x44px tap areas (extra important with semi-transparent buttons)

### Gradient Backgrounds

#### Animated Background Gradient
```css
background: linear-gradient(
  135deg,
  #667eea 0%,
  #764ba2 50%,
  #f093fb 100%
);
background-size: 400% 400%;
animation: gradientShift 15s ease infinite;

@keyframes gradientShift {
  0% { background-position: 0% 50%; }
  50% { background-position: 100% 50%; }
  100% { background-position: 0% 50%; }
}
```

#### Theme-Specific Gradients
- **Light Mode**: Bright, colorful gradients (pastel to vibrant)
- **Dark Mode**: Deep, moody gradients (dark purple → dark blue)

### Implementation Notes

1. **React Native Limitations**:
   - `backdrop-filter` not supported → Use fallback solid colors with high opacity
   - Can use `BlurView` from `expo-blur` for native blur effect
   - Web version gets full glassmorphism

2. **Component Library Structure**:
   ```
   components/
   ├── GlassCard.tsx          # Reusable glass card wrapper
   ├── GlassButton.tsx        # Glass-styled buttons
   ├── FloatingElement.tsx    # Animated floating container
   └── ShimmerLoader.tsx      # Glass skeleton loader
   ```

3. **CSS Variables for Theming**:
   ```css
   :root {
     --glass-bg-light: rgba(255, 255, 255, 0.1);
     --glass-bg-dark: rgba(28, 28, 30, 0.8);
     --glass-border: rgba(255, 255, 255, 0.2);
     --glass-shadow: 0 8px 32px 0 rgba(31, 38, 135, 0.37);
   }
   ```

### Inspiration References
- **Apple iOS Design**: Frosted glass panels, translucent overlays
- **Windows Fluent Design**: Acrylic materials, depth layers
- **Glassmorphism.com**: Reference for blur intensities and overlays

## 🔒 Security

### Socket.dev - Dependency Scanning

**Purpose:** Scans all npm dependencies for security vulnerabilities and supply chain attacks.

**Integration:** GitHub Actions workflow (`.github/workflows/socket-security.yml`)
- Runs on every push to main
- Runs on every pull request
- Runs weekly (every Monday at 9 AM)
- Fails build if high or critical vulnerabilities found

**Setup:**
1. Create Socket.dev account at https://socket.dev
2. Get API key from Socket.dev dashboard
3. Add GitHub Secret: `SOCKET_SECURITY_API_KEY`
4. Workflow will automatically scan on push/PR

**Reports:** Security reports are uploaded as artifacts in GitHub Actions

### Firebase Security Rules

**Location:** `firestore.rules`

**Key Security Features:**
1. **Authentication Required:** All read/write operations require authenticated user
2. **Owner-Only Access:** Users can only access their own data
3. **Data Validation:**
   - Push-ups: 1-1000 per entry
   - Water: 1-5000ml per entry
   - Protein: 1-500g per entry
   - Weight: 1-500kg, Body fat: 3-50%
   - Age: 10-120 years
4. **No UID Tampering:** Users cannot change their own userId
5. **Timestamp Validation:** All dates must be valid timestamps

**Deployment:**
```bash
# Install Firebase CLI
npm install -g firebase-tools

# Login to Firebase
firebase login

# Initialize Firestore (first time only)
firebase init firestore

# Deploy security rules
firebase deploy --only firestore:rules
```

**Testing Rules:**
```bash
firebase emulators:start --only firestore
```

### Firebase App Check - Bot Protection (Web Only)

**Purpose:** Protects Firebase resources from abuse (bots, scrapers)

**How it works:**
- Uses reCAPTCHA v3 for invisible bot detection on web
- Validates requests come from legitimate app instances
- Works automatically in background (no user interaction required)

**Setup Steps:**

1. **Enable Firebase App Check:**
   - Go to Firebase Console → App Check
   - Click "Get started"
   - Register your web app

2. **Get reCAPTCHA v3 Site Key:**
   - Go to https://www.google.com/recaptcha/admin
   - Click "+" to add new site
   - Select reCAPTCHA v3
   - Add your domain (e.g., `yourname.github.io`)
   - Copy the Site Key

3. **Add to Environment:**
   ```bash
   # Add to .env file
   EXPO_PUBLIC_RECAPTCHA_SITE_KEY=your_recaptcha_v3_site_key
   ```

4. **Add to GitHub Secrets:**
   - Go to GitHub repo → Settings → Secrets and variables → Actions
   - Add secret: `EXPO_PUBLIC_RECAPTCHA_SITE_KEY`

5. **Enforce App Check (Optional):**
   - Firebase Console → App Check
   - Click on your app
   - Enable "Enforce" for Firestore

**Note:** Currently implemented for web only. For iOS/Android, would need:
- iOS: DeviceCheck or App Attest
- Android: Play Integrity API

### Rate Limiting

**Current Implementation:** Firebase Security Rules with basic rate limit helpers

**For Production:** Consider Firebase Extensions:
- **Firestore Rate Limiting Extension**
  ```bash
  firebase ext:install firestore-counter
  ```

**Alternative:** Use Cloud Functions with rate limiting middleware

### Security Best Practices

1. **Never commit `.env` file** - Add to `.gitignore`
2. **Rotate API keys regularly** - Every 90 days recommended
3. **Monitor Firebase usage** - Set budget alerts in Firebase Console
4. **Review Security Rules** - Audit quarterly
5. **Keep dependencies updated** - Socket.dev will alert you
6. **Use HTTPS only** - Firebase enforces this automatically
7. **Enable 2FA** - For Firebase Console and GitHub accounts

## Common Issues & Solutions

### Issue: Entries not saving
- Check Firebase rules allow write access
- Verify user is authenticated
- Check network connectivity
- Verify date format (Timestamp.fromDate())

### Issue: Entries not displaying after logging
- Verify loadAllData() is called after add/edit/delete operations
- Check state updates are triggering re-renders
- Verify userId matches in database queries
- Check date filters (today calculation)

### Issue: Edit/Delete not working
- Verify update/delete functions are imported from database.ts
- Check entry IDs are being passed correctly
- Ensure user is authenticated before operations

### Issue: Theme not applying
- Check useTheme() is called in component
- Ensure ThemeProvider wraps Navigation
- Verify colors object is destructured

### Issue: Weight graph not showing
- Need at least 1 data point for graph (empty state shows tap-to-track)
- Check WeightGraph component is properly imported in HomeScreen
- Verify getWeightEntries is fetching data correctly
- Check date range filter (last 14 days for HomeScreen mini-graph)

### Issue: WeeklyOverview not updating
- Verify loadData() refreshes when entries change
- Check data aggregation logic for today's completion
- Verify date range calculations (week/month toggle)

## Testing Checklist

### Logging System
- [ ] Can log push-ups with quick buttons (10, 20, 30, 50)
- [ ] Push-up entries display immediately after logging
- [ ] Can edit push-up entries inline
- [ ] Can delete push-up entries with confirmation
- [ ] Can log water with quick buttons (250ml, 500ml, 750ml, 1000ml)
- [ ] Water entries display with timestamps
- [ ] Can edit/delete water entries
- [ ] Can log protein with quick buttons (20g, 30g, 40g, 50g)
- [ ] Protein entries display immediately
- [ ] Can edit/delete protein entries
- [ ] Can check sport as completed
- [ ] Sport cannot be checked twice on same day
- [ ] Today's totals update immediately after logging

### Weight Tracker
- [ ] WeightGraph displays on HomeScreen
- [ ] Empty state shows "Tippen um Gewicht zu tracken"
- [ ] Graph shows last 14 days when data exists
- [ ] Dual-line graph: Weight (purple) + Body fat (gold) when available
- [ ] Body fat line shows last known value when not updated
- [ ] Weight change indicator shows correctly (green/red)
- [ ] Tapping graph opens WeightTrackerScreen
- [ ] WeightTrackerScreen shows 30-day graph
- [ ] Can add weight entries in WeightTrackerScreen
- [ ] BMI calculation displays correctly

### Weekly Overview
- [ ] Shows rings for last 7 days (week mode)
- [ ] Shows rings for last 30 days (month mode)
- [ ] Rings update immediately after logging
- [ ] Completion percentage calculates correctly (4 categories)
- [ ] Toggle between week/month works
- [ ] Statistics show correct perfect days count

### Navigation & UI
- [ ] WeightTracker opens as modal
- [ ] Leaderboard opens as modal
- [ ] Settings opens as modal
- [ ] All modals have close/back buttons
- [ ] Theme switches work (light/dark/auto)
- [ ] Glassmorphism design applied throughout
- [ ] Gradient background displays correctly

### Authentication & Onboarding
- [ ] Google OAuth login works
- [ ] New users see onboarding screen
- [ ] Onboarding validates all required fields
- [ ] Onboarding saves data to Firestore
- [ ] Completed onboarding redirects to HomeScreen
- [ ] Settings can update profile data
- [ ] Logout works and returns to login screen

### Security
- [ ] Firebase Security Rules deployed
- [ ] Socket.dev workflow runs on push
- [ ] Firebase App Check initialized (web only)
- [ ] Users can only access their own data
- [ ] Invalid data is rejected by rules

### Leaderboard
- [ ] Shows group members when groupCode set
- [ ] Rankings calculate correctly
- [ ] Week/Month toggle works
- [ ] Current user is highlighted
- [ ] Medal emojis show for top 3
