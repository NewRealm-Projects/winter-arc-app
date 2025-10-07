# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- Profile picture management: Google avatars are uploaded to Firebase Storage during onboarding, users can replace them with custom uploads, and sharing preferences are configurable in-app. Updated Firebase Storage rules restrict access to shared photos.

## [0.1.0] - 2025-10-06

### 🎉 Features

- **Agentisches Entwicklungs-Setup** - Strukturiertes Agent-System für Qualitätssicherung
  - 4 spezialisierte Agents: UI-Refactor, PWA/Performance, Test/Guard, Docs/Changelog
  - Agent-Specs in `.agent/` Verzeichnis
  - Agent-Policies und PR-Templates
  - Agent-spezifische Scripts (Lighthouse, Bundle Analysis, Artifacts)

- **Design Token System** - Zentralisierte Design-Variablen
  - Design Tokens in `src/theme/tokens.ts`
  - Glass/Blur Presets (glassCardClasses, trackedTileClasses, etc.)
  - Spacing, Radius, Shadow, Blur Tokens
  - Helper Functions: `getTileClasses(isTracked)`

- **CI/CD Pipeline** - Automatisierte Quality Gates
  - GitHub Actions Workflow (`.github/workflows/ci.yml`)
  - ESLint, TypeScript, Unit Tests, E2E Tests, Build, Lighthouse CI
  - Parallel job execution für schnellere Builds
  - Quality Gates: Lint=0, TS=0, Tests pass, Lighthouse≥90

### ⚡ Performance

- **Lazy Loading Optimization** - Route-based Code Splitting erweitert
  - DashboardPage von eager zu lazy loading migriert
  - Nur kritische Auth-Pages eager: LoginPage, OnboardingPage
  - Main Bundle Size: 86 KB (vorher: ~110 KB)
  - Performance Report in `artifacts/performance/PERFORMANCE.md`

- **Bundle Analysis** - Detaillierte Bundle-Size-Reports
  - Total JS Size: 1204 KB (Firebase: 448 KB, Recharts: 376 KB)
  - Bundle Visualizer: `artifacts/bundle/stats.html`
  - Bundle Summary: `artifacts/bundle/bundle-summary.md`

### 🧪 Tests

- **E2E Test Specifications** - Playwright Test-Suites (26 Tests total)
  - Tracking Flow: 8 Tests (`tests/e2e/tracking.spec.ts`)
  - Navigation Flow: 9 Tests (`tests/e2e/navigation.spec.ts`)
  - Training Flow: 9 Tests (`tests/e2e/training.spec.ts`)
  - Test README mit Firebase Auth Emulator Setup-Anleitung
  - Status: Spezifikationen fertig, Emulator Setup ausstehend

### 📚 Documentation

- **README.md** - Umfassende Projekt-Dokumentation
  - Agent-System Erklärung
  - Performance-Metriken Tabelle
  - Testing Strategy mit Coverage-Zielen
  - Tech Stack detailliert
  - Development Scripts vollständig

