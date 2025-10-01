# CLAUDE.md

**Claude Code AI Configuration & Development Guidelines**

This file provides comprehensive guidance for Claude Code AI when working with the Winter Arc fitness tracking application. It ensures consistent development practices, maintains code quality, and serves as the single source of truth for project requirements.

**Version:** 2.3
**Last Updated:** 2025-10-01
**Project:** Winter Arc Fitness Tracker

## 📚 Essential Documentation

**Before working on this project, familiarize yourself with:**

1. **[FIXES.md](./FIXES.md)** - Already solved problems (check FIRST before debugging!)
2. **[IMPROVEMENTS.md](./IMPROVEMENTS.md)** - Missing features & improvement roadmap
3. **[REQUIREMENTS_STATUS.md](./REQUIREMENTS_STATUS.md)** - Current implementation status
4. **This file (CLAUDE.md)** - Complete development guidelines

## 🚨 CRITICAL: Check FIXES.md First!

**BEFORE starting ANY debugging or problem-solving:**

1. **Open and search FIXES.md** - All previously solved problems are documented there
2. **Search for keywords** related to your current issue (404, fonts, notifications, etc.)
3. **Apply documented solution** if the problem was already solved
4. **Document new fixes** in FIXES.md after solving them

**WHY THIS MATTERS:** Prevents circular debugging and wasted time re-solving the same problems.

**See:** [FIXES.md](./FIXES.md) - Complete database of solved issues with solutions

## 🔄 Meta-Requirement: Documentation Updates

**CRITICAL: Whenever the user provides new requirements, feature requests, or identifies issues:**

1. **Check FIXES.md first** to see if the issue was already solved
2. **Update this CLAUDE.md file** with new requirements in the appropriate section
3. **Document the requirement clearly** with context, constraints, and expected behavior
4. **Then implement** the changes in the codebase
5. **After solving bugs/issues**, document them in FIXES.md with the solution
6. **Keep both files synchronized** with the actual implementation

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

## Quick Start Guide

### Initial Setup

```bash
# Clone repository
git clone <repository-url>
cd winter-arc-app

# Install dependencies
npm install

# Create environment file
cp .env.example .env
# Edit .env with your Firebase credentials

# Start development server
npm start
```

### Development Commands

```bash
# Start development server (with QR code for mobile)
npm start

# Run on specific platforms
npm run web       # Web browser (http://localhost:8081)
npm run android   # Android emulator/device
npm run ios       # iOS simulator (macOS only)

# Build & Deploy
npm run build:web # Build for production (web)
npm run deploy    # Deploy to GitHub Pages (via Actions)

# Testing & Quality
npm test          # Run test suite
npm run lint      # Run ESLint
npm run type-check # TypeScript type checking

# Firebase Operations
firebase deploy --only firestore:rules  # Deploy security rules
firebase emulators:start                # Test locally
```

### Environment Setup Checklist

- [ ] Node.js 18+ installed
- [ ] Firebase account created
- [ ] Firebase project created
- [ ] Google OAuth credentials configured
- [ ] `.env` file created with all required keys
- [ ] GitHub repository created
- [ ] GitHub secrets configured (for deployment)

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

## Apple Liquid Glass Design System

### Design Philosophy

Inspired by **Apple's Human Interface Guidelines** and iOS design language, this app uses **Liquid Glass** materials to create depth, hierarchy, and visual harmony. Every element feels tactile, responsive, and premium.

**Core Principles:**
- **Clarity**: Typography and icons are sharp despite translucency
- **Depth**: Layered materials create spatial hierarchy
- **Deference**: Content is king; design supports without overwhelming
- **Vibrancy**: Colors saturate through blur without losing legibility

### Material Hierarchy

The design uses **4 distinct material layers**, each with specific blur and translucency:

#### Layer 1: Base Material (Backgrounds)
```tsx
// Full-screen gradient backgrounds
background: linear-gradient(180deg,
  rgba(0, 122, 255, 0.15) 0%,    // iOS Blue tint
  rgba(88, 86, 214, 0.12) 100%   // Purple fade
);
```

