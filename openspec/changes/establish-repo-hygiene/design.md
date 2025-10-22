# Design: Establish Repository Hygiene

## Overview
This design establishes a comprehensive repository hygiene system comprising:
1. Immediate cleanup of existing clutter
2. Clear organizational standards documented in project conventions
3. Automated validation in CI/CD pipelines
4. Developer tooling for maintaining hygiene locally

## Architecture

### 1. Directory Structure Standardization

**Current State Problems:**
- Multiple test directories: `test/`, `tests/`, `e2e/tests/`
- Unclear separation between E2E and unit tests
- MSW mocks in root-level `test/` directory

**Proposed Structure:**
```
winter-arc-app/
├── src/                      # Source code
│   ├── components/
│   │   └── __tests__/        # Co-located unit tests
│   ├── utils/
│   │   └── __tests__/
│   └── test/                 # Test utilities, mocks, setup
│       ├── mocks/            # MSW handlers
│       └── setup.ts
├── tests/                    # Integration & E2E tests
│   ├── e2e/                  # Playwright E2E tests
│   │   ├── *.spec.ts
│   │   └── playwright.config.ts
│   └── setup/                # Test setup files (if needed)
├── docs/                     # User-facing documentation
│   ├── assets/               # Images, diagrams
│   ├── deployment/           # Deployment guides (nginx, Docker)
│   ├── archive/              # Archived/outdated docs
│   └── maintenance-checklist.md
├── .github/                  # GitHub-specific files
│   ├── workflows/            # CI/CD pipelines
│   ├── ISSUE_TEMPLATE/
│   └── pull_request_template.md
├── scripts/                  # Build/dev/cleanup scripts
│   ├── cleanup-repo.mjs
│   └── check-secrets.mjs
└── openspec/                 # OpenSpec framework
    ├── project.md
    ├── specs/
    └── changes/
```

**Rationale:**
- **Co-located unit tests**: Easier to find and maintain tests alongside source
- **Centralized E2E tests**: Clear separation from unit tests, distinct config
- **Single test utilities location**: `src/test/` for all shared test infrastructure
- **Docs organization**: Clear separation between user docs (`docs/`) and GitHub-specific (`.github/`)

---

### 2. Build Artifacts Prevention

**Problem:**
Build artifacts like `dist/`, `stats.html`, `playwright-report/` are sometimes committed to version control.

**Solution:**

**A. Enhanced .gitignore**
```gitignore
# Build outputs
dist/
build/
*.bundle.js
stats.html

# Test outputs
coverage/
.nyc_output/
playwright-report/
test-results/
visual-regression-report/
preview-screenshots/

# Temporary files
*.tmp
*.log
.cache/
```

**B. Pre-commit Hook (Husky)**
```javascript
// .husky/pre-commit
const execSync = require('child_process').execSync;

// Check for build artifacts
const buildArtifacts = [
  'dist/',
  'stats.html',
  'playwright-report/',
  'test-results/',
];

const staged = execSync('git diff --cached --name-only').toString().split('\n');
const found = staged.filter(file => buildArtifacts.some(artifact => file.startsWith(artifact)));

if (found.length > 0) {
  console.error('ERROR: Build artifacts detected in commit:');
  found.forEach(f => console.error(`  - ${f}`));
  console.error('\nThese files should be in .gitignore, not version control.');
  process.exit(1);
}
```

**C. CI Validation (GitHub Actions)**
```yaml
# .github/workflows/repo-hygiene.yml
name: Repository Hygiene

on: [pull_request]

jobs:
  hygiene:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Check for build artifacts
        run: |
          if git ls-files | grep -E "^(dist|stats\.html|playwright-report|test-results)"; then
            echo "ERROR: Build artifacts found in version control"
            exit 1
          fi
      - name: Run cleanup validation
        run: npm run clean:dry-run
```

**Rationale:**
- **Three-layer defense**: .gitignore (prevention), pre-commit (early catch), CI (final validation)
- **Fast feedback**: Pre-commit catches issues before they reach CI
- **Automated enforcement**: No manual reviews needed for build artifacts

---

### 3. Cleanup Script Enhancement

**Existing:** `scripts/cleanup-repo.mjs` (basic functionality)

**Enhancements Needed:**

**A. Dry-run Mode**
```javascript
// scripts/cleanup-repo.mjs
import { parseArgs } from 'node:util';

const { values } = parseArgs({
  options: {
    'dry-run': { type: 'boolean', default: false },
    'verbose': { type: 'boolean', default: false },
  },
});

function checkBuildArtifacts() {
  const artifacts = ['dist/', 'stats.html', 'playwright-report/', 'test-results/'];
  const found = artifacts.filter(path => fs.existsSync(path));

  if (found.length > 0) {
    console.log('⚠️  Build artifacts detected:');
    found.forEach(path => {
      console.log(`  - ${path}`);
      if (!values['dry-run']) {
        execSync(`git rm -r --cached ${path} || true`);
        console.log(`    ✅ Removed from git tracking`);
      }
    });
  }

  return found.length;
}

function checkUnusedFiles() {
  // Run knip and parse output
  const result = execSync('npm run scan:knip --silent', { encoding: 'utf-8' });
  const unusedCount = parseKnipOutput(result);

  if (unusedCount > 10) {
    console.log(`⚠️  ${unusedCount} unused exports detected`);
    console.log('   Run: npm run scan:knip');
    return 1;
  }
  return 0;
}

// Main execution
const issues = checkBuildArtifacts() + checkUnusedFiles();

if (issues > 0 && values['dry-run']) {
  console.log('\n🔍 Dry-run mode: No changes made');
  console.log('   Run without --dry-run to apply fixes');
}

process.exit(issues > 0 ? 1 : 0);
```

