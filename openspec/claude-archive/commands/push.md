---
description: Smart push - stage, commit, push to remote with safety checks and PR creation
tags: [git, workflow]
---

# Smart Push Workflow

Execute a safe and optimized git push workflow with automatic validation.

## Instructions

You MUST follow these steps in order:

### 1. Safety Checks (MANDATORY)

First, perform these validation checks:

```bash
# Check current branch
CURRENT_BRANCH=$(git branch --show-current)

# BLOCK if on protected branch
if [[ "$CURRENT_BRANCH" == "main" || "$CURRENT_BRANCH" == "develop" ]]; then
  echo "❌ ERROR: Direct push to $CURRENT_BRANCH is forbidden!"
  echo "Create a feature branch first: git checkout -b <username>/<type>-<description>"
  exit 1
fi

# Validate branch naming convention: <username>/<type>-<description>
if ! echo "$CURRENT_BRANCH" | grep -qE '^[a-z0-9]+/(feature|fix|chore|refactor|docs|test|style)-[a-z0-9-]+$'; then
  echo "⚠️  WARNING: Branch name doesn't follow convention!"
  echo "Expected: <username>/<type>-<description>"
  echo "Examples: lbuettge/feature-dashboard, niklas/fix-login-bug"
  echo "Current: $CURRENT_BRANCH"
  echo ""
  read -p "Continue anyway? (y/N): " CONTINUE
  if [[ "$CONTINUE" != "y" ]]; then
    exit 1
  fi
fi

# Check for uncommitted changes
git status
```

### 2. Stage Changes

```bash
# Stage all changes (including deletions)
git add -A

# Show what will be committed
echo "📦 Staged files:"
git status --short
```

### 3. Commit Message

Ask the user if they want to:
- **Option A**: Auto-generate commit message based on changes
- **Option B**: Provide custom commit message

**For Auto-Generated Message:**
- Analyze git diff to understand changes
- Follow conventional commit format: `type(scope): subject`
- Valid types: feat, fix, refactor, chore, test, docs, style, perf
- Include Claude Code footer:
  ```
  🤖 Generated with [Claude Code](https://claude.com/claude-code)

  Co-Authored-By: Claude <noreply@anthropic.com>
  ```

**For Custom Message:**
- Ask user for commit message
- Still append Claude Code footer

### 4. Commit with --no-verify

```bash
# Commit with --no-verify to bypass hooks (useful when npm/tooling is broken)
git commit --no-verify -m "$(cat <<'EOF'
<commit message here>

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>
EOF
)"
```

### 5. Push to Remote

```bash
# Check if remote branch exists
if git rev-parse --verify origin/$CURRENT_BRANCH >/dev/null 2>&1; then
  # Branch exists, push normally
  git push
else
  # New branch, push with -u to set upstream
  git push -u origin $CURRENT_BRANCH
fi

# Show push result
git status
```

### 6. Create Pull Request (Optional)

Ask user: "Would you like to create a Pull Request? (y/N)"

**If yes:**
```bash
# Get recent commits for PR body
COMMITS=$(git log origin/main..HEAD --oneline)

# Get changed files
FILES=$(git diff --name-only origin/main..HEAD)

# Auto-generate PR description
gh pr create \
  --base main \
  --title "<commit message subject>" \
  --body "$(cat <<'EOF'
## Summary
<Bullet points of key changes>

## Changes
<List of modified components/files>

## Test Plan
- [ ] Manually tested locally
- [ ] Code compiles without errors
- [ ] No breaking changes

## Related
Closes #<issue-number> (if applicable)

🤖 Generated with [Claude Code](https://claude.com/claude-code)
EOF
)"

# Display PR URL
echo "✅ Pull Request created successfully!"
```

**If no:**
- Skip PR creation
- Show instructions: `gh pr create` when ready

### 7. Final Output

Display summary:
```
✅ Push Complete!

Branch: <branch-name>
Commit: <commit-hash>
Remote: <remote-url>
PR: <pr-url> (if created)

Next steps:
- View PR: gh pr view --web
- CI Status: gh pr checks
- Merge when ready: gh pr merge --squash
```

## Optimization Features

1. **Branch Protection**: Prevents accidental push to main/develop
2. **Branch Naming Validation**: Enforces `<username>/<type>-<description>` convention
3. **--no-verify Flag**: Bypasses broken pre-commit hooks (npm, linters)
4. **Smart Upstream**: Automatically sets upstream for new branches
5. **Auto PR Creation**: Optional one-command PR workflow
6. **Commit Message Templates**: Consistent formatting with Claude footer
7. **Safety Prompts**: Warns on non-standard branch names

## Usage Examples

```bash
# Simple push (auto-commit message)
/push

# Push with custom message
/push "feat: add new feature"

# Push + PR in one command
/push --pr
```

## Error Handling

- **If push fails (conflicts)**: Show `git pull --rebase` instructions
- **If PR fails (no gh)**: Show manual PR creation link
- **If protected branch**: Hard stop, require feature branch creation
- **If no changes**: Skip commit, warn user

## Notes

- Uses `--no-verify` to bypass pre-commit hooks (useful when CI tooling is broken)
- Always pushes to feature branch (never main/develop directly)
- PR base is always `main` (matches CLAUDE.md workflow)
- Commit messages follow Conventional Commits spec
