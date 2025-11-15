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

## 7. Documentation Expectations

- Update the `README.md` for user-facing copy only; keep technical instructions in this file.
- Architecture deep dives belong in `docs/architecture.md` (see Documentation Plan below) once created.
- When adding a feature, document workflows or commands under `docs/` using `Title Case` filenames and include an entry in the repo changelog if applicable.

## 8. OpenAI / AI Feature Guidance

- All OpenAI or other LLM integrations must live under `lib/ai/` (create the folder if needed) with a single client wrapper that centralizes API key access, retries, and logging.
- Never call OpenAI directly from client components. Use server routes or actions that pull `OPENAI_API_KEY` from the server environment.
- Sanitize prompts and responses before logging; redact PII or sensitive tokens using helpers similar to `filterSensitiveData` in `app/services/sentryService.ts`.
- Implement exponential backoff with jitter for retries, and set explicit timeouts.
- Document every AI-facing endpoint or action with request/response examples in `docs/ai/README.md` when such features exist.

## 9. Observability & Performance Monitoring

- **Vercel Analytics** is enabled globally via `<Analytics />` in `app/layout.tsx`. No further setup is needed beyond deploying to Vercel.
- **Vercel Speed Insights** collects runtime performance metrics for deployed builds. The component is already wired inside `app/components/Telemetry.tsx`, which also renders `<Analytics />`. To verify or re-enable it:
  1. Confirm the dependency exists: `npm install @vercel/speed-insights`.
  2. Ensure `Telemetry` is mounted in `app/layout.tsx` (it renders both Analytics and Speed Insights).
  3. Deploy and visit the site; the Vercel dashboard will start showing the collected metrics within a few minutes.
- When adding new observability tooling, document the required environment variables and initialization points here.

## 11. Definition of Done Checklist

Before merging:
- [ ] Code follows the conventions outlined above.
- [ ] Tests, lint, typecheck, and `npm run vercel:build` pass locally without warnings.
- [ ] Relevant documentation in this file or `docs/` has been updated.
- [ ] Secrets are documented in `.env.example` when new configuration is introduced.
- [ ] For user-visible UI updates, capture screenshots with the provided tooling.

Maintaining this document is a shared responsibility. If you find conflicting guidance elsewhere in the repository, update or replace it with references to this file.
