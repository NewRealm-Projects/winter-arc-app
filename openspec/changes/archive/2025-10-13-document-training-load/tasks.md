# Implementation Tasks

## 1. Research & Analysis

- [x] 1.1 Analyze existing Training Load implementation
  - Review `src/components/UnifiedTrainingCard.tsx`
  - Review `src/components/checkin/CheckInModal.tsx`
  - Review `src/components/TrainingLoadGraph.tsx`
  - Review `src/hooks/useTrainingLoadWeek.ts`
  - Review `src/services/trainingLoad.ts` (calculation logic)
  - Review `src/services/checkin.ts` (save logic)

- [x] 1.2 Document data flow
  - Map Check-In → DailyCheckIn Firestore document
  - Map Calculation → DailyTrainingLoad Firestore document
  - Map Weekly Aggregation → useTrainingLoadWeek hook
  - Map UI updates → Zustand store

- [x] 1.3 Document algorithm details
  - Training Load v1 formula (corrected to match implementation)
  - Badge level thresholds (Low/Optimal/High)
  - Workout entry conversion (sports → load units)
  - Pushup load calculation (capped at 20% of session load)

## 2. Create Training Load Spec

- [x] 2.1 Write Requirements section
  - Requirement: Daily Check-In
  - Requirement: Training Load Calculation
  - Requirement: Weekly Training Statistics
  - Requirement: Training Load Graph
  - Requirement: Unified Training Card
  - Requirement: Data Model

- [x] 2.2 Write Scenarios for each requirement
  - Open check-in modal
  - Enter sleep quality (1-10 slider)
  - Enter recovery score (1-10 slider)
  - Mark illness status (toggle)
  - Save check-in (optimistic update)
  - Calculate training load (formula)
  - Store training load (Firestore)
  - Calculate weekly stats (7 days)
  - Determine badge level (thresholds)
  - Render training load graph (area chart)
  - Display card header (badge + check-in button)
  - Display current day stats (sleep/recovery)
  - Display sport status (icons + count)
  - Manage sports (modal)

- [x] 2.3 Add Technical Notes
  - Implementation files list
  - Data flow diagram
  - Dependencies (Zustand, Firestore, date-fns, recharts)
  - Training Load formula (v1 algorithm - corrected)
  - Badge level thresholds table
  - Integration notes (useCombinedDailyTracking)

## 3. Documentation Updates

- [x] 3.1 Update CLAUDE.md
  - Training Load already documented in CLAUDE.md
  - Check-In flow documented
  - Weekly Badge system documented

- [x] 3.2 Update project.md
  - Training Load business rules will be documented in spec
  - v1 algorithm documented in spec and design.md

- [x] 3.3 Add Design Notes (design.md)
  - Document why separate card (UnifiedTrainingCard)
  - Document calculation transparency (v1 versioning)
  - Document badge color scheme (Blue/Green/Red)

## 4. Validation

- [x] 4.1 Run OpenSpec validation
  - `npx openspec validate document-training-load --strict`
  - ✅ Validation passed

- [x] 4.2 Cross-reference with code
  - ✅ All scenarios match implementation
  - ✅ Data model matches Firestore structure
  - ✅ Formula corrected to match `trainingLoad.ts`

- [x] 4.3 Review with team
  - ✅ Algorithm documented correctly (v1 multiplicative approach)
  - ✅ User flows clear
  - ✅ Future enhancements noted (v2 ideas)

## Parallel Work Opportunities

All tasks in Phase 1 can run in parallel (read-only operations).

## Dependencies

- Phase 1 must complete before Phase 2 (need analysis to write spec)
- Phase 2 must complete before Phase 3 (need spec to update docs)
- Phase 3 must complete before Phase 4 (need docs to validate)
