# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

---

# Winter Arc Fitness Tracking PWA

## Project Overview

Progressive Web App (PWA) für iOS und Android namens "Winter Arc Fitness Tracker" - eine umfassende Fitness-Tracking-App mit Fokus auf Liegestütze, Sport, Ernährung und Gewichtstracking.

---

## How to Work on This Repo

### Branching Strategy
- `main` - Production branch (protected, requires PR + CI pass)
- `develop` - Staging branch for integration testing
- `feat/<topic>` - Feature branches (branch from develop)
- `fix/<topic>` - Bug fix branches

### Commit Message Format
Follow conventional commits style:
```
type(scope): subject

body (optional)

🤖 Generated with [Claude Code](https://claude.com/claude-code)
Co-Authored-By: Claude <noreply@anthropic.com>
```

Types: `feat`, `fix`, `refactor`, `chore`, `test`, `docs`, `style`, `perf`

### Scripts
```bash
# Development
npm run dev              # Start dev server
npm run build            # Build for production
npm run preview          # Preview production build

# Quality Assurance
npm run lint             # Run ESLint
npm run lint:unused      # Check for unused imports
npm run typecheck        # TypeScript type checking
npm run scan:knip        # Find unused files/exports
npm run scan:tsprune     # Find dead TypeScript exports
npm run scan:dep         # Find unused dependencies

# Testing
npm run test:unit        # Run Vitest unit tests
npm run test:ui          # Run Playwright visual tests
npm run test:all         # Run all checks (typecheck + lint + unit + UI)

# Performance & Lighthouse
npm run analyze          # Analyze bundle size with visualizer
npm run perf:budget      # Check performance budgets
npm run lhci:collect     # Collect Lighthouse CI metrics
npm run lhci:assert      # Assert Lighthouse CI thresholds
npm run lhci:upload      # Upload Lighthouse CI results
npm run lhci:run         # Run full Lighthouse CI workflow
```

### Definition of Ready (DoR)
Before starting work on a task:
- [ ] Problem clearly defined with acceptance criteria
- [ ] Impact and user value articulated
- [ ] Technical approach discussed and approved
- [ ] Test strategy identified (unit + UI tests needed?)
- [ ] Light/dark mode considerations noted
- [ ] Mobile/responsive requirements clear
- [ ] Dependencies and blockers identified

### Definition of Done (DoD)
Before marking a task as complete:
- [ ] Code works as expected in dev environment
- [ ] All tests pass (`npm run test:all`)
- [ ] Visual regression OK in both light and dark mode
- [ ] No TypeScript errors or ESLint warnings
- [ ] **Git hooks passed** (pre-commit and pre-push checks)
- [ ] Code reviewed (if PR workflow)
- [ ] Docs updated (CLAUDE.md, comments, etc.)
- [ ] **CHANGELOG.md updated** with new version and changes
- [ ] **package.json version bumped** according to Semantic Versioning
- [ ] Commits follow message format
- [ ] Mobile/responsive behavior tested
- [ ] Telemetry/error logging added if needed

### Versioning & Changelog

**Semantic Versioning (SemVer):**
- **Patch** (0.0.1 → 0.0.2): Bug fixes, small improvements, documentation updates
- **Minor** (0.0.2 → 0.1.0): New features, backwards-compatible changes
- **Major** (0.1.0 → 1.0.0): Breaking changes, major redesigns

**CHANGELOG.md Requirements:**
1. **Every change must be documented** in CHANGELOG.md before committing
2. **Group changes by type:**
   - 🎉 **Features** - New functionality
   - 🐛 **Bug Fixes** - Error corrections
   - ⚡ **Performance** - Speed/efficiency improvements
   - 📚 **Documentation** - README, CLAUDE.md, comments
   - 🔧 **Chore** - Dependencies, config, tooling
   - ♻️ **Refactor** - Code restructuring without behavior change
   - 🧪 **Tests** - Test additions or improvements