#### Layer 2: Primary Glass (Content Cards)
```tsx
// Main tracking cards (Push-ups, Water, Sport, Protein)
background: rgba(255, 255, 255, 0.18);
border: 0.5px solid rgba(255, 255, 255, 0.25);
blur: 40px;  // Native blur via expo-blur
borderRadius: 20px;
shadow: {
  shadowColor: '#000',
  shadowOffset: { width: 0, height: 8 },
  shadowOpacity: 0.12,
  shadowRadius: 24,
};
```

#### Layer 3: Secondary Glass (Modals, Overlays)
```tsx
// Modal sheets, navigation bars
background: rgba(255, 255, 255, 0.72);
border: 0.5px solid rgba(255, 255, 255, 0.3);
blur: 80px;  // Stronger blur for foreground elements
borderRadius: 16px;
shadow: {
  shadowColor: '#000',
  shadowOffset: { width: 0, height: 16 },
  shadowOpacity: 0.15,
  shadowRadius: 32,
};
```

#### Layer 4: Interactive Glass (Buttons, Controls)
```tsx
// Buttons, quick-add controls
background: rgba(category_color, 0.2);  // Tinted glass
blur: 30px;
borderRadius: 12px;
border: 0.5px solid rgba(255, 255, 255, 0.4);
// Pressed state:
scale: 0.96;
brightness: 1.15;
```

### Color System (iOS-Inspired)

#### System Colors
```typescript
// Based on iOS SF Symbols color palette
colors = {
  // Primary colors with vibrancy
  blue: '#007AFF',      // iOS System Blue
  purple: '#5856D6',    // iOS Purple
  pink: '#FF2D55',      // iOS Pink
  green: '#34C759',     // iOS Green
  orange: '#FF9500',    // iOS Orange
  yellow: '#FFCC00',    // iOS Yellow

  // Semantic category colors
  pushups: '#FF375F',   // Vibrant Red (replaces #FF6B6B)
  water: '#64D2FF',     // Bright Cyan (replaces #4ECDC4)
  sport: '#30D158',     // iOS Green (replaces #95E1D3)
  protein: '#FFD60A',   // Vivid Yellow (replaces #F9CA24)
  weight: '#BF5AF2',    // iOS Purple (replaces #A29BFE)

  // Neutral glass tints
  glassLight: 'rgba(255, 255, 255, 0.18)',
  glassMedium: 'rgba(255, 255, 255, 0.25)',
  glassStrong: 'rgba(255, 255, 255, 0.72)',

  glassDark: 'rgba(28, 28, 30, 0.68)',      // Dark mode primary
  glassDarkMedium: 'rgba(28, 28, 30, 0.82)', // Dark mode modal

  // Text hierarchy
  label: 'rgba(0, 0, 0, 0.88)',           // Primary text
  secondaryLabel: 'rgba(0, 0, 0, 0.56)',  // Secondary text
  tertiaryLabel: 'rgba(0, 0, 0, 0.32)',   // Tertiary text

  labelDark: 'rgba(255, 255, 255, 0.92)',
  secondaryLabelDark: 'rgba(255, 255, 255, 0.64)',
  tertiaryLabelDark: 'rgba(255, 255, 255, 0.40)',
};
```

#### Gradient Backgrounds
```typescript
// Dynamic, subtle gradients (not overpowering)
lightGradient = ['rgba(99, 102, 241, 0.08)', 'rgba(168, 85, 247, 0.06)'];
darkGradient = ['rgba(17, 24, 39, 0.95)', 'rgba(31, 41, 55, 0.98)'];

// Animated shift: 20s ease-in-out infinite
```

### Typography (SF Pro-Inspired)

