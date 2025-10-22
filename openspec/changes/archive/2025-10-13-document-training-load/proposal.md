# Training Load & Recovery System Documentation

## Why

The Training Load & Recovery system is a **fully implemented feature** in the Winter Arc app, but currently lacks formal OpenSpec documentation. This system is critical for:

- Adaptive training recommendations based on recovery metrics
- Preventing overtraining through load monitoring
- Providing weekly training statistics and trends
- Integrating workouts, pushups, sleep, and recovery data

**Business Value:**
- Users get data-driven training insights
- Prevents burnout through recovery tracking
- Gamification via weekly badges (Low/Optimal/High)
- Central hub for all training-related metrics

**Current State:**
- ✅ **Fully implemented** in codebase
- ✅ Check-In modal with sleep/recovery/illness tracking
- ✅ Training Load calculation (v1 algorithm)
- ✅ Weekly statistics with badge system
- ✅ 7-day training load graph
- ❌ **No OpenSpec documentation**

## What Changes

### Core Changes
1. **Create Training Load Capability Spec**
   - Document Daily Check-In flow
   - Document Training Load calculation formula
   - Document Weekly Statistics aggregation
   - Document Training Load Graph visualization
   - Document UnifiedTrainingCard UI

2. **No Code Changes**
   - This is **pure documentation**
   - All features already exist in codebase
   - Focus on spec compliance and maintainability

### Non-Goals (Out of Scope)
- Code refactoring or optimization
- New features or functionality
- UI changes
- Algorithm improvements

## Impact

### Affected Specs
- **training-load** (NEW capability) - Document existing Training Load system

### Affected Code
**NONE** - This is a documentation-only change.

### Breaking Changes
**None** - No code changes.

### Migration
**None** - Documentation only.

## Questions / Clarifications

1. Should we document the Training Load algorithm in detail (formula, thresholds)?
   → **Answer: Yes, full transparency for maintainability**

2. Should we include future enhancement ideas (e.g., custom activity multipliers)?
   → **Answer: Yes, in "Future Enhancements" section**

3. Should we document the UnifiedTrainingCard component structure?
   → **Answer: Yes, with component hierarchy and data flow**