3. **Format:**
   ```markdown
   ## [0.1.0] - 2025-01-04

   ### Features
   - Add weather integration to dashboard header
   - Implement History page for tracking entries

   ### Bug Fixes
   - Fix TypeScript 'any' type errors (30 instances)
   - Remove unused variables in error handlers
   ```
4. **Update package.json version** to match CHANGELOG.md

### Git Hooks (Husky)

Pre-push and pre-commit hooks automatically run before commits and pushes to catch errors early:

**Pre-commit Hook:**
- TypeScript type checking
- ESLint validation

**Pre-push Hook:**
- TypeScript type checking
- ESLint validation
- Unit tests (Vitest)
- Production build test

**Skip hooks (emergency only):**
```bash
git commit --no-verify
git push --no-verify
```

### Pull Request Process
1. Create feature branch from `develop`
2. Make changes in small, focused commits (hooks will auto-check)
3. **Update CHANGELOG.md and bump version in package.json**
4. Run `npm run test:all` locally (or rely on pre-push hook)
5. Push and create PR with screenshots (light/dark)
6. Address review feedback
7. Squash-merge when CI passes

---

## Backlog & Experiments

This section tracks planned features, ideas, and experimental work.

### Status Definitions
- ✅ **implemented** - Feature is live in production
- 🔵 **idea** - Raw idea, not yet refined
- 🟡 **draft** - Under exploration, needs design/tech validation
- 🟢 **planned** - Refined, ready for implementation
- 🔴 **blocked** - Waiting on dependencies or decisions

### Implemented Features

#### 1. Pushup Training Mode (Status: ✅ implemented)
**Value**: Structured progressive overload training with smart auto-progression
**Implementation**:
- Base & Bump algorithm in `src/utils/pushupAlgorithm.ts`
- 90-second rest timer between sets
- Pass/Hold/Fail status after workout
- Progressive plan generation with `generateProgressivePlan()`
- Tracking via PushupTrainingPage

#### 2. Leaderboard Preview Widget (Status: ✅ implemented)
**Value**: Quick glance at standings without navigating to full leaderboard
**Implementation**:
- `src/components/LeaderboardPreview.tsx`
- Shows top 5 users from group
- Displays on dashboard below week tracking
- Link to full leaderboard page
- Real-time updates via Firebase

#### 3. History Page (Status: ✅ implemented)
**Value**: View and manage all past tracking entries
**Implementation**:
- `src/pages/HistoryPage.tsx`
- Sorted entries by date (newest first)
- Delete individual entries with confirmation
- Full tracking data display per day
- Accessible via navigation

#### 4. Weather Integration (Status: ✅ implemented)
**Value**: Contextual weather info in motivation header
**Implementation**:
- `src/services/weatherService.ts`
- Uses Open-Meteo API (free, no API key required)
- Location: Aachen, Germany (50.7753, 6.0839)
- Shows temperature and weather emoji
- WMO Weather interpretation codes

#### 5. Visual Regression Testing (Status: ✅ implemented)
**Value**: Prevent UI bugs, ensure design consistency
**Implementation**:
- Playwright setup in `playwright.config.ts`
- Baseline screenshots in `tests/`
- CI workflow in `.github/workflows/`
- Mobile device emulation

#### 6. Lighthouse CI & Performance (Status: ✅ implemented)
**Value**: Monitor performance, accessibility, and best practices
**Implementation**:
- Lighthouse CI config in `lighthouserc.json`
- Performance budgets in `scripts/check-budgets.mjs`
- CI workflow for automated checks
- Scripts: `lhci:collect`, `lhci:assert`, `lhci:upload`

#### 7. Vitest Unit Tests (Status: ✅ implemented)
**Value**: Business logic validation, regression prevention
**Implementation**:
- Vitest config in `vitest.config.ts`
- Test for motivation logic: `src/logic/motivation.test.ts`
- Accessibility tests: `src/__tests__/a11y.test.tsx`
- Script: `npm run test:unit`

