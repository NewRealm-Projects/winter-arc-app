# CLAUDE.md

Guidance for Claude Code when working with this repository.

---

# Winter Arc Fitness Tracking PWA

**Project**: Progressive Web App für iOS/Android - Fitness-Tracking mit Fokus auf Liegestütze, Sport, Ernährung, Gewicht.

**Tech Stack**: React + TypeScript + Vite + Tailwind + Firebase + Zustand + Vitest + Playwright

---

## Codacy Compliance (MANDATORY)

Every commit MUST pass Codacy checks:

| Check | Requirement |
|-------|-------------|
| ESLint | No errors/warnings |
| Prettier | `format:check` OK |
| TypeScript | No type errors |
| Tests | Coverage ≥80% |
| Security | No Critical/Major issues |

**Local validation:**
```bash
npm run lint && npm run format:check && npm run typecheck && npm test -- --coverage
```

**Common fixes:**
- Remove unused imports/vars or prefix with `_`
- Replace `any` with proper types
- Remove `console.*` (use logger or remove)
- Extract magic numbers to constants
- Split complex functions (<50 lines)
- No circular dependencies

---

## Branching & Workflow

- `main` - Production (protected)
- `develop` - Staging
- `feat/<topic>` - Feature branches
- `fix/<topic>` - Bug fixes

**PR Checklist:**
- [ ] Codacy Passed
- [ ] All tests pass (`npm run test:all`)
- [ ] CHANGELOG.md updated
- [ ] package.json version bumped (SemVer)
- [ ] Git hooks passed
- [ ] Screenshots for UI changes

**Commit format:**
```
type(scope): subject

🤖 Generated with [Claude Code](https://claude.com/claude-code)
Co-Authored-By: Claude <noreply@anthropic.com>
```
Types: `feat`, `fix`, `refactor`, `chore`, `test`, `docs`, `style`, `perf`

**Husky Hooks:**
- Pre-commit: TypeScript + ESLint
- Pre-push: TypeScript + ESLint + Tests + Build

---

## Agent System

Structured agents in `.agent/` for quality assurance:

1. **UI-Refactor** (`.agent/ui-refactor.agent.md`): Glass design, mobile-first, responsive
2. **PWA/Performance** (`.agent/pwa-perf.agent.md`): Lighthouse ≥90, Bundle <600KB
3. **Test/Guard** (`.agent/test-guard.agent.md`): Coverage ≥70%, E2E tests
4. **Docs/Changelog** (`.agent/docs-changelog.agent.md`): Docs, changelog, versioning

**Trigger examples:**
- Lighthouse <90 → PWA Agent
- Coverage <70% → Test Agent
- Inconsistent styles → UI Agent
- Missing changelog → Docs Agent

**Artifacts**: `artifacts/<agent>/` (bundle, lighthouse, tests, docs)

See [`.agent/policies.md`](.agent/policies.md) for full rules.

---

## Scripts

```bash
# Development
npm run dev              # Start dev server (localhost:5173)
npm run build            # Production build
npm run preview          # Preview build

# Quality
npm run lint             # ESLint
npm run typecheck        # TypeScript
npm run test:all         # All checks
npm run test:unit        # Vitest
npm run test:ui          # Playwright

# Performance
npm run analyze          # Bundle analyzer
npm run lhci:run         # Lighthouse CI
```

---

## UI/UX Guidelines

### Tile Design System

**MANDATORY Glass-Card Classes (ALL tiles):**
```css
rounded-2xl bg-white/5 dark:bg-white/5 backdrop-blur-md border border-white/10
shadow-[0_6px_24px_rgba(0,0,0,0.25)] transition-all duration-200
```

**Structure:**
- Header: Icon (left) + Title + Metric (right) - LEFT-ALIGNED
- Content: CENTERED (progress bars, buttons, inputs)
- Padding: `p-3` (standard) or `p-6` (graphs)

**❌ Never use:** `glass-dark` (deprecated) or custom glass styles

### Mobile-First (One Screen Rule)

**CRITICAL**: Every page MUST fit in one mobile viewport (~100vh) - NO vertical scrolling.

- Reduce padding on mobile: `px-3 pt-4` (Desktop: `px-6 pt-8`)
- Reduce gaps: `gap-2 mb-3` mobile, `gap-4 mb-4` desktop
- Flatten tiles: `h-32` instead of `h-48`
- Test on: iPhone SE (375×667), Pixel 6 (412×915), Galaxy S20 (360×800)

### Layout Grid

- **Tracking tiles**: Use `tile-grid-2` for flush desktop alignment
- **❌ Never use** `mobile-grid` for tracking tiles (breaks desktop alignment)
- **Bottom nav**: 3 items only (Dashboard, Group, Notes) - Settings in header only

---

## Design Tokens

### Colors
**Light**: `--primary-blue: #3B82F6`, `--bg-light: #F8FAFC`
**Dark**: `--primary-blue: #60A5FA`, `--bg-dark: #0F172A`
**Glass**: `--glass-blur: blur(16px)`, `--glass-border: rgba(255,255,255,0.12)`

### Typography
`--text-xs` (12px) → `--text-4xl` (36px)

### Spacing
`--space-1` (4px) → `--space-12` (48px)

### Backgrounds
Light: `url('/bg/light/winter_arc_bg_light.webp')`
Dark: `url('/bg/dark/winter_arc_bg_dark.webp')`

