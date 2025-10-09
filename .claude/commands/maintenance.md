Orchestrate comprehensive repository maintenance tasks with intelligent parallel execution and dependency management.

## Command Syntax

```bash
/maintenance [--apply] [--parallel] [--report] [--aggressive] [--skip=<tasks>] [--max-workers=<n>]
```

## Task IDs & Mapping

| Task ID | Command | Description |
|---------|---------|-------------|
| `clean` | `/clean` | Remove unused files, dead code, build artifacts |
| `docs` | `/docs-changelog` | Update documentation, changelog, versioning |
| `optimize` | `/pwa-perf` | PWA optimization, bundle analysis, Lighthouse |
| `health` | `/test-guard` | Test coverage, quality gates, validation |
| `maintain` | `/ui-refactor` | UI consistency, glass design, mobile-first |

## Execution Model

### Two-Phase Pipeline

**Phase 1: ANALYZE** (Parallel by default)
- Run analysis for all selected tasks concurrently (bounded by `--max-workers`)
- Each task generates: `reports/<task>/<timestamp>/findings.json`
- Collect all findings without making changes
- If any analysis fails → stop, generate `errors.md`, abort APPLY phase

**Phase 2: APPLY** (DAG-based ordering, only with `--apply`)

Dependency Graph:
```
clean → [docs || optimize] → maintain → health
```

- **Group A**: `clean` (runs first, required for repo cleanliness)
- **Group B**: `docs` and `optimize` (parallel, wait for clean)
- **Group C**: `maintain` (waits for Group B)
- **Group D**: `health` (validation only, runs last, no modifications)

Execution within each group:
1. Create/reuse feature branch: `chore/maintenance/<date-iso>`
2. Execute task with proper flags
3. Commit changes: `chore(<task>): <description>`
4. Run validation: `npm run lint && npm run typecheck && npm run test`
5. If validation fails → abort pipeline, keep commits, generate rollback instructions

## Flags & Options

### --apply
Execute changes to repository. Without this flag, runs in dry-run mode (analysis only).

**Default**: Dry-run (no changes)

### --parallel
Enable parallel execution:
- ANALYZE phase: All tasks run concurrently (bounded by `--max-workers`)
- APPLY phase: Respect DAG, but parallelize independent groups

**Default**: Sequential execution

### --report
Generate consolidated maintenance report at end.

**Output**: `reports/maintenance/<timestamp>/maintenance-report.md`

Includes:
- Per-task status and outcomes
- Files changed, lines added/removed
- Asset size deltas
- Dependency updates
- Health score and coverage metrics
- Performance numbers (Lighthouse scores)
- Warnings and recommendations
- Rollback instructions (if failures occurred)

**Default**: Report generated only with this flag

### --aggressive
Forward to tasks that support it (`clean`, `optimize`):
- `clean`: Use confidence ≥0.85, remove files >18 months
- `optimize`: Optimize all images, not just lossless

**Default**: Standard thresholds (confidence ≥0.92)

### --skip=<tasks>
Comma-separated list of task IDs to skip in both phases.

**Example**: `--skip=health,maintain`

**Default**: Run all tasks

### --max-workers=<n>
Maximum concurrent tasks in parallel mode.

**Default**: 4

**Range**: 1-8

## Implementation Steps

When this command is executed, perform the following:

### 1. Parse Arguments & Initialize

```typescript
// Parse flags from command
const args = parseMaintenanceArgs();
const {
  apply = false,
  parallel = false,
  report = false,
  aggressive = false,
  skip = [],
  maxWorkers = 4
} = args;

// Define all tasks
const allTasks = ['clean', 'docs', 'optimize', 'health', 'maintain'];
const selectedTasks = allTasks.filter(t => !skip.includes(t));

// Create timestamp for reports
const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
const reportsDir = `reports/maintenance/${timestamp}`;
```

### 2. ANALYZE Phase

Execute analysis for all selected tasks:

```typescript
// Task definitions with commands
const taskCommands = {
  clean: '/clean',
  docs: '/docs-changelog',
  optimize: '/pwa-perf',
  health: '/test-guard',
  maintain: '/ui-refactor'
};

// Run analyses
if (parallel) {
  // Concurrent execution with max-workers limit
  await runTasksInParallel(selectedTasks, {
    maxConcurrency: maxWorkers,
    phase: 'analyze',
    aggressive
  });
} else {
  // Sequential execution
  for (const task of selectedTasks) {
    await runTaskAnalysis(task, { aggressive });
  }
}

// Check for analysis errors
if (hasAnalysisErrors()) {
  generateErrorReport(reportsDir);
  abort('Analysis phase failed. See errors.md for details.');
}
```

