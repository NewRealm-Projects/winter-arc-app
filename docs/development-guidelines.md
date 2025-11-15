# Winter Arc Development Guidelines

## Environment Configuration

Copy the provided template to create your local environment file:

```bash
cp .env.local.template .env.local
```

The template mirrors `.env.example` and includes the variables required for the Next.js stack:

- `DATABASE_URL` – Neon/Vercel Postgres connection string
- `NEXTAUTH_SECRET` and `NEXTAUTH_URL` – NextAuth configuration
- `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` – Google OAuth credentials

Optional integrations such as Gemini and Sentry are also documented in the template. Refer to [`docs/archive/firebase-env.md`](archive/firebase-env.md) if you still support the legacy Firebase backend.

After populating `.env.local`, start the development server with `pnpm dev`.
This document is the single source of truth for engineers working on the Winter Arc Next.js application. It consolidates the scattered contributor notes, branch policies, and framework conventions into one place. Always keep this document up to date when processes or conventions change.

## 1. Project Overview

- **Runtime:** Next.js 16 App Router with React 19 (`app/` directory). Server components are preferred for data access whenever UI state does not require client interactivity (`app/layout.tsx`, `app/page.tsx`).
- **Authentication:** NextAuth with Google OAuth and a Drizzle adapter backed by Vercel Postgres/Neon (`lib/auth.ts`, `lib/db/schema.ts`). The `auth()` helper is the canonical way to read the session inside route handlers.
- **Database:** Drizzle ORM models in `lib/db/schema.ts`; connections created in `lib/db/index.ts`. Use parameterized queries (`eq`, `and`, etc.) and guard for `db === null` to keep handlers resilient.
- **State Management:** Zustand store in `app/store/useStore.ts` owns client-only state (user profile cache, daily tracking, theming). Prefer deriving state from server responses instead of duplicating server logic in the store.
- **Styling:** Tailwind CSS via `app/globals.css` and design tokens in `app/theme`. New components should rely on utility classes rather than bespoke CSS files.
- **Background integrations:** Analytics via `@vercel/analytics` and performance insights via `@vercel/speed-insights` are mounted in `app/layout.tsx`. Sentry client utilities live in `app/services/sentryService.ts` (currently Vite-oriented and slated for Next.js alignment).

## 2. Local Development Workflow

1. **Create a branch** following `<username>/<type>-<slug>` (types: `feature`, `fix`, `chore`, `refactor`, `docs`, `test`, `style`). The Husky pre-push hook enforces this convention.
2. **Install dependencies** with `npm install` and start the dev server via `npm run dev`.
3. **Environment variables:** duplicate `.env.example` into `.env.local` and fill in the required secrets (see Section 5).
4. **Run checks** before opening a pull request:
   - `npm run lint`
   - `npm run typecheck`
   - `npm run vercel:build`
   - `npm run test:unit`
   > ⚠️ If any command fails or emits warnings, stop and fix the root cause—skipping checks is not allowed.
5. **Commit messages** must follow Conventional Commit format (`type(scope): subject`). Use scopes that reflect the feature or subsystem (`feat(tracking): …`).
6. **Pull requests** target `develop`. Once merged, release PRs move `develop` → `main`.

## 3. Code Style & Patterns

- **TypeScript:** the repo is `strict` with `noUncheckedIndexedAccess`. Avoid `any`; if unavoidable, include a code comment explaining the constraint.
- **Components:** default to server components. Opt into client components with `'use client'` only when browser APIs, hooks, Zustand, or imperative behavior is required. Keep client components narrow to minimize bundle size.
- **Hooks vs. services:** shared data-fetching logic should live in `app/lib/` or `app/services/` and be imported by server code or React hooks rather than duplicating fetch calls across components.
- **Error handling:** prefer typed responses with `NextResponse.json({ error: '…' }, { status })` and log actionable metadata (`console.error('context', error)`). Sentry helpers (`captureException`, `addBreadcrumb`) should be used from browser-side hooks once the service is aligned with Next.js environment variables.
- **Utilities:** add new helpers under `app/utils/` with clear names and isolated dependencies. Keep utility modules pure and side-effect free.

## 4. Next.js Usage Conventions

- **Routing:** keep all routes under `app/`. Do not reintroduce the legacy `pages/` router. Group related screens beneath feature folders (e.g. `app/dashboard/*`).
- **Data fetching:**
  - Server route handlers (`app/api/**/route.ts`) should prefer Drizzle queries and the shared `auth()` helper.
  - Avoid client-side `fetch('/api/…')` calls from hooks when the data can be delivered via Server Components or Server Actions. When client fetching is necessary, co-locate the fetcher in `app/lib/http.ts` for reuse.
  - Introduce request validation schemas (e.g. Zod) for complex payloads before writing to the database.
