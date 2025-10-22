# Tasks: Establish Repository Hygiene

## Phase 1: Cleanup (Immediate)

### 1.1 Standardize Test Directory Structure
- [ ] Consolidate E2E tests into single directory (`e2e/` or `tests/e2e/`)
- [ ] Move MSW setup from `test/` to `src/test/` or `tests/setup/`
- [ ] Remove duplicate test directories
- [ ] Update all test import paths in source files
- [ ] Update `vitest.config.ts` and `e2e/playwright.config.ts` paths
- [ ] Verify all tests still pass: `npm run test:all && npm run e2e`

### 1.2 Remove Build Artifacts from Version Control
- [ ] Add missing entries to `.gitignore`: `dist/`, `stats.html`, `playwright-report/`, `test-results/`, `preview-screenshots/`
- [ ] Remove tracked build artifacts: `git rm -r --cached dist/ stats.html playwright-report/ test-results/ preview-screenshots/`
- [ ] Commit `.gitignore` updates
- [ ] Verify artifacts are ignored: `git status` should show clean working tree after `npm run build`

### 1.3 Remove Unused Directories
- [ ] Assess `apps/winter_arc_flutter` - if unused, remove or document purpose in README
- [ ] Remove `.expo/` directory (not used in Vite project)
- [ ] Remove or document `ops/` directory - move contents to `docs/ops/` if needed
- [ ] Remove `preview/` and `preview-screenshots/` directories (temp artifacts)
- [ ] Update documentation to explain removed directories (if needed)

### 1.4 Consolidate Documentation
- [ ] Move `.release-notes-v0.1.2.md` content to `CHANGELOG.md` or `docs/archive/`
- [ ] Assess `CODEX.md`, `SETUP_COMPLETE.md`, `rules.md` - archive or integrate into main docs
- [ ] Identify and resolve redundancy between `docs/` and `.github/`
- [ ] Create `docs/archive/` for historical documents (if needed)
- [ ] Update documentation index/README to point to canonical locations

### 1.5 Organize Root Directory
- [ ] Move `winter_arc_glass_mockup.png` to `docs/assets/` or `docs/design/`
- [ ] Move `cors.json`, `nginx.conf` to `ops/` or `docs/deployment/`
- [ ] Remove or document `_ul` file
- [ ] Verify root directory only contains essential config files

## Phase 2: Guidelines & Documentation (Short-term)

### 2.1 Document Repository Organization Standards
- [ ] Add "Repository Organization" section to `openspec/project.md`
- [ ] Document standard directory structure and purposes
- [ ] Document file naming conventions
- [ ] Document when to use `docs/` vs `.github/` vs root-level files

### 2.2 Establish File Lifecycle Guidelines
- [ ] Document policy for deprecating files (archive vs delete)
- [ ] Document policy for temporary artifacts (must be gitignored)
- [ ] Document policy for documentation (versioning, archival)
- [ ] Add guidelines to `CONTRIBUTING.md`

### 2.3 Create Maintenance Checklist
- [ ] Create `docs/maintenance-checklist.md` for periodic reviews
- [ ] Document quarterly cleanup process
- [ ] Document tooling usage (`knip`, `depcheck`, `cleanup-repo.mjs`)

## Phase 3: Automation & Enforcement (Ongoing)

### 3.1 Enhance Cleanup Script
- [ ] Review and update `scripts/cleanup-repo.mjs` to match new standards
- [ ] Add checks for build artifacts in version control
- [ ] Add checks for outdated documentation
- [ ] Add dry-run and interactive modes

### 3.2 Add CI Validation
- [ ] Add cleanup check to GitHub Actions (`.github/workflows/`)
- [ ] Fail CI if build artifacts are committed
- [ ] Fail CI if unused files detected by `knip` exceed threshold
- [ ] Add informative error messages with remediation steps

### 3.3 Update Git Hooks
- [ ] Add pre-commit hook to check for build artifacts
- [ ] Add pre-push hook to run `npm run clean:dry-run`
- [ ] Update Husky configuration

### 3.4 Documentation & Communication
- [ ] Update `README.md` with new repository organization
- [ ] Add section to `CONTRIBUTING.md` about maintaining hygiene
- [ ] Communicate changes to team (if applicable)
- [ ] Update onboarding documentation

## Verification

After all tasks:
- [ ] Run full test suite: `npm run test:all`
- [ ] Run E2E tests: `npm run e2e`
- [ ] Run cleanup check: `npm run clean:dry-run` (should report clean)
- [ ] Run unused exports check: `npm run scan:knip` (minimal warnings)
- [ ] Verify CI passes on feature branch
- [ ] Verify documentation is accessible and accurate
- [ ] Repository size reduced (check `.git/` size before/after)

## Dependencies
- Tasks 1.1-1.5 can be executed in parallel
- Task 2.x depends on completion of Phase 1
- Task 3.x can start after 2.1 is complete
- Verification depends on all tasks completing