### Planned Features

#### 1. Profile Pictures (Status: 🟡 draft)
**Value**: Personalization and social engagement in leaderboard
**Acceptance Criteria**:
- Upload profile picture in settings
- Display in leaderboard and user profile
- Firebase Storage integration (storageService.ts already exists)
- Image compression/optimization
- Placeholder avatars based on nickname initial

#### 2. Push Notifications (Status: 🔵 idea)
**Value**: Daily reminders to track progress
**Needs**: Firebase Cloud Messaging setup, permission handling, notification settings UI

#### 3. Data Export (Status: 🔵 idea)
**Value**: Users can download their data (GDPR compliance, data portability)
**Needs**: CSV/JSON export format, date range selection

#### 4. Social Sharing (Status: 🔵 idea)
**Value**: Viral growth, motivation through social pressure
**Needs**: Generate shareable progress cards (images), share API integration

#### 5. Achievements/Badges (Status: 🔵 idea)
**Value**: Gamification, increased engagement
**Needs**: Badge system design, unlock criteria, UI for badge display

### Technical Debt & Improvements

#### 1. Component Storybook (Status: 🟢 planned)
**Value**: Isolated component development, design system documentation
**Tasks**: Setup Storybook, create stories for tiles and core components

#### 2. Expand Unit Test Coverage (Status: 🟡 draft)
**Value**: Higher code confidence, regression prevention
**Needs**: Test pushup algorithm, calculations, data transformations, services

---

## Design Tokens & Theming

### Color Palette

**Light Mode:**
```css
--primary-blue: #3B82F6;      /* Accent color for CTAs */
--bg-light: #F8FAFC;          /* Main background */
--surface-light: #FFFFFF;     /* Cards, panels */
--text-primary: #0F172A;      /* Headings, primary text */
--text-secondary: #64748B;    /* Secondary text, labels */
--border-light: #E2E8F0;      /* Dividers, borders */
```

**Dark Mode:**
```css
--primary-blue: #60A5FA;      /* Lighter blue for dark bg */
--bg-dark: #0F172A;           /* Main background */
--surface-dark: #1E293B;      /* Cards, panels */
--text-primary-dark: #F1F5F9; /* Headings, primary text */
--text-secondary-dark: #94A3B8; /* Secondary text, labels */
--border-dark: #334155;       /* Dividers, borders */
```

**Glassmorphism:**
```css
--glass-light: rgba(255, 255, 255, 0.6);
--glass-dark: rgba(17, 25, 40, 0.55);
--glass-blur: blur(16px);
--glass-border: rgba(255, 255, 255, 0.12);
```

### Typography Scale
```css
--text-xs: 0.75rem;    /* 12px - Small labels */
--text-sm: 0.875rem;   /* 14px - Body small */
--text-base: 1rem;     /* 16px - Body text */
--text-lg: 1.125rem;   /* 18px - Subheadings */
--text-xl: 1.25rem;    /* 20px - Headings */
--text-2xl: 1.5rem;    /* 24px - Page titles */
--text-3xl: 1.875rem;  /* 30px - Hero text */
--text-4xl: 2.25rem;   /* 36px - Large numbers/stats */
```

### Spacing Scale
```css
--space-1: 0.25rem;  /* 4px */
--space-2: 0.5rem;   /* 8px */
--space-3: 0.75rem;  /* 12px */
--space-4: 1rem;     /* 16px */
--space-5: 1.25rem;  /* 20px */
--space-6: 1.5rem;   /* 24px */
--space-8: 2rem;     /* 32px */
--space-10: 2.5rem;  /* 40px */
--space-12: 3rem;    /* 48px */
```

