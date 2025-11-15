# Winter Arc App - Claude Development Guide

## 1. Project Overview

**Winter Arc** is a German-language Progressive Web App (PWA) for fitness tracking during winter months. The philosophy: "Jeder Tag zählt: Tracken, sehen, dranbleiben" (Every day counts: Track, see, stick with it).

### Core Purpose

- Daily fitness and wellness tracking (push-ups, weight, hydration, nutrition)
- Community motivation through groups and leaderboards
- Offline-first architecture with service worker caching
- Minimal, motivating interface focused on streaks and progress

### Current Version

- v0.1.3
- Recently migrated from Vite SPA to Next.js 16.0.1 App Router
- Recently migrated from Firebase Firestore to Vercel Postgres (Neon)

---

## 2. Technology Stack

### Frontend

- **Next.js 16.0.1** - App Router (server components default)
- **React 19.2.0** - Server & client components
- **TypeScript 5.9.3** - Strict mode with strict null checks
- **Tailwind CSS 3.4.17** - Custom winter/primary color palette, dark mode support
- **Zustand 5.0.8** - Client-side state management (user, tracking, dark mode)

### Backend & Data

- **Vercel Postgres / Neon** - PostgreSQL database (`@neondatabase/serverless`)
- **Drizzle ORM 0.44.7** - Type-safe database queries
- **NextAuth 4.24.13** - Authentication with Google OAuth provider
- **DrizzleAdapter** - NextAuth session/user storage

### Storage & Caching

- **Dexie.js 4.2.1** - IndexedDB for offline tracking data
- **Service Worker** - App shell caching, background sync
- **localStorage** - Dark mode, filter preferences persistence

### Utilities & Libraries

- **date-fns 4.1.0** - Date manipulation (YYYY-MM-DD formatting)
- **recharts 3.2.1** - Training load graph visualization
- **lucide-react 0.545.0** - Icon library
- **uuid 13.0.0** - UUID generation for records

### Monitoring

- **@vercel/analytics** - Web analytics
- **@vercel/speed-insights** - Performance monitoring
- **@sentry/react** - Error tracking (optional, gated)

### Testing

- **Vitest 3.2.4** - Unit tests
- **Playwright 1.56.0** - E2E tests
- **Testing Library** - React component testing
- **vitest-axe** - Accessibility testing

---

## 3. Architecture & Patterns

### Directory Structure

```
winter-arc-app/
├── app/                      # Next.js App Router
│   ├── (auth)/              # Auth-related pages
│   ├── (dashboard)/         # Dashboard and user pages
│   ├── api/                 # API routes
│   ├── components/          # Root-level shared components
│   ├── hooks/               # Custom React hooks
│   ├── layout.tsx           # Root layout
│   ├── page.tsx             # Home page
│   ├── store/               # Zustand stores
│   ├── services/            # Business logic (trainingLoad, smartNotes)
│   ├── types/               # App-level TypeScript types
│   └── manifest.ts          # PWA manifest
├── components/              # Shared root components (auth, providers)
├── lib/
│   ├── auth.ts              # NextAuth configuration
│   ├── db/
│   │   ├── index.ts         # Database client export
│   │   └── schema.ts        # Drizzle schema definitions
│   └── utils/               # Helper functions
├── public/
│   └── sw.js                # Service worker
├── types/
│   └── next-auth.d.ts       # NextAuth type extensions
├── docs/                    # Development documentation
└── Configuration files
```

### Component Patterns

#### Server Components (Default)

```typescript
// app/dashboard/page.tsx - Server component
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export default async function Dashboard() {
  const session = await auth();

  // Server-side auth check
  if (!session?.user?.id) {
    redirect("/auth/signin");
  }

  // Direct database access (no API needed)
  if (!db) throw new Error("Database unavailable");
  const userData = await db.query.users.findFirst({
    where: eq(users.id, session.user.id),
  });

  return <div>{userData?.nickname}</div>;
}
```

#### Client Components (For Interactivity)

```typescript
"use client";

import { useStore } from "@/store/useStore";
import { useAuth } from "@/app/hooks/useAuth";

export function InteractiveComponent() {
  const user = useStore((state) => state.user);
  const { session, loading } = useAuth();

  return <div>{user?.nickname}</div>;
}
```