```typescript
typography = {
  largeTitle: {
    fontSize: 34,
    fontWeight: '700',
    letterSpacing: 0.36,
    lineHeight: 41,
  },
  title1: {
    fontSize: 28,
    fontWeight: '600',
    letterSpacing: 0.36,
    lineHeight: 34,
  },
  title2: {
    fontSize: 22,
    fontWeight: '600',
    letterSpacing: 0.35,
    lineHeight: 28,
  },
  title3: {
    fontSize: 20,
    fontWeight: '600',
    letterSpacing: 0.38,
    lineHeight: 24,
  },
  headline: {
    fontSize: 17,
    fontWeight: '600',
    letterSpacing: -0.41,
    lineHeight: 22,
  },
  body: {
    fontSize: 17,
    fontWeight: '400',
    letterSpacing: -0.41,
    lineHeight: 22,
  },
  callout: {
    fontSize: 16,
    fontWeight: '400',
    letterSpacing: -0.31,
    lineHeight: 21,
  },
  subheadline: {
    fontSize: 15,
    fontWeight: '400',
    letterSpacing: -0.23,
    lineHeight: 20,
  },
  footnote: {
    fontSize: 13,
    fontWeight: '400',
    letterSpacing: -0.08,
    lineHeight: 18,
  },
  caption1: {
    fontSize: 12,
    fontWeight: '400',
    letterSpacing: 0,
    lineHeight: 16,
  },
  caption2: {
    fontSize: 11,
    fontWeight: '400',
    letterSpacing: 0.06,
    lineHeight: 13,
  },
};
```

### Spacing System (iOS Grid)

```typescript
// Based on 8pt grid system (iOS standard)
spacing = {
  xxs: 2,   // Hairline spacing
  xs: 4,    // Tight spacing
  sm: 8,    // Standard tight
  md: 12,   // Comfortable
  lg: 16,   // Card padding
  xl: 20,   // Section spacing
  xxl: 24,  // Major sections
  xxxl: 32, // Screen margins
  huge: 48, // Large separations
};

// Corner radii (iOS-style)
radius = {
  xs: 8,    // Small elements
  sm: 12,   // Buttons
  md: 16,   // Cards
  lg: 20,   // Major cards
  xl: 24,   // Modals
  full: 9999, // Pills
};
```

### Blur Intensities (expo-blur)

```tsx
import { BlurView } from 'expo-blur';

// Blur intensity mapping
intensity = {
  subtle: 10,      // Faint blur for backgrounds
  light: 30,       // Buttons and light overlays
  regular: 40,     // Standard cards
  strong: 60,      // Navigation bars
  prominent: 80,   // Modals and sheets
  ultra: 100,      // Critical overlays
};

// Usage in component:
<BlurView intensity={40} tint="light" style={styles.card}>
  {/* Content */}
</BlurView>
```

### Component Patterns

#### GlassCard (Tracking Cards)
```tsx
// Primary content cards with native blur
<BlurView intensity={40} tint="light" style={{
  borderRadius: 20,
  overflow: 'hidden',
  borderWidth: 0.5,
  borderColor: 'rgba(255, 255, 255, 0.25)',
}}>
  <LinearGradient
    colors={['rgba(255, 255, 255, 0.18)', 'rgba(255, 255, 255, 0.12)']}
    style={{
      padding: 20,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.12,
      shadowRadius: 24,
    }}
  >
    {/* Card content */}
  </LinearGradient>
</BlurView>
```

#### GlassButton (Quick Actions)
```tsx
// Category-colored interactive buttons
<BlurView intensity={30} tint="light" style={{
  borderRadius: 12,
  overflow: 'hidden',
  borderWidth: 0.5,
  borderColor: 'rgba(255, 255, 255, 0.4)',
}}>
  <LinearGradient
    colors={[
      `rgba(${categoryColor}, 0.25)`,
      `rgba(${categoryColor}, 0.15)`,
    ]}
    style={{ padding: 16 }}
  >
    <Text style={styles.buttonText}>{title}</Text>
  </LinearGradient>
</BlurView>

// Pressed state (via Pressable):
transform: [{ scale: 0.96 }]
filter: brightness(1.15)
```

#### GlassModal (Overlays, Sheets)
```tsx
// Full-screen or bottom sheet modals
<BlurView intensity={80} tint="light" style={{
  flex: 1,
  borderTopLeftRadius: 24,
  borderTopRightRadius: 24,
  overflow: 'hidden',
}}>
  <LinearGradient
    colors={['rgba(255, 255, 255, 0.72)', 'rgba(255, 255, 255, 0.65)']}
    style={styles.modalContent}
  >
    {/* Modal content */}
  </LinearGradient>
</BlurView>
```

### Animations & Micro-Interactions

