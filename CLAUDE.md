# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

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
├── components/      # Reusable UI components
│   └── WeeklyOverview.tsx  # Week/month progress rings
├── contexts/        # React contexts
│   ├── AuthContext.tsx     # User authentication & data
│   └── ThemeContext.tsx    # Dark/light/auto theme
├── screens/         # Screen components
│   ├── LoginScreen.tsx
│   ├── OnboardingScreen.tsx
│   ├── HomeScreen.tsx
│   ├── PushUpsScreen.tsx
│   ├── WaterScreen.tsx
│   ├── SportScreen.tsx
│   ├── ProteinScreen.tsx
│   ├── WeightTrackerScreen.tsx
│   ├── LeaderboardScreen.tsx
│   └── SettingsScreen.tsx
├── services/        # External services
│   ├── firebase.ts  # Firebase initialization
│   ├── database.ts  # Firestore CRUD operations
│   └── notifications.ts  # Push notifications
└── types/           # TypeScript type definitions
```

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

4. **Combined View**
   - Logging buttons and logged data should be in the same component
   - Example: Water card shows quick-add buttons + today's total + recent entries

5. **Auto-Close Behavior**
   - After successful logging, modal should auto-close after 1 second
   - Show brief success message
   - Return to HomeScreen automatically

### 📈 Weight Tracker
- **Monthly graph** showing weight progression
- Graph displays last 30 days by default
- Shows BMI calculation based on height
- Shows body fat percentage if logged
- Point-to-point line graph visualization
- Quick-add for today's weight

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
    ├── Home (no header)
    └── Modals (all use presentation: 'modal')
        ├── PushUps
        ├── Water
        ├── Sport
        ├── Protein
        ├── WeightTracker
        ├── Leaderboard
        └── Settings
```

## Design Principles

1. **Speed First**: Logging should take < 3 seconds
2. **Minimal Taps**: One tap to log common actions
3. **Visual Feedback**: Immediate confirmation on all actions
4. **Dark Mode**: Full support across all screens
5. **Responsive**: Works on mobile and desktop browsers
6. **Offline-First**: Cache recent data for offline viewing
7. **Modal Over Pages**: Never navigate away from home for quick actions

## Common Issues & Solutions

### Issue: Entries not saving
- Check Firebase rules allow write access
- Verify user is authenticated
- Check network connectivity
- Verify date format (Timestamp.fromDate())

### Issue: Modals opening as full pages
- Ensure `presentation: 'modal'` in screenOptions
- Check navigation.navigate() is called correctly
- Verify Stack.Navigator configuration

### Issue: Theme not applying
- Check useTheme() is called in component
- Ensure ThemeProvider wraps Navigation
- Verify colors object is destructured

### Issue: Weight graph not showing
- Need at least 2 data points for graph
- Check date range (last 30 days for monthly)
- Verify weight entries are fetched correctly

## Testing Checklist

- [ ] Can log push-ups with quick buttons
- [ ] Can check sport as completed
- [ ] Can add protein with quick amounts
- [ ] Can add water with quick amounts
- [ ] Can log weight with BMI calculation
- [ ] All modals open as overlays, not full screens
- [ ] Modals auto-close after successful save
- [ ] Weekly overview shows rings for all days
- [ ] Leaderboard shows group members correctly
- [ ] Theme switches work (light/dark/auto)
- [ ] Onboarding flow works for new users
- [ ] Settings save correctly
- [ ] Logout works and returns to login screen
