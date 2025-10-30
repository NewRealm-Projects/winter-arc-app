# Next.js Migration Proposal

## Why
The current Vite + Firebase + Vercel Serverless architecture has critical limitations that prevent optimal full-stack development:

1. **Development Complexity**: Running multiple services (frontend, backend, Firebase)
2. **Database Limitations**: Firebase Firestore is NoSQL and has scaling/query limitations
3. **Vendor Lock-in**: Firebase creates dependency on Google Cloud ecosystem
4. **No SSR Benefits**: Pure client-side rendering limits SEO and performance
5. **Cost Scaling**: Firebase can become expensive at scale

**Complete Vercel Migration** with Next.js 15 provides:
- **Unified Platform**: Everything on Vercel (database, backend, frontend)
- **Better Performance**: SSR/SSG + Vercel Edge Network
- **SQL Database**: PostgreSQL for complex queries and relationships
- **Cost Efficiency**: Single platform pricing
- **Modern Architecture**: Next.js App Router + Vercel Postgres

## Overview
**COMPLETE MIGRATION**: Transform Winter Arc App from Vite + Firebase to Next.js 15 + Vercel Postgres with unified full-stack architecture. Only Google SSO remains from Firebase ecosystem.

## Background
The current architecture uses:
- **Frontend**: Vite + React 19 + TypeScript 5.9.3 + Tailwind CSS
- **Backend**: Vercel Serverless Functions (recently built)
- **Database**: Firebase Firestore (NoSQL)
- **Auth**: Firebase Auth (full integration)
- **Routing**: React Router v6
- **State**: Zustand + Firebase Client SDK
- **PWA**: Vite PWA Plugin with Workbox

This creates vendor fragmentation:
- Google Cloud (Firebase Firestore, Auth)
- Vercel (Functions, Hosting)
- Multiple SDKs and APIs to maintain
- Manual API route management
- Complex development setup (2 dev servers)

## Goals
1. **Unified Platform**: Everything on Vercel (database, backend, frontend, deployment)
2. **Better Performance**: SSR/SSG with Vercel Edge Network
3. **SQL Database**: PostgreSQL for complex queries and relationships
4. **Simplified Auth**: Google SSO only (remove Firebase Auth complexity)
5. **Better DX**: Single platform, unified development environment
6. **Cost Efficiency**: Eliminate Firebase costs, single Vercel billing

**TARGET ARCHITECTURE:**
- **Platform**: Vercel (everything)
- **Frontend**: Next.js 15 App Router + TypeScript + Tailwind
- **Backend**: Next.js API Routes + Middleware
- **Database**: Vercel Postgres (SQL)
- **Auth**: Google OAuth 2.0 (direct integration, no Firebase)
- **State**: Zustand + SWR/TanStack Query for server state
- **PWA**: Next.js PWA Plugin

## Scope
**IN SCOPE:**
- Migrate all React components to Next.js App Router
- Convert Vercel API functions to Next.js API routes
- Maintain current UI/UX exactly
- Keep all existing features (PWA, Firebase, Zustand, Tailwind)
- Preserve current authentication flow
- Maintain current data structures and Firebase integration

**OUT OF SCOPE:**
- UI/UX changes (this is a technical migration only)
- New features beyond migration
- Database schema changes
- Authentication provider changes
- Breaking changes to user workflows

## Technical Approach

### Phase 1: Project Setup (2-3 hours)
- Install Next.js 15 alongside current setup
- Configure App Router structure
- Set up TypeScript and Tailwind in Next.js
- Configure next.config.js for PWA

### Phase 2: Component Migration (4-6 hours)
- Migrate all src/components to app/components
- Update imports and paths
- Ensure all components work in Next.js environment
- Migrate context providers and hooks

### Phase 3: Routing Migration (3-4 hours)
- Convert React Router routes to Next.js file-based routing
- Create app/page.tsx, app/dashboard/page.tsx, etc.
- Migrate route guards and authentication logic
- Update navigation components

### Phase 4: API Migration (2-3 hours)
- Convert api/ Vercel functions to app/api/ Next.js routes
- Update API client calls from frontend
- Ensure Firebase Admin SDK still works
- Test all authentication and data flows

### Phase 5: PWA & Build Setup (2-3 hours)
- Configure Next.js PWA plugin
- Migrate Service Worker functionality
- Update build and deployment configs
- Ensure offline capabilities work

### Phase 6: Testing & Cleanup (2-3 hours)
- Comprehensive testing of all features
- Remove old Vite configuration
- Update documentation
- Performance optimization

## Risks & Mitigation
1. **SSR Compatibility**: Some components may not work with SSR
   - *Mitigation*: Use dynamic imports with `ssr: false` for client-only components
2. **PWA Features**: Next.js PWA setup differs from Vite
   - *Mitigation*: Use @ducanh2912/next-pwa (Next.js 15 compatible)
3. **Build Time**: Next.js may be slower than Vite
   - *Mitigation*: Use Turbopack in development
4. **Bundle Size**: Next.js may increase bundle size
   - *Mitigation*: Proper code splitting and tree shaking

## Dependencies
- All current OpenSpec changes should be completed or safely mergeable
- Current Vercel backend implementation should be committed first
- No breaking changes to Firebase structure during migration

## Success Criteria
1. All existing functionality works identically
2. PWA features (offline, install prompt) work
3. Firebase authentication and data sync work
4. Performance is equal or better than current setup
5. Development experience is improved (single dev server)
6. Build and deployment work on Vercel
7. All existing tests pass (after migration)

## Timeline
Estimated 15-20 hours over 3-5 days for complete migration.

## Post-Migration Benefits
- Unified development experience
- Better TypeScript integration
- Improved performance with SSR where beneficial
- Simplified deployment (single Next.js app)
- Better developer tools and debugging
- Future-proof architecture for new features
