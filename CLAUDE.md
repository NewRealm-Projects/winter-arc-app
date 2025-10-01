# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 🔄 Meta-Requirement: Documentation Updates

**CRITICAL: Whenever the user provides new requirements, feature requests, or identifies issues:**

1. **First, update this CLAUDE.md file** with the new requirements in the appropriate section
2. **Document the requirement clearly** with context, constraints, and expected behavior
3. **Then implement** the changes in the codebase
4. **Keep this file synchronized** with the actual implementation

This ensures all future development sessions have complete context and requirements.

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
