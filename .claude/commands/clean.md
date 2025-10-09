Perform intelligent repository cleanup analysis and operations.

## Command Modes

**Default (Dry-Run)**: `/clean`
- Analyze repository for unused files, dead code, and inconsistencies
- Generate detailed reports without making changes
- Show cleanup plan with confidence scores

**Apply**: `/clean apply`
- Execute the cleanup plan from dry-run
- Create feature branch `chore/cleanup/<date-iso>`
- Commit changes atomically with descriptive messages
- Optionally create PR with summary

**Aggressive**: `/clean aggressive`
- Use stricter heuristics (confidence ≥0.85 instead of ≥0.92)
- Remove files older than 18 months without references
- Optimize all images (not just lossless)

**Reset**: `/clean reset`
- Revert all changes made by `/clean apply`
- Delete cleanup branch
- Restore repository to pre-cleanup state

## Analysis Scope

1. **Markdown Files (.md)**
   - Find unreferenced/duplicate documentation
   - Check for broken internal links
   - Standardize structure (H1, ToC, formatting)
   - Consolidate scattered notes into docs/

2. **Images & Assets**
   - Detect unreferenced files in public/, src/assets/, docs/
   - Find duplicates and oversized files
   - Check references in: code, CSS, Markdown, manifests, i18n
   - Account for dynamic imports (import.meta.glob, etc.)

3. **Dead Code**
   - Unused exports and imports
   - Orphaned components/hooks/utilities
   - Empty directories
   - Obsolete test snapshots

4. **Build Artifacts**
   - dist/, build/, coverage/ contents
   - Temporary files and editor artifacts
   - Old CI artifacts

## Safety Rules

- **Never delete**: README.md, LICENSE, CHANGELOG*, SECURITY.md, CLAUDE.md, .agent/*, .github/*, framework configs
- **Protected paths**: Defined in `cleanup.config.json`
- **Always**: Create feature branch, never commit to main directly
- **Generate**: Detailed reports in `reports/cleanup/<timestamp>/`
  - cleanup-report.md (summary)
  - cleanup-findings.json (detailed with confidence scores)
  - cleanup-plan.md (planned operations)
  - risk-register.md (potential risks)

## Implementation Steps

1. Read `cleanup.config.json` for protection rules
2. Use Glob to find all Markdown files, images, and source files
3. Use Grep to search for references across codebase
4. Calculate confidence scores (0.0-1.0) for each finding
5. Generate comprehensive reports
6. If apply mode: execute plan with git safety measures

## Output Format

Present a compact summary showing:
- Unreferenced .md files: N (X MB)
- Unreferenced images/assets: N (X MB)
- Duplicate files: N groups
- Dead code paths: N files
- Build artifacts: N files (X MB)
- Total estimated savings: X MB

Then offer next steps:
- Review detailed reports in reports/cleanup/<timestamp>/
- Run `/clean apply` to execute plan
- Run `/clean aggressive` for stricter cleanup

---

**Now execute the analysis based on the provided mode.**