### API Route Pattern

```typescript
// app/api/tracking/[date]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export async function PATCH(
  request: NextRequest,
  { params }: { params: { date: string } }
) {
  // Step 1: Authentication
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Step 2: Database availability
  if (!db) {
    return NextResponse.json(
      { error: "Database unavailable" },
      { status: 503 }
    );
  }
  const database = db; // Type narrowing after null check

  // Step 3: Validate input
  const body = await request.json();
  if (!params.date.match(/^\d{4}-\d{2}-\d{2}$/)) {
    return NextResponse.json({ error: "Invalid date format" }, { status: 400 });
  }

  // Step 4: Database operation
  try {
    const result = await database
      .update(tracking_entries)
      .set(body)
      .where(
        and(
          eq(tracking_entries.userId, session.user.id),
          eq(tracking_entries.date, params.date)
        )
      )
      .returning();

    return NextResponse.json(result[0]);
  } catch (error) {
    console.error("Tracking update error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
```

### Database Access Pattern

```typescript
import { db } from "@/lib/db";
import { users, tracking_entries } from "@/lib/db/schema";
import { eq, and, gte, lte } from "drizzle-orm";

// CRITICAL: Always check database availability
if (!db) {
  throw new Error("Database unavailable");
}
const database = db; // Assert non-null for TypeScript

// Type-safe queries with Drizzle
const userRecord = await database
  .select()
  .from(users)
  .where(eq(users.email, userEmail))
  .limit(1);

// Safe access to first result
const user = userRecord[0];
if (!user) {
  throw new Error("User not found");
}

// Complex query with filters
const entries = await database
  .select()
  .from(tracking_entries)
  .where(
    and(
      eq(tracking_entries.userId, userId),
      gte(tracking_entries.date, startDate),
      lte(tracking_entries.date, endDate)
    )
  );
```

### State Management Pattern

```typescript
// app/store/useStore.ts
import { create } from "zustand";

interface AppState {
  // User state
  user: User | null;
  setUser: (user: User | null) => void;

  // Tracking data (organized by date: YYYY-MM-DD)
  tracking: Record<string, DailyTracking>;
  updateDayTracking: (date: string, data: Partial<DailyTracking>) => void;

  // UI state
  darkMode: boolean;
  toggleDarkMode: () => void;
}

export const useStore = create<AppState>((set) => ({
  user: null,
  setUser: (user) => set({ user }),

  tracking: {},
  updateDayTracking: (date, data) =>
    set((state) => ({
      tracking: {
        ...state.tracking,
        [date]: { ...state.tracking[date], ...data },
      },
    })),

  darkMode: getInitialDarkMode(),
  toggleDarkMode: () =>
    set((state) => {
      const newDarkMode = !state.darkMode;
      localStorage.setItem("darkMode", JSON.stringify(newDarkMode));
      return { darkMode: newDarkMode };
    }),
}));

// Usage in components
const user = useStore((state) => state.user);
const setUser = useStore((state) => state.setUser);
const { tracking, updateDayTracking } = useStore((state) => ({
  tracking: state.tracking,
  updateDayTracking: state.updateDayTracking,
}));
```

### TypeScript Patterns

#### Schema-Derived Types

```typescript
// lib/db/schema.ts
export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  email: text("email").unique().notNull(),
  // ... more fields
});

// Auto-generated types from schema
export type User = typeof users.$inferSelect; // Select ✓
export type NewUser = typeof users.$inferInsert; // Insert

// lib/db/index.ts
export type { User, NewUser };
```

#### App Domain Types

```typescript
// app/types/index.ts

export interface DailyTracking {
  date: string; // YYYY-MM-DD format (required)
  pushups?: {
    total?: number;
    workout?: PushupWorkout; // { sets, reps, passed }
  };
  sports: SportTracking;
  water: number; // ml
  protein: number; // grams
  weight?: {
    value: number; // kg
    bodyFat?: number; // %
    bmi?: number;
  };
  completed: boolean;
}

export interface TrainingLoadResult {
  load: number; // 0-1000
  components: {
    baseLoad: number;
    pushupLoad: number;
    sportsLoad: number;
    wellnessModifier: number; // 0.5-1.2
  };
}

// Strict null checks enforced
const first = array[0]; // Type: T | undefined (not just T)
if (first) {
  // Type is narrowed to T here
}
```