#### Spring Animation (iOS Native Feel)
```typescript
// Use React Native Animated with spring physics
Animated.spring(value, {
  toValue: 1,
  friction: 7,      // iOS-like bounce
  tension: 40,
  useNativeDriver: true,
}).start();
```

#### Interactive Scale (Buttons)
```tsx
// Press feedback (iOS-style scale down)
<Pressable
  onPressIn={() => scale.value = 0.96}
  onPressOut={() => scale.value = 1}
  style={[
    styles.button,
    { transform: [{ scale: scaleValue }] }
  ]}
>
```

#### Fade Transitions
```typescript
// Smooth content transitions
Animated.timing(opacity, {
  toValue: 1,
  duration: 300,
  easing: Easing.bezier(0.25, 0.1, 0.25, 1), // iOS ease
  useNativeDriver: true,
}).start();
```

#### Skeleton Shimmer (Loading States)
```tsx
// Animated shimmer for loading skeletons
<LinearGradient
  colors={[
    'rgba(255, 255, 255, 0)',
    'rgba(255, 255, 255, 0.3)',
    'rgba(255, 255, 255, 0)',
  ]}
  start={{ x: 0, y: 0 }}
  end={{ x: 1, y: 0 }}
  style={[
    styles.shimmer,
    { transform: [{ translateX: shimmerValue }] }
  ]}
/>
// Animate shimmerValue from -width to width, repeat
```

### Accessibility & Performance

#### Contrast & Legibility
- Minimum contrast ratio: **4.5:1** (WCAG AA)
- Text shadows for readability: `textShadowColor: 'rgba(0,0,0,0.1)'`
- Vibrancy layer for text on glass: increases saturation by 20%

#### Reduced Motion Support
```typescript
import { AccessibilityInfo } from 'react-native';

const [reduceMotion, setReduceMotion] = useState(false);

useEffect(() => {
  AccessibilityInfo.isReduceMotionEnabled().then(setReduceMotion);
}, []);

// Disable animations if reduceMotion is true
```

#### Performance Optimization
- **Native Blur**: Use `expo-blur` (GPU-accelerated)
- **Memoization**: Wrap glass components in `React.memo`
- **Avoid Over-Blur**: Limit blur to visible viewport
- **Hardware Acceleration**: `shouldRasterizeIOS: true` for complex glass

#### Dark Mode Support
```typescript
// Automatic dark mode detection
import { useColorScheme } from 'react-native';

const colorScheme = useColorScheme();
const isDark = colorScheme === 'dark';

const glassBackground = isDark
  ? 'rgba(28, 28, 30, 0.68)'   // Dark glass
  : 'rgba(255, 255, 255, 0.18)'; // Light glass
```

### Touch Targets & Spacing

Following Apple HIG:
- **Minimum touch target**: 44×44 pt
- **Comfortable spacing**: 12-16pt between interactive elements
- **Card padding**: 20pt for breathing room
- **Screen margins**: 16-20pt from edges

### Implementation Architecture

```
src/
├── components/
│   ├── glass/
│   │   ├── GlassCard.tsx          # Primary content cards
│   │   ├── GlassButton.tsx        # Interactive buttons
│   │   ├── GlassModal.tsx         # Modal overlays
│   │   ├── GlassNavBar.tsx        # Navigation header
│   │   └── GlassBackground.tsx    # Animated gradient bg
│   └── feedback/
│       ├── ShimmerLoader.tsx      # Loading skeleton
│       └── SpringButton.tsx       # iOS spring animation wrapper
├── theme/
│   ├── colors.ts                  # iOS color system
│   ├── typography.ts              # SF Pro-inspired scale
│   ├── spacing.ts                 # 8pt grid
│   └── shadows.ts                 # Elevation system
└── contexts/
    └── ThemeContext.tsx           # Dark/light mode provider
```

### Inspiration & References
- **Apple Human Interface Guidelines**: Translucency, vibrancy, depth
- **iOS Control Center**: Multi-layer glass panels
- **macOS Big Sur**: Frosted glass materials
- **SF Symbols**: Color vibrancy and saturation

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

## Coding Standards & Best Practices

### TypeScript Guidelines