---

## Architecture

### State Management
- **Zustand** store: `useStore` (user, tracking, dark mode)
- Auto-sync to Firebase via hooks

### Firebase
- **Auth**: `useAuth` hook (Google SSO)
- **Firestore**: `firestoreService` (CRUD), `useTracking` (auto-save, debounced 1s)
- **Security**: App Check with reCAPTCHA v3

### Data Model
```typescript
users/{userId}: { nickname, gender, height, weight, bodyFat?, maxPushups, groupCode, pushupState }
tracking/{userId}/days/{date}: { pushups, sports, water, protein, weight?, completed }
groups/{groupCode}: { name, members[], createdAt }
```

### Error Tracking & Monitoring
- **Sentry**: Real-time error tracking and performance monitoring (`src/services/sentryService.ts`)
- **Integration**: All unhandled errors, promise rejections, and React errors are automatically captured
- **Privacy**: Sensitive data (tokens, API keys) filtered via `beforeSend` hook
- **Usage**:
  ```typescript
  import { captureException, setUser, addBreadcrumb } from '@/services/sentryService';

  // Manual error capture
  captureException(new Error('Something went wrong'), { userId: '123' });

  // Set user context
  setUser({ id: userId, email, nickname });

  // Add debugging breadcrumb
  addBreadcrumb('User clicked button', { buttonId: 'submit' });
  ```
- **Configuration**: Set `VITE_SENTRY_DSN` in `.env` to enable (see `.env.example`)
- **Environment**:
  - Dev: All errors logged to console, 100% traces sampled
  - Production: Errors sent to Sentry, 10% traces sampled, session replay on errors
- **Global Handlers**: Automatic capture of:
  - Unhandled window errors
  - Unhandled promise rejections
  - React component errors (via ErrorBoundary)
  - Logger errors in production

---

## App Structure

### 1. Dashboard
- Header: Greeting + Weather (Open-Meteo API for Aachen)
- Week tracking: Mon-Sun progress circles
- Leaderboard preview: Top 5 group members

### 2. Tracking
- **Pushup Tile**: Quick input OR Training mode (Base & Bump algorithm in `src/utils/pushupAlgorithm.ts`)
- **Sport Tile**: HIIT/Cardio/Gym checkboxes
- **Water Tile**: Progress bar, quick buttons (+250ml, +500ml, +1L)
- **Protein Tile**: Goal based on weight (2g/kg), input field
- **Weight Graph**: Line chart (30/90 days), BMI calculation

### 3. Leaderboard
- Calendar heatmap, group stats, achievements

### 4. Settings
- Profile, groups, notifications, privacy, account deletion

### 5. History (Archived)
**Status**: ⚫ Archived 2025-10-04 (redundant with week navigation)
**Reactivate**: Set `HISTORY_ENABLED=true` in `src/config/features.ts`, uncomment routes

---

## Implemented Features

✅ Pushup Training Mode (Base & Bump in `pushupAlgorithm.ts`)
✅ Leaderboard Preview Widget
✅ Weather Integration (Open-Meteo API)
✅ Visual Regression Tests (Playwright)
✅ Lighthouse CI & Performance Budgets
✅ Vitest Unit Tests
✅ Sentry Error Tracking (with privacy filtering)

### Archived Features
⚫ **AI Quotes** (2025-10-04): Gemini API removed, no user value. Fallback quotes remain.
⚫ **History Page** (2025-10-04): Redundant with week navigation. Feature flag: `HISTORY_ENABLED`.

---

## Planned Features

🟡 **Profile Pictures**: Upload, Firebase Storage, compression
🔵 **Push Notifications**: FCM, daily reminders
🔵 **Data Export**: CSV/JSON, GDPR compliance
🔵 **Social Sharing**: Progress cards
🔵 **Achievements**: Badge system

---

## Environment Variables

**Required:**
```bash
VITE_FIREBASE_API_KEY=...
VITE_FIREBASE_AUTH_DOMAIN=...
VITE_FIREBASE_PROJECT_ID=...
VITE_FIREBASE_STORAGE_BUCKET=...
VITE_FIREBASE_MESSAGING_SENDER_ID=...
VITE_FIREBASE_APP_ID=...
```

**Optional:**
```bash
VITE_RECAPTCHA_SITE_KEY=...  # Firebase App Check (production)
VITE_SENTRY_DSN=...           # Sentry error tracking (recommended)
VITE_GEMINI_API_KEY=...       # Gemini AI for Smart Notes
```

**CI/CD Only (GitHub Secrets):**
```bash
SENTRY_AUTH_TOKEN=...         # For source map upload
SENTRY_ORG=...                # Your Sentry organization
SENTRY_PROJECT=...            # Your Sentry project
```

---

## Onboarding Flow

Google SSO → Language → Nickname → Gender → Height → Weight → Body Fat% (optional) → Max Pushups

---

## PWA & Performance

- Service Worker (Workbox)
- Offline-first: IndexedDB/localStorage → Firebase sync
- Cache-first for static assets
- Network-first for leaderboard data
- Lighthouse target: ≥90
- Bundle budget: <600KB main chunk

---

## Best Practices

- TypeScript strict mode
- a11y standards (WCAG)
- Mobile-first responsive design
- Dark mode support
- Code splitting & lazy loading
- Optimized images (WebP)
- Semantic versioning (SemVer)
- CHANGELOG.md for every change
