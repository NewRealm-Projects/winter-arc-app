# Branch Protection Rules Setup

This document describes the required Branch Protection Rules for the Winter Arc project.

## 🎯 Git-Flow Model

```
┌─────────────┐
│  feature/*  │  ← Feature branches (unprotected)
└──────┬──────┘
       │ PR (CI must pass)
       ▼
┌─────────────┐
│   develop   │  ← Protected (Staging)
└──────┬──────┘
       │ PR (CI + Review)
       ▼
┌─────────────┐
│    main     │  ← Protected (Production)
└─────────────┘
```

**Rules:**
- ✅ Feature branches → `develop` (CI must pass)
- ✅ Only `develop` → `main` (CI + Review required)
- ❌ **NO** direct pushes to `main` or `develop`
- ❌ **NO** feature branches directly to `main`

## 🎯 Why Branch Protection?

Branch protection ensures:
- ✅ All code passes quality checks before merge
- ✅ No direct pushes to protected branches
- ✅ Code reviews are mandatory
- ✅ Enforce Git-Flow workflow
- ✅ CI/CD workflows complete successfully

---

## 🔒 Required Protection Rules

### 1. `main` Branch (Production)

**Navigate to:** Settings → Branches → Add branch protection rule

**Branch name pattern:** `main`

#### Required Settings

**✅ Require a pull request before merging**
- Require approvals: **2** (higher bar for production)
- Dismiss stale pull request approvals when new commits are pushed: **✓**
- Require review from Code Owners: **✓** (if CODEOWNERS file exists)

**✅ Require status checks to pass before merging**
- Require branches to be up to date before merging: **✓**

**Required status checks (add these):**
```
CI / ci-success (CI ✅)
Enforce Git-Flow / enforce-develop-to-main (Enforce develop → main)
```

**Note:** The `Enforce Git-Flow` check ensures only PRs from `develop` are allowed.
This is automatically enforced by the workflow, providing clear feedback to developers.

**To add status checks:**
1. Create a PR first to trigger CI workflow
2. Once workflow runs, status checks appear in the search box
3. Search for "CI" and add all checks listed above

**✅ Require conversation resolution before merging**
- All PR comments must be resolved: **✓**

**✅ Require signed commits** (optional, recommended for security)
- Require signed commits: **✓**

**✅ Require linear history**
- Prevent merge commits: **□** (allow merge commits for clarity)
- **Recommended:** Use "Squash and merge" for feature → develop
- **Recommended:** Use "Merge commit" for develop → main (preserves history)

**✅ Do not allow bypassing the above settings**
- Do not allow bypass: **✓**
- Include administrators: **✓** (even admins must follow rules)

**✅ Restrict pushes that create matching branches** ⚠️ **CRITICAL**
- Restrict who can push to matching branches: **✓**
- **ONLY** allow pushes from: `develop` branch
- This ensures only develop → main merges are possible

**Alternative (GitHub UI):**
- In "Rules applied to everyone including administrators"
- Enable "Restrict who can push to matching branches"
- Add exception: Only allow PRs from `develop` branch

**✅ Lock branch**
- Lock branch to read-only: **□** (only if you want to freeze the branch)

---

### 2. `develop` Branch (Staging) ⚠️ **REQUIRED**

**Branch name pattern:** `develop`

**Purpose:** All feature branches merge here first. This is your staging environment.

#### Required Settings

**✅ Require a pull request before merging**
- Require approvals: **1**
- Dismiss stale pull request approvals: **✓**
- Require review from Code Owners: **□** (optional)

**✅ Require status checks to pass before merging**
- Require branches to be up to date before merging: **✓**

**Required status checks:**
```
CI / ci-success (CI ✅)
```

**Note:** Only the main CI success check is required. Individual jobs (lint, typecheck, test, build)
are dependencies of `ci-success`, so they run automatically.

**✅ Require conversation resolution before merging**
- All PR comments must be resolved: **✓**

**✅ Require linear history**
- Prevent merge commits: **□** (allow merge commits)
- **Recommended:** Use "Squash and merge" for feature branches

**✅ Do not allow bypassing the above settings**
- Do not allow bypass: **✓**
- Include administrators: **✓**

