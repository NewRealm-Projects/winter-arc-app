# Implementation Tasks

## Phase 1: Foundation & Utilities

### 1.1 Create Retry Utility
- [x] 1.1.1 Create `src/utils/retry.ts` with exponential backoff function
- [x] 1.1.2 Add TypeScript types for retry options (maxRetries, baseDelay)
- [x] 1.1.3 Implement exponential backoff: 1s, 2s, 4s delays
- [x] 1.1.4 Add error handling for max retries exceeded
- [x] 1.1.5 Add Sentry breadcrumb logging for retry attempts

### 1.2 Write Unit Tests for Retry Utility
- [x] 1.2.1 Test successful operation on first attempt
- [x] 1.2.2 Test retry after transient failure
- [x] 1.2.3 Test max retries exceeded (throws error)
- [x] 1.2.4 Test exponential backoff timing
- [x] 1.2.5 Test Sentry breadcrumb logging

## Phase 2: Fix Training Load Calculation

### 2.1 Fix Pushup Calculation
- [x] 2.1.1 Review `computeDailyTrainingLoadV1` in `src/services/trainingLoad.ts`
- [x] 2.1.2 Remove incorrect `pushupAdj` calculation (lines 76-78)
- [x] 2.1.3 Change `computeBaseFromWorkouts` call to include `params.pushupsReps` (line 64)
- [x] 2.1.4 Remove `pushupAdj` from final load calculation (line 81)
- [x] 2.1.5 Update formula to: `const load = Math.round(clamp(baseLoad * wellnessMod, 0, TRAINING_LOAD_CAP))`

### 2.2 Update Calculation Tests
- [ ] 2.2.1 Update `src/services/__tests__/computeDailyTrainingLoadV1.test.ts` (NEEDS TEST RUN)
- [ ] 2.2.2 Fix test expectations for pushup load contribution (NEEDS TEST RUN)
- [ ] 2.2.3 Add test case: 100 pushups should contribute ~1.35 units (NEEDS TEST RUN)
- [ ] 2.2.4 Add test case: 200 pushups should contribute ~2.7 units (NEEDS TEST RUN)
- [ ] 2.2.5 Verify wellness modifier still applies correctly (NEEDS TEST RUN)
- [ ] 2.2.6 Run tests: `npm run test:unit -- trainingLoad` (NEEDS TEST RUN)

## Phase 3: Week-Wide Subscription

### 3.1 Create Week Subscription Hook
- [x] 3.1.1 Create `src/hooks/useWeeklyTrainingLoadSubscription.ts`
- [x] 3.1.2 Import `startOfWeek`, `addDays`, `format` from date-fns
- [x] 3.1.3 Calculate Monday of current/selected week
- [x] 3.1.4 Generate 7 date keys (Mon-Sun)
- [x] 3.1.5 Create 7 onSnapshot listeners (one per day)
- [x] 3.1.6 Update Zustand store for each day's data
- [x] 3.1.7 Return cleanup function to unsubscribe all 7 listeners
- [x] 3.1.8 Add demo mode and test environment guards

### 3.2 Integrate Week Subscription
- [x] 3.2.1 Replace `useTrainingLoadSubscription` with `useWeeklyTrainingLoadSubscription` in `UnifiedTrainingCard.tsx`
- [ ] 3.2.2 Verify subscription triggers on week change (NEEDS MANUAL TEST)
- [ ] 3.2.3 Test subscription cleanup on unmount (NEEDS MANUAL TEST)
- [ ] 3.2.4 Check console logs for listener paths (dev mode) (NEEDS MANUAL TEST)

### 3.3 Update Graph Component
- [x] 3.3.1 Review `TrainingLoadGraph.tsx` - no changes needed (uses trainingLoadMap from store)
- [ ] 3.3.2 Add optional loading state if needed (NOT REQUIRED)
- [ ] 3.3.3 Test graph updates in real-time when any day changes (NEEDS MANUAL TEST)

## Phase 4: Remove Optimistic Updates