- **Server Actions & Revalidation:** adopt Server Actions for mutations that currently rely on custom REST endpoints. Use `revalidatePath` for dashboards that should refresh after data changes.
- **Performance:**
  - Prefer `async` server components for heavy queries.
  - Use dynamic imports (`next/dynamic`) for charting libraries like Recharts to prevent large bundles on first load.
  - Audit Zustand slices to ensure large data sets are memoized.
- **SEO:** configure metadata in route segments (e.g. `generateMetadata`) instead of manual `<Head>`. Update `app/manifest.ts` and `public/` icons when new marketing assets are added.

## 5. Secrets & Environment Management

| Variable | Scope | Notes |
| --- | --- | --- |
| `DATABASE_URL` | Server | Required for Drizzle/Neon (`lib/db/index.ts`).
| `NEXTAUTH_SECRET`, `NEXTAUTH_URL` | Server | Needed for NextAuth (`lib/auth.ts`).
| `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` | Server | OAuth credentials used in NextAuth provider config.
| `GEMINI_API_KEY` | Server | Optional, currently unused — document when integrating.
| `NEXT_PUBLIC_SENTRY_DSN` | Client | Error tracking integration.

Guidelines:
- Never commit real secrets. `.env.example` must include every required variable.
- Prefix any client-exposed value with `NEXT_PUBLIC_`.
- Use 1Password run scripts (`npm run dev:1p`) for shared environment bundles.

## 6. Testing Strategy

- **Unit tests:** `npm run test:unit` (Vitest). Add new tests under `app/**/__tests__` or `components/**/__tests__`.
- **Type safety:** `npm run typecheck` must succeed; add module augmentations under `types/` as needed.
- **Linting:** `npm run lint` runs ESLint + secret scanning. Fix lint issues rather than suppressing unless there is a documented exception.
- **Production build:** `npm run vercel:build` must succeed. Resolve CLI/linking issues instead of skipping the command.
- **No loose ends:** Treat warnings from these commands as blockers—either resolve them or document why they are acceptable and how they will be fixed.
- **Visual/Performance:** Lighthouse CI via `npm run lhci:run` for regressions; use `npm run analyze` to inspect bundle composition when adding large dependencies.

## 7. Dependency Management Policy

This section consolidates all dependency management, security, and infrastructure upgrade policies. The goal is to maintain a healthy, transparent dependency tree with zero hidden technical debt.

### 7.1 Core Principles

**Always Stay Current:**
- Prefer latest stable (non-beta) versions of all direct dependencies
- Schedule upgrades proactively rather than pinning old versions
- Treat dependency warnings (deprecated, vulnerabilities, peer conflicts) as immediate tasks, not noise

**Transparency Over Workarounds:**
- **NEVER** suppress, hide, or bypass dependency warnings via:
  - `npm audit --audit-level=none` or disabling audits
  - Blanket `overrides` or `resolutions` to silence peer warnings
  - Ignoring deprecation warnings or vulnerability advisories
- **NEVER** ignore security scan failures or lint warnings
- If a transitive issue blocks progress:
  1. Open upstream issue with reproduction steps
  2. Document temporary mitigation in `docs/DECISIONS.md` with:
     - Issue link
     - Owner name
     - Expiry date (max 30 days)
     - Removal plan

**Proactive Cleanup:**
- Remove unused packages immediately using `npx depcheck` and `npx knip`
- Delete dead code before it accumulates
- Each removal must pass: `npm run test:all` (typecheck + lint + tests + build)

**Code Adapts to Dependencies, Not Vice Versa:**
- When an upgrade requires code changes (breaking API, new patterns), implement those changes cleanly
- Do NOT downgrade or freeze versions unless a confirmed blocking upstream bug exists
- Document upgrade decisions that affect architecture in `docs/DECISIONS.md`

### 7.2 Standard Upgrade Workflow

Follow this 5-step process for all dependency upgrades:

