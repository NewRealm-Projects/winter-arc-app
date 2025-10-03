# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Features
- Add Git hooks (Husky) to catch errors before push
- Pre-commit hook validates TypeScript and ESLint
- Pre-push hook runs full test suite including build

### Bug Fixes
- Fix port conflict in Lighthouse CI workflows (mobile-tests now uses port 4174)
- Make Playwright baseURL configurable via BASE_URL environment variable
- Fix Vitest attempting to run Playwright tests by excluding tests/** directory

### Documentation
- Add Git Hooks section to CLAUDE.md
- Update DoD and PR process to mention hooks

### Chore
- Configure workflow dependencies: CI → Lighthouse CI → Deploy
- Deploy only runs if both CI and Lighthouse CI succeed
- Prevent broken builds from reaching production
- Install Husky ^9.1.7 for Git hooks

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
