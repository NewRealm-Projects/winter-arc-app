# Design: Training Load Stability Fixes

## Context

The Training Load system has multiple stability issues causing poor UX:
- Race conditions between optimistic updates and Firestore subscriptions
- Graph shows stale data (only 1 day subscribed out of 7)
- Slow check-in saves (2-3s) due to weekly aggregation queries
- Pushup calculation is inconsistent and confusing

**This refactor focuses on correctness and performance without changing the user-facing API.**

## Goals

1. **Eliminate Race Conditions** - Single source of truth (Firestore subscription)
2. **Improve Responsiveness** - All 7 days update live in graph
3. **Fix Calculations** - Correct pushup load computation
4. **Reduce Latency** - Check-in saves in <1s (remove heavy aggregation)
5. **Better Reliability** - Retry failed saves, clear error messages

## Non-Goals

- Changing the UI/UX design
- Migrating data model or Firestore structure
- Improving the v1 algorithm accuracy (that's a separate change)
- Adding new features

## Design Decisions

### Decision 1: Remove Optimistic Updates

**Problem:**
```typescript
// CheckInModal.tsx:141-142
setCheckInForDate(dateKey, optimisticCheckIn);
setTrainingLoadForDate(dateKey, optimisticTrainingLoad);

// Race condition:
// 1. Optimistic update sets value A
// 2. Firestore save starts
// 3. Subscription fires with old value B (from before save)
// 4. UI shows B briefly, then A again after save completes
// Result: Flickering, confusing UX
```

**Choice:** Remove optimistic updates entirely, rely on Firestore subscription

**Rationale:**
- **Simpler**: Single source of truth (Firestore), no state synchronization
- **More Reliable**: No race conditions, no rollback logic needed
- **Trade-off**: Slightly slower perceived response (wait for Firestore roundtrip ~200-500ms)
- **Acceptable**: 500ms delay is better than flickering/incorrect values

**Implementation:**
```typescript
// Before (with optimistic update)
setCheckInForDate(dateKey, optimisticCheckIn);
await saveDailyCheckInAndRecalc(dateKey, data);

// After (subscription-only)
setIsSaving(true);
await saveDailyCheckInAndRecalc(dateKey, data);
// UI updates automatically via useTrainingLoadSubscription
setIsSaving(false);
```

**Alternatives Considered:**
- Keep optimistic updates, add deduplication logic → Rejected: Too complex, hard to debug
- Use Firestore local cache → Rejected: Requires offline persistence config changes
- Debounce subscription updates → Rejected: Doesn't solve root cause

### Decision 2: Week-Wide Subscription (7 Days)

**Problem:**
```typescript
// useTrainingLoadSubscription.ts only subscribes to ONE day
const ref = doc(db, 'users', userId, 'trainingLoad', dateKey);

// Graph shows 7 days, but only 1 day is live
// Other days show stale data until manual refresh
```

**Choice:** Create `useWeeklyTrainingLoadSubscription.ts` that subscribes to all 7 days of current week

**Rationale:**
- **Better UX**: Graph updates immediately when any day changes
- **Minimal Cost**: 7 listeners instead of 1 (still within Firestore limits)
- **Consistent**: All days show real-time data

**Implementation:**
```typescript
// New hook: useWeeklyTrainingLoadSubscription.ts
export function useWeeklyTrainingLoadSubscription() {
  const weekStart = getMondayOfWeek(selectedDate);
  const unsubscribes = [];

  for (let i = 0; i < 7; i++) {
    const date = addDays(weekStart, i);
    const dateKey = format(date, 'yyyy-MM-dd');
    const ref = doc(db, 'users', userId, 'trainingLoad', dateKey);

    const unsub = onSnapshot(ref, (snapshot) => {
      if (snapshot.exists()) {
        setTrainingLoadForDate(dateKey, snapshot.data());
      } else {
        setTrainingLoadForDate(dateKey, null);
      }
    });

    unsubscribes.push(unsub);
  }

  return () => unsubscribes.forEach(fn => fn());
}
```

**Alternatives Considered:**
- Query-based subscription (`where('date', 'in', [7 days])`) → Rejected: Firestore doesn't support 'in' with >10 items
- Collection group query → Rejected: Would require index, more complex
- Polling with setInterval → Rejected: Less efficient, not real-time

### Decision 3: Fix Pushup Calculation

**Problem:**
```typescript
// trainingLoad.ts:64 - Pushups are ignored!
const sessionLoad = computeBaseFromWorkouts(params.workouts, 0); // pushupsReps: 0

// Then added as "adjustment" with 20% cap:
const pushupAdj = Math.min((params.pushupsReps / 100) * sessionLoad, 0.2 * sessionLoad);

// Result: Pushups contribute much less than intended
```

**Choice:** Use `computeBaseFromWorkouts` correctly with pushups included

**Rationale:**
- **Correct Formula**: Pushups should be part of base load, not an adjustment
- **Consistent**: Matches original design intent (see computeBaseFromWorkouts implementation)
- **Fair**: High pushup counts now properly reflected in load

**Implementation:**
```typescript
// Before (incorrect)
const sessionLoad = computeBaseFromWorkouts(params.workouts, 0);
const pushupAdj = Math.min((params.pushupsReps / 100) * sessionLoad, 0.2 * sessionLoad);
const load = (sessionLoad + pushupAdj) * wellnessMod;

// After (correct)
const baseLoad = computeBaseFromWorkouts(params.workouts, params.pushupsReps);
const load = baseLoad * wellnessMod;
```

**Breaking Change?**
- **Yes**: Training load values will change for users with pushup data
- **Acceptable**: Values will be MORE accurate, not less
- **Migration**: No data migration needed, values recalculate on next check-in

**Alternatives Considered:**
- Keep current formula, document as "intended" → Rejected: Formula is objectively wrong
- Add v2 algorithm → Rejected: Overkill, this is a bug fix not a redesign
- Grandfather old data → Rejected: Complexity not worth it, values auto-correct

### Decision 4: Defer Weekly Aggregation

**Problem:**
```typescript
// checkin.ts:180-229 - Heavy aggregation on every save
const weekDays = await getDayDocumentsForWeek(userId, weekStart, weekEnd);
const checkInsSnapshot = await getDocs(checkInsQuery);
// ... lots of processing ...
await setDoc(weekRef, { streakDays, totalPctAvg, updatedAt }, { merge: true });

// Result: Check-in save takes 2-3 seconds
```

**Choice:** Remove weekly aggregation from `saveDailyCheckInAndRecalc`, move to on-demand calculation

**Rationale:**
- **Faster Saves**: Check-in completes in <1s (only writes 2 docs, not 10+)
- **On-Demand**: Weekly stats calculated by `useTrainingLoadWeek` hook (client-side)
- **Cheaper**: Reduces Firestore reads by ~60% (no weekly queries on every save)

**Implementation:**
```typescript
// Before: saveDailyCheckInAndRecalc does everything
await setDoc(checkinRef, checkinData);
await setDoc(trainingLoadRef, trainingLoadData);
await setDoc(trackingRef, trackingData); // <-- Remove this
const weekDays = await getDayDocumentsForWeek(...); // <-- Remove this
// ... heavy aggregation ...

// After: Only save check-in and training load
await setDoc(checkinRef, checkinData);
await setDoc(trainingLoadRef, trainingLoadData);
// Weekly stats calculated by useTrainingLoadWeek hook
```

**Trade-off:**
- **Lose**: Weekly stats in Firestore (currently unused)
- **Gain**: 2x faster saves, 60% fewer reads

**Alternatives Considered:**
- Background Cloud Function → Rejected: Adds complexity, cold start latency
- Debounced aggregation (batch updates) → Rejected: Doesn't solve latency problem
- Keep aggregation, optimize queries → Rejected: Still too slow (~1.5s)

### Decision 5: Add Retry Logic

**Problem:**
```typescript
// CheckInModal.tsx:144-166 - No retry on transient failures
try {
  await saveDailyCheckInAndRecalc(dateKey, data);
} catch {
  // Just show error, no retry
  showToast({ message: t('checkIn.toastError'), type: 'error' });
}
```

**Choice:** Add exponential backoff retry (max 3 attempts)

**Rationale:**
- **Resilient**: Network blips don't lose user data
- **User-Friendly**: Auto-retry is invisible for transient errors
- **Standard Practice**: Industry standard for API calls

**Implementation:**
```typescript
async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  maxRetries = 3,
  baseDelay = 1000
): Promise<T> {
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      if (attempt === maxRetries - 1) throw error;

      // Exponential backoff: 1s, 2s, 4s
      const delay = baseDelay * Math.pow(2, attempt);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  throw new Error('Max retries exceeded');
}

// Usage
await retryWithBackoff(() => saveDailyCheckInAndRecalc(dateKey, data));
```

**Alternatives Considered:**
- No retry → Rejected: Poor UX for users on spotty networks
- Infinite retry → Rejected: Could hang indefinitely
- Linear backoff → Rejected: Less efficient than exponential

## Data Flow (After Fix)

```
1. User adjusts sliders in CheckInModal
   ↓
2. Live preview updates (client-side computation)
   ↓
3. User clicks "Save"
   ↓
4. setIsSaving(true) → Show loading spinner
   ↓
5. saveDailyCheckInAndRecalc (with retry logic)
   ↓
6. Write DailyCheckIn to Firestore
   ↓
7. Write DailyTrainingLoad to Firestore
   ↓
8. Firestore subscription fires (useWeeklyTrainingLoadSubscription)
   ↓
9. setTrainingLoadForDate updates Zustand store
   ↓
10. TrainingLoadGraph re-renders with new data
    ↓
11. setIsSaving(false) → Hide loading spinner
    ↓
12. Show success toast, close modal
```

**Key Differences from Before:**
- ❌ No optimistic update (step removed)
- ❌ No weekly aggregation (step removed)
- ✅ Retry logic added (3 attempts with backoff)
- ✅ Week-wide subscription (all 7 days update)

## Risks & Mitigation

### Risk 1: Slightly Slower Perceived Response

**Risk:** Users may notice ~300ms delay before UI updates (waiting for Firestore roundtrip)

**Mitigation:**
- Show loading spinner immediately on save
- Disable "Save" button to prevent double-clicks
- Keep live preview active (user sees expected value before save)
- Add subtle animation during save

**Acceptable:** 300ms delay is imperceptible for most users, much better than flickering

### Risk 2: Increased Firestore Listener Count

**Risk:** 7 listeners per user (instead of 1) might hit Firestore limits

**Mitigation:**
- Firestore allows 1 million concurrent listeners (plenty of headroom)
- Only active users have listeners (listeners close when user leaves page)
- Worst case: 10,000 active users × 7 listeners = 70k listeners (well within limit)

**Monitoring:** Track listener count in Firestore console

### Risk 3: Changed Training Load Values

**Risk:** Users with pushup data will see different load values after fix

**Mitigation:**
- Values will be MORE accurate (not less)
- Add changelog entry explaining fix
- No data loss (historical data unchanged, just recalculated on next check-in)
- Users will see "correct" values going forward

**Communication:** Mention in release notes as "bug fix for pushup load calculation"

## Migration Plan

**No data migration needed** - All changes are code-only.

**Rollout:**
1. Deploy fix to staging environment
2. Run E2E tests (check-in flow, graph updates)
3. Monitor Sentry for errors
4. Deploy to production
5. Monitor performance metrics (check-in latency, Firestore reads)

**Rollback Plan:**
- If issues detected, revert commit (no data migration to undo)
- All code changes are backward-compatible

## Open Questions

1. **Q:** Should we keep the weekly aggregation code for future use (e.g., leaderboard)?
   **A:** No, remove it. Leaderboard can calculate on-demand or use a separate Cloud Function.

2. **Q:** Should we show a "Retrying..." message to users during retry attempts?
   **A:** No, keep it transparent. Only show error if all 3 attempts fail.

3. **Q:** Should we add Sentry tracking for retry attempts?
   **A:** Yes, track as breadcrumb (not error) to monitor network stability.

## Success Metrics

- **Latency**: Check-in save <1s (P95) down from 2-3s
- **Errors**: <0.1% failed saves (after 3 retries)
- **Firestore Reads**: Reduced by ~60% (fewer weekly aggregation queries)
- **User Satisfaction**: No support tickets about "wrong values" or "slow saves"

## References

- Current implementation: `src/services/checkin.ts:72-232`
- Pushup calculation bug: `src/services/trainingLoad.ts:61-98`
- Subscription issue: `src/hooks/useTrainingLoadSubscription.ts:14-52`
- Related issue: Race conditions in optimistic updates