### Border Radius
```css
--radius-sm: 0.375rem;  /* 6px - Small elements */
--radius-md: 0.5rem;    /* 8px - Buttons, inputs */
--radius-lg: 0.75rem;   /* 12px - Cards */
--radius-xl: 1rem;      /* 16px - Panels */
--radius-2xl: 1.5rem;   /* 24px - Hero cards */
--radius-full: 9999px;  /* Circular elements */
```

### Z-Index Layers
```css
--z-base: 0;           /* Base layer */
--z-dropdown: 10;      /* Dropdowns */
--z-sticky: 20;        /* Sticky headers */
--z-modal-backdrop: 40; /* Modal backgrounds */
--z-modal: 50;         /* Modals */
--z-toast: 60;         /* Toast notifications */
--z-tooltip: 70;       /* Tooltips */
```

### Shadows
```css
--shadow-sm: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
--shadow-md: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
--shadow-lg: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
--shadow-xl: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
```

### Animation
```css
--transition-fast: 150ms ease-in-out;
--transition-base: 200ms ease-in-out;
--transition-slow: 300ms ease-in-out;
```

### Backgrounds
```css
--bg-image-light: url('/bg/light/winter_arc_bg_light.webp');
--bg-image-dark: url('/bg/dark/winter_arc_bg_dark.webp');
```

**Usage Pattern:**
```tsx
// Apply background to root layout
<main className="app-bg min-h-screen">
  {/* Glass cards */}
  <section className="glass rounded-2xl p-6 shadow-xl">
    ...
  </section>
</main>
```

---

## Technologie-Stack

- **Frontend**: React mit TypeScript
- **Build-Tool**: Vite
- **Styling**: Tailwind CSS
- **Backend**: Firebase (Authentication, Firestore, Cloud Functions)
- **AI**: Google Gemini für personalisierte Motivationssprüche
- **Weather**: Open-Meteo API (free, no key required) für Wetterdaten
- **Security**: Firebase App Check mit reCAPTCHA v3
- **PWA**: Workbox für Service Worker und Offline-Funktionalität
- **Charts**: Recharts für Gewichtsgraphen
- **State Management**: Zustand mit automatischer Firebase-Synchronisation
- **Testing**: Vitest (unit), Playwright (E2E & visual regression)
- **Performance**: Lighthouse CI, Performance Budgets, Bundle Analyzer
- **Error Tracking**: Sentry für Fehlermonitoring

---

## Authentifizierung & Onboarding

### Login
- Google SSO über Firebase Auth
- Beim ersten Login: Onboarding-Flow mit folgenden Schritten:
  1. Sprache (Deutsch/English)
  2. Spitzname
  3. Geschlecht (Männlich/Weiblich/Divers oder Male/Female/Diverse)
  4. Größe (in cm)
  5. Gewicht (in kg)
  6. Körperfettanteil (KFA, optional, in %)
  7. Maximale Liegestütze am Stück (für Trainingsplan-Generierung)

---

## App-Struktur (Bottom Navigation)

### Seite 1: Dashboard/Übersicht

**Header mit AI-Motivation (oben)**
- Persönliche Begrüßung mit Nickname
- **Wetter-Integration**: Zeigt aktuelle Temperatur und Wetter-Emoji für Aachen (via Open-Meteo API)
- **AI-generierter Motivationsspruch**: Analysiert Tracking-Daten (Streak, Liegestütze, Sport-Sessions) und generiert täglich einen personalisierten, motivierenden Spruch über Google Gemini
- Fallback auf statische Motivationssprüche, falls Gemini API nicht konfiguriert
- Glassmorphism-Design mit Backdrop-Blur-Effekt

**Wochentracking (Mitte)**
- Zeigt die aktuelle Woche (Montag-Sonntag)
- Visueller Progress-Indikator für täglich erledigte Aufgaben
- Checkboxen oder Kreise für jeden Tag mit farblicher Kennzeichnung (erledigt/offen)

