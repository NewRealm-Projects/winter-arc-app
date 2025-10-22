# Fix Training Load Stability Issues

## Why

The Training Load & Recovery system suffers from multiple critical stability issues that impact user experience:

**Current Problems:**
1. **Race Conditions**: Optimistic UI updates conflict with Firestore real-time subscriptions, causing flickering and incorrect data display
2. **Incomplete Graph Updates**: Only the current day is subscribed to Firestore changes; the 7-day graph doesn't update when other days change
3. **Incorrect Calculations**: Pushup load calculation is inconsistent - pushups are ignored in base calculation then added as capped "adjustment"
4. **Performance Issues**: Weekly aggregation runs on every check-in save, causing unnecessary Firestore queries and slow saves
5. **Missing Error Recovery**: No retry logic for failed saves, poor error messages for users

**User Impact:**
- Users see wrong training load values after check-in
- Graph shows stale data (doesn't reflect recent changes)
- Check-in save is slow (2-3 seconds) due to heavy aggregation
- Frustrating UX: values flicker, updates don't appear immediately
- Lost data on network failures (no retry mechanism)

**Business Impact:**
- Feature is unreliable, users lose trust in the system
- Support requests increase ("My training load is wrong!")
- Firestore costs increase due to inefficient queries

## What Changes

### Core Fixes
1. **Remove Optimistic Updates** - Let Firestore subscription handle all UI updates (single source of truth)
2. **Week-Wide Subscription** - Subscribe to all 7 days of current week, not just one day
3. **Fix Pushup Calculation** - Use `computeBaseFromWorkouts` correctly with pushups included in base load
4. **Defer Weekly Aggregation** - Move aggregation to background process or trigger only when viewing leaderboard
5. **Add Retry Logic** - Exponential backoff for failed saves with user feedback
6. **Improve Error Handling** - Clear error messages, automatic recovery from transient failures

### Technical Changes
- **Modified**: `CheckInModal.tsx` - Remove optimistic updates, add loading state
- **Modified**: `useTrainingLoadSubscription.ts` - Subscribe to entire week (7 days)
- **Modified**: `trainingLoad.ts` - Fix pushup calculation logic
- **Modified**: `checkin.ts` - Remove weekly aggregation from save path
- **Added**: `useWeeklyTrainingLoadSubscription.ts` - New hook for week-wide subscription
- **Added**: Retry mechanism with exponential backoff

### Breaking Changes
**None** - All changes are internal implementation improvements, no API changes

## Impact

### Affected Specs
- **training-load** (MODIFIED) - Update requirements for subscription model, calculation correctness, error handling

### Affected Code
- `src/components/checkin/CheckInModal.tsx` (optimistic update removal)
- `src/hooks/useTrainingLoadSubscription.ts` (week-wide subscription)
- `src/services/trainingLoad.ts` (pushup calculation fix)
- `src/services/checkin.ts` (deferred aggregation)
- `src/store/useStore.ts` (simplified state updates)
- `src/components/TrainingLoadGraph.tsx` (may need loading state)

### Migration
**None required** - Existing data model unchanged, Firestore structure unchanged

## Success Criteria

1. ✅ Check-in save completes in <1 second (down from 2-3s)
2. ✅ Graph updates immediately after check-in (no manual refresh needed)
3. ✅ Training load values are consistent across all views
4. ✅ No flickering or incorrect intermediate values shown
5. ✅ Failed saves automatically retry (up to 3 attempts)
6. ✅ All existing unit tests pass + new tests for fixes
7. ✅ Firestore read operations reduced by ~60% (fewer weekly aggregation queries)