```typescript
// ✅ GOOD: Strong typing
interface UserData {
  nickname: string;
  age: number;
  weight?: number;
}

// ❌ BAD: Using 'any'
const user: any = {};

// ✅ GOOD: Explicit return types
const calculateBMI = (weight: number, height: number): number => {
  return weight / ((height / 100) ** 2);
};

// ✅ GOOD: Null checks
if (user?.weight) {
  console.log(user.weight);
}
```

### Component Structure

```typescript
// Preferred component structure
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '../contexts/ThemeContext';

// 1. Type definitions
interface Props {
  onPress: () => void;
  title: string;
}

// 2. Component
export const MyComponent: React.FC<Props> = ({ onPress, title }) => {
  const { colors } = useTheme();

  // 3. State
  const [isLoading, setIsLoading] = useState(false);

  // 4. Effects
  useEffect(() => {
    // Setup
    return () => {
      // Cleanup
    };
  }, []);

  // 5. Handlers
  const handlePress = () => {
    setIsLoading(true);
    onPress();
  };

  // 6. Render
  return (
    <View style={styles.container}>
      <Text style={{ color: colors.text }}>{title}</Text>
    </View>
  );
};

// 7. Styles
const styles = StyleSheet.create({
  container: {
    padding: 16,
  },
});
```

### Error Handling

```typescript
// ✅ GOOD: Comprehensive error handling
try {
  await addPushUpEntry(userId, count);
  Alert.alert('Erfolg', 'Eintrag gespeichert');
} catch (error) {
  console.error('Failed to save entry:', error);
  Alert.alert(
    'Fehler',
    'Eintrag konnte nicht gespeichert werden. Bitte versuche es erneut.'
  );
} finally {
  setLoading(false);
}

// ❌ BAD: Silent failures
try {
  await addPushUpEntry(userId, count);
} catch (error) {
  // Empty catch block
}
```

### Performance Optimization

```typescript
// ✅ GOOD: Memoization
const expensiveCalculation = useMemo(() => {
  return data.reduce((sum, item) => sum + item.value, 0);
}, [data]);

// ✅ GOOD: Callback memoization
const handlePress = useCallback(() => {
  onPress(id);
}, [id, onPress]);

// ✅ GOOD: Lazy loading
const HeavyComponent = lazy(() => import('./HeavyComponent'));
```

### Naming Conventions

```typescript
// Components: PascalCase
export const GlassButton = () => {};

// Functions/Variables: camelCase
const getUserData = () => {};
const isLoading = false;

// Constants: UPPER_SNAKE_CASE
const MAX_PUSH_UPS = 1000;
const API_ENDPOINT = 'https://api.example.com';

// Types/Interfaces: PascalCase
interface UserProfile {}
type ThemeMode = 'light' | 'dark' | 'auto';

// Files: kebab-case or PascalCase
// Components: GlassButton.tsx
// Utilities: date-utils.ts
```

## Common Issues & Troubleshooting

**⚠️ FIRST: Check [FIXES.md](./FIXES.md) for already solved problems before debugging!**

Many common issues have been solved and documented. Save time by checking there first.

---

### Database Issues

#### Issue: Entries not saving
**Symptoms:**
- No error message shown
- Data not appearing in Firestore console
- App appears to work but data is lost

**Solutions:**
1. Check Firebase rules allow write access
   ```bash
   firebase deploy --only firestore:rules
   ```
2. Verify user is authenticated
   ```typescript
   if (!auth.currentUser) {
     throw new Error('User not authenticated');
   }
   ```
3. Check network connectivity
4. Verify date format (use `Timestamp.fromDate()`)
5. Check Firestore quotas in Firebase Console

#### Issue: Entries not displaying after logging
**Symptoms:**
- Entry saves to database
- UI doesn't update immediately
- Refresh shows the entry

**Solutions:**
1. Call `loadAllData()` after add/edit/delete operations
   ```typescript
   await addPushUpEntry(userId, count);
   await loadAllData(); // ← Critical!
   ```
2. Verify state updates trigger re-renders
3. Check userId matches in queries
4. Verify date filters (today calculation)
5. Use React DevTools to inspect state

#### Issue: Edit/Delete not working
**Solutions:**
1. Verify functions are imported correctly
   ```typescript
   import { updatePushUpEntry, deletePushUpEntry } from '../services/database';
   ```
