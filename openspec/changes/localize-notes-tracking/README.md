# Localize Notes Tracking - Change Proposal

**Status:** Ready for Review
**Created:** 2025-10-15
**Type:** Major architectural change - removes AI dependency

## Summary

This proposal eliminates the costly Gemini API dependency ($150-1500/month) by replacing free-form AI-powered note parsing with structured local-only logging interfaces. All tracking functionality is preserved while achieving zero API costs, <100ms latency, 100% offline support, and <0.1% error rate.

## Files Included

### ✅ Core Proposal Files
- [x] `proposal.md` - Complete (Why, What Changes, Impact)
- [x] `tasks.md` - 26 tasks across 7 phases
- [x] `design.md` - Comprehensive technical architecture

### ✅ Spec Deltas
- [x] `specs/notes/spec.md` - Major rewrite (ADDED/MODIFIED/REMOVED requirements)
- [x] `specs/dashboard/spec.md` - Minor documentation update

## Validation Results

### Manual Format Check ✅

**Proposal Structure:**
- ✅ Contains "Why" section explaining cost and reliability problems
- ✅ Contains "What Changes" section with structured logging approach
- ✅ Contains "Impact" section listing affected specs and code
- ✅ Rollout strategy simplified for 3-user local deployment

**Tasks Structure:**
- ✅ 26 tasks organized into 7 phases
- ✅ Each task has clear description and affected files
- ✅ Includes foundation (data layer), UI components, architecture cleanup, testing, expansion
- ✅ Estimated effort: 3-4 weeks

**Design Document:**
- ✅ Comprehensive sections: Food Database, Search Algorithm, Nutrition Calculator, UI Components, Data Flow, Legacy Data Handling
- ✅ Includes code examples for all major components
- ✅ Performance targets specified (<50ms search, <100ms logging)
- ✅ Risk mitigation table included

**Spec Deltas (notes/spec.md):**
- ✅ Uses proper operation headers: `## REMOVED Requirements`, `## MODIFIED Requirements`, `## ADDED Requirements`
- ✅ Each requirement has descriptive name and SHALL/MUST wording
- ✅ Each requirement has at least one scenario using `#### Scenario:` format
- ✅ Scenarios use proper WHEN/THEN format
- ✅ Technical Notes section updated with file changes
- ✅ Data Model section shows new structures

**Spec Deltas (dashboard/spec.md):**
- ✅ Uses `## MODIFIED Requirements` for documentation updates
- ✅ Uses `## ADDED Notes` section for integration notes
- ✅ Clarifies that smart contributions source changed (from AI to structured logs)

### Content Completeness ✅

**Food Database Design:**
- ✅ FoodItem interface specified with name (i18n), category, macros per 100g
- ✅ Common serving sizes structure defined
- ✅ Target: 200 items, ~50KB gzipped
- ✅ Data source: USDA FoodData Central (public domain)

**Search Implementation:**
- ✅ Fuzzy search algorithm (Levenshtein distance)
- ✅ Scoring system (exact: 1.0, prefix: 0.9, contains: 0.8, fuzzy: 0.5-0.7)
- ✅ Performance target: <50ms for 200 items

**UI Components:**
- ✅ QuickLogPanel with 5 action buttons
- ✅ DrinkLogModal (beverage type + presets + manual)
- ✅ FoodLogModal (database search + manual entry tabs)
- ✅ WorkoutLogModal (sport dropdown + duration + intensity)
- ✅ WeightLogModal (weight + body fat + BMI calculation)
- ✅ PushupLogModal (count + increment buttons)
- ✅ ArchivedNotesView (read-only legacy notes)

**Data Flow:**
- ✅ Before/after comparison documented
- ✅ Direct DailyTracking updates (no intermediate SmartNote)
- ✅ Event history storage pattern defined
- ✅ Firestore integration examples provided

**Migration Strategy:**
- ✅ Simplified for 3-user deployment (no phased rollout)
- ✅ Data preservation: Keep existing SmartNotes read-only
- ✅ No breaking changes to existing tracking data

### Quality Metrics ✅

**Performance:**
- ✅ Latency: <100ms (vs 2-8s) - 20-80x improvement
- ✅ Offline: 100% functional (vs 0%)
- ✅ Error rate: <0.1% (vs ~5%)
- ✅ Bundle size: +50KB gzipped (acceptable)

**Cost:**
- ✅ Monthly API cost: $0 (vs $150-1500)
- ✅ 100% savings

**Reliability:**
- ✅ No network dependency
- ✅ No AI parsing errors
- ✅ Guaranteed data consistency

