# Cleanup Risk Register

**Generated**: 2025-10-09T17:00:00Z
**Analysis Mode**: Standard (minConfidenceToDelete: 0.92)

---

## Risk Categories

### 🟢 Low Risk (Confidence ≥0.95)

| Item | Risk | Mitigation |
|------|------|------------|
| `dist/` directory | None | Regenerable via `npm run build` |
| `coverage/` directory | None | Regenerable via `npm run test -- --coverage` |
| `tmp_pwa_prompt.tsx` | Minimal | Temporary file, appears abandoned |
| `AGENTS.md` | Minimal | No references found, git history available |
| `docs/hygiene-report.md` | Minimal | Old report, no references |
| `docs/review-findings.md` | Minimal | Old report, no references |
| `docs/training-load.md` | Minimal | No references, concept doc |

### 🟡 Medium Risk (Confidence 0.85-0.94)

| Item | Risk | Mitigation |
|------|------|------------|
| `rules.md` | Low-Medium | May contain project rules, verify content first |
| `docs/release-checklist.md` | Low-Medium | May be needed for releases, check with team |
| `FIREBASE_AUTH_SETUP.md` | Medium | Setup documentation, consider moving to docs/ |
| `src/logic/motivation.ts` | Medium | May have active imports, verify thoroughly |

### 🔴 High Risk (Confidence <0.85 or Protected)

| Item | Risk | Mitigation |
|------|------|------------|
| `CODEX.md` | High | Self-referencing, unclear purpose - DO NOT DELETE without review |
| `CLEANUP_REPORT.md` | Medium-High | May be referenced in documentation - REVIEW FIRST |
| `docs/CONTRIBUTING.md` | High | Duplicate of root file, merge content before deleting |
| `docs/branch-protection.md` | Critical | **DO NOT DELETE** - Referenced in CI workflow |

---

## Breaking Change Risks

### Risk 1: Missing Documentation
**Impact**: Medium
**Probability**: Low
**Description**: Deleting documentation files that users may be referencing externally
**Mitigation**:
- Check git history for recent access
- Search for external links in issues/PRs
- Keep git history intact

### Risk 2: Dynamic Imports
**Impact**: High
**Probability**: Very Low
**Description**: Files may be imported dynamically (import.meta.glob, require.context)
**Mitigation**:
- Search for dynamic import patterns
- Test build after cleanup
- Run full test suite

### Risk 3: CI/CD Dependencies
**Impact**: Critical
**Probability**: Low
**Description**: CI workflows may reference deleted files
**Mitigation**:
- Already identified: `docs/branch-protection.md` is protected
- Verify workflows pass after cleanup
- Keep CI documentation files

### Risk 4: Lost Historical Context
**Impact**: Low
**Probability**: Medium
**Description**: Setup documentation may be useful for future reference
**Mitigation**:
- Archive important docs to docs/archive/
- Git history preserves content
- Document cleanup in CHANGELOG.md

---

## Abort Criteria

**Immediately abort cleanup if:**

1. ❌ Build fails after cleanup (`npm run build`)
2. ❌ Tests fail after cleanup (`npm run test:all`)
3. ❌ TypeScript errors introduced (`npm run typecheck`)
4. ❌ Lint errors introduced (`npm run lint`)
5. ❌ CI workflow references deleted files
6. ❌ Import errors in application runtime

---

## Validation Checklist (Post-Cleanup)

Before committing cleanup changes, verify:

- [ ] `npm run build` succeeds
- [ ] `npm run test:all` passes
- [ ] `npm run typecheck` passes
- [ ] `npm run lint` passes
- [ ] Application starts without errors (`npm run dev`)
- [ ] No broken internal links in remaining docs
- [ ] CI workflows still pass
- [ ] No runtime import errors

---

## Rollback Procedure

If cleanup causes issues:

```bash
# Option 1: Revert branch
git checkout develop
git branch -D chore/cleanup/2025-10-09

# Option 2: Revert specific files
git checkout develop -- <file-path>

# Option 3: Restore from git history
git show HEAD^:<file-path> > <file-path>
```

---

## Recommendations

1. **Before applying:**
   - Review all items marked "REVIEW" manually
   - Read content of files with confidence <0.90
   - Check git log for recent activity

2. **During apply:**
   - Execute in phases (artifacts → temp files → docs)
   - Run validation after each phase
   - Create separate commits per phase

3. **After apply:**
   - Run full test suite including E2E tests
   - Verify application in browser
   - Update CHANGELOG.md
   - Create PR for review

4. **For aggressive mode:**
   - Be extra cautious with files confidence 0.85-0.92
   - Review `src/logic/motivation.*` files thoroughly
   - Consider impact on team's workflow

---

**Risk Assessment**: 🟢 **LOW to MEDIUM**

The cleanup is relatively safe as most deletions are:
- Build artifacts (100% safe, regenerable)
- Old reports and unreferenced docs (low risk)
- Temporary files (minimal risk)

Higher risk items have been flagged for manual review.
