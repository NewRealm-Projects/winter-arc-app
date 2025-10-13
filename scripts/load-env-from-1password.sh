#!/bin/bash
#
# Load environment variables from 1Password
#
# Usage:
#   source scripts/load-env-from-1password.sh production
#   source scripts/load-env-from-1password.sh staging
#

set -e

ENV=${1:-production}

echo "🔐 Loading secrets from 1Password (vault: winter-arc-app, env: $ENV)"

# Check if 1Password CLI is installed
if ! command -v op &> /dev/null; then
    echo "❌ Error: 1Password CLI not found"
    echo "   Install it: https://1password.com/downloads/command-line/"
    return 1
fi

# Check if signed in
if ! op account list &> /dev/null; then
    echo "❌ Error: Not signed in to 1Password"
    echo "   Run: eval \$(op signin)"
    return 1
fi

# Determine which Firebase config to use
if [ "$ENV" = "staging" ]; then
  FIREBASE_ITEM="Firebase Staging"
else
  FIREBASE_ITEM="Firebase Production"
fi

# Load Firebase configuration
echo "📦 Loading Firebase ($FIREBASE_ITEM)..."
export VITE_FIREBASE_API_KEY=$(op read "op://winter-arc-app/$FIREBASE_ITEM/api_key")
export VITE_FIREBASE_AUTH_DOMAIN=$(op read "op://winter-arc-app/$FIREBASE_ITEM/auth_domain")
export VITE_FIREBASE_PROJECT_ID=$(op read "op://winter-arc-app/$FIREBASE_ITEM/project_id")
export VITE_FIREBASE_STORAGE_BUCKET=$(op read "op://winter-arc-app/$FIREBASE_ITEM/storage_bucket")
export VITE_FIREBASE_MESSAGING_SENDER_ID=$(op read "op://winter-arc-app/$FIREBASE_ITEM/messaging_sender_id")
export VITE_FIREBASE_APP_ID=$(op read "op://winter-arc-app/$FIREBASE_ITEM/app_id")

# Load optional services
echo "🔧 Loading optional services..."
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
echo ""
echo "🚀 You can now run: npm run dev"