2. Check entry IDs are passed correctly (not undefined)
3. Ensure user is authenticated
4. Check Firebase rules allow update/delete

### UI/UX Issues

#### Issue: Theme not applying
**Solutions:**
1. Verify `useTheme()` is called in component
2. Ensure `ThemeProvider` wraps Navigation in App.tsx
3. Check colors object is destructured: `const { colors } = useTheme()`
4. Clear cache: Stop Metro, delete `.expo` folder, restart

#### Issue: Weight graph not showing
**Symptoms:**
- Empty graph component
- "Tippen um Gewicht zu tracken" shows when data exists

**Solutions:**
1. Need at least 1 data point for graph
2. Check `WeightGraph` component is imported in HomeScreen
3. Verify `getWeightEntries()` fetches data correctly
4. Check date range filter (last 14 days)
5. Inspect console for errors
6. Verify `weightEntries` prop is passed and not empty

#### Issue: WeeklyOverview not updating
**Solutions:**
1. Verify `loadData()` refreshes when entries change
2. Check data aggregation logic for today's completion
3. Verify date range calculations (week/month toggle)
4. Ensure `useEffect` dependencies include entry arrays

### Build & Deployment Issues

#### Issue: Build fails with type errors
**Solutions:**
```bash
# Clear cache and rebuild
rm -rf node_modules .expo dist
npm install
npm run type-check
```

#### Issue: GitHub Pages deployment fails
**Solutions:**
1. Verify all GitHub secrets are set
2. Check `homepage` field in package.json
3. Ensure `gh-pages` branch exists
4. Review GitHub Actions logs for specific errors

#### Issue: Firebase App Check blocking requests
**Solutions:**
1. Disable enforcement in Firebase Console temporarily
2. Verify reCAPTCHA site key is correct
3. Check domain is whitelisted in reCAPTCHA admin
4. Use debug tokens for testing

### Performance Issues

#### Issue: App feels slow/laggy
**Solutions:**
1. Use React DevTools Profiler to identify slow renders
2. Add memoization to expensive calculations
3. Implement virtualization for long lists
4. Optimize images (use WebP, lazy load)
5. Reduce backdrop-filter usage (expensive on mobile)

#### Issue: Large bundle size
**Solutions:**
```bash
# Analyze bundle
npx expo-cli export --public-url . --dev false
npx source-map-explorer dist/**/*.js

# Optimize imports (use specific imports, not entire libraries)
import { format } from 'date-fns'; // ✅ Good
import * as dateFns from 'date-fns'; // ❌ Bad
```

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

## Development Workflow

### Feature Development Process

**Branching Policy:** Every new feature must start from a dedicated branch (e.g., `feature/<summary>`). Do not develop or commit feature work directly on `main`.

1. **Planning Phase**
   - [ ] Review requirements in this CODEX.md
   - [ ] Break down feature into tasks
   - [ ] Identify affected components/files
   - [ ] Consider security implications
   - [ ] Plan data model changes if needed

2. **Implementation Phase**
   - [ ] Create feature branch: `git checkout -b feature/feature-name`
   - [ ] Implement changes following coding standards
   - [ ] Add TypeScript types for all new code
   - [ ] Handle errors gracefully
   - [ ] Update state management if needed

3. **Testing Phase** (MANDATORY)
   - [ ] Test feature manually in dev environment
   - [ ] Verify UI updates immediately
   - [ ] Test edge cases (empty state, max values, errors)
   - [ ] Test on multiple screen sizes (mobile, tablet, desktop)
   - [ ] Check dark mode compatibility
   - [ ] Verify Firebase rules work correctly
   - [ ] Test offline behavior

4. **Documentation Phase**
   - [ ] Update this CODEX.md with new features/requirements
   - [ ] Add JSDoc comments for complex functions
   - [ ] Update README.md if user-facing changes
   - [ ] Document any new environment variables

5. **Deployment Phase**
   - [ ] Commit with descriptive message
   - [ ] Push to GitHub
   - [ ] Verify GitHub Actions pass
   - [ ] Test production build locally: `npm run build:web`
   - [ ] Monitor Firebase usage after deployment

### Git Commit Message Format

