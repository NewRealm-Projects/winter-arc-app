#!/bin/bash
#
# Migrate secrets from .env.local to 1Password
#
# Usage:
#   ./scripts/migrate-to-1password.sh
#

set -e

VAULT="winter-arc-app"
ENV_FILE=".env.local"

echo "🔐 Migrating secrets from $ENV_FILE to 1Password vault '$VAULT'"
echo ""

# Check if 1Password CLI is installed
if ! command -v op &> /dev/null; then
    echo "❌ Error: 1Password CLI not found"
    echo "   Install it: https://1password.com/downloads/command-line/"
    exit 1
fi

# Check if signed in
if ! op account list &> /dev/null; then
    echo "❌ Error: Not signed in to 1Password"
    echo "   Run: eval \$(op signin)"
    exit 1
fi

# Check if .env.local exists
if [ ! -f "$ENV_FILE" ]; then
    echo "❌ Error: $ENV_FILE not found"
    exit 1
fi

# Parse .env.local file
echo "📄 Reading $ENV_FILE..."
source $ENV_FILE

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  Creating 1Password Items"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# ============================================================================
# 1. Firebase Production
# ============================================================================
echo "📦 Creating 'Firebase Production' item..."

op item create \
  --vault="$VAULT" \
  --category="API Credential" \
  --title="Firebase Production" \
  api_key="$VITE_FIREBASE_API_KEY" \
  auth_domain="$VITE_FIREBASE_AUTH_DOMAIN" \
  project_id="$VITE_FIREBASE_PROJECT_ID" \
  storage_bucket="$VITE_FIREBASE_STORAGE_BUCKET" \
  messaging_sender_id="$VITE_FIREBASE_MESSAGING_SENDER_ID" \
  app_id="$VITE_FIREBASE_APP_ID" \
  2>/dev/null || echo "   ⚠️  Item already exists, updating..."

# If item exists, update it
if op item get "Firebase Production" --vault="$VAULT" &>/dev/null; then
  op item edit "Firebase Production" \
    --vault="$VAULT" \
    api_key="$VITE_FIREBASE_API_KEY" \
    auth_domain="$VITE_FIREBASE_AUTH_DOMAIN" \
    project_id="$VITE_FIREBASE_PROJECT_ID" \
    storage_bucket="$VITE_FIREBASE_STORAGE_BUCKET" \
    messaging_sender_id="$VITE_FIREBASE_MESSAGING_SENDER_ID" \
    app_id="$VITE_FIREBASE_APP_ID"
  echo "   ✅ Updated"
else
  echo "   ✅ Created"
fi

# ============================================================================
# 2. Firebase Staging (using same values for now - update manually later)
# ============================================================================
echo "📦 Creating 'Firebase Staging' item..."

op item create \
  --vault="$VAULT" \
  --category="API Credential" \
  --title="Firebase Staging" \
  api_key="$VITE_FIREBASE_API_KEY" \
  auth_domain="$VITE_FIREBASE_AUTH_DOMAIN" \
  project_id="$VITE_FIREBASE_PROJECT_ID" \
  storage_bucket="$VITE_FIREBASE_STORAGE_BUCKET" \
  messaging_sender_id="$VITE_FIREBASE_MESSAGING_SENDER_ID" \
  app_id="$VITE_FIREBASE_APP_ID" \
  2>/dev/null || echo "   ⚠️  Item already exists"

echo "   ℹ️  Note: Staging uses same Firebase config as production"
echo "   ℹ️  Update manually if you have separate staging Firebase project"

# ============================================================================
# 3. Google Services
# ============================================================================
echo "🔧 Creating 'Google Services' item..."

op item create \
  --vault="$VAULT" \
  --category="API Credential" \
  --title="Google Services" \
  gemini_api_key="${VITE_GEMINI_API_KEY:-}" \
  recaptcha_site_key="${VITE_RECAPTCHA_SITE_KEY:-}" \
  2>/dev/null || echo "   ⚠️  Item already exists, updating..."

if op item get "Google Services" --vault="$VAULT" &>/dev/null; then
  op item edit "Google Services" \
    --vault="$VAULT" \
    gemini_api_key="${VITE_GEMINI_API_KEY:-}" \
    recaptcha_site_key="${VITE_RECAPTCHA_SITE_KEY:-}"
  echo "   ✅ Updated"
else
  echo "   ✅ Created"
fi

# ============================================================================
# 4. Sentry
# ============================================================================
echo "📊 Creating 'Sentry' item..."

op item create \
  --vault="$VAULT" \
  --category="API Credential" \
  --title="Sentry" \
  dsn="${VITE_SENTRY_DSN:-}" \
  organization="newrealm" \
  project="javascript-react" \
  2>/dev/null || echo "   ⚠️  Item already exists, updating..."

if op item get "Sentry" --vault="$VAULT" &>/dev/null; then
  op item edit "Sentry" \
    --vault="$VAULT" \
    dsn="${VITE_SENTRY_DSN:-}" \
    organization="newrealm" \
    project="javascript-react"
  echo "   ✅ Updated"
else
  echo "   ✅ Created"
fi

echo ""
echo "   ℹ️  Note: Sentry auth_token must be added manually:"
echo "   ℹ️  op item edit 'Sentry' --vault='$VAULT' auth_token='YOUR_TOKEN'"

# ============================================================================
# 5. GitHub Deployment (placeholder - must be added manually)
# ============================================================================
echo "🐙 Creating 'GitHub Deployment' item..."

op item create \
  --vault="$VAULT" \
  --category="API Credential" \
  --title="GitHub Deployment" \
  pages_deploy_token="" \
  2>/dev/null || echo "   ⚠️  Item already exists"

echo "   ⚠️  IMPORTANT: Add your GitHub Personal Access Token manually:"
echo "   ⚠️  op item edit 'GitHub Deployment' --vault='$VAULT' pages_deploy_token='YOUR_GITHUB_TOKEN'"

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  Migration Summary"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "✅ Created/Updated items in 1Password vault '$VAULT':"
echo "   1. Firebase Production"
echo "   2. Firebase Staging"
echo "   3. Google Services"
echo "   4. Sentry (DSN only)"
echo "   5. GitHub Deployment (placeholder)"
echo ""
echo "⚠️  Manual steps required:"
echo "   1. Add Sentry auth_token:"
echo "      op item edit 'Sentry' --vault='$VAULT' auth_token='YOUR_TOKEN'"
echo ""
echo "   2. Add GitHub Pages Deploy Token:"
echo "      op item edit 'GitHub Deployment' --vault='$VAULT' pages_deploy_token='YOUR_TOKEN'"
echo ""
echo "   3. Update Firebase Staging if you have separate project:"
echo "      op item edit 'Firebase Staging' --vault='$VAULT' [fields...]"
echo ""
echo "🧪 Test your setup:"
echo "   npm run dev:1p-prod"
echo ""
echo "📖 Full documentation:"
echo "   docs/1PASSWORD_SETUP.md"
echo "   docs/1PASSWORD_QUICKSTART.md"
echo ""
