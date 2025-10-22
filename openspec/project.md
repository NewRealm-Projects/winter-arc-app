# Project Context

## Purpose
Winter Arc is a Progressive Web App (PWA) for iOS/Android focused on fitness tracking with emphasis on push-ups, sports, nutrition, and weight management. The app provides a gamified experience with group challenges, leaderboards, and progress visualization.

## Tech Stack
- **Frontend**: React 18 + TypeScript + Vite
- **Styling**: Tailwind CSS 3.x (Mobile-first, responsive design)
- **State Management**: Zustand (lightweight, reactive store)
- **Backend**: Firebase
  - Authentication (Google OAuth)
  - Firestore (real-time database)
  - Storage (profile pictures, future media)
  - App Check (reCAPTCHA v3 for security)
- **Testing**: Vitest (unit), Playwright (e2e), Visual Regression
- **Monitoring**: Sentry (error tracking, performance monitoring)
- **PWA**: Workbox (service worker, offline-first)
- **CI/CD**: GitHub Actions + Codacy

## Project Conventions

### Code Style
- **TypeScript**: Strict mode enabled, no implicit `any`
- **ESLint**: All errors/warnings must be resolved
- **Prettier**: Enforced formatting (4 spaces, semicolons, single quotes)
- **Naming**:
  - Components: PascalCase (e.g., `UserProfile.tsx`)
  - Hooks: camelCase with `use` prefix (e.g., `useAuth.ts`)
  - Utils: camelCase (e.g., `formatDate.ts`)
  - Constants: UPPER_SNAKE_CASE (e.g., `MAX_PUSHUPS`)
- **Imports**: Absolute imports via `@/` alias (e.g., `@/components/Header`)
- **Comments**: Remove `console.*` in production, use logger or remove entirely

### Architecture Patterns
- **State Management**: Zustand store (`src/store/useStore.ts`) for global state
  - Auto-sync to Firebase via hooks
  - Debounced writes (1s) to reduce Firestore calls
- **Data Flow**:
  - UI Components → Hooks (`useAuth`, `useTracking`) → Zustand Store → Firebase
  - Real-time sync: Firestore listeners update store on remote changes
- **Component Structure**:
  - Tiles: Reusable tracking components (e.g., `PushupTile`, `WaterTile`)
  - Modals: Unified `AppModal` component (MANDATORY for all dialogs)
  - Pages: Route-level components in `src/pages/`
- **Performance**:
  - Code splitting & lazy loading (React.lazy)
  - Optimized images (WebP format)
  - Bundle budget: <600KB main chunk
- **Offline-First**:
  - Service Worker (Workbox) for caching
  - IndexedDB/localStorage for offline data
  - Sync queue for pending writes
- **Error Handling**:
  - Global ErrorBoundary for React errors
  - Sentry for unhandled exceptions & promise rejections
  - Sensitive data filtering (tokens, API keys)

### Testing Strategy
- **Unit Tests** (Vitest):
  - Utilities: 100% coverage
  - Hooks: Happy + unhappy paths
  - Components: Critical logic only (not UI snapshots)
- **E2E Tests** (Playwright):
  - Critical user flows (login, tracking, leaderboard)
  - Mobile & desktop viewports
  - Visual regression (screenshot comparison)
- **Coverage Requirements**:
  - Minimum: 80% statements/branches/lines
  - Target: 90% for critical paths (auth, tracking, Firebase)
- **Mocking**:
  - Firebase: Mock via `firebase-mock` or Firestore emulator
  - External APIs: MSW (Mock Service Worker)
- **Test Structure**:
  - Co-located: `__tests__/` folder next to source
  - Naming: `*.test.ts` or `*.spec.ts`

### Git Workflow
- **Branching**:
  - Format: `<username>/<type>-<description>` (e.g., `lbuettge/feature-dashboard`)
  - Types: `feature`, `fix`, `chore`, `refactor`, `docs`, `test`, `style`
- **Protected Branches**:
  - `main`: Production (requires PR + CI + 1 approval)
  - `develop`: Staging (requires PR + CI) [if used]
- **Commits**:
  - Format: `type(scope): subject` (Conventional Commits)
  - Auto-footer: `🤖 Generated with Claude Code` + `Co-Authored-By: Claude`
- **Pull Requests**:
  - Must pass Codacy (ESLint, Prettier, TypeScript, Tests, Security)
  - Must include CHANGELOG.md entry + version bump (SemVer)
  - Screenshots required for UI changes
