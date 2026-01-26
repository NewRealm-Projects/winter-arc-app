# Winter Arc App - Project Documentation

## 1. Project Overview

Winter Arc is a Progressive Web App (PWA) for fitness tracking with emphasis on push-ups, sports, nutrition, and weight management. The app provides a gamified experience with group challenges, leaderboards, and progress visualization.

**Live URLs:**
- Production: https://app.winterarc.newrealm.de
- Staging: https://develop.winterarc.newrealm.de

---

## 2. Tech Stack

| Category | Technology |
|----------|------------|
| Framework | Next.js 16 (App Router) |
| UI | React 19 + TypeScript |
| Styling | Tailwind CSS 3.x (Mobile-first) |
| State | Zustand |
| Database | PostgreSQL (Neon) + Drizzle ORM |
| Auth | NextAuth.js (Google OAuth) |
| Testing | Vitest (unit), Playwright (e2e) |
| Monitoring | Sentry |
| Deployment | Vercel |

---

## 3. Project Structure

```
winter-arc-app/
├── app/                    # Next.js App Router
│   ├── api/               # API routes
│   ├── components/        # React components
│   │   ├── dashboard/     # Dashboard tiles
│   │   ├── notes/         # Quick log modals
│   │   └── ui/            # Shared UI components (AppModal, etc.)
│   ├── contexts/          # React contexts (Theme, Week)
│   ├── hooks/             # Custom hooks
│   ├── i18n/              # Translations (de, en)
│   ├── services/          # Business logic services
│   ├── store/             # Zustand store
│   ├── styles/            # Global styles, theme tokens
│   ├── types/             # TypeScript types
│   └── utils/             # Utility functions
├── lib/
│   └── db/                # Drizzle schema & client
├── docs/                  # Documentation
├── e2e/                   # Playwright tests
└── scripts/               # Build & utility scripts
```

---

## 4. Development Setup

```bash
# Install dependencies
npm install

# Setup database (Neon PostgreSQL)
npm run db:setup

# Run development server
npm run dev

# Run with 1Password secrets
npm run dev:1p

# Database operations
npm run db:generate    # Generate migrations
npm run db:push        # Push schema changes
npm run db:studio      # Open Drizzle Studio
```

---

## 5. Code Conventions

### Naming
- Components: PascalCase (`UserProfile.tsx`)
- Hooks: camelCase with `use` prefix (`useAuth.ts`)
- Utils: camelCase (`formatDate.ts`)
- Constants: UPPER_SNAKE_CASE (`MAX_PUSHUPS`)

### Imports
- Use absolute imports via `@/` alias
- Example: `import { useStore } from '@/store/useStore'`

### Components
- All modals MUST use `<AppModal>` from `app/components/ui/AppModal.tsx`
- Tiles are reusable tracking components in `app/components/dashboard/`

---

## 6. Architecture Patterns

### State Management
- Zustand store at `app/store/useStore.ts`
- API sync via hooks (debounced writes)
- Optimistic updates for better UX

### Data Flow
```
UI Components → Hooks → Zustand Store → API Routes → PostgreSQL
```

### API Routes
All API routes at `app/api/`:
- `/api/tracking/[date]` - Daily tracking CRUD
- `/api/users/[id]` - User profile CRUD
- `/api/auth/*` - NextAuth endpoints

---

## 7. Open TODOs

### Critical Bugs

#### Arc Menu Data Persistence Bug
- **Issue**: Arc menu state not persisting correctly across sessions
- **Location**: `app/components/dashboard/ArcMenu.tsx`

#### Progress Ring: Continuous Flow
- **Issue**: Progress ring shows segments instead of continuous flow
- **Location**: `app/components/dashboard/StatCarouselWithProgressCircle.tsx`
- **Expected**: Smooth gradient fill, not discrete segments

#### Modal Focus Outline Clipping (7 Modals)
- **Issue**: Focus outline gets clipped on modal edges
- **Affected**: DrinkLogModal, FoodLogModal, WorkoutLogModal, WeightLogModal, PushupLogModal, CustomNoteModal, Settings modals
- **Fix**: Adjust padding/overflow on modal container

### Feature Backlog

#### Custom Hydration Presets
- Allow users to create/edit/delete custom drink presets
- Currently limited to system presets

#### Food Macro Tracking
- Add detailed macro tracking (carbs, fat, protein per meal)
- Database schema already supports it

#### Mobile Dashboard Redesign
- Improve tile layout for small screens
- Better touch targets for quick actions

### UI Improvements

#### Weight Tile Edit Consolidation
- Merge weight input and body fat input into single modal

#### ArcMenu Positioning
- Fix positioning issues on different screen sizes
- Consider responsive breakpoints

---

## 8. Testing

### Run Tests
```bash
npm run test           # Run all tests
npm run test:watch     # Watch mode
npm run test:coverage  # Coverage report
npm run test:ui        # Vitest UI
```

### Test Structure
- Co-located: `__tests__/` folder next to source
- Naming: `*.test.ts` or `*.spec.ts`

### Coverage Requirements
- Minimum: 80% statements/branches/lines
- Target: 90% for critical paths (auth, tracking)

---

## 9. Deployment

### Vercel Commands
```bash
npm run build           # Build for production
npm run deploy          # Deploy to production
npm run deploy:preview  # Deploy preview
```

### Environment Variables
Required in Vercel:
- `DATABASE_URL` - Neon PostgreSQL connection string
- `NEXTAUTH_URL` - App URL
- `NEXTAUTH_SECRET` - Auth secret
- `GOOGLE_CLIENT_ID` - OAuth client ID
- `GOOGLE_CLIENT_SECRET` - OAuth client secret
- `SENTRY_DSN` - Error tracking (optional)

---

## 10. Business Rules

| Rule | Formula |
|------|---------|
| Water Goal | `weight * 0.033L` (min 2.0L) |
| Protein Goal | `weight * 2.0g` |
| Pushup Base | `0.45 * maxPushups` per set |
| Training Load | 7-day rolling average (sleep, recovery, volume) |

---

## 11. Git Workflow

### Branch Naming
Format: `<username>/<type>-<description>`
- `feature` - New functionality
- `fix` - Bug fixes
- `chore` - Maintenance
- `refactor` - Code restructuring

### Commit Format
```
type(scope): subject

[optional body]

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>
```

### Pre-commit Checks
- TypeScript type checking
- ESLint
- Secret scanning

---

## 12. Migration Notes (Firebase → PostgreSQL)

**Completed:**
- User data migrated to `users` table
- Tracking data migrated to `tracking_entries` table
- Authentication switched to NextAuth
- All Firestore references removed

**Removed Features (to be reimplemented):**
- SmartNotes (local IndexedDB + Firestore sync)
- Real-time listeners (now uses polling/fetch)

---

## 13. Design Tokens

See `app/styles/theme.css` for CSS custom properties:

```css
/* Semantic colors */
--color-hydration: #3B82F6;  /* Blue */
--color-nutrition: #F97316;  /* Orange */
--color-weight: #9333EA;     /* Purple */
--color-workout: #F59E0B;    /* Amber */
```

Use via Tailwind: `text-hydration`, `bg-nutrition`, etc.
