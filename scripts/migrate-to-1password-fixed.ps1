# Migrate secrets from .env.local to 1Password (Fixed Version)
# Usage: .\scripts\migrate-to-1password-fixed.ps1

$ErrorActionPreference = "Stop"

$VAULT = "Winter-Arc-App"
$ENV_FILE = ".env.local"

Write-Host "Migrating secrets from $ENV_FILE to 1Password vault '$VAULT'" -ForegroundColor Cyan
Write-Host ""

# Check if 1Password CLI is installed
if (-not (Get-Command op -ErrorAction SilentlyContinue)) {
    Write-Host "Error: 1Password CLI not found" -ForegroundColor Red
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
        $key = $matches[1].Trim()
        $value = $matches[2].Trim()
        $envVars[$key] = $value
        Write-Host "  Loaded: $key" -ForegroundColor Gray
    }
}

Write-Host ""
Write-Host "Creating 1Password Items..." -ForegroundColor Cyan
Write-Host ""

# Helper function to delete item if it exists
function Remove-OpItemIfExists {
    param([string]$Title)
    try {
        $item = op item get $Title --vault=$VAULT 2>&1
        if ($item) {
            op item delete $Title --vault=$VAULT --archive
            Write-Host "  Deleted existing item" -ForegroundColor Yellow
        }
    } catch {
        # Item doesn't exist, that's fine
    }
}

# 1. Firebase Production
Write-Host "Creating 'Firebase Production' item..." -ForegroundColor Cyan
Remove-OpItemIfExists -Title "Firebase Production"

op item create --vault=$VAULT `
    --category="API Credential" `
    --title="Firebase Production" `
    "api_key[password]=$($envVars['VITE_FIREBASE_API_KEY'])" `
    "auth_domain[text]=$($envVars['VITE_FIREBASE_AUTH_DOMAIN'])" `
    "project_id[text]=$($envVars['VITE_FIREBASE_PROJECT_ID'])" `
    "storage_bucket[text]=$($envVars['VITE_FIREBASE_STORAGE_BUCKET'])" `
    "messaging_sender_id[text]=$($envVars['VITE_FIREBASE_MESSAGING_SENDER_ID'])" `
    "app_id[text]=$($envVars['VITE_FIREBASE_APP_ID'])" | Out-Null

Write-Host "  Created" -ForegroundColor Green

# 2. Firebase Staging
Write-Host "Creating 'Firebase Staging' item..." -ForegroundColor Cyan
Remove-OpItemIfExists -Title "Firebase Staging"

op item create --vault=$VAULT `
    --category="API Credential" `
    --title="Firebase Staging" `
    "api_key[password]=$($envVars['VITE_FIREBASE_API_KEY'])" `
    "auth_domain[text]=$($envVars['VITE_FIREBASE_AUTH_DOMAIN'])" `
    "project_id[text]=$($envVars['VITE_FIREBASE_PROJECT_ID'])" `
    "storage_bucket[text]=$($envVars['VITE_FIREBASE_STORAGE_BUCKET'])" `
    "messaging_sender_id[text]=$($envVars['VITE_FIREBASE_MESSAGING_SENDER_ID'])" `
    "app_id[text]=$($envVars['VITE_FIREBASE_APP_ID'])" | Out-Null

Write-Host "  Created (using same values as production)" -ForegroundColor Green

# 3. Google Services
Write-Host "Creating 'Google Services' item..." -ForegroundColor Cyan
Remove-OpItemIfExists -Title "Google Services"

op item create --vault=$VAULT `
    --category="API Credential" `
    --title="Google Services" `
    "gemini_api_key[password]=$($envVars['VITE_GEMINI_API_KEY'])" `
    "recaptcha_site_key[text]=$($envVars['VITE_RECAPTCHA_SITE_KEY'])" | Out-Null

Write-Host "  Created" -ForegroundColor Green

# 4. Sentry
Write-Host "Creating 'Sentry' item..." -ForegroundColor Cyan
Remove-OpItemIfExists -Title "Sentry"

op item create --vault=$VAULT `
    --category="API Credential" `
    --title="Sentry" `
    "dsn[password]=$($envVars['VITE_SENTRY_DSN'])" `
    "organization[text]=newrealm" `
    "project[text]=javascript-react" `
    "auth_token[password]=" | Out-Null

Write-Host "  Created (auth_token empty - add manually)" -ForegroundColor Yellow

# 5. GitHub Deployment
Write-Host "Creating 'GitHub Deployment' item..." -ForegroundColor Cyan

$githubExists = $false
try {
    op item get "GitHub Deployment" --vault=$VAULT | Out-Null
    $githubExists = $true
    Write-Host "  Already exists (keeping existing token)" -ForegroundColor Yellow
} catch {
    op item create --vault=$VAULT `
        --category="API Credential" `
        --title="GitHub Deployment" `
        "pages_deploy_token[password]=" | Out-Null
    Write-Host "  Created (token empty - add manually)" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "================================" -ForegroundColor Green
Write-Host "Migration Complete!" -ForegroundColor Green
Write-Host "================================" -ForegroundColor Green
Write-Host ""
Write-Host "Created items in vault '$VAULT':" -ForegroundColor Cyan
Write-Host "  1. Firebase Production" -ForegroundColor White
Write-Host "  2. Firebase Staging" -ForegroundColor White
Write-Host "  3. Google Services" -ForegroundColor White
Write-Host "  4. Sentry (add auth_token manually)" -ForegroundColor White
Write-Host "  5. GitHub Deployment (add pages_deploy_token manually)" -ForegroundColor White
Write-Host ""
Write-Host "Manual steps:" -ForegroundColor Yellow
Write-Host "  1. Add Sentry auth_token (if you have one):" -ForegroundColor White
Write-Host "     op item edit 'Sentry' --vault='$VAULT' 'auth_token[password]=YOUR_TOKEN'" -ForegroundColor Gray
Write-Host ""
Write-Host "  2. Add GitHub Pages Deploy Token:" -ForegroundColor White
Write-Host "     op item edit 'GitHub Deployment' --vault='$VAULT' 'pages_deploy_token[password]=YOUR_TOKEN'" -ForegroundColor Gray
Write-Host ""
Write-Host "Test your setup:" -ForegroundColor Cyan
Write-Host "  npm run dev:1p-prod" -ForegroundColor White
Write-Host ""
