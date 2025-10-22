# CI/CD Infrastructure Design

## Context

Winter Arc uses GitHub Actions for CI/CD with the following components:
- **Quality Gate:** `ci.yml` (lint, typecheck, test, build)
- **Deployments:** Production, Staging, PR Previews
- **Security:** Secret scanning, dependency audits
- **Governance:** Git-Flow enforcement, branch naming validation
- **Composite Actions:** Reusable setup and build logic
- **Performance:** Multi-layer caching (6 layers)

The infrastructure has evolved organically and currently uses Depot.dev runners. This change will migrate to standard GitHub runners and formalize the infrastructure through documentation and specifications.

## Goals / Non-Goals

### Goals
- Clean and maintainable CI/CD infrastructure
- Comprehensive documentation for onboarding and troubleshooting
- Formal specification of CI/CD requirements
- Performance benchmarks and optimization strategies
- Security best practices documented

### Non-Goals
- Changing existing workflow functionality (cleanup only)
- Migrating to different CI/CD platform
- Adding new workflows or features (separate proposals)
- Changing deployment targets or strategies

## Decisions

### 1. Create CI/CD Capability Specification
**Decision:** Create new `openspec/specs/ci-cd/` capability with formal requirements.

**Rationale:**
- CI/CD is a critical capability that affects all development work
- No formal spec exists, leading to inconsistencies
- Requirements need to be explicit for quality assurance
- Enables better onboarding and change management

**Alternatives Considered:**
- Document in CLAUDE.md only → Rejected: Too informal, not spec-driven
- Add to existing specs → Rejected: CI/CD is orthogonal capability

### 2. Remove Depot.dev and Use Standard GitHub Runners
**Decision:** Migrate from `depot-ubuntu-*` to standard `ubuntu-latest` runners.

**Rationale:**
- Eliminate vendor lock-in and external dependencies
- Reduce complexity in CI configuration
- Standard runners are sufficient for our workload
- No additional cost or account management
- Better long-term maintainability

**Alternatives Considered:**
- Keep Depot.dev → Rejected: Adds unnecessary complexity and vendor dependency
- Buildjet or similar → Rejected: Same vendor lock-in issues

**Migration:**
- Replace all `depot-ubuntu-22.04*` with `ubuntu-latest`
- Re-benchmark CI performance after migration
- Adjust timeouts if needed (may increase slightly)
- Document performance trade-offs

### 3. Maintain Multi-Layer Caching
**Decision:** Keep current caching strategy with 6 layers:
- npm cache (actions/setup-node)
- node_modules (actions/cache)
- Vite build cache
- TypeScript build info
- ESLint cache
- Vitest cache

**Rationale:**
- Proven to reduce CI time by ~30%
- Cache hit rate ~85%
- Each layer serves specific purpose
- Minimal overhead

**Alternatives Considered:**
- Single cache layer → Rejected: Less granular, slower invalidation
- No caching → Rejected: 3x slower builds

### 4. Remove Backup Files Without Archiving
**Decision:** Delete `.backup.yml` files directly (no git archive).

**Rationale:**
- Git history preserves old versions
- Backup files were temporary (deployment refactoring)
- No active references in code or docs
- Reduces confusion and clutter

**Migration:** None required, files are unused.

### 5. Formalize Workflow Dependencies
**Decision:** Document explicit dependencies between workflows.

**Example:** Deployments depend on CI success via `workflow_run` trigger.

**Rationale:**
- Prevents deployment of broken code
- Makes quality gate explicit
- Easier to understand workflow orchestration

## Architecture

### Workflow Dependency Graph
```
Code Push/PR
    │
    ▼
CI Workflow (quality gate)
    │
    ├──────────────┬──────────────┬──────────────┐
    ▼              ▼              ▼              ▼
Deploy Prod    Deploy Stage   PR Preview    E2E Tests
(main only)    (develop)      (PRs)         (manual/auto)
```

### Composite Actions
```
setup-deps/
  ├─ Node.js setup
  ├─ npm cache
  ├─ Multi-layer caching (6 layers)
  └─ Dependency installation

build-app/
  ├─ Environment configuration
  ├─ Firebase secrets injection
  ├─ Sentry configuration
  └─ Vite build + verification
```

### Security Layers
```
1. Pre-commit: TypeScript + ESLint + Secret scanning
2. Pre-push: All tests + Build
3. CI Workflow: Full quality gate
4. Security Workflow: npm audit + secret history scan
5. Branch Protection: Required checks
```

## Risks / Trade-offs

### Risk: Performance Regression After Depot.dev Removal
**Trade-off:** Standard runners may be 10-20% slower than Depot.dev
**Mitigation:**
- Re-benchmark CI after migration
- Optimize caching strategies for standard runners
- Adjust timeouts if needed
- Document baseline performance
- Monitor CI times over time

### Risk: Documentation Becomes Outdated
**Mitigation:**
- Add "Last Updated" date to README
- Require documentation updates in PR checklist
- Link to OpenSpec spec as source of truth

### Risk: Over-Documentation
**Trade-off:** Comprehensive docs vs. maintenance burden
**Mitigation:**
- Focus on "why" not "what" (code is self-documenting)
- Use diagrams and examples
- Keep troubleshooting section concise

### Risk: Breaking Changes During Cleanup
**Mitigation:**
- Test all workflows after cleanup
- No functional changes, only removal of unused files
- Review by DevOps team before merge

## Migration Plan

### Phase 1: Analysis (Day 1)
- Audit all workflows
- Identify duplicates and unused files
- Document current state

### Phase 2: Cleanup (Day 1-2)
- Remove backup files
- Remove duplicate workflows
- Verify no broken references

### Phase 3: Documentation (Day 2-3)
- Update README.md
- Create OpenSpec specification
- Add troubleshooting guide

### Phase 4: Validation (Day 3)
- Test all workflows
- OpenSpec validation
- DevOps review

### Rollback Plan
- Git revert if any workflow breaks
- Backup files are in git history if needed

## Open Questions

- **Q:** Should we add Lighthouse CI to the main CI workflow?
  **A:** Out of scope for this change. Lighthouse is already configured and runs separately.

- **Q:** Do we need workflow templates for new workflows?
  **A:** Nice-to-have, but not critical for this change. Can be added later.

- **Q:** Should we investigate GitHub Actions caching improvements?
  **A:** Yes, part of this change. Will optimize caching after Depot.dev removal.