### 3. APPLY Phase (if --apply flag set)

Execute with dependency ordering:

```typescript
if (!apply) {
  console.log('Dry-run complete. Use --apply to execute changes.');
  return;
}

// Create maintenance branch
const branchName = `chore/maintenance/${timestamp.slice(0, 10)}`;
await git.createBranch(branchName);

// Define dependency graph
const dependencyGraph = {
  clean: [],                    // No dependencies
  docs: ['clean'],              // Depends on clean
  optimize: ['clean'],          // Depends on clean
  maintain: ['docs', 'optimize'], // Depends on Group B
  health: ['maintain']          // Depends on maintain (validation only)
};

// Execute in topological order with parallelism
const executionPlan = buildExecutionPlan(selectedTasks, dependencyGraph);

for (const group of executionPlan) {
  if (parallel && group.length > 1) {
    // Run group in parallel
    await Promise.all(group.map(task => executeTask(task, {
      branchName,
      aggressive,
      commit: true
    })));
  } else {
    // Run sequentially
    for (const task of group) {
      await executeTask(task, {
        branchName,
        aggressive,
        commit: true
      });
    }
  }

  // Validate after each group
  const validationResult = await runValidation();
  if (!validationResult.success) {
    generateRollbackInstructions(reportsDir, branchName);
    abort('Validation failed. See rollback instructions in report.');
  }
}
```

### 4. Generate Consolidated Report (if --report flag set)

```typescript
if (report) {
  await generateConsolidatedReport({
    reportsDir,
    timestamp,
    selectedTasks,
    executionResults,
    branchName: apply ? branchName : null
  });
}
```

## Safety & Validation

