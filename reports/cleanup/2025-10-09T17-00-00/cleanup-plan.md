# Cleanup Execution Plan

**Generated**: 2025-10-09T17:00:00Z
**Mode**: Dry-Run
**Config**: cleanup.config.json (minConfidenceToDelete: 0.92)

---

## Planned Operations

### Phase 1: Build Artifacts (Safe, High Priority)

**DELETE** `dist/` directory
- **Confidence**: 1.0
- **Size**: ~2.09 MB
- **Reason**: Build output, regenerated on next build
- **Risk**: None (regenerable)

**DELETE** `coverage/` directory
- **Confidence**: 1.0
- **Size**: ~0.64 MB
- **Reason**: Test coverage reports, regenerated on next test run
- **Risk**: None (regenerable)

---

### Phase 2: Temporary Files (High Confidence)

**DELETE** `tmp_pwa_prompt.tsx`
- **Confidence**: 0.98
- **Reason**: Temporary file with tmp_ prefix
- **Risk**: Low (appears to be abandoned code)

---

### Phase 3: Unreferenced Markdown (High Confidence ≥0.92)

**DELETE** `AGENTS.md`
- **Confidence**: 0.95
- **Size**: 4.3 KB
- **Reason**: No references found
- **Risk**: Low (may be documentation artifact)

**DELETE** `rules.md`
- **Confidence**: 0.92
- **Size**: 3.5 KB
- **Reason**: No references found
- **Risk**: Low (may be outdated rules)

**DELETE** `docs/hygiene-report.md`
- **Confidence**: 0.95
- **Reason**: No references found
- **Risk**: Low (appears to be old report)

**DELETE** `docs/review-findings.md`
- **Confidence**: 0.95
- **Reason**: No references found
- **Risk**: Low (appears to be old report)

**DELETE** `docs/release-checklist.md`
- **Confidence**: 0.92
- **Reason**: No references found
- **Risk**: Low (may be outdated checklist)

**DELETE** `docs/training-load.md`
- **Confidence**: 0.95
- **Reason**: No references found
- **Risk**: Low (appears to be concept doc)

---

### Phase 4: Review & Manual Decision Required

**REVIEW** `FIREBASE_AUTH_SETUP.md`
- **Confidence**: 0.85
- **Reason**: No references, but may be useful setup documentation
- **Action**: Consider archiving to docs/ or deleting if obsolete

**REVIEW** `CLEANUP_REPORT.md`
- **Confidence**: 0.50
- **Reason**: Only referenced in command context
- **Action**: Verify if still needed or replace with new reports

**REVIEW** `CODEX.md`
- **Confidence**: 0.60
- **Reason**: Self-referencing only
- **Action**: Verify purpose and usage

**REVIEW** `src/logic/motivation.ts` + `src/logic/motivation.test.ts`
- **Confidence**: 0.70
- **Reason**: May be archived/replaced logic
- **Action**: Verify if imports exist, check git history

**KEEP** `docs/branch-protection.md`
- **Confidence**: 0.40 (inverse)
- **Reason**: Referenced in CI workflow
- **Action**: Do not delete

**REVIEW** `docs/CONTRIBUTING.md`
- **Confidence**: 0.30 (inverse)
- **Reason**: Duplicate of root CONTRIBUTING.md
- **Action**: Merge or remove duplicate

---

## Execution Summary (if `/clean apply` is run)

### Safe to Delete (Confidence ≥0.92):
- 2 build artifact directories (~2.73 MB)
- 1 temporary file
- 6 unreferenced markdown files (~7.8 KB)

### Total: 9 items, ~2.74 MB

### Requires Review: 5 items

---

## Git Operations (if applied)

1. Create branch: `chore/cleanup/2025-10-09`
2. Commit 1: Remove build artifacts (dist/, coverage/)
3. Commit 2: Remove temporary files (tmp_pwa_prompt.tsx)
4. Commit 3: Remove unreferenced documentation
5. Optional: Create PR with summary

---

## Rollback Plan

```bash
# If cleanup was applied and needs to be reverted
git checkout develop
git branch -D chore/cleanup/2025-10-09
```

---

**Next Steps:**
- Review this plan carefully
- Check items marked as "REVIEW" manually
- Run `/clean apply` to execute
- Run `/clean aggressive` for stricter cleanup (confidence ≥0.85)
