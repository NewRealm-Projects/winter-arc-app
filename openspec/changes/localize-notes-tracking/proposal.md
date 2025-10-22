# Localize Notes Tracking to Eliminate AI Dependency

## Why

The current Notes Page uses Google Gemini API for parsing free-form text input, which has proven prohibitively expensive ($150-1500/month for active users) and creates reliability issues:

- **Cost**: Each note costs $0.0001-0.001 to process
- **Latency**: 2-8 second processing time per note
- **Reliability**: ~5% failure rate due to timeouts and network issues
- **Offline**: Complete dependency on network connectivity
- **Privacy**: User data sent to external AI service

The AI parsing was originally intended to provide a seamless "natural language" experience, but the cost-to-value ratio is unsustainable for a fitness tracking app.

## What Changes

Replace free-form AI-powered input with **structured logging interfaces** that work entirely offline with local code evaluation:

### 1. Drink Tracking → Direct Hydration Integration
- Remove drink tracking from Notes Page
- Quick-log modal reusing existing hydration preset system
- Direct updates to `DailyTracking.water` (bypasses SmartNote storage)
- Zero latency, works offline

### 2. Food Tracking → Embedded Nutrition Database
- **Embedded JSON database** (~200 common foods, ~50KB gzipped)
  - Per-100g nutrition data sourced from USDA FoodData Central
  - Fuzzy search by name + category filter
  - Common serving sizes (e.g., "1 medium banana = 120g")
- **Manual macro entry** for foods not in database
- Auto-calculate nutrition from portion size
- Update `DailyTracking.calories`, `protein`, `carbsG`, `fatG`

### 3. Other Activities → Structured Forms
- **Pushups**: Number input with increment buttons
- **Workouts**: Dropdown (sport type) + duration + intensity + optional notes
- **Weight**: Number input + optional body fat % + auto-calculated BMI

### 4. Architecture Simplification
- **Remove**: `src/services/gemini.ts` (entire file)
- **Remove**: `@google/generative-ai` npm dependency
- **Refactor**: `src/features/notes/pipeline.ts` - direct event creation, no AI merge logic
- **Create**: Structured logging components (DrinkLogModal, FoodLogModal, etc.)
- **Create**: `src/data/foodDatabase.ts` with embedded nutrition data
- **Create**: `src/utils/foodSearch.ts` for fuzzy search

### 5. Data Preservation
- Keep existing `SmartNote` records intact (read-only archive view)
- New structured logs create events directly without SmartNote wrapper
- History view shows both old notes and new structured events

## Impact

### Affected Specs
- `openspec/specs/notes/spec.md` - **MAJOR REWRITE**: Replace AI architecture with structured logging
- `openspec/specs/dashboard/spec.md` - **MINOR UPDATE**: Add reference to structured food logging

### Affected Code
**Remove:**
- `src/services/gemini.ts` (entire file)

**Major Refactor:**
- `src/features/notes/pipeline.ts` - Remove `summarizeAndValidate()`, `mergeEvents()`, LLM event normalization
- `src/pages/NotesPage.tsx` - Replace free-form input with QuickLogPanel

**New Files:**
- `src/components/notes/QuickLogPanel.tsx` - Main logging interface with 4 quick actions
- `src/components/notes/DrinkLogModal.tsx` - Drink logging with presets
- `src/components/notes/FoodLogModal.tsx` - Food logging with database search + manual entry
- `src/components/notes/WorkoutLogModal.tsx` - Workout logging form
- `src/components/notes/WeightLogModal.tsx` - Weight logging form
- `src/data/foodDatabase.ts` - Embedded nutrition database (~200 items)
- `src/utils/foodSearch.ts` - Fuzzy search implementation
- `src/utils/nutritionCalculator.ts` - Portion-based calculation helpers

**Minor Updates:**
- `src/i18n/translations.ts` - Add keys for new modals and food database
- `src/types/events.ts` - Add `source: 'manual'` for structured entries
- `package.json` - Remove `@google/generative-ai`

### Database Schema
No schema changes needed - all fields already exist in `DailyTracking` interface.

### User Experience
- **Before**: Type free-form note → Wait 2-8s → Hope AI parsed correctly
- **After**: Select quick action → Fill structured form → Instant update

### Cost Impact
- **Current**: $150-1500/month (variable, unpredictable)
- **New**: $0/month (100% local processing)

### Performance Impact
- **Latency**: 2-8s → <100ms (20-80x faster)
- **Offline support**: 0% → 100%
- **Error rate**: ~5% → <0.1%
- **Bundle size**: +50KB gzipped (embedded food database)

## Rollout

Since this is a local deployment with 3 users:

1. **Implement structured logging components** (Tasks 1-10)
2. **Remove AI dependencies** (Tasks 11-13)
3. **Update Notes Page UI** (Tasks 14-15)
4. **Test with all 3 users** - gather feedback, iterate
5. **Expand food database** based on user requests (ongoing)

Existing SmartNotes remain accessible in read-only archive view for historical reference.
