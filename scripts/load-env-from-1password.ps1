#
# Load environment variables from 1Password (PowerShell)
#
# Usage:
#   .\scripts\load-env-from-1password.ps1 production
#   .\scripts\load-env-from-1password.ps1 staging
#

param(
    [Parameter(Position=0)]
    [string]$Environment = "production"
)

$ErrorActionPreference = "Stop"

Write-Host "🔐 Loading secrets from 1Password (vault: winter-arc-app, env: $Environment)" -ForegroundColor Cyan

# Check if 1Password CLI is installed
if (-not (Get-Command op -ErrorAction SilentlyContinue)) {
    Write-Host "❌ Error: 1Password CLI not found" -ForegroundColor Red
    Write-Host "   Install it: https://1password.com/downloads/command-line/" -ForegroundColor Yellow
    exit 1
}

# Check if signed in
try {
    op account list | Out-Null
} catch {
    Write-Host "❌ Error: Not signed in to 1Password" -ForegroundColor Red
    Write-Host "   Run: op signin" -ForegroundColor Yellow
    exit 1
}

# Determine which Firebase config to use
$FirebaseItem = if ($Environment -eq "staging") {
    "Firebase Staging"
} else {
    "Firebase Production"
}

# Load Firebase configuration
Write-Host "📦 Loading Firebase ($FirebaseItem)..." -ForegroundColor Cyan
$env:VITE_FIREBASE_API_KEY = op read "op://winter-arc-app/$FirebaseItem/api_key"
$env:VITE_FIREBASE_AUTH_DOMAIN = op read "op://winter-arc-app/$FirebaseItem/auth_domain"
$env:VITE_FIREBASE_PROJECT_ID = op read "op://winter-arc-app/$FirebaseItem/project_id"
$env:VITE_FIREBASE_STORAGE_BUCKET = op read "op://winter-arc-app/$FirebaseItem/storage_bucket"
$env:VITE_FIREBASE_MESSAGING_SENDER_ID = op read "op://winter-arc-app/$FirebaseItem/messaging_sender_id"
$env:VITE_FIREBASE_APP_ID = op read "op://winter-arc-app/$FirebaseItem/app_id"

# Load optional services
Write-Host "🔧 Loading optional services..." -ForegroundColor Cyan
try { $env:VITE_GEMINI_API_KEY = op read "op://winter-arc-app/Google Services/gemini_api_key" } catch { $env:VITE_GEMINI_API_KEY = "" }
try { $env:VITE_RECAPTCHA_SITE_KEY = op read "op://winter-arc-app/Google Services/recaptcha_site_key" } catch { $env:VITE_RECAPTCHA_SITE_KEY = "" }
try { $env:VITE_SENTRY_DSN = op read "op://winter-arc-app/Sentry/dsn" } catch { $env:VITE_SENTRY_DSN = "" }

# Load Sentry (for builds with source maps)
try { $env:SENTRY_AUTH_TOKEN = op read "op://winter-arc-app/Sentry/auth_token" } catch { $env:SENTRY_AUTH_TOKEN = "" }
try { $env:SENTRY_ORG = op read "op://winter-arc-app/Sentry/organization" } catch { $env:SENTRY_ORG = "newrealm" }
try { $env:SENTRY_PROJECT = op read "op://winter-arc-app/Sentry/project" } catch { $env:SENTRY_PROJECT = "javascript-react" }

Write-Host "✅ Environment variables loaded from 1Password" -ForegroundColor Green
Write-Host "📦 Firebase Project: $env:VITE_FIREBASE_PROJECT_ID" -ForegroundColor Cyan
Write-Host "🔧 Environment: $Environment" -ForegroundColor Cyan
Write-Host ""
Write-Host "🚀 You can now run: npm run dev" -ForegroundColor Green
