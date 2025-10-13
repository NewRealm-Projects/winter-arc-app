# Migrate secrets from .env.local to 1Password (PowerShell)
# Usage: .\scripts\migrate-to-1password.ps1

$ErrorActionPreference = "Stop"

$VAULT = "Winter-Arc-App"
$ENV_FILE = ".env.local"

Write-Host "Migrating secrets from $ENV_FILE to 1Password vault '$VAULT'" -ForegroundColor Cyan
Write-Host ""

# Check if 1Password CLI is installed
if (-not (Get-Command op -ErrorAction SilentlyContinue)) {
    Write-Host "Error: 1Password CLI not found" -ForegroundColor Red
    Write-Host "Install it: https://1password.com/downloads/command-line/" -ForegroundColor Yellow
    exit 1
}

# Check if signed in
try {
    op account list | Out-Null
} catch {
    Write-Host "Error: Not signed in to 1Password" -ForegroundColor Red
    Write-Host "Run: op signin" -ForegroundColor Yellow
    exit 1
}

# Check if .env.local exists
if (-not (Test-Path $ENV_FILE)) {
    Write-Host "Error: $ENV_FILE not found" -ForegroundColor Red
    exit 1
}

# Parse .env.local file
Write-Host "Reading $ENV_FILE..." -ForegroundColor Cyan
$envVars = @{}
Get-Content $ENV_FILE | ForEach-Object {
    if ($_ -match '^\s*([^#][^=]+)=(.*)$') {
        $envVars[$matches[1].Trim()] = $matches[2].Trim()
    }
}

Write-Host ""
Write-Host "Creating 1Password Items..." -ForegroundColor Cyan
Write-Host ""

# Helper function to create or update item
function Set-OpItem {
    param(
        [string]$Title,
        [hashtable]$Fields
    )

    Write-Host "Creating '$Title' item..." -ForegroundColor Cyan

    # Check if item exists
    $itemExists = $false
    try {
        op item get $Title --vault=$VAULT | Out-Null
        $itemExists = $true
        Write-Host "  Item already exists, updating..." -ForegroundColor Yellow
    } catch {
        # Item doesn't exist, create it
    }

    if ($itemExists) {
        # Update existing item
        $args = @($Title, "--vault=$VAULT")
        foreach ($key in $Fields.Keys) {
            $args += "$key=$($Fields[$key])"
        }
        op item edit @args
        Write-Host "  Updated" -ForegroundColor Green
    } else {
        # Create new item
        $args = @("--vault=$VAULT", "--category=API Credential", "--title=$Title")
        foreach ($key in $Fields.Keys) {
            $args += "$key=$($Fields[$key])"
        }
        op item create @args
        Write-Host "  Created" -ForegroundColor Green
    }
}

# 1. Firebase Production
Set-OpItem -Title "Firebase Production" -Fields @{
    api_key = $envVars['VITE_FIREBASE_API_KEY']
    auth_domain = $envVars['VITE_FIREBASE_AUTH_DOMAIN']
    project_id = $envVars['VITE_FIREBASE_PROJECT_ID']
    storage_bucket = $envVars['VITE_FIREBASE_STORAGE_BUCKET']
    messaging_sender_id = $envVars['VITE_FIREBASE_MESSAGING_SENDER_ID']
    app_id = $envVars['VITE_FIREBASE_APP_ID']
}

# 2. Firebase Staging
Set-OpItem -Title "Firebase Staging" -Fields @{
    api_key = $envVars['VITE_FIREBASE_API_KEY']
    auth_domain = $envVars['VITE_FIREBASE_AUTH_DOMAIN']
    project_id = $envVars['VITE_FIREBASE_PROJECT_ID']
    storage_bucket = $envVars['VITE_FIREBASE_STORAGE_BUCKET']
    messaging_sender_id = $envVars['VITE_FIREBASE_MESSAGING_SENDER_ID']
    app_id = $envVars['VITE_FIREBASE_APP_ID']
}

Write-Host "  Note: Staging uses same Firebase config as production" -ForegroundColor Yellow

# 3. Google Services
Set-OpItem -Title "Google Services" -Fields @{
    gemini_api_key = $envVars['VITE_GEMINI_API_KEY']
    recaptcha_site_key = $envVars['VITE_RECAPTCHA_SITE_KEY']
}

# 4. Sentry
Set-OpItem -Title "Sentry" -Fields @{
    dsn = $envVars['VITE_SENTRY_DSN']
    organization = "newrealm"
    project = "javascript-react"
}

Write-Host ""
Write-Host "Note: Sentry auth_token must be added manually" -ForegroundColor Yellow

# 5. GitHub Deployment
try {
    op item get "GitHub Deployment" --vault=$VAULT | Out-Null
    Write-Host "'GitHub Deployment' item already exists" -ForegroundColor Cyan
} catch {
    op item create --vault=$VAULT --category="API Credential" --title="GitHub Deployment" pages_deploy_token=""
    Write-Host "Created 'GitHub Deployment' item (placeholder)" -ForegroundColor Cyan
}

Write-Host ""
Write-Host "Migration Summary:" -ForegroundColor Cyan
Write-Host ""
Write-Host "Created/Updated items in 1Password vault '$VAULT':" -ForegroundColor Green
Write-Host "  1. Firebase Production"
Write-Host "  2. Firebase Staging"
Write-Host "  3. Google Services"
Write-Host "  4. Sentry (DSN only)"
Write-Host "  5. GitHub Deployment (placeholder)"
Write-Host ""
Write-Host "Manual steps required:" -ForegroundColor Yellow
Write-Host "  1. Add Sentry auth_token:"
Write-Host "     op item edit 'Sentry' --vault='$VAULT' auth_token='YOUR_TOKEN'"
Write-Host ""
Write-Host "  2. Add GitHub Pages Deploy Token:"
Write-Host "     op item edit 'GitHub Deployment' --vault='$VAULT' pages_deploy_token='YOUR_TOKEN'"
Write-Host ""
Write-Host "Test your setup:" -ForegroundColor Cyan
Write-Host "  npm run dev:1p-prod"
Write-Host ""