---

## 4. Database Schema

### Users Table

```typescript
users: {
  id: UUID (PK)
  firebaseUid: TEXT | NULL         // Legacy migration tracking only
  email: TEXT UNIQUE               // Auth email
  nickname: TEXT                   // Display name (required for onboarding)
  gender: TEXT                      // 'm' | 'f' | 'o'
  height: INTEGER                   // cm (required for onboarding)
  weight: DECIMAL                   // kg
  maxPushups: INTEGER              // Personal record
  groupCode: TEXT | NULL           // Group membership code
  pushupState: JSONB               // { base, bump, workout } (Base & Bump algorithm)
  language: TEXT                    // 'de' | 'en' (default: 'de')
  createdAt: TIMESTAMP             // Record creation
  updatedAt: TIMESTAMP             // Last update
}
```

### Groups Table

```typescript
groups: {
  id: UUID (PK)
  code: TEXT UNIQUE                // Join code (e.g., 'WINTER24')
  name: TEXT                        // Group name
  members: JSONB                   // Array of user IDs
}
```

### Tracking Entries Table

```typescript
tracking_entries: {
  id: UUID (PK)
  userId: UUID (FK → users.id)     // Record owner
  date: TEXT                        // YYYY-MM-DD format
  pushups: JSONB | NULL            // { total, workout }
  sports: JSONB | NULL             // Duration, intensity
  water: INTEGER                    // ml
  protein: INTEGER                  // grams
  weight: DECIMAL | NULL           // kg
  completed: BOOLEAN               // Day completion status
  createdAt: TIMESTAMP
  updatedAt: TIMESTAMP
}
```

**CRITICAL**: All date fields in tracking use `YYYY-MM-DD` string format for consistency across client/server.

---

## 5. Authentication Flow

### NextAuth Configuration

```typescript
// lib/auth.ts
import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import { DrizzleAdapter } from "@auth/drizzle-orm";

export const { auth, signIn, signOut } = NextAuth({
  adapter: DrizzleAdapter(db!),
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],
  pages: {
    signIn: "/auth/signin",
  },
  session: { strategy: "jwt" },
  callbacks: {
    // Extend session with user fields
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.sub!;
        // Custom fields from database
        session.user.nickname = token.nickname;
        session.user.groupCode = token.groupCode;
      }
      return session;
    },
  },
});
```

### Session Type Extension

```typescript
// types/next-auth.d.ts
declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      email: string;
      nickname: string | null;
      groupCode: string | null;
      image: string | null;
    };
  }
}
```

### Authentication Flow

```
1. User lands on / (page.tsx)
2. Server checks await auth() → session?
3. If session → check onboarding status (nickname + height)
4. If onboarded → redirect to /dashboard
5. If not onboarded → redirect to /onboarding
6. If no session → redirect to /auth/signin
7. Sign in with Google → NextAuth creates user + session
8. Session returned with id, nickname, groupCode
```

### Using Auth in Components

**Server Component:**

```typescript
import { auth } from "@/lib/auth";

export default async function Protected() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/auth/signin");
  }
  return <div>Welcome {session.user.nickname}</div>;
}
```

**Client Component:**

```typescript
"use client";
import { useAuth } from "@/app/hooks/useAuth";

export function Profile() {
  const { session, loading } = useAuth();

  if (loading) return <Loading />;
  if (!session) return <Unauthorized />;

  return <div>{session.user.nickname}</div>;
}
```

---

## 6. Key Features & Components

### Daily Tracking Tiles

#### Push-ups (`components/PushupTile.tsx`)

- Tracks repetitions and workout sets
- Uses **Base & Bump algorithm** stored in `users.pushupState`
  - Base: Minimum daily target
  - Bump: Incremental progression
  - Adaptively adjusts based on workout outcomes (pass/hold/fail)
- Shows current target, progress, and status

#### Weight (`components/WeightTile.tsx`)

