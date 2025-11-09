# GitHub Copilot Instructions - Winter Arc App

## Project Overview

Winter Arc is a Progressive Web App (PWA) for fitness tracking with push-ups, sports, nutrition, and weight management. Built with Next.js 15 + React 19 + TypeScript + PostgreSQL (Vercel Postgres/Neon).

## OpenSpec Framework (CRITICAL)

**Before implementing features, ALWAYS check:**

1. Read `openspec/AGENTS.md` for spec-driven development workflow
2. Run `openspec list` to see active changes and avoid conflicts
3. For new features: Create proposal in `openspec/changes/[change-id]/` with `proposal.md`, `tasks.md`, and spec deltas
4. Validate with `openspec validate [change-id] --strict` before implementation

**Triggers for creating OpenSpec proposals:**

- New features, breaking changes, architecture shifts
- Performance optimizations that change behavior
- Security pattern updates

**Skip proposals for:** Bug fixes, typos, dependency updates, tests for existing behavior.

## Mandatory Branch Naming

Format: `<username>/<type>-<description>` (e.g., `lbuettge/feature-dashboard`)

- Types: `feature`, `fix`, `chore`, `refactor`, `docs`, `test`, `style`
- NEVER push directly to `main` or `develop` (protected branches require PR)

## Architecture Patterns

### State Management

- **Global State**: Zustand store (`app/store/useStore.ts`)
- **API Sync**: Auto-sync via `useAuth` and `useTracking` hooks with 1s debounce
- **Data Flow**: UI → Hooks → Zustand → PostgreSQL API (polling updates store every 30s)

### Component Structure

- **Tiles**: Reusable tracking components (`PushupTile`, `WaterTile`, etc.)
- **Modals**: MANDATORY use `AppModal` component (in `app/components/ui/AppModal.tsx`) for all dialogs
- **Pages**: Route-level components in `app/` directory (Next.js App Router)
- **Lazy Loading**: Next.js automatic code splitting + `React.lazy()` for dynamic imports

### Database Integration

**PostgreSQL Schema (Drizzle ORM):**

```
users → { id, email, nickname, gender, height, weight, maxPushups, groupCode, pushupState }
tracking_entries → { id, userId, date, pushups, sports, water, protein, weight, completed }
groups → { id, code, name, members[], createdAt }
```

**API Routes:**

- `app/api/auth/[...nextauth]/route.ts` - NextAuth authentication handler
- `app/api/users/[id]/route.ts` - User CRUD operations
- `app/api/tracking/[date]/route.ts` - Tracking data by date
- `app/api/groups/[code]/route.ts` - Group management

**Security:**

- NextAuth with JWT sessions
- Server-side session validation
- API routes: users read/write own data only

## Code Quality (Pre-commit/Push Hooks)

**Pre-commit:** TypeScript + ESLint + Secret Scanning
**Pre-push:** TypeScript + ESLint + Tests + Build + Branch Name Validation

**Coverage Requirements:**

- Unit tests: ≥80% (Vitest with v8 coverage)
- Branch coverage: ≥78%

**Common Fixes:**

- Replace `any` with proper types (import from `src/types/`)
- Remove unused imports or prefix with `_`
- No `console.*` in production (use logger or remove)
- Extract magic numbers to constants

## Dependency Policy (NEW)

To keep the stack healthy and avoid hidden technical debt:

- Always prefer the latest stable (non-beta) versions of direct dependencies. Schedule upgrades rather than pinning old versions unless a regression is confirmed.
- Do NOT suppress, hide, or bypass dependency warnings (deprecated, vulnerabilities). Resolve them by upgrading or refactoring.
- Avoid hacky workarounds like blanket `overrides`, disabling audits, or silencing peer warnings. If a transitive issue appears, open an upstream issue and document a temporary mitigation in `DECISIONS.md` with an expiry date.
- Remove unused packages proactively (use `depcheck`, `knip`). Each removal should pass typecheck, lint, and tests.
- If an upgrade needs code changes (e.g. API differences), implement those changes cleanly rather than freezing versions.
- Security and deprecation warnings are treated as tasks, not noise—never ignore.

Upgrade Workflow:

1. Run `npx depcheck && npx knip` to identify unused/dead deps.
2. Upgrade target package (`npm install <pkg>@latest`).
3. Run `npm run test:all` (typecheck + lint + tests + build).
4. If failures occur, adapt code; do NOT downgrade unless blocking upstream bug is verified.
5. Record notable upgrade decisions or blockers in `openspec/DECISIONS.md`.

Temporary Exceptions:
Only allowed if: (a) upstream critical bug, (b) security patch pending. Must include removal plan and owner.

Result: Clean dependency tree, minimal maintenance friction, transparent upgrade path.

## Security First Policy (PRIO #1)

Security steht über allem – jede erkannte Schwachstelle (npm audit, Snyk, GitHub Advisory, Dependabot) wird sofort triagiert.

Grundsätze:

- Keine Ignorierlisten außer dokumentierten, zeitlich befristeten Ausnahmen (max 30 Tage) in `openspec/DECISIONS.md` mit Owner & Entferndatum.
- Hohe / kritische Vulnerabilities: Patch oder Upgrade noch am selben Tag (spätestens nächster Arbeits-Tag).
- Moderate / Low: Bündeln, aber spätestens innerhalb von 7 Tagen lösen.
- Niemals Sicherheitswarnungen durch Abschalten von `audit`, `fund`, oder künstliche Overrides verstecken.
- Bei Transitivem Blocker: Upstream Issue eröffnen, Link + Tracking in `DECISIONS.md`.