**✅ Restrict pushes**
- Restrict who can push to matching branches: **✓**
- **ONLY** allow pushes from: PR branches (feature/*, fix/*, etc.)
- This ensures all changes go through PR review

---

### 3. Feature Branches (Optional Protection)

**Branch name pattern:** `feat/*` or `fix/*`

#### Optional Settings

**✅ Require status checks to pass before merging**
- CI must pass: **✓**

This ensures feature branches are tested before creating PRs.

---

## 🎯 Workflow Examples

### Feature Branch → Develop
```bash
# Create feature branch from develop
git checkout develop
git pull origin develop
git checkout -b feat/awesome-feature

# Make changes, commit
git add .
git commit -m "feat: Add awesome feature"
git push origin feat/awesome-feature

# Create PR on GitHub: feat/awesome-feature → develop
# ✅ CI runs automatically
# ✅ Request 1 review
# ✅ Merge (squash recommended)
```

### Develop → Main (Release)
```bash
# After features are tested on staging
git checkout develop
git pull origin develop

# Create PR on GitHub: develop → main
# ✅ CI runs automatically
# ✅ Request 2 reviews
# ✅ Merge (merge commit recommended to preserve history)
# 🚀 Production deployment runs automatically
```

---

## 📋 Step-by-Step Setup

### Via GitHub UI (Recommended)

1. Go to your repository: https://github.com/NewRealm-Projects/winter-arc-app
2. Click **Settings** (top menu)
3. Click **Branches** (left sidebar)
4. Click **Add branch protection rule**
5. Enter branch name pattern: `main`
6. Configure settings as described above
7. Click **Create** at the bottom
8. Repeat for `develop` branch

### Via GitHub Rulesets (Modern Alternative, Recommended)

GitHub Rulesets are newer and more powerful than Branch Protection Rules.

1. Go to: https://github.com/NewRealm-Projects/winter-arc-app/settings/rules
2. Click **New ruleset** → **New branch ruleset**
3. Name: `Main Branch Protection`
4. Target: `Include default branch` (main)
5. Add rules:
   - ✅ Require a pull request before merging
   - ✅ Require status checks to pass
   - ✅ Require conversation resolution
   - ✅ Block force pushes
6. Enforcement: **Active**
7. Click **Create**
8. Repeat for `develop` branch

### Via GitHub CLI

```bash
# Install GitHub CLI if not already installed
# https://cli.github.com/

# Protect main branch
gh api repos/NewRealm-Projects/winter-arc-app/branches/main/protection \
  --method PUT \
  --field required_status_checks='{"strict":true,"contexts":["CI / ci-success"]}' \
  --field enforce_admins=true \
  --field required_pull_request_reviews='{"required_approving_review_count":1}' \
  --field restrictions=null

# Protect develop branch
gh api repos/NewRealm-Projects/winter-arc-app/branches/develop/protection \
  --method PUT \
  --field required_status_checks='{"strict":true,"contexts":["CI / ci-success"]}' \
  --field enforce_admins=true \
  --field required_pull_request_reviews='{"required_approving_review_count":1}' \
  --field restrictions=null
```

---

## 🧪 Testing Branch Protection

After setup, test that protection works:

### Test 1: Direct Push (should fail)
```bash
git checkout main
echo "test" >> README.md
git commit -am "test: direct push"
git push origin main
# Expected: ❌ Error: protected branch
```

### Test 2: PR without CI (should fail)
```bash
git checkout -b test/branch-protection
echo "test" >> README.md
git commit -am "test: PR without CI"
git push origin test/branch-protection
# Create PR on GitHub
# Expected: ❌ "Some checks haven't completed yet"
```

### Test 3: PR with CI success (should pass)
```bash
git checkout -b test/branch-protection-pass
echo "test" >> README.md
git commit -am "test: PR with CI"
git push origin test/branch-protection-pass
# Create PR on GitHub
# Wait for CI to pass
# Expected: ✅ "All checks have passed"
# Expected: ✅ "Merge pull request" button enabled
```

---

## 🚨 Common Issues

### Issue: Can't find status checks
**Solution:** Create a PR first to trigger CI. Status checks appear after first workflow run.

### Issue: Status checks not required
**Solution:**
1. Go to Settings → Branches → Edit rule
2. Check "Require status checks to pass"
3. Search for "CI" in the status check search box
4. Add all CI jobs

### Issue: Admin can still push directly
**Solution:**
1. Go to Settings → Branches → Edit rule
2. Check "Do not allow bypassing"
3. Check "Include administrators"

### Issue: PR shows "Merge pull request" before checks complete
**Solution:**
1. Go to Settings → Branches → Edit rule
2. Check "Require branches to be up to date before merging"

---

## 🔐 Security Best Practices

### 1. CODEOWNERS File
Create `.github/CODEOWNERS` to automatically request reviews:

```
# Global owners
* @maintainer-username

# Workflow owners
/.github/workflows/ @devops-team

# Security-sensitive files
/src/config/ @security-team
```

### 2. Required Reviewers
Configure required reviewers for sensitive areas:
- Database migrations: Backend team
- Auth changes: Security team
- CI/CD changes: DevOps team

### 3. Secrets Management
- Never commit secrets to Git
- Use GitHub Secrets for sensitive values
- Rotate secrets regularly

### 4. Dependabot Alerts
Enable Dependabot security alerts:
1. Settings → Code security and analysis
2. Enable "Dependabot alerts"
3. Enable "Dependabot security updates"

---

## 📊 Monitoring

### Check Protection Status
```bash
gh api repos/NewRealm-Projects/winter-arc-app/branches/main/protection
```

### View Required Checks
```bash
gh api repos/NewRealm-Projects/winter-arc-app/branches/main/protection/required_status_checks
```

### List Protected Branches
```bash
gh api repos/NewRealm-Projects/winter-arc-app/branches --jq '.[] | select(.protected==true) | .name'
```

---

## 🎓 Resources

- [GitHub Branch Protection Docs](https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-protected-branches/about-protected-branches)
- [Required Status Checks](https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-protected-branches/about-protected-branches#require-status-checks-before-merging)
- [CODEOWNERS Syntax](https://docs.github.com/en/repositories/managing-your-repositorys-settings-and-features/customizing-your-repository/about-code-owners)

---

## ✅ Checklist

After setup, verify:

### Main Branch
- [ ] `main` branch is protected
- [ ] Required status checks: CI workflow
- [ ] Required approvals: **2**
- [ ] Direct pushes blocked
- [ ] Admins cannot bypass
- [ ] Only PRs from `develop` allowed
- [ ] Branches must be up-to-date
- [ ] Signed commits (optional)

### Develop Branch
- [ ] `develop` branch is protected
- [ ] Required status checks: CI workflow
- [ ] Required approvals: **1**
- [ ] Direct pushes blocked
- [ ] Admins cannot bypass
- [ ] Branches must be up-to-date

### Optional
- [ ] CODEOWNERS file created
- [ ] Feature branch naming convention enforced
- [ ] Dependabot enabled
- [ ] CodeQL scanning enabled

---

## 📊 Branch Flow Summary

```
┌──────────────────────────────────────────────────────────────┐
│                     Git-Flow Model                           │
└──────────────────────────────────────────────────────────────┘

   Developer                 GitHub                Environments
   ─────────                 ──────                ────────────

1. Create feature
   git checkout -b
   feat/xyz
        │
        │ git push
        ▼
2. Open PR ─────────────► feat/xyz → develop
                                   │
                                   │ CI runs
                                   ▼
                                ✅ Tests pass
                                   │
                                   │ Review (1)
                                   ▼
3. Merge ───────────────► develop branch ──────► 🧪 STAGING
                                   │              staging.winterarc.de
                                   │
                           (Test on staging)
                                   │
                                   ▼
4. Open Release PR ────► develop → main
                                   │
                                   │ CI runs
                                   ▼
                                ✅ Tests pass
                                   │
                                   │ Review (2)
                                   ▼
5. Merge ───────────────► main branch ─────────► 🚀 PRODUCTION
                                                  app.winterarc.de

```

**Key Points:**
- **Feature branches** are unprotected (developers can force push)
- **Develop** requires CI + 1 review
- **Main** requires CI + 2 reviews + only from develop
- **No** direct commits to main or develop
- **All** changes go through PRs

---

## 🔐 Enforcement Matrix

| Action | feature/* | develop | main |
|--------|-----------|---------|------|
| Direct push | ✅ Allowed | ❌ Blocked | ❌ Blocked |
| Force push | ✅ Allowed | ❌ Blocked | ❌ Blocked |
| PR without CI | ❌ Blocked | ❌ Blocked | ❌ Blocked |
| PR without review | ✅ Can merge | ❌ Blocked (1) | ❌ Blocked (2) |
| PR from fork | ✅ Allowed | ✅ Allowed | ❌ Blocked* |
| Delete branch | ✅ Allowed | ❌ Blocked | ❌ Blocked |
| Bypass by admin | ✅ Allowed | ❌ Blocked | ❌ Blocked |

*Only PRs from `develop` are allowed to `main`

---

**Last Updated:** 2025-01-09