- Daily weight logging (kg)
- Optional body fat percentage
- Auto-calculates BMI: `weight / (height/100)²`
- Displays trend (up/down/stable)

#### Hydration (`components/HydrationTile.tsx`)

- Water intake tracking (ml)
- Quick-add drink presets (customizable array)
- Goal-based progress bar (default 2L/day)
- Shows % of daily goal completed

#### Nutrition (`components/NutritionTile.tsx`)

- Protein tracking (grams)
- Optional: calories, carbs, fats
- Goal-based indicators
- Macro breakdown visualization

### Training Load Calculation

```typescript
// app/services/trainingLoad.ts

/**
 * Computes daily training load on scale of 0-1000
 * Formula: (workouts + pushups) * wellness_modifier
 */
export function computeDailyTrainingLoadV1(params: {
  workouts: Workout[]; // { durationMinutes, intensity }
  pushupsReps: number; // Daily pushup count
  sleepScore: number; // 0-10
  recoveryScore: number; // 0-10
  sick: boolean; // Sickness penalty
}): TrainingLoadResult;

// Example calculation
const load = computeDailyTrainingLoadV1({
  workouts: [{ durationMinutes: 45, intensity: 8 }],
  pushupsReps: 120,
  sleepScore: 7,
  recoveryScore: 8,
  sick: false,
});
// Result: { load: 450, components: {...} }
```

### Groups & Leaderboard

- Join via 4-6 character group code
- View group members' aggregated stats
- Leaderboard filters: week / month / all-time
- Public rankings, private tracking data
- API: `GET /api/groups/[code]` → members + stats

### PWA & Offline Support

- **Service Worker** caches app shell + assets
- **IndexedDB** (Dexie) stores tracking data locally
- Background sync when online connection restored
- Install prompt via `BeforeInstallPromptEvent`
- Manifest: `app/manifest.ts` (icons, shortcuts)

### Smart Notes (Optional)

- Parse natural language tracking notes
- Example: "ran 30min, drank 2L water, 100 pushups"
- Optional Gemini AI integration (`GEMINI_API_KEY`)
- Auto-sync parsed values to tracking

---

## 7. Critical Guidelines

### Database Safety (🔴 CRITICAL)

**ALWAYS check database availability before queries:**

```typescript
if (!db) {
  // Return 503 for API routes
  return NextResponse.json(
    { error: 'Database unavailable' },
    { status: 503 }
  )
  // Or throw for server components
  throw new Error('Database unavailable')
}
const database = db // Type narrowing

// Now safe to use database
await database.select().from(users)...
```

**Why?** Database may be null during build time or when connection is unavailable. Failing to check causes runtime errors.

### Date Format Convention

- **Always use `YYYY-MM-DD` string format** for dates in tracking
- Use `date-fns` for parsing and manipulation
- Example: `format(new Date(), 'yyyy-MM-dd')`
- Database stores as TEXT in this format for consistency

### Environment Variables

```bash
# Required for development
DATABASE_URL="postgresql://user:password@host/dbname"  # Neon/Vercel Postgres
NEXTAUTH_SECRET="<randomly-generated-secret>"
NEXTAUTH_URL="http://localhost:3000"
GOOGLE_CLIENT_ID="<from-google-cloud-console>"
GOOGLE_CLIENT_SECRET="<from-google-cloud-console>"

# Optional
GEMINI_API_KEY="<for-smart-notes-feature>"
NEXT_PUBLIC_SENTRY_DSN="<for-error-tracking>"
NEXT_PUBLIC_ENABLE_CHECKINS="false"  # Feature flag for legacy check-ins
```

### Feature Flags

- Use `process.env.NEXT_PUBLIC_*` for client-side feature gates
- Use `process.env.*` for server-side feature gates
- Example: `NEXT_PUBLIC_ENABLE_CHECKINS` gates legacy check-in feature
- Always check flag before enabling related UI/API

### Language Context

- **Primary language: German (de)**
- UI text defaults to German
- Translation system via `useTranslation()` hook
- When writing user-facing text, use German strings
- English only for code comments and internal documentation

### Legacy Code & Migration