Remediation Workflow:

1. `npm audit --json` parsen → Priorität bestimmen.
2. Für direkte Dependencies: `npm install <pkg>@latest` oder Security-Fix Version.
3. Für transitive: Versuchen Upgrade des Root-Pakets; wenn nicht möglich, Issue + temporäre Mitigation dokumentieren.
4. Nach jedem Fix: `npm run test:all` (lint + typecheck + tests + build) + manuelles Smoke-Test (App Start).
5. PR Titel Format: `security:<package>-<version>` oder Sammel-PR `security:monthly-batch-YYYY-MM`.

Zielmetriken:

- Offen High/Critical: 0
- Mean Time To Remediate (Critical): <24h
- Keine stillgelegten Audits / versteckten Advisories

Transparenz:

- Monatlicher Security-Abschnitt im `CHANGELOG.md` bei produktiven Releases.
- Jede Ausnahme klar mit "EXPIRY" versehen.

## Critical Commands

```bash
# Development
npm run dev                    # Start dev server (localhost:3000)

# Database
npm run db:push                # Push schema to database
npm run db:studio              # Open Drizzle Studio (GUI)
npm run db:generate            # Generate migrations
npm run db:migrate             # Run migrations

# Quality Checks (run before committing)
npm run lint                   # ESLint
npm run typecheck              # TypeScript strict mode
npm test                       # Vitest unit tests
npm run test:all               # All checks (lint + typecheck + test + build)

# OpenSpec
openspec list                  # List active changes
openspec list --specs          # List specifications
openspec validate [id] --strict # Validate change proposal
```

## Environment Variables

**Required:**

- `DATABASE_URL` - PostgreSQL connection string (Vercel Postgres/Neon)
- `NEXTAUTH_SECRET` - NextAuth session encryption key
- `NEXTAUTH_URL` - Application URL (http://localhost:3000 for dev)
- `GOOGLE_CLIENT_ID` - Google OAuth client ID
- `GOOGLE_CLIENT_SECRET` - Google OAuth client secret

**Optional:**

- `NEXT_PUBLIC_SENTRY_DSN` - Error tracking
- `GEMINI_API_KEY` - AI-powered smart notes (server-side)

**1Password Integration:** Use `op run --env-file=.env.1password.production -- npm run dev` for secrets management.

## Testing Strategy

**Unit Tests:** Vitest (`app/**/__tests__/`)

- Drizzle / Datenbank-Layer mocken mit `vi.mock('@/lib/db')` oder spezifische Query-Funktionen isolieren
- Optional: In-Memory SQLite Schema über Drizzle für realistischere Query-Tests (schnell, kein Netzwerk)
- `src/test/test-utils.tsx` für React-Komponententests (Provider / Zustand / i18n)
- Keine Firebase-Emulatoren mehr – Fokus auf Postgres API & Hooks

**E2E Tests:** Playwright (`tests/e2e/`)

- Follow Given-When-Then pattern
- Use `data-testid` attributes for selectors
- Auth: NextAuth Session Flows mocken (z.B. vor Login Page Snapshot, nach Login Zustand prüfen)

## Performance

**Bundle Budget:** <600KB main chunk
**Lighthouse Target:** ≥95 (alle Kernmetriken)
**Optimierung:**

- Lazy Loading großer Komponenten mit `React.lazy()` / Dynamic Imports
- Automatisches Code-Splitting durch Next.js + manuelle Splits bei schweren Charts
- Service Worker Caching: Network-first für `/api/` JSON; Cache-first für statische Assets; Stale-While-Revalidate für Icons / Manifest
- Reduziertes Netzvolumen durch differenziertes Speichern geänderter Tracking-Tage (Diff-Strategie in Hooks)
- Zustandshydration minimieren (nur notwendige Slices laden)

## PWA Features

- Offline-first via eigenem Service Worker (`public/sw.js`)
- Install Prompts für iOS/Android
- Background Sync für Tracking-/Statistik-Endpunkte (~24h Retention, Retry + Backoff geplant)
- Konfigurierbare Basis-URL für API Requests im SW statt Hardcode

## Deployment

**Three environments:** Production (`main` → `app.winterarc.newrealm.de`), Staging (`develop` → `staging.winterarc.newrealm.de`), PR Previews (`staging.winterarc.newrealm.de/pr-<num>/`)

Workflows in `.github/workflows/`: `deploy-prod.yml`, `deploy-staging.yml`, `pr-preview.yml`

## Common Patterns

**Import aliases:** Use `@/` prefix (e.g., `import { useAuth } from '@/hooks/useAuth'`)

**Modal usage:**

```tsx
<AppModal
  open={isOpen}
  onClose={handleClose}
  title="Title"
  icon={<span>🔥</span>}
>
  <div>Modal content</div>
</AppModal>
```

**Tracking data save:**

```tsx
const { tracking, setTracking } = useStore();
setTracking({ ...tracking, water: 2000 }); // Auto-saves (debounced ~1s) via PostgreSQL API PATCH/PUT nur für geänderte Tage
```

**Authentication check:**

```tsx
const { user, loading } = useAuth();
if (loading) return <Skeleton />;
if (!user) return <LoginPage />;
```

## Agent System

Specialized agents in `.agent/` for quality gates:

- **UI-Refactor** - Glass design, mobile-first
- **PWA/Performance** - Lighthouse ≥90, Bundle <600KB
- **Test/Guard** - Coverage ≥70%
- **Docs/Changelog** - Documentation updates

See `.agent/policies.md` for triggers and workflows.
