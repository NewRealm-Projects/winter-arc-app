# Improve CI/CD Documentation and Infrastructure

## Why

The CI/CD infrastructure has grown organically and now requires cleanup, documentation, and optimization. Currently:
- Backup files (`.backup.yml`) clutter the workflows directory
- Documentation is outdated (last updated 2025-01-09, missing recent changes)
- No formal specification exists for CI/CD capability
- Performance metrics and best practices are not comprehensively documented
- Troubleshooting guidance is incomplete

This change establishes a clean, well-documented, and optimized CI/CD environment that serves as a reference for the team.

## What Changes

- **Documentation:**
  - Update `.github/workflows/README.md` with current state
  - Add performance benchmarks and metrics
  - Expand troubleshooting guide
  - Document best practices for workflow maintenance
  - Create CI/CD specification in `openspec/specs/ci-cd/`

- **Cleanup:**
  - Remove backup workflow files (`.backup.yml`)
  - Identify and remove duplicate workflows
  - Archive unused workflows
  - Clean up deprecated comments/code

- **Improvements:**
  - Remove Depot.dev runners, migrate to standard GitHub runners
  - Optimize caching strategies for standard runners
  - Add performance monitoring
  - Improve error handling and logging
  - Document security best practices
  - Add workflow templates

- **New Capability:**
  - Create `ci-cd` specification defining requirements for CI/CD infrastructure

## Impact

- **Affected specs:** NEW `ci-cd` capability
- **Affected code:** `.github/workflows/`, `.github/actions/`
- **Breaking changes:** None (cleanup only)
- **Benefits:**
  - Cleaner repository structure
  - Better onboarding for new developers
  - Easier maintenance and troubleshooting
  - Documented best practices
  - Performance baseline for future improvements
  - Standard GitHub runners (no vendor lock-in)
  - Reduced complexity and dependencies