```bash
# Step 1: Identify unused/dead dependencies
npx depcheck && npx knip

# Step 2: Upgrade target package(s)
npm install <package>@latest

# Step 3: Run full test suite
npm run test:all  # Runs: lint + typecheck + test:unit + vercel:build

# Step 4: Fix any failures
# - Adapt code to new API (don't downgrade)
# - Update tests if behavior changed
# - Fix type errors from stricter types

# Step 5: Document notable changes
# Add entry to docs/DECISIONS.md if upgrade affected:
# - Architecture patterns
# - API contracts
# - Build/deployment process
```

**Post-Upgrade Checklist:**
- [ ] All tests pass (`npm run test:all`)
- [ ] Manual smoke test (dev server starts, core flows work)
- [ ] No new warnings in console or build output
- [ ] Documentation updated if APIs changed
- [ ] CHANGELOG.md entry added (for notable upgrades)

### 7.3 Security First Policy (PRIO #1)

**Security is paramount.** Every identified vulnerability (npm audit, Snyk, GitHub Advisory, Dependabot) is triaged immediately.

**Vulnerability Response SLAs:**

| Severity      | Response Time       | Action                                    |
|---------------|---------------------|-------------------------------------------|
| **Critical**  | Same day            | Patch/upgrade immediately                 |
| **High**      | Next business day   | Patch/upgrade immediately                 |
| **Moderate**  | Within 7 days       | Bundle with other fixes, prioritize       |
| **Low**       | Within 14 days      | Include in next maintenance cycle         |

**Remediation Workflow:**

```bash
# Step 1: Parse audit results and determine priority
npm audit --json | jq '.vulnerabilities'

# Step 2: For direct dependencies
npm install <package>@latest  # Or specific security patch version

# Step 3: For transitive dependencies
# Try upgrading the root package that depends on the vulnerable package
npm outdated  # Identify which root package depends on it
npm install <root-package>@latest

# If not possible:
# - Document issue in docs/DECISIONS.md with upstream issue link
# - Add temporary mitigation (e.g., runtime guards, input validation)
# - Set expiry date (max 30 days)

# Step 4: Verify fix
npm audit  # Should show zero High/Critical vulnerabilities
npm run test:all  # All checks must pass

# Step 5: Manual smoke test
npm run dev  # App must start and core flows work
```

**Forbidden Practices:**
- ❌ Disabling `npm audit` or using `--audit-level=none`
- ❌ Adding vulnerable packages to ignore lists without time limit
- ❌ Using `overrides` to force vulnerable versions
- ❌ Postponing security patches "until next sprint"

**Acceptable Temporary Exceptions:**
Only allowed if both conditions are met:
1. **Documented blocking issue:** Upstream critical bug OR security patch not yet available
2. **Time-limited mitigation:** Entry in `docs/DECISIONS.md` with:
   - Issue/advisory link
   - Owner responsible for tracking
   - Expiry date (max 30 days from discovery)
   - Concrete removal plan (upgrade path or alternative)

**Metrics & Transparency:**
- **Target: Zero open High/Critical vulnerabilities**
- **Mean Time To Remediate (Critical): <24 hours**
- **No disabled audits or hidden advisories**
- Monthly security section in `CHANGELOG.md` for production releases
- Every exception clearly marked with "EXPIRY: YYYY-MM-DD"

### 7.4 Infrastructure Upgrades (Major Version Bumps)

When a dependency upgrade involves **major infrastructure changes** (e.g., Next.js 15 → 16, React 18 → 19, Node 18 → 20), **always ask the user before proceeding**.

**Criteria for "Infrastructure Upgrade":**
- Major version bump of core framework (Next.js, React, TypeScript)
- Breaking changes requiring code modifications in >5 files
- Changes to build/deployment pipeline
- Changes to runtime environment (Node version, serverless config)
- Database schema migrations or ORM major upgrades

**Upgrade Request Template:**

```
⚠️ Infrastructure Upgrade Required

Package: <name> (<current-version> → <target-version>)

Impact:
- Breaking changes: <list key breaking changes>
- Files affected: ~<number> files
- Migration effort: <estimated hours/days>
- Risk level: <Low/Medium/High>

Benefits:
- <list key improvements: performance, security, new features>

Recommendation:
<brief recommendation: proceed now / schedule / defer>

Should I proceed with this upgrade, or would you like to schedule it for later?
```

**Example:**
```
⚠️ Infrastructure Upgrade Required

Package: next (16.0.1 → 17.0.0)

Impact:
- Breaking changes: Middleware API changed, new caching defaults
- Files affected: ~12 files (middleware, API routes, config)
- Migration effort: ~4-6 hours
- Risk level: Medium

Benefits:
- 30% faster cold starts
- Improved streaming SSR
- Better image optimization

Recommendation:
Proceed now - migration is straightforward, well-documented, and blocking security patches are included.

Should I proceed with this upgrade, or would you like to schedule it for later?
```

