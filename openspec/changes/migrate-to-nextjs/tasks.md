# Next.js + Vercel Complete Migration Tasks

## Phase 0: Database Migration (TODAY PRIORITY)
- [ ] **Task 0.1**: Set up Vercel Postgres database
  - Create Vercel Postgres database in project
  - Set up database environment variables
  - Configure connection pooling
  - Test database connectivity

- [ ] **Task 0.2**: Design SQL schema from Firestore structure
  - Analyze current Firestore collections (users, tracking, groups)
  - Design relational schema for Postgres
  - Create migration SQL scripts
  - Plan data transformation logic

- [ ] **Task 0.3**: Create database tables and relationships
  - Users table (id, email, nickname, profile data)
  - Tracking table (user_id, date, pushups, sports, water, etc.)
  - Groups table (code, name, members)
  - User_groups junction table for many-to-many
  - Add proper indexes and constraints

- [ ] **Task 0.4**: Build data migration scripts
  - Export data from Firestore collections
  - Transform to SQL-compatible format
  - Create migration scripts for bulk insert
  - Test with sample data first

- [ ] **Task 0.5**: Implement dual-write system (transition period)
  - Write to both Firestore and Postgres temporarily
  - Verify data consistency between systems
  - Allow rollback if issues occur
  - Monitor performance impact

## Phase 1: Project Setup
- [ ] **Task 1.1**: Install Next.js 15 and configure basic setup
  - Install `next@latest`, `@next/bundle-analyzer`
  - Create `next.config.js` with TypeScript and experimental features
  - Configure `app/` directory structure
  - Set up basic layout and root page

- [ ] **Task 1.2**: Configure TypeScript for Next.js
  - Update `tsconfig.json` for Next.js App Router
  - Add Next.js specific types and path mappings
  - Configure strict mode and Next.js optimizations
  - Verify TypeScript compilation works

- [ ] **Task 1.3**: Setup Tailwind CSS for Next.js
  - Configure `tailwind.config.js` for Next.js
  - Update CSS imports and global styles
  - Test Tailwind classes work in Next.js environment
  - Migrate existing theme configuration

- [ ] **Task 1.4**: Configure PWA for Next.js
  - Install `@ducanh2912/next-pwa` (Next.js 15 compatible)
  - Configure PWA settings in next.config.js
  - Set up service worker and manifest
  - Test PWA features (install prompt, offline)

## Phase 2: Component Migration
- [ ] **Task 2.1**: Create Next.js app structure
  - Create `app/layout.tsx` (root layout)
  - Create `app/globals.css`
  - Set up providers for Zustand, Firebase, etc.
  - Create error boundaries and loading components

- [ ] **Task 2.2**: Migrate UI components
  - Move `src/components/ui/` to `app/components/ui/`
  - Update all imports to use new paths
  - Ensure components work with Next.js SSR
  - Add `'use client'` directive where needed

- [ ] **Task 2.3**: Migrate feature components
  - Move `src/components/` main components to `app/components/`
  - Update component imports and dependencies
  - Test all components render correctly
  - Fix any SSR compatibility issues

- [ ] **Task 2.4**: Migrate hooks and utilities
  - Move `src/hooks/` to `app/hooks/`
  - Move `src/utils/` to `app/utils/`
  - Update all imports throughout the app
  - Ensure client-side hooks work properly

## Phase 3: Routing Migration
- [ ] **Task 3.1**: Create page structure
  - Create `app/page.tsx` (home/login page)
  - Create `app/dashboard/page.tsx`
  - Create `app/settings/page.tsx`
  - Create `app/leaderboard/page.tsx`

- [ ] **Task 3.2**: Migrate route guards
  - Implement authentication checking in layouts
  - Create middleware for route protection
  - Update navigation components for Next.js routing
  - Test authentication flows

- [ ] **Task 3.3**: Remove React Router
  - Remove react-router-dom dependency
  - Delete `src/routes/` directory
  - Update all navigation to use Next.js Link
  - Remove BrowserRouter and related config

- [ ] **Task 3.4**: Update navigation
  - Update all internal links to use Next.js `Link`
  - Fix navigation state management
  - Ensure proper page transitions
  - Test all navigation flows