### Protected Files
Respect exclusions from `cleanup.config.json`:
- README.md, LICENSE, CHANGELOG*, SECURITY.md
- CLAUDE.md, .agent/*, .github/*
- Framework configs (package.json, vite.config.ts, etc.)

### Git Safety
- **Never commit to main/develop** - Always use feature branch
- **Branch naming**: `chore/maintenance/<date-iso>`
- **Commit format**: Conventional commits with task scope
  ```
  chore(clean): Remove unused markdown files and build artifacts
  chore(docs): Update CHANGELOG.md for v2.1.0 release
  chore(optimize): Optimize images and reduce bundle size
  ```

### Validation Gates
After each task execution:
1. **Lint**: `npm run lint` must pass
2. **TypeScript**: `npm run typecheck` must pass
3. **Tests**: `npm run test` must pass
4. **Build**: `npm run build` must succeed

### Failure Handling
If any step fails:
1. Stop pipeline immediately
2. Keep partial commits on feature branch
3. Generate detailed error report
4. Include rollback instructions:
   ```bash
   # Rollback maintenance changes
   git checkout develop
   git branch -D chore/maintenance/2025-10-09

   # Or restore specific files
   git checkout develop -- <file-path>
   ```

### Age-Based Protection
Even in `--aggressive` mode:
- **Never delete** assets modified in last 12 months
- **Keep** files with recent git activity
- **Preserve** files referenced in recent commits

## Report Structure

### Consolidated Report Location
`reports/maintenance/<timestamp>/maintenance-report.md`

### Report Sections

1. **Executive Summary**
   - Total tasks executed
   - Success/failure status
   - Overall impact (files changed, size delta)
   - Recommendations

2. **Per-Task Results**
   For each task:
   - Status (✅ Success, ⚠️ Warning, ❌ Failed)
   - Files modified/deleted
   - Size impact
   - Key metrics (coverage, Lighthouse, etc.)
   - Warnings and issues

3. **Repository Health**
   - Test coverage: Before → After
   - Bundle size: Before → After
   - Lighthouse scores: Performance, A11y, Best Practices, SEO
   - Dependencies: Updates available

4. **Changes Summary**
   - Total files modified: N
   - Total files deleted: N
   - Lines added/removed: +X / -Y
   - Commits created: N
   - Branch: `chore/maintenance/<date>`

5. **Validation Results**
   - ✅ Lint passed
   - ✅ TypeScript passed
   - ✅ Tests passed (X/Y)
   - ✅ Build successful

6. **Rollback Instructions**
   (If failures occurred)

### Additional Artifacts

- `reports/maintenance/<timestamp>/combined-findings.json` - Merged JSON data
- `reports/maintenance/<timestamp>/task-logs/*.json` - Individual task logs
- `reports/maintenance/<timestamp>/errors.md` - Error details (if failures)

## Usage Examples

### Example 1: Dry-Run Analysis (Default)
```bash
/maintenance
```
- Runs ANALYZE phase for all tasks sequentially
- No repository changes
- Generates findings for review

### Example 2: Full Parallel Analysis
```bash
/maintenance --parallel --max-workers=6
```
- Runs all task analyses concurrently (max 6 at once)
- Faster analysis, no changes
- Review findings before applying

### Example 3: Apply with Report
```bash
/maintenance --apply --report
```
- Executes all tasks with proper dependency ordering
- Creates feature branch
- Generates comprehensive report

### Example 4: Aggressive Cleanup and Optimization
```bash
/maintenance --apply --aggressive --parallel --report --skip=health
```
- Aggressive mode for clean and optimize
- Parallel execution where safe
- Skip health validation
- Generate full report

### Example 5: Docs and Health Only
```bash
/maintenance --apply --skip=clean,optimize,maintain
```
- Only run docs and health tasks
- Apply changes
- Useful for release preparation

## Execution Flow Diagram

```
┌─────────────────────────────────────────────────────┐
│  /maintenance [flags]                               │
└─────────────────┬───────────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────────┐
│  Phase 1: ANALYZE (--parallel aware)                │
│  ┌─────────┐  ┌──────┐  ┌─────────┐  ┌────────┐    │
│  │ clean   │  │ docs │  │optimize │  │ health │    │
│  └────┬────┘  └───┬──┘  └────┬────┘  └───┬────┘    │
│       │           │          │           │         │
│       └───────────┴──────────┴───────────┘         │
│                     │                               │
│         Generate findings.json for each             │
└─────────────────────┬───────────────────────────────┘
                      │
                      ▼
              ┌───────────────┐
              │ Errors found? │
              └───┬───────┬───┘
                  │ Yes   │ No
                  ▼       ▼
            ┌─────────┐   │
            │ errors  │   │
            │  .md    │   │
            │ → ABORT │   │
            └─────────┘   │
                          │
          ┌───────────────┘
          │ --apply flag set?
          └───┬───────┬───
              │ No    │ Yes
              ▼       ▼
        ┌─────────┐  ┌──────────────────────────────┐
        │ EXIT    │  │  Phase 2: APPLY (DAG order)  │
        │(dry-run)│  │                              │
        └─────────┘  │  ┌────────────────────────┐  │
                     │  │ Group A: clean         │  │
                     │  └───────┬────────────────┘  │
                     │          │                   │
                     │          ▼                   │
                     │  ┌────────────────────────┐  │
                     │  │ Group B: docs ||       │  │
                     │  │         optimize       │  │
                     │  └───────┬────────────────┘  │
                     │          │                   │
                     │          ▼                   │
                     │  ┌────────────────────────┐  │
                     │  │ Group C: maintain      │  │
                     │  └───────┬────────────────┘  │
                     │          │                   │
                     │          ▼                   │
                     │  ┌────────────────────────┐  │
                     │  │ Group D: health        │  │
                     │  │ (validation only)      │  │
                     │  └───────┬────────────────┘  │
                     │          │                   │
                     │    Validate after each       │
                     └──────────┬───────────────────┘
                                │
                                ▼
                     ┌────────────────────┐
                     │  --report set?     │
                     └────┬───────┬───────┘
                          │ Yes   │ No
                          ▼       ▼
                  ┌──────────────┐  │
                  │ Generate     │  │
                  │ maintenance- │  │
                  │ report.md    │  │
                  └──────────────┘  │
                          │         │
                          └────┬────┘
                               │
                               ▼
                        ┌──────────┐
                        │   DONE   │
                        └──────────┘
```

## Determinism & Reproducibility

To ensure consistent behavior:

1. **Task ordering**: Topological sort of dependency graph is deterministic
2. **Timestamps**: Same format across all tasks (ISO 8601)
3. **Configuration**: Read from `cleanup.config.json` and project configs
4. **Git state**: Always create clean branch from current HEAD
5. **Validation**: Same test suite runs after each phase

Running the same command with the same flags on the same repository state will produce identical results.

---

## Implementation Note

This command orchestrates existing task commands. When executed, Claude Code will:

1. Parse the command arguments
2. Load task specifications from respective `.md` files
3. Execute the two-phase pipeline as described
4. Generate consolidated reports
5. Provide clear next steps and rollback instructions

**Now execute the analysis based on the provided flags.**