**Leaderboard (darunter)**
- Gruppen-basiertes Ranking
- User können Gruppencode eingeben/erstellen (z.B. "boys")
- Zeigt alle Mitglieder der Gruppe mit ihrem Score
- Score basiert auf: erledigte Tracking-Tage, Liegestütze, Sport-Sessions
- Anzeige: Rang, Spitzname, Punkte/Progress

### Seite 2: Tracking

**1. Liegestütze-Kachel (oben)**
Beim Klick öffnet sich Modal mit zwei Modi:

**Modus A: Schnelleingabe**
- Einfaches Zahlenfeld zur Eingabe der Gesamt-Liegestütze

**Modus B: Trainingsmodus**
Implementiere den "Base & Bump" Algorithmus:

```typescript
// Initialisierung (einmalig nach Onboarding)
function initPushupPlan(maxReps: number) {
  const B = Math.max(3, Math.floor(0.45 * maxReps));
  return {
    baseReps: B,
    sets: 5,
    restTime: 90 // Sekunden
  };
}

// Täglicher Trainingsplan
function getDailyPlan(state) {
  return {
    sets: [
      { number: 1, target: state.baseReps, type: 'fixed' },
      { number: 2, target: state.baseReps, type: 'fixed' },
      { number: 3, target: state.baseReps, type: 'fixed' },
      { number: 4, target: state.baseReps, type: 'fixed' },
      { number: 5, target: state.baseReps + 2, type: 'amrap' } // AMRAP mit Limit
    ],
    restTime: state.restTime
  };
}

// Auswertung nach Training
function evaluateWorkout(state, reps: number[]) {
  const B = state.baseReps;
  const hit = reps.slice(0, 4).filter(r => r >= B).length;
  const amrapOk = reps[4] >= B;

  let nextB;
  if (hit === 4 && amrapOk) {
    nextB = B + 1; // Progress
  } else if (hit === 3 || (hit === 4 && reps[4] === B - 1)) {
    nextB = B; // Hold
  } else {
    nextB = Math.max(3, B - 1); // Regression
  }

  // Deload Guard
  const nextSets = (nextB * 5 > 120) ? 4 : 5;

  return {
    baseReps: nextB,
    sets: nextSets,
    restTime: state.restTime,
    status: hit === 4 && amrapOk ? 'pass' : hit === 3 ? 'hold' : 'fail'
  };
}
```

**Trainingsmodus UI:**
- Zeige 5 Kacheln für jeden Satz mit Ziel-Wiederholungen
- 90-Sekunden Countdown-Timer zwischen Sätzen
- Input für tatsächliche Wiederholungen pro Satz
- Nach Abschluss: Status-Badge (Pass/Hold/Fail) und neue Basis für morgen
- Info-Banner: "1 Wiederholung vor Form-Kollaps stoppen"
- **Wöchentliche Re-Kalibrierung** (Tag 7): AMRAP-Test zur Neuberechnung

**2. Sport-Kachel**
Drei Checkbox-Optionen (können täglich mehrfach abgehakt werden):
- HIIT/HYROX
- Cardio
- Gym

**3. Wasser-Kachel**
- Ziel: z.B. 3 Liter pro Tag
- Visuelle Darstellung (Gläser oder Fortschrittsbalken)
- Schnell-Buttons: +250ml, +500ml, +1L
- Manuelle Eingabe möglich

**4. Protein-Kachel**
- Ziel basierend auf Körpergewicht (z.B. 2g pro kg)
- Input-Feld für Gramm Protein
- Tagesfortschritt anzeigen

**5. Gewichts-Graph (unten)**
- Eingabemöglichkeit: Gewicht (kg) + optional KFA (%)
- Liniendiagramm für Gewichtsverlauf (letzte 30/90 Tage)
- BMI-Berechnung und Anzeige, wenn Größe vorhanden
- Formel: BMI = Gewicht (kg) / (Größe (m))²

