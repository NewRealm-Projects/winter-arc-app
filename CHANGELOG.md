# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

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