```
<type>(<scope>): <subject>

<body>

<footer>
```

**Types:**
- `feat`: New feature
- `fix`: Bug fix
- `refactor`: Code refactoring
- `style`: UI/styling changes
- `docs`: Documentation updates
- `test`: Adding/updating tests
- `chore`: Build tasks, dependencies

**Examples:**
```bash
feat(tracking): add inline edit for push-up entries

- Add edit button to each entry row
- Open inline form on edit click
- Update database and UI on save
- Show confirmation message

Closes #42

---

fix(auth): prevent navigation before onboarding complete

Users were able to access HomeScreen before completing
onboarding by using browser back button.

Fixes #38

---

refactor(theme): extract color constants to theme context

- Move hardcoded colors to theme configuration
- Add type-safe color accessors
- Update all components to use theme colors
```

## API Reference

### Firebase Database Functions

Located in `src/services/database.ts`

#### User Management

```typescript
// Create or update user profile
await createOrUpdateUser(
  userId: string,
  data: Partial<UserProfile>
): Promise<void>

// Get user profile
const user = await getUser(userId: string): Promise<UserProfile | null>
```

#### Push-ups

```typescript
// Add entry
await addPushUpEntry(
  userId: string,
  count: number,
  notes?: string
): Promise<string>

// Get entries for date range
const entries = await getPushUpEntries(
  userId: string,
  startDate: Date,
  endDate: Date
): Promise<PushUpEntry[]>

// Update entry
await updatePushUpEntry(
  entryId: string,
  data: Partial<PushUpEntry>
): Promise<void>

// Delete entry
await deletePushUpEntry(entryId: string): Promise<void>
```

#### Water

```typescript
// Add entry
await addWaterEntry(
  userId: string,
  amount: number
): Promise<string>

// Get today's entries
const entries = await getWaterEntries(
  userId: string,
  date: Date
): Promise<WaterEntry[]>

// Calculate today's total
const total = await getTodayWaterTotal(userId: string): Promise<number>
```

#### Protein

```typescript
// Add entry
await addProteinEntry(
  userId: string,
  grams: number,
  notes?: string
): Promise<string>

// Get entries
const entries = await getProteinEntries(
  userId: string,
  startDate: Date,
  endDate: Date
): Promise<ProteinEntry[]>
```

#### Sport

```typescript
// Mark sport complete for today
await markSportComplete(userId: string): Promise<void>

// Check if sport completed today
const isComplete = await isSportCompleteToday(userId: string): Promise<boolean>

// Get sport entries
const entries = await getSportEntries(
  userId: string,
  startDate: Date,
  endDate: Date
): Promise<SportEntry[]>
```

#### Weight

```typescript
// Add weight entry
await addWeightEntry(
  userId: string,
  weight: number,
  bodyFat?: number
): Promise<string>

// Get weight history
const entries = await getWeightEntries(
  userId: string,
  days: number
): Promise<WeightEntry[]>

// Calculate BMI
const bmi = calculateBMI(weight: number, height: number): number
```

### Theme Context API

```typescript
import { useTheme } from '../contexts/ThemeContext';

// In component
const { theme, colors, setTheme } = useTheme();

// Available themes
type ThemeMode = 'light' | 'dark' | 'auto';

// Colors object structure
interface ThemeColors {
  // Base colors
  background: string;
  surface: string;
  text: string;
  textSecondary: string;
  border: string;

  // Category colors
  pushUps: string;
  water: string;
  sport: string;
  protein: string;
  weight: string;

  // Status colors
  success: string;
  error: string;
  warning: string;

  // Glass effect colors
  glassBackground: string;
  glassBorder: string;
}
```

### Auth Context API

```typescript
import { useAuth } from '../contexts/AuthContext';

// In component
const { user, profile, loading, signIn, signOut } = useAuth();

// Auth state
user: User | null;              // Firebase user object
profile: UserProfile | null;    // User profile from Firestore
loading: boolean;               // Auth state loading

// Methods
signIn: () => Promise<void>;    // Sign in with Google
signOut: () => Promise<void>;   // Sign out current user
```

## Future Enhancements

### Planned Features