- **CONTRIBUTING.md** - Beitrags-Guidelines
  - Branching-Strategie (main → dev → feat/*)
  - Commit-Konventionen (Conventional Commits)
  - PR-Prozess mit Template
  - Definition of Done
  - Code Quality Gates
  - Semantic Versioning Regeln

- **CLAUDE.md** - Agent-System Abschnitt
  - 4 Agents dokumentiert mit Triggern
  - Agent-Workflow erklärt
  - Policies referenziert

### 🔧 Chore

- **gitignore** - Auto-generierte Dateien ignorieren
  - `*.tsbuildinfo` (TypeScript Cache)
  - `stats.html` (Bundle Visualizer)

### 🏆 Agent PRs

- **PR #27**: Agent Infrastructure Setup
- **PR #28**: UI-Refactor Agent - Design Token Migration
- **PR #29**: Test/Guard Agent - E2E Test Specifications
- **PR #30**: PWA/Performance Agent - Lazy Loading & Bundle Optimization

---

## [0.0.5] - 2025-10-06

### Chore
- 🔧 **Archive GitHub Actions Workflows** - Moved CI/CD workflows to `.github/workflows-archived/`
  - Archived `ci.yml` (CI tests: TypeScript, ESLint, Playwright, hygiene scans)
  - Archived `deploy.yml` (GitHub Pages deployment)
  - Archived `lighthouse-ci.yml` (Lighthouse CI and mobile device tests)
  - Workflows can be restored by moving files back to `.github/workflows/`

## [0.0.4] - 2025-10-04

### Removed
- ♻️ **History/Verlauf Page** - Archived History page (reversible via HISTORY_ENABLED flag)
  - Removed route from router (`/tracking/history`)
  - Removed navigation links from Dashboard and BottomNav
  - Created feature flag system in `src/config/features.ts`
  - Archived `src/pages/HistoryPage.tsx` with clear reactivation instructions
  - Updated CLAUDE.md "Archived Features" section with detailed reactivation steps

### Features
- 🎨 **Dashboard Redesign** - New compact top layout with streak/weather cards
  - Added StreakMiniCard (168×88px compact card with fire icon)
  - Added WeatherCard with live Aachen weather data
  - Added WeekCompactCard with horizontal chip-based week navigation
  - Removed "Hey, Lars!" header for cleaner layout
  - All cards use unified glass-card design
- 🎨 **Standardized Glass-Card Design** - All tiles now use consistent styling
  - Applied new glass-card classes to all tracking tiles (Pushup, Sport, Water, Protein, Weight)
  - Mandatory classes: `rounded-2xl bg-white/5 backdrop-blur-md border border-white/10 shadow-[0_6px_24px_rgba(0,0,0,0.25)]`
  - Deprecated old `glass-dark` class
  - Updated CLAUDE.md with mandatory design rules

### Documentation
- Updated CLAUDE.md with glass-card design system rules
- Added feature flag documentation

## [0.0.3] - 2025-10-04

### Removed
- ♻️ **AI Motivational Quote feature** - Temporarily removed AI-generated motivational quotes (archived for future reconsideration)
  - Removed Gemini API integration from dashboard header
  - Commented out VITE_GEMINI_API_KEY in .env.example
  - Archived aiService.ts and aiQuoteService.ts
  - Updated CLAUDE.md with "Archived Features" section

### Features
- Add Git hooks (Husky) to catch errors before push
- Pre-commit hook validates TypeScript and ESLint
- Pre-push hook runs full test suite including build
- Add Notes page with Firestore integration for personal workout notes
- Redesign tiles with compact mobile-first layout
- Simplify bottom navigation with glassmorphism style (remove Settings)
- Update WeekOverview with circular progress indicators
- Lower streak threshold from 4 to 3 tasks
- Implement Weekly Top 3 achievement system with automatic snapshots
- **Standardize tile design:** Emoji top-left, metric top-right for all tiles
- **Desktop layout:** Add tile-grid-2 class for flush alignment

### Bug Fixes
- Fix port conflict in Lighthouse CI workflows (mobile-tests now uses port 4174)
- Make Playwright baseURL configurable via BASE_URL environment variable
- Fix Vitest attempting to run Playwright tests by excluding tests/** directory
- **Fix streak calculation:** Only count days with 3/5 tasks completed (pushups, sports, water, protein, weight)

### Documentation
- Add Git Hooks section to CLAUDE.md
- Update DoD and PR process to mention hooks
- **Add local development instructions:** Emphasize npm run dev for live reloading
- **Add UI/UX Design Guidelines section:** Tile design system, layout rules, navigation structure

### Chore
- Configure workflow dependencies: CI → Lighthouse CI → Deploy
- Deploy only runs if both CI and Lighthouse CI succeed
- Prevent broken builds from reaching production
- Install Husky ^9.1.7 for Git hooks
- Add Firestore security rules for aiQuotes, notes, and weeklyTop3 collections
- Add firebase.json configuration file

## [0.0.2] - 2025-01-04

### Bug Fixes
- Fix 30 ESLint errors with proper TypeScript types
- Replace all 'any' types with proper interfaces (GroupMember, TrackingRecord)
- Remove unused variables (error, fetchError)
- Fix no-useless-escape in template strings
- Remove unnecessary try-catch wrapper in AI service

### Documentation
- Update CLAUDE.md with all implemented features
- Add Versioning & Changelog section to CLAUDE.md
- Document Weather Integration, History Page, and Lighthouse CI
- Add missing environment variables to .env.example (GEMINI, reCAPTCHA)

### Chore
- Configure Lighthouse CI for /login page with realistic thresholds
- Update accessibility threshold to 0.85 (from 0.9)

## [0.0.1] - 2025-01-03

### Features
- 🎉 Initial release of Winter Arc Fitness Tracker
- Pushup Training Mode with Base & Bump algorithm
- Progressive plan generation with automatic adjustment
- Leaderboard Preview Widget showing top 5 group members
- History Page for viewing and managing tracking entries
- Weather Integration (Open-Meteo API for Aachen, Germany)
- AI-generated motivational quotes via Google Gemini
- Google OAuth authentication with Firebase
- PWA support with offline functionality
- Dark mode with glassmorphism design
- Group-based tracking and leaderboard

### Testing
- Vitest unit tests for motivation logic
- Playwright E2E and visual regression tests
- Lighthouse CI integration
- Accessibility testing with vitest-axe

### Infrastructure
- Firebase Authentication, Firestore, Storage
- Sentry error tracking
- Performance budgets monitoring
- Bundle size analysis with rollup-plugin-visualizer

[unreleased]: https://github.com/WildDragonKing/winter-arc-app/compare/v0.0.2...HEAD
[0.0.2]: https://github.com/WildDragonKing/winter-arc-app/compare/v0.0.1...v0.0.2
[0.0.1]: https://github.com/WildDragonKing/winter-arc-app/releases/tag/v0.0.1