### Seite 3: Erweitertes Leaderboard
- Monatsübersicht mit Kalenderansicht
- Heatmap der Trainingstage
- Detaillierte Statistiken pro Gruppenmitglied:
  - Gesamte Liegestütze
  - Sport-Sessions
  - Streak (aufeinanderfolgende Tage)
  - Durchschnittliche Wasseraufnahme
  - Durchschnittliche Proteinaufnahme
- Filter: Woche/Monat/All-Time
- Achievements/Badges System

### Seite 4: Einstellungen

**Profil**
- Bearbeiten aller Onboarding-Daten (Sprache, Spitzname, Geschlecht, Größe, Gewicht, KFA, max. Liegestütze)
- Profilbild (optional)

**Gruppen**
- Aktuellen Gruppencode anzeigen
- Gruppencode ändern/neue Gruppe beitreten
- Gruppe verlassen

**Benachrichtigungen**
- Tägliche Erinnerung (Uhrzeit wählbar)
- Erinnerung für unvollständige Tage
- Push-Notifications via Firebase Cloud Messaging

**Datenschutz & Konto**
- Abmelden
- Konto löschen (mit Bestätigung, löscht alle Daten aus Firebase)
- Datenschutzerklärung
- AGB

### Seite 5: History/Verlauf (Separate Page)

**Übersicht**
- Vollständige Liste aller vergangenen Tracking-Einträge
- Sortiert nach Datum (neueste zuerst)
- Zugriff via Navigation vom Dashboard

**Features**:
- Anzeige aller Tracking-Daten pro Tag (Liegestütze, Sport, Wasser, Protein, Gewicht)
- Löschen einzelner Einträge mit Bestätigungsdialog
- Formatierte Datumsanzeige (lokalisiert DE/EN)
- Zurück-Button zum Dashboard

---

## Offline-Funktionalität

- Service Worker mit Workbox implementieren
- Offline-First Strategie:
  - Alle Tracking-Eingaben werden lokal im IndexedDB/localStorage gespeichert
  - Bei Internetverbindung: Sync mit Firestore
  - Conflict Resolution bei gleichzeitigen Änderungen
- Background Sync für ausstehende Updates
- Cache-First Strategie für statische Assets
- Network-First für Leaderboard/Gruppendaten

---

## Firebase Datenmodell

```typescript
// Firestore Collections
users: {
  [userId]: {
    language: 'de' | 'en';
    nickname: string;
    gender: 'male' | 'female' | 'diverse';
    height: number; // cm
    weight: number; // kg
    bodyFat?: number; // %
    maxPushups: number;
    groupCode: string;
    createdAt: timestamp;
    pushupState: {
      baseReps: number;
      sets: number;
      restTime: number;
    };
  }
}

tracking: {
  [userId]: {
    [date: YYYY-MM-DD]: {
      pushups: {
        total?: number; // Schnelleingabe
        workout?: { // Trainingsmodus
          reps: number[];
          status: 'pass' | 'hold' | 'fail';
        };
      };
      sports: {
        hiit: boolean;
        cardio: boolean;
        gym: boolean;
      };
      water: number; // ml
      protein: number; // g
      weight?: {
        value: number; // kg
        bodyFat?: number; // %
        bmi?: number;
      };
      completed: boolean;
    }
  }
}

groups: {
  [groupCode]: {
    name: string;
    members: string[]; // userIds
    createdAt: timestamp;
  }
}
```

---

## Design-Anforderungen

- Modernes, cleanes UI mit Winter-Theme (kühle Farben: Blau, Weiß, Grau-Töne)
- Dark Mode Support
- Responsive für alle Bildschirmgrößen
- Animationen für Übergänge und Erfolgsmeldungen
- Haptic Feedback auf mobilen Geräten
- iOS Safari und Chrome Android optimiert

---

## PWA Konfiguration

- manifest.json mit Icons (512x512, 192x192)
- App-Name: "Winter Arc Tracker"
- Standalone Display Mode
- Theme Color und Background Color
- Splash Screens für iOS

