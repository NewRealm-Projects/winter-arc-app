# Repository Cleanup Report

**Project**: Winter Arc Fitness Tracking PWA
**Date**: 2025-10-09
**Mode**: Dry-Run Analysis
**Analyzer**: Claude Code Smart Cleanup

---

## Executive Summary

Analyzed repository for unused files, dead code, and build artifacts. Found **18 items** totaling **~2.74 MB** that can be safely removed or require review.

### Quick Stats

| Category | Count | Size | Confidence |
|----------|-------|------|------------|
| Unreferenced Markdown | 11 | ~12 KB | Mixed (0.30-0.95) |
| Unreferenced Assets | 0 | 0 KB | N/A |
| Dead Code | 3 | ~1 KB | 0.70-0.98 |
| Build Artifacts | 2 dirs | ~2.72 MB | 1.0 |
| **Total** | **16+** | **~2.74 MB** | **Variable** |

---

## Detailed Findings

### 1. Build Artifacts (100% Safe to Delete)

**Recommendation**: ✅ DELETE

- **dist/** (~2.09 MB) - Build output, regenerated on next build
- **coverage/** (~0.64 MB) - Test coverage reports, regenerated on test run

**Impact**: None - these are regenerable artifacts
**Confidence**: 1.0

---

### 2. Temporary Files (Safe to Delete)

**Recommendation**: ✅ DELETE

- **tmp_pwa_prompt.tsx** - Temporary file with `tmp_` prefix, no imports found

**Impact**: Low - appears to be abandoned code
**Confidence**: 0.98

---

### 3. Unreferenced Markdown Files

#### High Confidence (≥0.92) - Safe to Delete

**Recommendation**: ✅ DELETE

- **AGENTS.md** (4.3 KB, confidence: 0.95)
- **rules.md** (3.5 KB, confidence: 0.92)
- **docs/hygiene-report.md** (confidence: 0.95)
- **docs/review-findings.md** (confidence: 0.95)
- **docs/release-checklist.md** (confidence: 0.92)
- **docs/training-load.md** (confidence: 0.95)

**Impact**: Low - no references found in codebase
**Total**: 6 files, ~7.8 KB

#### Medium Confidence (0.70-0.89) - Requires Review

**Recommendation**: ⚠️ REVIEW

- **FIREBASE_AUTH_SETUP.md** (4.1 KB, confidence: 0.85)
  - May be useful setup documentation, consider moving to docs/

#### Low Confidence (<0.70) - Manual Decision Required

**Recommendation**: 🔍 MANUAL REVIEW

- **CODEX.md** (4.5 KB, confidence: 0.60)
  - Self-referencing only, unclear purpose

- **CLEANUP_REPORT.md** (394 B, confidence: 0.50)
  - Referenced in command context, may be needed

#### Protected - Keep

**Recommendation**: ✅ KEEP

- **docs/branch-protection.md** - Referenced in CI workflow (`.github/workflows/enforce-gitflow.yml`)

#### Duplicate - Requires Merge

**Recommendation**: 🔄 MERGE OR REMOVE

- **docs/CONTRIBUTING.md** - Duplicate of root `CONTRIBUTING.md`
  - Verify content differences before deleting

---

### 4. Dead Code

**Recommendation**: ⚠️ VERIFY BEFORE DELETE

- **src/logic/motivation.ts** (confidence: 0.70)
- **src/logic/motivation.test.ts** (confidence: 0.70)

**Impact**: Medium - may have been archived/replaced
**Action**: Verify no active imports exist

---

### 5. Images & Assets

**Analysis**: ✅ ALL ASSETS IN USE

All images in `public/` are properly referenced:
- ✅ `apple-touch-icon.png` - Referenced in `index.html`
- ✅ `icon-192.png`, `icon-512.png` - Referenced in `vite.config.ts` (PWA manifest)
- ✅ `bg/dark/winter_arc_bg_dark.svg` - Referenced in `src/styles/theme.css`
- ✅ `bg/light/winter_arc_bg_light.svg` - Referenced in `src/styles/theme.css`
- ⚠️ `vite.svg` - Vite default asset, referenced in `index.html` (consider replacing)

---

## Recommendations by Priority

### Priority 1: Immediate (No Risk)

```bash
# Safe to delete now
rm -rf dist/
rm -rf coverage/
rm tmp_pwa_prompt.tsx
```

**Savings**: ~2.73 MB

---

### Priority 2: High Confidence Documentation

After manual verification:

```bash
# Review content first, then delete if confirmed
rm AGENTS.md rules.md
rm docs/hygiene-report.md docs/review-findings.md
rm docs/release-checklist.md docs/training-load.md
```

**Savings**: ~7.8 KB

---

### Priority 3: Manual Review Required

1. **FIREBASE_AUTH_SETUP.md**: Read content → Archive to `docs/setup/` or delete
2. **CODEX.md**: Clarify purpose with team
3. **CLEANUP_REPORT.md**: Determine if still needed (likely superseded by this report)
4. **src/logic/motivation.***: Check git history and verify no imports
5. **docs/CONTRIBUTING.md**: Compare with root version, merge differences, delete duplicate

---

## Cleanup Execution Plan

To apply cleanup automatically:

```bash
# Run cleanup command
/clean apply
```

For more aggressive cleanup (confidence ≥0.85):

```bash
# Use stricter thresholds
/clean aggressive
```

To rollback if needed:

```bash
# Revert cleanup changes
/clean reset
```

---

## Risk Assessment

**Overall Risk**: 🟢 **LOW to MEDIUM**

- **Low Risk**: Build artifacts, temporary files, high-confidence unreferenced docs
- **Medium Risk**: Dead code in `src/logic/`, medium-confidence docs
- **High Risk**: None identified

**Breaking Changes**: None expected
**Testing Required**: Full test suite after cleanup

---

## Validation Checklist

Before merging cleanup changes:

- [ ] Build succeeds (`npm run build`)
- [ ] Tests pass (`npm run test:all`)
- [ ] TypeScript compiles (`npm run typecheck`)
- [ ] Linter passes (`npm run lint`)
- [ ] App runs without errors (`npm run dev`)
- [ ] CI workflows pass
- [ ] No broken doc links

---

## Generated Reports

Detailed analysis available in:

- **cleanup-findings.json** - Machine-readable findings with confidence scores
- **cleanup-plan.md** - Step-by-step execution plan
- **risk-register.md** - Comprehensive risk analysis and mitigation strategies

---

## Next Steps

1. **Review** files marked for manual review
2. **Run** `/clean apply` to execute cleanup
3. **Validate** with test suite and build
4. **Commit** changes with descriptive messages
5. **Update** CHANGELOG.md with cleanup summary

---

**Generated by**: Claude Code Smart Cleanup System
**Configuration**: `cleanup.config.json`
**Execution**: Dry-run only (no files modified)