- Firebase Firestore → Vercel Postgres migration completed
- `firebaseUid` column in users table for migration tracking only
- Firebase auth → NextAuth migration complete
- Legacy code has defensive null checks throughout
- **Do NOT remove** `NEXT_PUBLIC_ENABLE_CHECKINS` flag yet

### Type Safety

- **`noUncheckedIndexedAccess: true`** in tsconfig
- Array access returns `T | undefined`, not just `T`
- **Always check array bounds** before access
- Example: `const first = array[0]; if (first) { /* use */ }`

---

## 8. Development Workflow

### Branch Naming (ENFORCED by Husky)

```
<username>/<type>-<description>

Valid types: feature, fix, chore, refactor, docs, test, style

Examples:
✅ lars/feature-dashboard-redesign
✅ niklas/fix-login-race-condition
✅ daniel/chore-upgrade-typescript
❌ feature/new-dashboard (missing username)
❌ fix_login_issue (invalid format)
```

### Commit Message Convention

```
<type>(<scope>): <subject>

<body - optional>

Examples:
feat(tracking): add bulk import API endpoint
fix(auth): resolve session expiration race condition
chore(deps): upgrade Next.js to 16.0.1
refactor(components): extract PushupTile logic to service
docs(readme): update installation steps
test(trainingLoad): add edge case tests
```

### PR Workflow

1. Create feature branch from `develop`
2. Run checks before pushing:
   ```bash
   npm run lint        # ESLint validation
   npm run typecheck   # TypeScript strict checks
   npm run vercel:build # Next.js build verification
   npm run test:unit   # Unit tests
   ```
3. Push to remote and create PR against `develop` (not `main`)
4. Update `CHANGELOG.md` in `[Unreleased]` section
5. Husky pre-push hook validates branch naming
6. Await code review before merge

### Key Scripts

```bash
npm run dev              # Start development server (localhost:3000)
npm run build            # Next.js production build
npm run start            # Run production build
npm run lint             # ESLint check
npm run lint:fix         # Auto-fix lint issues
npm run typecheck        # TypeScript strict check
npm run vercel:build     # Vercel build verification
npm run test:unit        # Run Vitest unit tests
npm run test:e2e         # Run Playwright E2E tests
npm run format           # Prettier code formatting
```

---

## 9. File Organization & Path Aliases

### Key Files

```
winter-arc-app/
├── lib/
│   ├── auth.ts              # NextAuth setup and session handling
│   ├── db/
│   │   ├── index.ts         # Database client export (null-checked)
│   │   └── schema.ts        # Drizzle table definitions and type exports
│   └── utils.ts             # Helper functions (date, calculations)
├── app/
│   ├── hooks/
│   │   ├── useAuth.ts       # Session/auth hook for client components
│   │   ├── useTracking.ts   # Tracking data hook
│   │   └── useGroups.ts     # Group membership hook
│   ├── store/
│   │   └── useStore.ts      # Zustand store (user, tracking, UI state)
│   ├── services/
│   │   ├── trainingLoad.ts  # Training load calculation logic
│   │   └── smartNoteService.ts # Natural language parsing (optional Gemini)
│   ├── types/
│   │   └── index.ts         # App-level TypeScript interfaces
│   ├── api/
│   │   ├── auth/            # NextAuth routes
│   │   ├── tracking/        # Tracking CRUD endpoints
│   │   ├── users/           # User management endpoints
│   │   └── groups/          # Group endpoints
│   ├── (dashboard)/         # Dashboard and user pages
│   ├── (auth)/              # Sign-in/sign-out pages
│   ├── components/          # Page-specific components
│   ├── layout.tsx           # Root layout with providers
│   ├── page.tsx             # Home page / entry point
│   └── manifest.ts          # PWA manifest
├── components/              # Root-level shared components
│   ├── AuthProvider.tsx     # NextAuth Provider
│   ├── ClientProvider.tsx   # Zustand + localStorage hydration
│   └── ...
├── public/
│   ├── sw.js                # Service Worker for PWA caching
│   └── ...                  # Icons, images
├── types/
│   └── next-auth.d.ts       # NextAuth session type extensions
└── docs/
    └── development-guidelines.md # Detailed development reference
```

