# Spec Delta: Development Workflow

## ADDED Requirements

### Requirement: Repository Organization Standards
The system MUST maintain a clean, standardized directory structure with clear purpose for each top-level directory.

#### Scenario: Standard directory structure is documented and enforced
**Given** a developer is working in the repository
**When** they need to add new files or directories
**Then** they can reference clear guidelines in `openspec/project.md` "Repository Organization" section
**And** CI checks validate compliance with directory standards
**And** pre-commit hooks prevent accidental clutter

#### Scenario: Test directories follow single standard
**Given** the repository contains test files
**When** a developer needs to add or locate tests
**Then** E2E tests are located in `tests/e2e/` or `e2e/tests/` (single location)
**And** unit tests are co-located with source files in `__tests__/` directories
**And** test setup/mocks are in `tests/setup/` or `src/test/`
**And** there are NO duplicate test directories (`test/`, `tests/`, `e2e/tests/` simultaneously)

#### Scenario: Build artifacts are never committed
**Given** a developer runs build commands (`npm run build`, `npm run analyze`)
**When** they attempt to commit changes
**Then** build artifacts (`dist/`, `stats.html`, `playwright-report/`, `test-results/`) are gitignored
**And** pre-commit hooks reject commits containing build artifacts
**And** CI fails if build artifacts are detected in version control

---

### Requirement: Documentation Organization
The system MUST maintain non-redundant, well-organized documentation with clear canonical locations.

#### Scenario: Documentation has canonical locations
**Given** multiple documentation files exist in the repository
**When** a developer needs to find or update documentation
**Then** they can reference the documentation index in `README.md`
**And** project guidelines are in `openspec/project.md`
**And** contributor guidelines are in `CONTRIBUTING.md`
**And** GitHub-specific docs (PR templates, workflows) are in `.github/`
**And** user-facing docs are in `docs/`
**And** there is NO redundancy between `docs/` and `.github/` or root-level files

#### Scenario: Outdated documentation is archived
**Given** documentation becomes outdated or superseded
**When** a maintainer reviews documentation
**Then** outdated docs are moved to `docs/archive/` with date prefix
**And** active docs reference the archive for historical context (if needed)
**And** active docs do NOT link to archived content as primary source

---

### Requirement: File Lifecycle Management
The system MUST provide clear policies for creating, deprecating, and removing files.

#### Scenario: Temporary files are not committed
**Given** a developer creates temporary files during development
**When** they run `git status`
**Then** temporary files are automatically gitignored (e.g., `*.tmp`, `.cache/`, coverage reports)
**And** pre-commit hooks warn about uncommitted temporary files
**And** CI fails if temporary files are detected

#### Scenario: Unused files are detected and removed
**Given** files become unused over time (e.g., deprecated scripts, dead code)
**When** a maintainer runs `npm run scan:knip` or `npm run clean:dry-run`
**Then** the system reports all unused exports, files, and dependencies
**And** the maintainer can safely remove unused files
**And** removal is documented in `CHANGELOG.md`

---

### Requirement: Automated Cleanup Validation
The system MUST automatically validate repository hygiene in CI/CD pipelines.

#### Scenario: CI validates repository hygiene
**Given** a developer opens a pull request
**When** CI runs on the PR
**Then** CI executes cleanup validation script (`scripts/cleanup-repo.mjs`)
**And** CI fails if build artifacts are committed
**And** CI fails if unused files exceed threshold (e.g., >10 unused exports)
**And** CI provides actionable error messages with remediation steps

#### Scenario: Cleanup script runs in dry-run mode locally
**Given** a developer wants to check for repository issues
**When** they run `npm run clean:dry-run`
**Then** the script reports all detected issues without making changes
**And** the script suggests remediation commands
**And** the script exits with non-zero code if issues are found

#### Scenario: Cleanup script can auto-fix issues
**Given** a maintainer wants to clean the repository
**When** they run `npm run clean`
**Then** the script removes all detected build artifacts
**And** the script removes all gitignored files from version control
**And** the script reports all actions taken
**And** the script does NOT remove files without clear rules (requires manual review)

---

### Requirement: Developer Tooling for Hygiene
The system MUST provide tools to maintain repository hygiene during development.

#### Scenario: Pre-commit hooks prevent clutter
**Given** a developer stages files for commit
**When** they run `git commit`
**Then** pre-commit hooks check for build artifacts
**And** pre-commit hooks check for secret leaks
**And** pre-commit hooks run TypeScript and ESLint
**And** commit is rejected if any check fails with helpful error message

#### Scenario: Periodic maintenance checklist exists
**Given** a maintainer wants to perform quarterly cleanup
**When** they reference `docs/maintenance-checklist.md`
**Then** they find step-by-step instructions for cleanup tasks
**And** they find commands to run (`knip`, `depcheck`, `clean`)
**And** they find criteria for what to remove vs archive

---

## MODIFIED Requirements

None. This is a new capability with no existing requirements.

---

## REMOVED Requirements

None. This is a new capability.
