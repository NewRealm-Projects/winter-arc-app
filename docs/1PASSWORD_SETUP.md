# 1Password Secrets Management Setup

Comprehensive guide for integrating 1Password as the secrets management solution for Winter Arc App.

**Vault Name**: `winter-arc-app`

---

## Table of Contents

1. [Overview](#overview)
2. [1Password Vault Structure](#1password-vault-structure)
3. [Local Development Setup](#local-development-setup)
4. [GitHub Actions Setup](#github-actions-setup)
5. [Migration Checklist](#migration-checklist)
6. [Troubleshooting](#troubleshooting)

---

## Overview

### Why 1Password?

- ✅ **Centralized Secrets**: All secrets in one secure location
- ✅ **No Git Exposure**: Secrets never touch the repository
- ✅ **Team Collaboration**: Easy sharing within the team
- ✅ **Audit Trail**: Track who accessed what and when
- ✅ **CI/CD Integration**: Seamless GitHub Actions integration
- ✅ **Local Development**: Direct CLI access without `.env` files

### Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    1Password Vault                          │
│                   "winter-arc-app"                           │
│                                                               │
│  ┌──────────────────┐  ┌──────────────────┐                │
│  │ Firebase Prod    │  │ Firebase Staging │                │
│  │ - API Key        │  │ - API Key        │                │
│  │ - Project ID     │  │ - Project ID     │                │
│  │ - etc.           │  │ - etc.           │                │
│  └──────────────────┘  └──────────────────┘                │
│                                                               │
│  ┌──────────────────┐  ┌──────────────────┐                │
│  │ Sentry           │  │ GitHub           │                │
│  │ - Auth Token     │  │ - Deploy Token   │                │
│  │ - Org            │  │ - API Token      │                │
│  │ - Project        │  │                  │                │
│  └──────────────────┘  └──────────────────┘                │
└─────────────────────────────────────────────────────────────┘
                             │
          ┌──────────────────┴──────────────────┐
          │                                      │
    ┌─────▼──────┐                      ┌───────▼────────┐
    │   Local    │                      │ GitHub Actions │
    │ Development│                      │   (CI/CD)      │
    │            │                      │                │
    │ 1Password  │                      │ 1Password      │
    │ CLI (op)   │                      │ Action         │
    └────────────┘                      └────────────────┘
```

---

## 1Password Vault Structure

### Vault Organization

Create items in your `winter-arc-app` vault with the following structure:

#### 1. Firebase Production

**Item Name**: `Firebase Production`
**Item Type**: `API Credential`

| Field Name | 1Password Reference | Value Example |
|------------|-------------------|---------------|
| API Key | `op://winter-arc-app/Firebase Production/api_key` | `AIza...` |
| Auth Domain | `op://winter-arc-app/Firebase Production/auth_domain` | `project.firebaseapp.com` |
| Project ID | `op://winter-arc-app/Firebase Production/project_id` | `project-id` |
| Storage Bucket | `op://winter-arc-app/Firebase Production/storage_bucket` | `project.appspot.com` |
| Messaging Sender ID | `op://winter-arc-app/Firebase Production/messaging_sender_id` | `123456789` |
| App ID | `op://winter-arc-app/Firebase Production/app_id` | `1:123:web:abc` |

#### 2. Firebase Staging

**Item Name**: `Firebase Staging`
**Item Type**: `API Credential`

| Field Name | 1Password Reference | Value Example |
|------------|-------------------|---------------|
| API Key | `op://winter-arc-app/Firebase Staging/api_key` | `AIza...` |
| Auth Domain | `op://winter-arc-app/Firebase Staging/auth_domain` | `project-staging.firebaseapp.com` |
| Project ID | `op://winter-arc-app/Firebase Staging/project_id` | `project-staging-id` |
| Storage Bucket | `op://winter-arc-app/Firebase Staging/storage_bucket` | `project-staging.appspot.com` |
| Messaging Sender ID | `op://winter-arc-app/Firebase Staging/messaging_sender_id` | `987654321` |
| App ID | `op://winter-arc-app/Firebase Staging/app_id` | `1:987:web:xyz` |

#### 3. Sentry

**Item Name**: `Sentry`
**Item Type**: `API Credential`

| Field Name | 1Password Reference | Value Example |
|------------|-------------------|---------------|
| Auth Token | `op://winter-arc-app/Sentry/auth_token` | `sntrys_...` |
| Organization | `op://winter-arc-app/Sentry/organization` | `newrealm` |
| Project | `op://winter-arc-app/Sentry/project` | `javascript-react` |
| DSN (optional) | `op://winter-arc-app/Sentry/dsn` | `https://...@sentry.io/...` |

#### 4. GitHub

**Item Name**: `GitHub Deployment`
**Item Type**: `API Credential`

| Field Name | 1Password Reference | Value Example |
|------------|-------------------|---------------|
| Pages Deploy Token | `op://winter-arc-app/GitHub Deployment/pages_deploy_token` | `ghp_...` |

#### 5. Optional Services

**Item Name**: `Google Services`
**Item Type**: `API Credential`

| Field Name | 1Password Reference | Value Example |
|------------|-------------------|---------------|
| Gemini API Key | `op://winter-arc-app/Google Services/gemini_api_key` | `AIza...` |
| reCAPTCHA Site Key | `op://winter-arc-app/Google Services/recaptcha_site_key` | `6Lc...` |

---

## Local Development Setup

### Step 1: Install 1Password CLI

**Windows:**
```powershell
# Using winget
winget install AgileBits.1Password.CLI

# Or download from: https://1password.com/downloads/command-line/
```

**macOS:**
```bash
brew install 1password-cli
```

**Linux:**
```bash
# Download and install from: https://1password.com/downloads/command-line/
```

### Step 2: Sign In to 1Password CLI

```bash
# Sign in to your 1Password account
op account add

# Verify connection
op account list

# Sign in (if not already signed in)
eval $(op signin)
```

### Step 3: Test Access to Your Vault

```bash
# List items in your vault
op item list --vault winter-arc-app

# Test retrieving a secret
op read "op://winter-arc-app/Firebase Production/api_key"
```

### Step 4: Create Environment Loading Script

**File**: `scripts/load-env-from-1password.sh`

```bash
#!/bin/bash
#
# Load environment variables from 1Password
#
# Usage:
#   source scripts/load-env-from-1password.sh production
#   source scripts/load-env-from-1password.sh staging
#

ENV=${1:-production}

echo "🔐 Loading secrets from 1Password (vault: winter-arc-app, env: $ENV)"

# Determine which Firebase config to use
if [ "$ENV" = "staging" ]; then
  FIREBASE_ITEM="Firebase Staging"
else
  FIREBASE_ITEM="Firebase Production"
fi

# Load Firebase configuration
export VITE_FIREBASE_API_KEY=$(op read "op://winter-arc-app/$FIREBASE_ITEM/api_key")
export VITE_FIREBASE_AUTH_DOMAIN=$(op read "op://winter-arc-app/$FIREBASE_ITEM/auth_domain")
export VITE_FIREBASE_PROJECT_ID=$(op read "op://winter-arc-app/$FIREBASE_ITEM/project_id")
export VITE_FIREBASE_STORAGE_BUCKET=$(op read "op://winter-arc-app/$FIREBASE_ITEM/storage_bucket")
export VITE_FIREBASE_MESSAGING_SENDER_ID=$(op read "op://winter-arc-app/$FIREBASE_ITEM/messaging_sender_id")
export VITE_FIREBASE_APP_ID=$(op read "op://winter-arc-app/$FIREBASE_ITEM/app_id")

# Load optional services
export VITE_GEMINI_API_KEY=$(op read "op://winter-arc-app/Google Services/gemini_api_key" 2>/dev/null || echo "")
export VITE_RECAPTCHA_SITE_KEY=$(op read "op://winter-arc-app/Google Services/recaptcha_site_key" 2>/dev/null || echo "")
export VITE_SENTRY_DSN=$(op read "op://winter-arc-app/Sentry/dsn" 2>/dev/null || echo "")

# Load Sentry (for builds with source maps)
export SENTRY_AUTH_TOKEN=$(op read "op://winter-arc-app/Sentry/auth_token" 2>/dev/null || echo "")
export SENTRY_ORG=$(op read "op://winter-arc-app/Sentry/organization" 2>/dev/null || echo "newrealm")
export SENTRY_PROJECT=$(op read "op://winter-arc-app/Sentry/project" 2>/dev/null || echo "javascript-react")

echo "✅ Environment variables loaded from 1Password"
echo "📦 Firebase Project: $VITE_FIREBASE_PROJECT_ID"
echo "🔧 Environment: $ENV"
```

**Make it executable:**
```bash
chmod +x scripts/load-env-from-1password.sh
```

### Step 5: Update npm Scripts

**File**: `package.json` (add these scripts)

```json
{
  "scripts": {
    "dev:prod": "op run --env-file=.env.1password.production -- npm run dev",
    "dev:staging": "op run --env-file=.env.1password.staging -- npm run dev",
    "build:prod": "op run --env-file=.env.1password.production -- npm run build",
    "build:staging": "op run --env-file=.env.1password.staging -- npm run build"
  }
}
```

### Step 6: Create 1Password .env Templates

**File**: `.env.1password.production`

```bash
# Production environment - loaded from 1Password
VITE_FIREBASE_API_KEY=op://winter-arc-app/Firebase Production/api_key
VITE_FIREBASE_AUTH_DOMAIN=op://winter-arc-app/Firebase Production/auth_domain
VITE_FIREBASE_PROJECT_ID=op://winter-arc-app/Firebase Production/project_id
VITE_FIREBASE_STORAGE_BUCKET=op://winter-arc-app/Firebase Production/storage_bucket
VITE_FIREBASE_MESSAGING_SENDER_ID=op://winter-arc-app/Firebase Production/messaging_sender_id
VITE_FIREBASE_APP_ID=op://winter-arc-app/Firebase Production/app_id
VITE_GEMINI_API_KEY=op://winter-arc-app/Google Services/gemini_api_key
VITE_RECAPTCHA_SITE_KEY=op://winter-arc-app/Google Services/recaptcha_site_key
VITE_SENTRY_DSN=op://winter-arc-app/Sentry/dsn
```

**File**: `.env.1password.staging`

```bash
# Staging environment - loaded from 1Password
VITE_FIREBASE_API_KEY=op://winter-arc-app/Firebase Staging/api_key
VITE_FIREBASE_AUTH_DOMAIN=op://winter-arc-app/Firebase Staging/auth_domain
VITE_FIREBASE_PROJECT_ID=op://winter-arc-app/Firebase Staging/project_id
VITE_FIREBASE_STORAGE_BUCKET=op://winter-arc-app/Firebase Staging/storage_bucket
VITE_FIREBASE_MESSAGING_SENDER_ID=op://winter-arc-app/Firebase Staging/messaging_sender_id
VITE_FIREBASE_APP_ID=op://winter-arc-app/Firebase Staging/app_id
VITE_GEMINI_API_KEY=op://winter-arc-app/Google Services/gemini_api_key
VITE_RECAPTCHA_SITE_KEY=op://winter-arc-app/Google Services/recaptcha_site_key
VITE_SENTRY_DSN=op://winter-arc-app/Sentry/dsn
```

**Add to `.gitignore`**:
```bash
# 1Password environment templates (safe to commit - contain references, not secrets)
# .env.1password.*  # These can be committed as they only contain op:// references
```

### Step 7: Run Development Server

```bash
# Production environment
npm run dev:prod

# Staging environment
npm run dev:staging
```

---

## GitHub Actions Setup

### Step 1: Create 1Password Service Account

1. Go to your 1Password account settings
2. Navigate to **Service Accounts**
3. Click **Create Service Account**
4. Name it: `GitHub Actions - Winter Arc App`
5. Grant access to the `winter-arc-app` vault
6. Copy the **Service Account Token** (starts with `ops_`)

### Step 2: Add Service Account Token to GitHub

```bash
# Add the token as a GitHub secret
# Repository Settings → Secrets and variables → Actions → New repository secret

Name: OP_SERVICE_ACCOUNT_TOKEN
Value: ops_xxxxxxxxxxxxxxxxxxxxx
```

### Step 3: Update GitHub Actions Workflows

**File**: `.github/workflows/deploy-production.yml`

```yaml
name: Deploy Production

on:
  workflow_run:
    workflows: ['CI']
    types: [completed]
    branches: [main]
  workflow_dispatch:

concurrency:
  group: deploy-production
  cancel-in-progress: false

permissions:
  contents: read

jobs:
  deploy:
    name: Deploy to Production
    runs-on: ubuntu-latest
    timeout-minutes: 15
    environment:
      name: production
      url: https://app.winterarc.newrealm.de

    if: |
      github.event_name == 'workflow_dispatch' ||
      github.event.workflow_run.conclusion == 'success'

    steps:
      - name: Checkout code
        uses: actions/checkout@v4
        with:
          ref: main

      - name: Load secrets from 1Password
        uses: 1password/load-secrets-action@v2
        with:
          export-env: true
        env:
          OP_SERVICE_ACCOUNT_TOKEN: ${{ secrets.OP_SERVICE_ACCOUNT_TOKEN }}
          VITE_FIREBASE_API_KEY: op://winter-arc-app/Firebase Production/api_key
          VITE_FIREBASE_AUTH_DOMAIN: op://winter-arc-app/Firebase Production/auth_domain
          VITE_FIREBASE_PROJECT_ID: op://winter-arc-app/Firebase Production/project_id
          VITE_FIREBASE_STORAGE_BUCKET: op://winter-arc-app/Firebase Production/storage_bucket
          VITE_FIREBASE_MESSAGING_SENDER_ID: op://winter-arc-app/Firebase Production/messaging_sender_id
          VITE_FIREBASE_APP_ID: op://winter-arc-app/Firebase Production/app_id
          VITE_GEMINI_API_KEY: op://winter-arc-app/Google Services/gemini_api_key
          VITE_RECAPTCHA_SITE_KEY: op://winter-arc-app/Google Services/recaptcha_site_key
          SENTRY_AUTH_TOKEN: op://winter-arc-app/Sentry/auth_token
          SENTRY_ORG: op://winter-arc-app/Sentry/organization
          SENTRY_PROJECT: op://winter-arc-app/Sentry/project
          PAGES_DEPLOY_TOKEN: op://winter-arc-app/GitHub Deployment/pages_deploy_token

      - name: Setup dependencies
        uses: ./.github/actions/setup-deps

      - name: Build for production
        run: npm run build
        env:
          VITE_APP_ENV: 'production'
          VITE_BASE_PATH: '/'
          SENTRY_RELEASE: ${{ github.sha }}

      - name: Copy CNAME for production
        run: |
          if [ -f "ops/pages/CNAME.prod" ]; then
            echo "📄 Copying CNAME for production domain"
            cp ops/pages/CNAME.prod dist/CNAME
            cat dist/CNAME
          else
            echo "⚠️ No CNAME.prod file found"
          fi

      - name: Deploy to production pages repository
        uses: JamesIves/github-pages-deploy-action@v4
        with:
          repository-name: NewRealm-Projects/winter-arc-app-prod
          branch: gh-pages
          folder: dist
          token: ${{ env.PAGES_DEPLOY_TOKEN }}
          clean: true
          commit-message: |
            🚀 Deploy production build from ${{ github.sha }}

            Version: $(node -p "require('./package.json').version")
            Commit: ${{ github.event.head_commit.message }}
            Author: ${{ github.event.head_commit.author.name }}

      - name: Deployment summary
        run: |
          echo "✅ Production deployment successful!"
          echo ""
          echo "🌐 URL: https://app.winterarc.newrealm.de"
          echo "📦 Version: $(node -p "require('./package.json').version")"
          echo "🔖 Commit: ${{ github.sha }}"
          echo "👤 Author: ${{ github.event.head_commit.author.name }}"
          echo ""
          echo "📊 Deployment time: $(date -u +"%Y-%m-%d %H:%M:%S UTC")"
```

**File**: `.github/workflows/deploy-staging.yml`

```yaml
name: Deploy Staging

on:
  workflow_run:
    workflows: ['CI']
    types: [completed]
    branches: [develop]
  workflow_dispatch:

concurrency:
  group: deploy-staging
  cancel-in-progress: false

permissions:
  contents: read

jobs:
  deploy:
    name: Deploy to Staging
    runs-on: ubuntu-latest
    timeout-minutes: 15
    environment:
      name: staging
      url: https://staging.winterarc.newrealm.de

    if: |
      github.event_name == 'workflow_dispatch' ||
      github.event.workflow_run.conclusion == 'success'

    steps:
      - name: Checkout code
        uses: actions/checkout@v4
        with:
          ref: develop

      - name: Load secrets from 1Password
        uses: 1password/load-secrets-action@v2
        with:
          export-env: true
        env:
          OP_SERVICE_ACCOUNT_TOKEN: ${{ secrets.OP_SERVICE_ACCOUNT_TOKEN }}
          VITE_FIREBASE_API_KEY: op://winter-arc-app/Firebase Staging/api_key
          VITE_FIREBASE_AUTH_DOMAIN: op://winter-arc-app/Firebase Staging/auth_domain
          VITE_FIREBASE_PROJECT_ID: op://winter-arc-app/Firebase Staging/project_id
          VITE_FIREBASE_STORAGE_BUCKET: op://winter-arc-app/Firebase Staging/storage_bucket
          VITE_FIREBASE_MESSAGING_SENDER_ID: op://winter-arc-app/Firebase Staging/messaging_sender_id
          VITE_FIREBASE_APP_ID: op://winter-arc-app/Firebase Staging/app_id
          VITE_GEMINI_API_KEY: op://winter-arc-app/Google Services/gemini_api_key
          VITE_RECAPTCHA_SITE_KEY: op://winter-arc-app/Google Services/recaptcha_site_key
          SENTRY_AUTH_TOKEN: op://winter-arc-app/Sentry/auth_token
          SENTRY_ORG: op://winter-arc-app/Sentry/organization
          SENTRY_PROJECT: op://winter-arc-app/Sentry/project
          PAGES_DEPLOY_TOKEN: op://winter-arc-app/GitHub Deployment/pages_deploy_token

      - name: Setup dependencies
        uses: ./.github/actions/setup-deps

      - name: Build for staging
        run: npm run build
        env:
          VITE_APP_ENV: 'staging'
          VITE_BASE_PATH: '/'
          SENTRY_RELEASE: ${{ github.sha }}

      - name: Copy CNAME for staging
        run: |
          if [ -f "ops/pages/CNAME.staging" ]; then
            echo "📄 Copying CNAME for staging domain"
            cp ops/pages/CNAME.staging dist/CNAME
            cat dist/CNAME
          else
            echo "⚠️ No CNAME.staging file found"
          fi

      - name: Deploy to staging pages repository
        uses: JamesIves/github-pages-deploy-action@v4
        with:
          repository-name: NewRealm-Projects/winter-arc-app-staging
          branch: gh-pages
          folder: dist
          token: ${{ env.PAGES_DEPLOY_TOKEN }}
          clean: false
          clean-exclude: 'pr-*'
          single-commit: false
          git-config-name: github-actions[bot]
          git-config-email: github-actions[bot]@users.noreply.github.com
          commit-message: |
            🧪 Deploy staging build from ${{ github.sha }}

            Version: $(node -p "require('./package.json').version")
            Commit: ${{ github.event.head_commit.message }}
            Author: ${{ github.event.head_commit.author.name }}

      - name: Deployment summary
        run: |
          echo "✅ Staging deployment successful!"
          echo ""
          echo "🌐 URL: https://staging.winterarc.newrealm.de"
          echo "📦 Version: $(node -p "require('./package.json').version")"
          echo "🔖 Commit: ${{ github.sha }}"
          echo "👤 Author: ${{ github.event.head_commit.author.name }}"
          echo ""
          echo "📊 Deployment time: $(date -u +"%Y-%m-%d %H:%M:%S UTC")"
```

---

## Migration Checklist

### Phase 1: Setup (Do First)

- [ ] Install 1Password CLI locally
- [ ] Create items in `winter-arc-app` vault:
  - [ ] Firebase Production
  - [ ] Firebase Staging
  - [ ] Sentry
  - [ ] GitHub Deployment
  - [ ] Google Services (optional)
- [ ] Test 1Password CLI access: `op item list --vault winter-arc-app`
- [ ] Test secret retrieval: `op read "op://winter-arc-app/Firebase Production/api_key"`

### Phase 2: Local Development

- [ ] Create `scripts/load-env-from-1password.sh`
- [ ] Create `.env.1password.production`
- [ ] Create `.env.1password.staging`
- [ ] Update `package.json` with 1Password scripts
- [ ] Test local development: `npm run dev:prod`
- [ ] Verify app works with 1Password secrets

### Phase 3: GitHub Actions

- [ ] Create 1Password Service Account
- [ ] Add `OP_SERVICE_ACCOUNT_TOKEN` to GitHub Secrets
- [ ] Update `deploy-production.yml`
- [ ] Update `deploy-staging.yml`
- [ ] Test deployment workflows (manual trigger first)

### Phase 4: Cleanup

- [ ] Remove old `.env` files (keep `.env.example` for documentation)
- [ ] Remove secrets from GitHub repository settings (after confirming 1Password works)
- [ ] Update `.gitignore` to exclude `.env*` but allow `.env.1password.*`
- [ ] Update team documentation
- [ ] Update CLAUDE.md with 1Password instructions

### Phase 5: Verification

- [ ] Verify production deployment works
- [ ] Verify staging deployment works
- [ ] Verify local development works for all team members
- [ ] Run security scan: `npm run lint:secrets`
- [ ] Confirm no secrets in repository: `node scripts/check-secrets.mjs --history`

---

## Troubleshooting

### Local Development Issues

**Error: `op: command not found`**
```bash
# Install 1Password CLI (see Step 1)
# Verify installation:
which op
op --version
```

**Error: `[ERROR] 401: Invalid token`**
```bash
# Sign in again
eval $(op signin)

# Or re-authenticate
op account add --force
```

**Error: `[ERROR] item "Firebase Production" isn't in vault "winter-arc-app"`**
```bash
# List items to verify names
op item list --vault winter-arc-app

# Check exact item name (case-sensitive)
op item get "Firebase Production" --vault winter-arc-app
```

### GitHub Actions Issues

**Error: `401 Unauthorized` in GitHub Actions**
```bash
# Check service account token is valid
# Regenerate token in 1Password and update GitHub secret
```

**Error: `Item not found`**
```bash
# Verify item names match exactly in workflow files
# Check service account has access to vault
```

**Secrets not loading**
```bash
# Ensure OP_SERVICE_ACCOUNT_TOKEN is set in GitHub
# Verify export-env: true in load-secrets-action
# Check 1Password references use correct format: op://vault/item/field
```

### Best Practices

1. **Never commit real secrets** - Always use 1Password references
2. **Use descriptive item names** - Makes troubleshooting easier
3. **Test locally first** - Before pushing to CI/CD
4. **Rotate secrets regularly** - Update in 1Password, redeploy
5. **Monitor access logs** - Review who accessed which secrets
6. **Use separate items** - For production, staging, development
7. **Document field names** - Keep this guide updated

---

## Additional Resources

- [1Password CLI Documentation](https://developer.1password.com/docs/cli/)
- [1Password GitHub Actions](https://github.com/1password/load-secrets-action)
- [1Password Service Accounts](https://developer.1password.com/docs/service-accounts/)
- [Security Incident Response Guide](./SECURITY_INCIDENT_RESPONSE.md)

---

**Last Updated**: 2025-10-13
**Maintained By**: Winter Arc Development Team