## Phase 4: Database & API Migration
- [ ] **Task 4.1**: Create Postgres-based API routes
  - Replace Firebase Admin with Postgres queries
  - Create /api/auth/login (Google OAuth only)
  - Create /api/tracking/[date] endpoints
  - Create /api/users/profile endpoints
  - Create /api/groups/ endpoints

- [ ] **Task 4.2**: Implement Google OAuth without Firebase
  - Set up direct Google OAuth 2.0 integration
  - Create JWT token handling (no Firebase Auth)
  - Implement session management
  - Create auth middleware for API protection

- [ ] **Task 4.3**: Replace Firestore client with Postgres client
  - Install @vercel/postgres or drizzle ORM
  - Replace all Firebase calls with SQL queries
  - Update useAuth hook for new auth flow
  - Update tracking hooks for SQL database

- [ ] **Task 4.4**: Data migration execution
  - Run migration scripts on production data
  - Verify data integrity after migration
  - Switch frontend to new API endpoints
  - Remove Firebase dependencies
- [ ] **Task 4.1**: Convert API routes
  - Move `api/health.ts` to `app/api/health/route.ts`
  - Move `api/auth/verify.ts` to `app/api/auth/verify/route.ts`
  - Move `api/tracking/entry.ts` to `app/api/tracking/entry/route.ts`
  - Update to Next.js 15 API route format

- [ ] **Task 4.2**: Update API client
  - Update frontend API calls to use new Next.js routes
  - Ensure Firebase Admin SDK still works
  - Test all API endpoints
  - Fix any authentication issues

- [ ] **Task 4.3**: Remove Vercel config
  - Delete `vercel.json` (Next.js handles this)
  - Remove old API directory
  - Update deployment scripts
  - Test local development server

- [ ] **Task 4.4**: Update environment variables
  - Move environment variables to Next.js format
  - Update `.env.local.template`
  - Ensure all secrets work in Next.js
  - Test Firebase Admin integration

## Phase 5: Build & Deployment
- [ ] **Task 5.1**: Configure build process
  - Update `package.json` scripts for Next.js
  - Configure next.config.js for production
  - Set up proper static asset handling
  - Test build process

- [ ] **Task 5.2**: Update deployment
  - Configure Vercel for Next.js deployment
  - Update GitHub Actions if needed
  - Test production deployment
  - Verify environment variables work

- [ ] **Task 5.3**: Performance optimization
  - Configure Next.js image optimization
  - Set up proper code splitting
  - Optimize bundle size
  - Run Lighthouse performance tests

- [ ] **Task 5.4**: Remove Vite configuration
  - Delete `vite.config.ts`
  - Remove Vite dependencies from package.json
  - Clean up old build artifacts
  - Update documentation

## Phase 6: Testing & Finalization
- [ ] **Task 6.1**: Comprehensive testing
  - Test all user workflows
  - Verify PWA features work
  - Test offline functionality
  - Verify Firebase integration

- [ ] **Task 6.2**: Performance validation
  - Run Lighthouse audits
  - Compare performance to Vite version
  - Optimize any regressions
  - Document performance improvements

- [ ] **Task 6.3**: Update documentation
  - Update README.md for Next.js
  - Update development setup instructions
  - Document new deployment process
  - Update architecture documentation

- [ ] **Task 6.4**: Cleanup and final review
  - Remove all old Vite-related files
  - Clean up package.json dependencies
  - Final code review and cleanup
  - Tag release for migration completion

## Risk Mitigation Tasks
- [ ] **Risk 6.1**: SSR compatibility check
  - Identify components that need client-side only
  - Add proper `'use client'` directives
  - Test all components with SSR enabled
  - Create fallbacks for client-only features

- [ ] **Risk 6.2**: PWA feature validation
  - Verify service worker registration
  - Test offline functionality
  - Validate install prompts work
  - Ensure cache strategies work

- [ ] **Risk 6.3**: Bundle size monitoring
  - Monitor bundle size during migration
  - Implement proper code splitting
  - Optimize imports and dependencies
  - Use Next.js bundle analyzer