- **Git Hooks**:
  - Pre-commit: TypeScript + ESLint + Secret Scanning
  - Pre-push: All tests + build validation + branch name check
- **Merge Strategy**: Squash and merge (preferred)

## Domain Context

### Data Model
```typescript
// Firestore Collections
users/{userId}
  - nickname: string
  - gender: 'male' | 'female' | 'other'
  - height: number (cm)
  - weight: number (kg)
  - bodyFat?: number (%)
  - maxPushups: number
  - groupCode?: string
  - pushupState: { mode: 'base' | 'bump', startedAt?: Timestamp }

tracking/{userId}/days/{date}
  - pushups: number
  - sports: { name: string, duration: number }[]
  - water: number (L)
  - protein: number (g)
  - weight?: number (kg)
  - completed: boolean

groups/{groupCode}
  - name: string
  - members: string[] (userIds)
  - createdAt: Timestamp
```

### Business Rules
- **Water Goal**: `weight * 0.033L` (minimum 2.0L)
- **Protein Goal**: `weight * 2.0g`
- **Pushup Training**:
  - Base Mode: `0.45 * maxPushups` per set, increasing reps
  - Bump Mode: Triggered after completing Base Mode
- **Training Load**: Calculated from last 7 days (sleep, recovery, sports volume)
- **Leaderboard**: Weekly reset (Monday), based on completed days

### User Flows
1. **Onboarding**: Google SSO → Language → Nickname → Gender → Height → Weight → Body Fat% (opt) → Max Pushups
2. **Daily Tracking**: Dashboard → Quick-add tiles (Pushups, Water, Protein) → Check-in (sleep/recovery)
3. **Group Challenge**: Join Group (code) → Leaderboard → View Progress
4. **Training Mode**: Pushup Tile → Start Training → Follow algorithm → Complete session

## Important Constraints

### Performance
- **Lighthouse Score**: ≥90 (all metrics)
- **Bundle Size**: <600KB main chunk
- **Time to Interactive (TTI)**: <3s on 3G
- **First Contentful Paint (FCP)**: <1.5s

### Browser Support
- **Desktop**: Last 2 versions of Chrome, Firefox, Safari, Edge
- **Mobile**: iOS 13+, Android 9+ (Chrome, Safari)
- **PWA**: Must work offline, installable on home screen

### Accessibility (a11y)
- **WCAG 2.1 Level AA** compliance
- Color contrast ratios: ≥4.5:1 (normal text), ≥3:1 (large text)
- Keyboard navigation: All interactive elements focusable
- Screen readers: Semantic HTML + ARIA labels

### Security
- **Firebase App Check**: reCAPTCHA v3 for all Firestore/Storage requests
- **Secrets**: Environment variables only, never committed
- **Data Privacy**: GDPR-compliant, user data deletion on request
- **Content Security Policy (CSP)**: Strict inline script/style rules

### Scalability
- **Firestore Reads**: <10,000/day per user (optimize with caching)
- **Firestore Writes**: <1,000/day per user (debouncing, batching)
- **Storage**: <100MB per user (profile picture + future media)

## External Dependencies

### Firebase Services
- **Authentication**: Google OAuth provider
- **Firestore**: Real-time database (production rules enforced)
- **Storage**: Profile pictures, future media uploads
- **App Check**: reCAPTCHA v3 for request validation

### Third-Party APIs
- **Sentry**: Error tracking + performance monitoring
  - DSN: `VITE_SENTRY_DSN` (environment variable)
  - Privacy: Sensitive data filtered via `beforeSend` hook
- **Weather API** (Open-Meteo): Optional weather integration
  - No API key required, rate-limited
- **Gemini AI** (Deprecated 2025-10-04): Removed, fallback quotes remain

### Build & Deployment
- **Vite**: Module bundler (HMR, optimized builds)
- **Workbox**: Service worker generation (cache-first, network-first strategies)
- **Lighthouse CI**: Performance budgets (CI fails on regression)
- **Codacy**: Code quality gate (ESLint, Prettier, Security)

### Development Tools
- **Vitest**: Test runner (fast, ESM-native)
- **Playwright**: E2E test framework (cross-browser)
- **MSW**: API mocking (development, testing)
- **TypeScript**: Type checking (strict mode)
