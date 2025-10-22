# Proposal: Establish Repository Hygiene

## Summary
Establish and enforce repository organization standards to prevent accumulation of unused files, redundant documentation, and build artifacts. This change introduces cleanup guidelines, automated checks, and clear file organization policies to maintain a clean, maintainable codebase.

## Problem Statement
The repository currently suffers from:
- **Duplicate test structures**: Multiple test directories (`test/`, `tests/`, `e2e/tests/`) with overlapping purposes
- **Build artifacts in version control**: `dist/`, `stats.html`, `playwright-report/`, `test-results/` should be gitignored
- **Unused/outdated directories**: `.expo/`, `apps/winter_arc_flutter`, `ops/`, `preview/` with unclear purpose or obsolete content
- **Documentation clutter**: Redundant docs between `docs/` and `.github/`, outdated files like `CODEX.md`, `SETUP_COMPLETE.md`, `.release-notes-v0.1.2.md`
- **Root directory clutter**: Miscellaneous files (`_ul`, `winter_arc_glass_mockup.png`, `cors.json`, `nginx.conf`) without clear organization

This leads to:
- Confusion for new developers about which files/folders to use
- Increased repository size and slower clones
- Maintenance burden and technical debt
- Difficulty finding relevant documentation

## Goals
1. **Immediate cleanup**: Remove/reorganize unused files and standardize directory structure
2. **Establish guidelines**: Document clear file organization policies in `project.md`
3. **Automate enforcement**: Add CI checks to prevent future clutter (via existing `scripts/cleanup-repo.mjs`)
4. **Maintain hygiene**: Create process for regular maintenance reviews

## Scope
This change affects:
- **Project conventions** (new "Repository Organization" section in `openspec/project.md`)
- **CI/CD workflows** (add cleanup validation to GitHub Actions)
- **Developer workflow** (update git hooks, pre-commit checks)
- **Documentation** (consolidate and reorganize docs)

## Out of Scope
- Code refactoring or feature changes
- Performance optimizations
- Third-party dependency updates
- Security improvements (handled separately)

## Dependencies
- Existing cleanup script (`scripts/cleanup-repo.mjs`) will be enhanced
- Existing `.gitignore` will be updated
- Git hooks (Husky) will include new checks

## Risks & Mitigations
| Risk | Impact | Mitigation |
|------|--------|------------|
| Accidental deletion of used files | High | Dry-run mode, manual review, backup branch |
| Breaking CI/CD pipelines | Medium | Thorough testing of all scripts, gradual rollout |
| Developer friction from strict rules | Low | Clear documentation, helpful error messages |
| Merge conflicts during cleanup | Medium | Coordinate with active PRs, communicate in team |

## Success Metrics
- ✅ Zero build artifacts in version control
- ✅ Single, consistent test directory structure
- ✅ All documentation accessible and non-redundant
- ✅ CI check passes on all PRs
- ✅ Repository size reduced by >10%
- ✅ Zero "unused file" warnings in `npm run scan:knip`

## Alternatives Considered
1. **Manual cleanup only**: Rejected - doesn't prevent future clutter
2. **Strict pre-commit hooks**: Rejected - too disruptive for developers
3. **Separate cleanup repository**: Rejected - unnecessary complexity

## Timeline
- **Phase 1 (Immediate)**: Cleanup and reorganization (1-2 days)
- **Phase 2 (Short-term)**: Guidelines and documentation (1 day)
- **Phase 3 (Ongoing)**: CI automation and enforcement (ongoing)
