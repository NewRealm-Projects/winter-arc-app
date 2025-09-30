# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Winter Arc is a cross-platform fitness tracking application built with Expo/React Native. It runs on:
- Web browsers
- iOS devices
- Android devices

The app tracks:
- Push-ups
- Sport activities (running, cycling, gym, etc.)
- Nutrition (meals with calories)
- Water intake

## Technology Stack

- **Framework**: Expo (React Native) with TypeScript
- **Backend**: Firebase (Authentication + Firestore)
- **Navigation**: React Navigation (Stack Navigator)
- **Deployment**: GitHub Actions → GitHub Pages

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
├── contexts/        # React contexts (AuthContext)
├── screens/         # Screen components
│   ├── LoginScreen.tsx
│   ├── HomeScreen.tsx
│   ├── PushUpsScreen.tsx
│   ├── WaterScreen.tsx
│   ├── SportScreen.tsx
│   └── NutritionScreen.tsx
├── services/        # External services
│   ├── firebase.ts  # Firebase initialization
│   └── database.ts  # Firestore CRUD operations
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
2. Can sign up or sign in with email/password
3. `AuthContext` manages authentication state
4. Authenticated users see `HomeScreen` with navigation to tracking screens

## Data Model

All entries are stored in Firestore with user ID association:

- `sportEntries`: type, duration, date, notes
- `pushUpEntries`: count, date, notes
- `nutritionEntries`: mealType, description, calories, date, notes
- `waterEntries`: amount, date

## Key Features

- **Simple onboarding**: Email/password registration, no verification required
- **Quick logging**: Pre-selected options for fast data entry
- **History view**: Each screen shows recent entries
- **Cross-platform**: Same codebase for web, iOS, and Android