**After Approval:**
1. Create dedicated feature branch: `<username>/chore-upgrade-<package>-<version>`
2. Follow standard upgrade workflow (Section 7.2)
3. Add comprehensive testing (smoke tests for all core flows)
4. Document migration steps in PR description
5. Update `docs/DECISIONS.md` with upgrade rationale and breaking changes

### 7.5 Integration with Existing Workflows

**Pre-commit Hooks (Husky):**
- Lint check: Fails on any warnings (including dependency warnings)
- Type check: Ensures no regressions from upgrades
- Secret scan: Prevents committing credentials

**Pre-push Hooks:**
- Branch name validation
- Full test suite: `npm run test:all`
- Vercel build: Ensures deployment won't fail

**CI/CD (GitHub Actions):**
- Automated `npm audit` on every PR
- Dependabot security alerts → auto-create issue with priority label
- Weekly dependency update check (compares `npm outdated` with `docs/DECISIONS.md`)

**Monitoring:**
- `npm run analyze`: Bundle composition analysis (use before/after major upgrades)
- Lighthouse CI: Performance regression detection
- `npx depcheck`: Run monthly to detect unused packages

### 7.6 Decision Tracking

All temporary exceptions, deferred upgrades, and security mitigations MUST be tracked in `docs/DECISIONS.md` using this format:

```markdown
## Dependency Exception: <package-name>

**Status:** Active | Resolved
**Owner:** <github-username>
**Created:** YYYY-MM-DD
**Expiry:** YYYY-MM-DD (max 30 days from creation)

**Reason:**
<why we cannot upgrade/fix immediately>

**Upstream Issue:**
<link to GitHub issue, security advisory, or bug report>

**Mitigation:**
<what we're doing to reduce risk in the meantime>

**Removal Plan:**
<specific steps to resolve and remove this exception>
```

**Governance:**
- Review `docs/DECISIONS.md` weekly
- Auto-close expired exceptions (upgrade or document extension)
- Exceptions extended beyond 30 days require:
  - Written justification in PR
  - Approval from team lead
  - Updated removal plan

## 8. Documentation Expectations

- Update the `README.md` for user-facing copy only; keep technical instructions in this file.
- Architecture deep dives belong in `docs/architecture.md` (see Documentation Plan below) once created.
- When adding a feature, document workflows or commands under `docs/` using `Title Case` filenames and include an entry in the repo changelog if applicable.

## 9. OpenAI / AI Feature Guidance

- All OpenAI or other LLM integrations must live under `lib/ai/` (create the folder if needed) with a single client wrapper that centralizes API key access, retries, and logging.
- Never call OpenAI directly from client components. Use server routes or actions that pull `OPENAI_API_KEY` from the server environment.
- Sanitize prompts and responses before logging; redact PII or sensitive tokens using helpers similar to `filterSensitiveData` in `app/services/sentryService.ts`.
- Implement exponential backoff with jitter for retries, and set explicit timeouts.
- Document every AI-facing endpoint or action with request/response examples in `docs/ai/README.md` when such features exist.

## 10. Observability & Performance Monitoring

- **Vercel Analytics** is enabled globally via `<Analytics />` in `app/layout.tsx`. No further setup is needed beyond deploying to Vercel.
- **Vercel Speed Insights** collects runtime performance metrics for deployed builds. The component is already wired inside `app/components/Telemetry.tsx`, which also renders `<Analytics />`. To verify or re-enable it:
  1. Confirm the dependency exists: `npm install @vercel/speed-insights`.
  2. Ensure `Telemetry` is mounted in `app/layout.tsx` (it renders both Analytics and Speed Insights).
  3. Deploy and visit the site; the Vercel dashboard will start showing the collected metrics within a few minutes.
- When adding new observability tooling, document the required environment variables and initialization points here.

## 12. Definition of Done Checklist

Before merging:
- [ ] Code follows the conventions outlined above.
- [ ] Tests, lint, typecheck, and `npm run vercel:build` pass locally without warnings.
- [ ] Relevant documentation in this file or `docs/` has been updated.
- [ ] Secrets are documented in `.env.example` when new configuration is introduced.
- [ ] For user-visible UI updates, capture screenshots with the provided tooling.

Maintaining this document is a shared responsibility. If you find conflicting guidance elsewhere in the repository, update or replace it with references to this file.