#### Priority 1 (Next Sprint)
- [ ] **Habit Streaks**: Track consecutive days of goal completion
- [ ] **Custom Goals**: Allow users to set personalized daily targets
- [ ] **Photo Logging**: Add before/after progress photos
- [ ] **Export Data**: Download personal data as CSV/JSON
- [ ] **Weekly Reports**: Email summary of weekly progress

#### Priority 2 (Backlog)
- [ ] **Social Features**: Like/comment on friend's achievements
- [ ] **Challenges**: Create group challenges (e.g., "1000 push-ups this month")
- [ ] **Achievements/Badges**: Gamification rewards
- [ ] **Meal Tracking**: Log full meals instead of just protein
- [ ] **Workout Plans**: Pre-defined workout routines
- [ ] **Rest Days**: Track rest/recovery days
- [ ] **Injury Tracking**: Log injuries and affected activities

#### Priority 3 (Wishlist)
- [ ] **AI Coach**: Personalized recommendations based on progress
- [ ] **Wearable Integration**: Sync with Apple Health, Google Fit
- [ ] **Video Tutorials**: Exercise form guides
- [ ] **Nutrition Database**: Food search with macros
- [ ] **Calendar View**: Monthly calendar with all activities
- [ ] **Voice Logging**: "Hey Siri/Alexa, log 50 push-ups"

### Technical Debt

- [ ] Add unit tests (Jest + React Testing Library)
- [ ] Add E2E tests (Detox for mobile, Playwright for web)
- [ ] Implement proper error boundaries
- [ ] Add performance monitoring (Firebase Performance)
- [ ] Set up Sentry for error tracking
- [ ] Implement analytics (Firebase Analytics)
- [ ] Add offline support with local database sync
- [ ] Optimize bundle size (code splitting, lazy loading)
- [ ] Implement proper loading states (skeletons)
- [ ] Add accessibility features (screen reader support)
- [ ] Internationalization (i18n) support

### Performance Optimizations

- [ ] Implement pagination for large data sets
- [ ] Add infinite scroll for history views
- [ ] Cache frequently accessed data (React Query)
- [ ] Optimize images (WebP format, responsive images)
- [ ] Implement service worker for PWA features
- [ ] Add request debouncing for search/filter
- [ ] Optimize Firestore queries (composite indexes)
- [ ] Implement virtual scrolling for long lists

## Resources & References

### Official Documentation
- [Expo Documentation](https://docs.expo.dev/)
- [React Navigation](https://reactnavigation.org/docs/getting-started)
- [Firebase Documentation](https://firebase.google.com/docs)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [React Native Documentation](https://reactnative.dev/docs/getting-started)

### Design Resources
- [Glassmorphism.com](https://glassmorphism.com/) - Glass effect generator
- [Coolors.co](https://coolors.co/) - Color palette generator
- [React Native UI Libraries](https://www.reactnative.directory/)

### Security Resources
- [OWASP Mobile Security](https://owasp.org/www-project-mobile-security/)
- [Firebase Security Rules Guide](https://firebase.google.com/docs/rules)
- [Socket.dev](https://socket.dev/) - Dependency security

### Learning Resources
- [React Native Express](https://www.reactnative.express/)
- [Expo Router Tutorial](https://docs.expo.dev/router/introduction/)
- [Firebase for React Native](https://rnfirebase.io/)

## Changelog

### Version 2.1.0 (2025-10-01)
- ?? Converted project documentation from Claude Code to Codex CLI
- ??? Updated Expo notification scheduling to use current APIs and avoid web build failures
- ?? Hardened weight graph rendering for single data points and refined loading skeleton typings

### Version 2.0.0 (2025-10-01)
- ✨ Restructured CODEX.md for professional setup
- ✨ Added comprehensive coding standards
- ✨ Added detailed troubleshooting guide
- ✨ Added development workflow process
- ✨ Added API reference documentation
- ✨ Added future enhancements roadmap
- ✨ Added resources and references section

### Version 1.x.x (Previous)
- Initial setup and basic documentation
- Core tracking features implemented
- Glassmorphism design system
- Firebase integration
- GitHub Actions deployment

---

**Last Updated:** 2025-10-01
**Maintained By:** Development Team
**Questions?** Check the resources section or open an issue on GitHub