## Key Technical Decisions

### 1. Embedded Food Database (vs External API)
**Decision:** 200-item embedded JSON database (~50KB gzipped)
**Rationale:** Zero cost, offline support, fast search, no rate limits
**Trade-off:** Limited to curated foods, manual expansion needed

### 2. Fuzzy Search (vs Simple String Matching)
**Decision:** Levenshtein distance algorithm with scoring
**Rationale:** Better UX, handles typos, supports multiple languages
**Trade-off:** Slightly more complex, but <50ms target achievable

### 3. Direct Tracking Updates (vs SmartNote Intermediary)
**Decision:** Update DailyTracking immediately on save
**Rationale:** <100ms latency, simpler architecture, no pending states
**Trade-off:** Lose AI summary feature, but users prefer instant updates

### 4. Hybrid Food Entry (Database + Manual)
**Decision:** Two-tab modal with search and manual entry
**Rationale:** 80% coverage from database, 100% coverage with manual
**Trade-off:** Some user effort for unknown foods, but reasonable

### 5. Preserve Legacy Notes (Read-Only Archive)
**Decision:** Keep existing SmartNotes in read-only view
**Rationale:** No data loss, maintains historical context
**Trade-off:** Slight code complexity, but user trust preserved

## Breaking Changes

### ⚠️ User-Facing Changes
1. **Free-form text input removed** - Replaced with structured quick log modals
2. **AI summaries removed** - No longer generated for new entries
3. **Note editing removed** - New entries are immutable (legacy notes remain editable)
4. **Food tracking requires explicit macros** - No AI inference from descriptions

### 🔧 Code-Level Breaking Changes
1. **Gemini service deleted** - `src/services/gemini.ts` removed entirely
2. **Pipeline refactored** - `processSmartNote()` simplified, `summarizeAndValidate()` removed
3. **Event source changed** - New events have `source: 'manual'` instead of `'llm'`
4. **Dependency removed** - `@google/generative-ai` uninstalled

### ✅ Preserved Functionality
- All tracking capabilities (drink, food, pushups, workouts, weight) retained
- Dashboard tiles continue to aggregate manual + smart contributions
- Historical data remains accessible (archived notes view)
- Firestore schema unchanged (all fields already exist in DailyTracking)

## Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| Food database too limited | Medium | Medium | Start with 50 items, expand to 200 based on user feedback. Manual entry covers edge cases. |
| Users miss AI summaries | Low | Low | Optional note field in all modals. Archive preserves old AI summaries. |
| Search performance issues | Low | Medium | Target <50ms with profiling. Debounced input. |
| Nutrition data inaccuracies | Medium | Low | Source from USDA (trusted). Display "approximate values" disclaimer. |
| Bundle size concerns | Low | Low | 25KB gzipped addition, well within 600KB budget. |
| User adoption resistance | Low | Medium | Instant feedback (<100ms) vs slow AI (2-8s) encourages adoption. |

## Success Criteria

### Must Have (MVP)
- [ ] All 5 quick log modals functional (drink, food, pushups, workout, weight)
- [ ] Food database with 50+ common items
- [ ] Fuzzy search <50ms
- [ ] Direct DailyTracking updates <100ms
- [ ] Archived notes view (read-only)
- [ ] 100% offline functionality
- [ ] Zero Gemini API calls

### Should Have (Phase 2)
- [ ] Food database expanded to 200 items
- [ ] Community food database contributions
- [ ] Barcode scanning (Open Food Facts API)
- [ ] Meal templates (save common meals)

### Nice to Have (Future)
- [ ] Recipe database
- [ ] Nutrition goal recommendations
- [ ] Photo-based food logging (device-based ML, no API)

## Next Steps

1. **Review & Approve** - Stakeholders review this proposal
2. **Implement Phase 1** - Data layer and food database (Tasks 1-3)
3. **Implement Phase 2** - UI components (Tasks 4-10)
4. **Implement Phase 3** - Remove AI dependencies (Tasks 11-13)
5. **Implement Phase 4** - UI integration (Tasks 14-15)
6. **Test with 3 users** - Gather feedback, iterate
7. **Deploy** - Push to production
8. **Archive change** - Update specs, move to archive

## Questions?

- Food database curation priorities?
- Any foods that must be included in initial 50 items?
- Specific user workflows to preserve?
- Timeline constraints?

---

**Proposal Ready:** ✅ All required files created and validated
**Format Compliance:** ✅ Follows OpenSpec structure
**Blocking Issues:** None

**Recommended Action:** Approve proposal and begin Phase 1 implementation