**B. Package.json Scripts**
```json
{
  "scripts": {
    "clean": "node scripts/cleanup-repo.mjs",
    "clean:dry-run": "node scripts/cleanup-repo.mjs --dry-run",
    "clean:verify": "node scripts/cleanup-repo.mjs --dry-run && npm run scan:knip"
  }
}
```

**Rationale:**
- **Safe by default**: Dry-run mode prevents accidental deletions
- **Actionable output**: Clear messages with remediation steps
- **Composable**: Can be combined with other checks (knip, depcheck)

---

### 4. Documentation Organization

**Problem:** Redundancy and unclear canonical locations

**Solution: Documentation Matrix**

| Type | Location | Examples |
|------|----------|----------|
| Project Conventions | `openspec/project.md` | Tech stack, architecture, testing |
| Contributor Guide | `CONTRIBUTING.md` | How to contribute, PR process |
| User Documentation | `docs/` | Setup guides, deployment, API docs |
| GitHub-specific | `.github/` | Issue templates, PR templates, workflows |
| Historical/Archived | `docs/archive/` | Old release notes, deprecated docs |
| Developer Checklists | `docs/maintenance-checklist.md` | Quarterly cleanup tasks |

**Implementation:**
1. **Consolidation Phase:**
   - Move `.release-notes-v0.1.2.md` → `docs/archive/2025-10-v0.1.2-release-notes.md`
   - Merge `CODEX.md` → `openspec/project.md` (if relevant) or delete
   - Merge `SETUP_COMPLETE.md` → `docs/deployment/setup-verification.md` or delete
   - Move `rules.md` → `docs/archive/` (if historical) or merge into `CONTRIBUTING.md`

2. **Documentation Index (README.md):**
   ```markdown
   ## Documentation

   - **Getting Started**: See [README.md](./README.md)
   - **Contributing**: See [CONTRIBUTING.md](./CONTRIBUTING.md)
   - **Architecture**: See [openspec/project.md](./openspec/project.md)
   - **Deployment**: See [docs/deployment/](./docs/deployment/)
   - **Maintenance**: See [docs/maintenance-checklist.md](./docs/maintenance-checklist.md)
   ```

**Rationale:**
- **Single source of truth**: Each doc type has ONE canonical location
- **Clear ownership**: Easier to maintain when structure is logical
- **Discoverability**: Index in README makes everything findable

---

### 5. Git Hooks Strategy

**Current Hooks (Husky):**
- Pre-commit: TypeScript, ESLint, secret scanning

**Additions:**
```javascript
// .husky/pre-commit (enhanced)
npm run typecheck
npm run lint:code
npm run lint:secrets
node scripts/check-build-artifacts.mjs  // NEW
```

```javascript
// .husky/pre-push (enhanced)
npm run test:unit
npm run clean:dry-run  // NEW - verify hygiene before push
```

**Rationale:**
- **Pre-commit**: Fast checks (build artifacts, secrets) - <5 seconds
- **Pre-push**: Slower checks (tests, full hygiene scan) - acceptable delay before push
- **Opt-out available**: Developers can use `--no-verify` if needed (documented in `CONTRIBUTING.md`)

---

## Trade-offs & Decisions

### Decision 1: Single Test Directory vs Co-located Tests
**Options:**
1. All tests in `tests/` directory
2. Co-located `__tests__/` + separate `tests/e2e/`

**Chosen:** Option 2 (co-located + separate E2E)

**Rationale:**
- Unit tests benefit from co-location (easier to maintain)
- E2E tests need separate config and are cross-cutting
- Matches industry standard (Jest, Vitest, React Testing Library conventions)

### Decision 2: Strict vs Lenient CI Checks
**Options:**
1. Fail CI on ANY unused export
2. Fail CI only on build artifacts, warn on unused exports
3. Only warn, never fail CI

**Chosen:** Option 2 (fail on artifacts, warn on unused)

**Rationale:**
- Build artifacts are NEVER acceptable (strict enforcement)
- Unused exports may be temporary during development (warning acceptable)
- Provides flexibility without sacrificing critical standards

### Decision 3: Automated Cleanup vs Manual Review
**Options:**
1. Script auto-deletes files based on rules
2. Script only reports, requires manual confirmation
3. Interactive mode prompts for each file

**Chosen:** Option 2 (report-only with dry-run default)

**Rationale:**
- Safer: Prevents accidental deletion of needed files
- Transparent: Developer sees exactly what would be removed
- Flexible: Can still auto-fix with `--no-dry-run` flag

---

## Implementation Plan

See `tasks.md` for detailed task breakdown.

**Key Milestones:**
1. ✅ Cleanup existing clutter (1-2 days)
2. ✅ Document standards in `project.md` (1 day)
3. ✅ Enhance automation (cleanup script, CI, hooks) (1-2 days)
4. ✅ Verify and communicate changes (0.5 day)

**Total effort:** ~4-5 days

---

## Success Criteria

- ✅ Zero build artifacts in `git ls-files` output
- ✅ Single test directory structure (no duplicates)
- ✅ All documentation has clear canonical location
- ✅ `npm run clean:dry-run` exits with code 0
- ✅ CI hygiene check passes on all PRs
- ✅ Repository size reduced by >10%
- ✅ Developer documentation updated (README, CONTRIBUTING)

---

## Future Enhancements (Out of Scope)

- Automated dead code elimination (requires advanced static analysis)
- Dependency pruning automation (requires careful testing)
- File size monitoring (track repo growth over time)
- Documentation versioning system (Docusaurus, VitePress)
