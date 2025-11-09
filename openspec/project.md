# Project Context

## Purpose
Winter Arc is a Progressive Web App (PWA) for iOS/Android focused on fitness tracking with emphasis on push-ups, sports, nutrition, and weight management. The app provides a gamified experience with group challenges, leaderboards, and progress visualization.

\n## Tech Stack (Updated)
- **Framework**: Next.js 16 (App Router) + React 19 + TypeScript
- **Styling**: Tailwind CSS 3.x (Mobile-first, responsive design)
- **State Management**: Zustand (lightweight, reactive store)
- **Backend**:
  - Next.js API Routes (serverless functions)
  - PostgreSQL (Vercel Postgres / Neon) – Drizzle ORM
  - NextAuth (JWT Sessions / Google OAuth)
- **Testing**: Vitest (unit), Playwright (e2e)
- **Monitoring**: Sentry (errors & performance)
- **PWA**: Custom Service Worker (`public/sw.js`) + Offline Strategies
- **Deployment**: Vercel (prod + staging + PR previews)
- **CI/CD**: GitHub Actions (lint, typecheck, tests, build, Lighthouse)

## Project Conventions

\n### Code Style
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

\n### Architecture Patterns
- **State Management**: Zustand store (`app/store/useStore.ts`) global slices
  - Diff-basierte, debouncte Persistenz (≈1s) in PostgreSQL
  - Polling (30s) für frische Tracking-Daten (`useTrackingEntries`)
- **Data Flow**:
  - UI → Hooks (`useAuth`, `useTracking`, `useTrackingEntries`) → Zustand → API (PostgreSQL)
  - Kein Firestore mehr; ersetzte Echtzeit durch effizientes Polling + geplante Background Sync
- **Component Structure**:
  - Tiles: Reusable tracking components (e.g., `PushupTile`, `WaterTile`)
  - Modals: Unified `AppModal` component (MANDATORY for all dialogs)
  - Pages: Route-level components in `app/` directory (Next.js App Router)
- **Performance**:
  - Automatic code splitting (Next.js)
  - Lazy loading with React.lazy + dynamic imports
  - Optimized images (Next.js Image component, WebP/AVIF)
  - Bundle budget: <600KB main chunk
- **Offline-First**:
  - Custom SW: Network-first für `/api/`, Cache-first für Assets, Stale-While-Revalidate für Icons
  - IndexedDB (Dexie) für Smart Notes & zukünftige Offline Queues
  - `beforeunload` Flush + geplante Background Sync
- **Error Handling**:
  - Global ErrorBoundary for React errors
  - Sentry for unhandled exceptions & promise rejections
  - Sensitive data filtering (tokens, API keys)

\n### Testing Strategy (Updated)
- **Unit Tests** (Vitest): Utilities, Hooks (auth/tracking), Komponenten mit Logik
- **E2E** (Playwright): Kernflows (Login, Tracking, Leaderboard) + Responsive Checks
- **Coverage**: Ziel ≥80% (kritische Pfade ≥90%) – ohne Firebase-Bezug
- **Mocking**: Drizzle Layer (`vi.mock('@/lib/db')`) + MSW für externe APIs
- **Test Structure**:
  - Co-located: `__tests__/` folder next to source
  - Naming: `*.test.ts` or `*.spec.ts`

\n### Git Workflow
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

### Data Model (PostgreSQL / Drizzle)

```ts
users { id, email, nickname, gender, height, weight, bodyFat?, maxPushups, groupCode?, pushupState, enabledActivities[], createdAt }
tracking_entries { id, userId, date, pushups, sports, water, protein, weight, completed }
groups { id, code, name, members[], createdAt }
```

\n### Business Rules
- **Water Goal**: `weight * 0.033L` (minimum 2.0L)
- **Protein Goal**: `weight * 2.0g`
- **Pushup Training**:
  - Base Mode: `0.45 * maxPushups` per set, increasing reps
  - Bump Mode: Triggered after completing Base Mode
- **Training Load**: Calculated from last 7 days (sleep, recovery, sports volume)
- **Leaderboard**: Weekly reset (Monday), based on completed days

\n### User Flows
1. **Onboarding**: Google SSO → Language → Nickname → Gender → Height → Weight → Body Fat% (opt) → Max Pushups
2. **Daily Tracking**: Dashboard → Quick-add tiles (Pushups, Water, Protein) → Check-in (sleep/recovery)
3. **Group Challenge**: Join Group (code) → Leaderboard → View Progress
4. **Training Mode**: Pushup Tile → Start Training → Follow algorithm → Complete session

\n## Important Constraints

\n### Performance
- **Lighthouse Score**: ≥90 (all metrics)
- **Bundle Size**: <600KB main chunk
- **Time to Interactive (TTI)**: <3s on 3G
- **First Contentful Paint (FCP)**: <1.5s

\n### Browser Support
- **Desktop**: Last 2 versions of Chrome, Firefox, Safari, Edge
- **Mobile**: iOS 13+, Android 9+ (Chrome, Safari)
- **PWA**: Must work offline, installable on home screen

\n### Accessibility (a11y)
- **WCAG 2.1 Level AA** compliance
- Color contrast ratios: ≥4.5:1 (normal text), ≥3:1 (large text)
- Keyboard navigation: All interactive elements focusable
- Screen readers: Semantic HTML + ARIA labels

\n### Security
- **NextAuth**: Session Validation (JWT) + Google OAuth
- **Secrets**: Environment variables (1Password Integration optional)
- **Data Privacy**: GDPR – Löschanforderung unterstützt
- **CSP**: Restriktiv (Script-Src `'self'`)

\n### Scalability
- **Firestore Reads**: <10,000/day per user (optimize with caching)
- **Firestore Writes**: <1,000/day per user (debouncing, batching)
- **Storage**: <100MB per user (profile picture + future media)

\n## External Dependencies (Updated)
\n### Auth & Persistence
- NextAuth (Google OAuth)
- PostgreSQL (Drizzle ORM)

\n### Third-Party APIs
- **Sentry**: Error tracking + performance monitoring
  - DSN: `VITE_SENTRY_DSN` (environment variable)
  - Privacy: Sensitive data filtered via `beforeSend` hook
- **Weather API** (Open-Meteo): Optional weather integration
  - No API key required, rate-limited
- **Gemini AI** (Deprecated 2025-10-04): Removed, fallback quotes remain

\n### Build & Deployment
- Next.js (Turbopack Dev / Webpack Prod)
- Custom Service Worker
- Lighthouse CI (Performance Budgets)
- Codacy / ESLint / TypeScript Gates

\n### Development Tools
- **Vitest**: Test runner (fast, ESM-native)
- **Playwright**: E2E test framework (cross-browser)
- **MSW**: API mocking (development, testing)
- **TypeScript**: Type checking (strict mode)