### Path Aliases (tsconfig.json)

```typescript
// All imports use @ prefix
import { db } from "@/lib/db";
import { useStore } from "@/store/useStore";
import { User } from "@/types";
import { PushupTile } from "@/components/PushupTile";
import { auth } from "@/lib/auth";
import { computeTrainingLoad } from "@/services/trainingLoad";

// Maps to:
// @/* → ./
```

---

## 10. Testing Guidelines

### Unit Tests (Vitest)

```typescript
// Format: filename.test.ts or filename.spec.ts
// Location: Same directory as source file

import { describe, it, expect } from "vitest";
import { computeDailyTrainingLoadV1 } from "./trainingLoad";

describe("Training Load Calculation", () => {
  it("computes base load from workouts and pushups", () => {
    const result = computeDailyTrainingLoadV1({
      workouts: [{ durationMinutes: 30, intensity: 7 }],
      pushupsReps: 50,
      sleepScore: 7,
      recoveryScore: 8,
      sick: false,
    });

    expect(result.load).toBeGreaterThan(0);
    expect(result.load).toBeLessThanOrEqual(1000);
  });
});
```

### Coverage Goals

- Business logic: ≥80%
- Hooks/Services: ≥70%
- Components: ≥50%

---

## 11. Performance & Best Practices

### Server vs Client Components

- **Default to server components** for data fetching
- Use client components only when needed (hooks, interactivity)
- Avoids unnecessary JavaScript shipped to client
- Server components can access database directly

### Image Optimization

- Use Next.js `next/image` component
- Enables automatic optimization and responsive sizing
- Specify `width` and `height` for static images
- Use `priority` prop for above-the-fold images

### Dynamic Imports

- Use for heavy libraries: `Recharts`, data visualization
- Example: `const Chart = dynamic(() => import('@/components/Chart'))`
- Reduces initial bundle size

### Caching Strategy

- HTTP headers set in `next.config.js`
- Service Worker caches app shell + critical assets
- IndexedDB (Dexie) for tracking data persistence
- localStorage for UI state (dark mode, filters)

---

## 12. Resources & References

- **Development Guidelines**: `docs/development-guidelines.md`
- **Contributing Guide**: `CONTRIBUTING.md`
- **Database Schema**: `lib/db/schema.ts`
- **Auth Configuration**: `lib/auth.ts`
- **Type Definitions**: `app/types/index.ts`
- **Store Definition**: `app/store/useStore.ts`
- **Git Repo**: Current branch is `develop`, PRs go to `develop` (not `main`)

---

## 13. Quick Reference

### Common Tasks

**Add a new tracking metric:**

1. Add field to `tracking_entries` schema in `lib/db/schema.ts`
2. Create corresponding Tile component in `app/components/`
3. Add reducer to Zustand store in `app/store/useStore.ts`
4. Create API endpoint in `app/api/tracking/[date]/route.ts`
5. Add to `DailyTracking` interface in `app/types/index.ts`

**Create a new page:**

1. Create file in `app/` or `app/(dashboard)/` following App Router pattern
2. For protected pages: `await auth()` server-side check
3. Use `<Suspense>` for async data boundaries
4. Add to navigation component

**Add a new API endpoint:**

1. Create `app/api/resource/route.ts`
2. Check auth: `await auth()`
3. Check database: `if (!db) return 503`
4. Use Drizzle for queries
5. Return `NextResponse.json(data)`

**Update database schema:**

1. Modify `lib/db/schema.ts`
2. Create migration in Neon/Vercel dashboard
3. Test locally with updated `DATABASE_URL`
4. Verify API routes still work

---

## 14. Known Issues & Gotchas

- **Database build-time**: Database is null during `next build`. All API routes and server components must check `if (!db)`.
- **Date format**: Always `YYYY-MM-DD`. Inconsistent formats cause filtering bugs.
- **Session hydration**: Client components need `useAuth()` hook, not direct NextAuth import.
- **TypeScript strict mode**: `noUncheckedIndexedAccess` requires bounds checking on array access.
- **Legacy Firebase code**: Some old patterns remain for migration compatibility. Do not expand Firebase usage.