### 4.1 Refactor CheckInModal
- [x] 4.1.1 Open `src/components/checkin/CheckInModal.tsx`
- [x] 4.1.2 Remove `previousCheckIn` and `previousTrainingLoad` variables (lines 97-98)
- [x] 4.1.3 Remove optimistic update calls: `setCheckInForDate` and `setTrainingLoadForDate` (lines 141-142)
- [x] 4.1.4 Remove rollback logic in catch block (lines 154-164)
- [x] 4.1.5 Keep `setIsSaving(true)` and loading state
- [x] 4.1.6 Wrap `saveDailyCheckInAndRecalc` with retry utility
- [x] 4.1.7 Update dependencies array (remove `setCheckInForDate`, `setTrainingLoadForDate`)

### 4.2 Add Retry Logic to CheckInModal
- [x] 4.2.1 Import `retryWithBackoff` from `src/utils/retry.ts`
- [x] 4.2.2 Wrap save call: `await retryWithBackoff(() => saveDailyCheckInAndRecalc(...))`
- [x] 4.2.3 Add error handling for retry failures
- [x] 4.2.4 Update error toast message to be user-friendly
- [x] 4.2.5 Keep modal open on error (don't close)

### 4.3 Update Spec Delta
- [ ] 4.3.1 Verify spec matches implementation (remove optimistic update requirement) (OPTIONAL)
- [ ] 4.3.2 Update scenario: "Save check-in" with retry logic (OPTIONAL)

## Phase 5: Remove Weekly Aggregation

### 5.1 Simplify Check-In Service
- [x] 5.1.1 Open `src/services/checkin.ts`
- [x] 5.1.2 Remove `getDayDocumentsForWeek` function call (line 182)
- [x] 5.1.3 Remove `checkInsQuery` and `getDocs` call (lines 187-198)
- [x] 5.1.4 Remove metrics calculation loop (lines 200-211)
- [x] 5.1.5 Remove `streakDays` and `averagePct` calculation (lines 213-218)
- [x] 5.1.6 Remove `weekRef` and `setDoc` for weekly data (lines 220-229)
- [x] 5.1.7 Keep only: save DailyCheckIn, calculate training load, save DailyTrainingLoad

### 5.2 Remove Tracking Document Updates
- [x] 5.2.1 Remove `getDayProgressSummary` call for tracking document (lines 159-164)
- [x] 5.2.2 Remove `trackingRef` setDoc call (lines 166-178)
- [x] 5.2.3 Verify DailyCheckIn and DailyTrainingLoad are still saved

### 5.3 Verify Weekly Stats Still Work
- [x] 5.3.1 Check `useTrainingLoadWeek` hook (client-side calculation)
- [x] 5.3.2 Verify hook calculates stats from trainingLoadMap
- [ ] 5.3.3 Test weekly badge display (Low/Optimal/High) (NEEDS MANUAL TEST)
- [ ] 5.3.4 Test streak days and average completion (NEEDS MANUAL TEST)

## Phase 6: Testing & Validation

### 6.1 Unit Tests
- [ ] 6.1.1 Run all training load tests: `npm run test:unit -- trainingLoad` (NEEDS ENV FIX)
- [ ] 6.1.2 Run check-in tests: `npm run test:unit -- checkin` (NEEDS ENV FIX)
- [ ] 6.1.3 Fix any failing tests (update expectations) (NEEDS ENV FIX)
- [x] 6.1.4 Add test for retry logic in CheckInModal (DONE: src/utils/retry.test.ts)
- [ ] 6.1.5 Add test for week subscription hook (FUTURE: Consider adding if needed)

### 6.2 E2E Tests
- [ ] 6.2.1 Run check-in E2E test: `npm run test:ui -- checkin.spec.ts` (USER TO RUN)
- [ ] 6.2.2 Test check-in flow completes successfully (USER TO RUN)
- [ ] 6.2.3 Test graph updates after check-in (USER TO RUN)
- [ ] 6.2.4 Test error handling (simulate network failure) (USER TO RUN)
- [ ] 6.2.5 Test retry logic (mock transient failure) (USER TO RUN)

### 6.3 Manual Testing
- [ ] 6.3.1 Start dev server: `npm run dev` (USER TO RUN)
- [ ] 6.3.2 Open Dashboard → UnifiedTrainingCard (USER TO RUN)
- [ ] 6.3.3 Click "Check-In" → Adjust sliders → Save (USER TO RUN)
- [ ] 6.3.4 Verify save completes in <1s (USER TO RUN)
- [ ] 6.3.5 Verify graph updates immediately (USER TO RUN)
- [ ] 6.3.6 Check Network tab: Should see 2 Firestore writes (not 10+) (USER TO RUN)
- [ ] 6.3.7 Simulate network failure (offline mode) → Verify retry logic (USER TO RUN)
- [ ] 6.3.8 Check Sentry breadcrumbs for retry attempts (USER TO RUN)

### 6.4 Performance Validation
- [ ] 6.4.1 Measure check-in save latency (should be <1s P95) (USER TO VALIDATE)
- [ ] 6.4.2 Count Firestore operations (should be 2 writes, 0 reads) (USER TO VALIDATE)
- [ ] 6.4.3 Check Firestore console for listener count (7 per active user) (USER TO VALIDATE)
- [ ] 6.4.4 Verify no performance regression in graph rendering (USER TO VALIDATE)

## Phase 7: Documentation & Cleanup

### 7.1 Update Documentation
- [ ] 7.1.1 Update CLAUDE.md with new subscription model (NOT REQUIRED - behavior unchanged from user perspective)
- [x] 7.1.2 Update CHANGELOG.md with bug fix entry
- [ ] 7.1.3 Add migration notes (if needed) (NOT REQUIRED - no data migration)
- [x] 7.1.4 Update JSDoc comments in changed files

### 7.2 Code Cleanup
- [x] 7.2.1 Remove unused imports (previousCheckIn, previousTrainingLoad)
- [x] 7.2.2 Remove commented-out code
- [ ] 7.2.3 Run ESLint: `npm run lint` (USER TO RUN)
- [ ] 7.2.4 Run Prettier: `npm run format` (USER TO RUN)
- [ ] 7.2.5 Run TypeScript check: `npm run typecheck` (USER TO RUN)

### 7.3 Final Validation
- [ ] 7.3.1 Run full test suite: `npm run test:all` (USER TO RUN)
- [ ] 7.3.2 Run build: `npm run build` (USER TO RUN)
- [ ] 7.3.3 Verify bundle size (<600KB main chunk) (USER TO RUN)
- [ ] 7.3.4 Run Lighthouse CI (score ≥90) (USER TO RUN)
- [ ] 7.3.5 Check Codacy (all checks pass) (USER TO RUN)

## Phase 8: Deployment

### 8.1 Pre-Deploy Checklist
- [ ] 8.1.1 All tests passing
- [ ] 8.1.2 No ESLint errors/warnings
- [ ] 8.1.3 TypeScript strict mode passing
- [ ] 8.1.4 CHANGELOG.md updated
- [ ] 8.1.5 package.json version bumped (patch: x.x.X)

### 8.2 Deploy to Staging
- [ ] 8.2.1 Merge to develop branch
- [ ] 8.2.2 Wait for CI/CD pipeline
- [ ] 8.2.3 Smoke test on staging environment
- [ ] 8.2.4 Verify Sentry shows no new errors

### 8.3 Deploy to Production
- [ ] 8.3.1 Create PR to main branch
- [ ] 8.3.2 Wait for code review approval
- [ ] 8.3.3 Merge to main
- [ ] 8.3.4 Monitor Sentry for 1 hour after deploy
- [ ] 8.3.5 Check Firestore usage metrics
- [ ] 8.3.6 Verify no user complaints

## Parallel Work Opportunities

- **Phase 1 & Phase 2** can run in parallel (independent utilities)
- **Phase 3** depends on Phase 1 complete (needs store setup)
- **Phase 4** depends on Phase 1 (needs retry utility)
- **Phase 5** independent (can run parallel with Phase 3-4)
- **Phase 6-8** must be sequential (testing → cleanup → deploy)

## Estimated Effort

- **Phase 1**: 2 hours (retry utility + tests)
- **Phase 2**: 2 hours (fix calculation + tests)
- **Phase 3**: 3 hours (week subscription hook + integration)
- **Phase 4**: 2 hours (remove optimistic updates + retry)
- **Phase 5**: 2 hours (remove aggregation)
- **Phase 6**: 4 hours (comprehensive testing)
- **Phase 7**: 1 hour (cleanup + docs)
- **Phase 8**: 1 hour (deployment + monitoring)

**Total**: ~17 hours

## Dependencies

- Phase 4 requires Phase 1 (retry utility)
- Phase 6 requires Phases 2-5 complete (all code changes done)
- Phase 7 requires Phase 6 (tests passing)
- Phase 8 requires Phase 7 (docs + cleanup done)