---

## Zusätzliche Features

- Streak-Counter (aufeinanderfolgende Trainingstage)
- Motivierende Quotes/Sprüche
- Erfolgs-Notifications bei Meilensteinen
- Export der eigenen Daten (CSV/JSON)
- Teilbare Fortschritts-Cards (Social Media)

---

## Sicherheit & Performance

- Firebase Security Rules für Datenschutz
- Input Validation auf Client und Server
- Rate Limiting für API-Calls
- Optimierte Bundle-Größe
- Lazy Loading für Routen
- Optimierte Bilder (WebP mit Fallback)

---

## Development Commands

```bash
# Install dependencies
npm install

# Setup environment variables
cp .env.example .env
# Then fill in Firebase credentials in .env

# Run development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Run tests
npm test

# Run linter
npm run lint
```

### Environment Variables Setup

The app requires the following environment variables in `.env`:

**Firebase Configuration (Required):**
```bash
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
```

**Gemini AI for Personalized Quotes (Optional):**
```bash
VITE_GEMINI_API_KEY=your_gemini_api_key
```
- Get your API key from: https://makersuite.google.com/app/apikey
- If not set, the app will show fallback motivational quotes
- The AI analyzes user tracking data (streak, pushups, sports) to generate personalized daily motivational quotes

**Firebase App Check with reCAPTCHA v3 (Optional but recommended for production):**
```bash
VITE_RECAPTCHA_SITE_KEY=your_recaptcha_site_key
```
- Setup steps:
  1. Go to Firebase Console → App Check → Register app
  2. Select reCAPTCHA v3 as provider
  3. Register your domain (localhost for dev, your-domain.com for prod)
  4. Copy the site key to `.env`
- If not set, App Check will be skipped (development mode)
- Protects Firebase services from abuse and unauthorized access

---

## Architecture

### State Management

The app uses **Zustand** for global state management:
- `useStore` - Main store with user, tracking, dark mode
- State automatically syncs with Firebase via hooks

### Firebase Integration

**Authentication:**
- `useAuth` hook - Listens to Firebase auth state
- Automatically fetches/creates user data on login
- Redirects to onboarding if user data doesn't exist

**Firestore:**
- `firestoreService` - CRUD operations for users, tracking, groups
- `useTracking` hook - Auto-saves tracking data (debounced 1s)
- Security rules prevent unauthorized access

### Key Hooks

- `useAuth()` - Firebase authentication listener
- `useTracking()` - Auto-sync tracking data to Firestore

### Data Flow

1. User logs in with Google SSO
2. `useAuth` fetches user data from Firestore
3. If no user data exists, redirect to onboarding
4. Onboarding saves user data to Firestore
5. Tracking changes auto-save to Firestore (debounced)

---

## Firebase Structure

```
firestore/
├── users/{userId}
│   ├── nickname: string
│   ├── gender: 'male' | 'female' | 'diverse'
│   ├── height: number
│   ├── weight: number
│   ├── bodyFat?: number
│   ├── maxPushups: number
│   ├── groupCode: string
│   ├── createdAt: timestamp
│   └── pushupState: { baseReps, sets, restTime }
│
├── tracking/{userId}/days/{date}
│   ├── pushups: { total?, workout? }
│   ├── sports: { hiit, cardio, gym }
│   ├── water: number
│   ├── protein: number
│   ├── weight?: { value, bodyFat?, bmi? }
│   └── completed: boolean
│
└── groups/{groupCode}
    ├── name: string
    ├── members: string[]
    └── createdAt: timestamp
```

---

## Best Practices

- Implementiere Best Practices für React, TypeScript und PWA-Entwicklung
- Code-Splitting und Lazy Loading für optimale Performance
- Accessibility (a11y) Standards einhalten
- SEO-Optimierung
- Progressive Enhancement Strategie
