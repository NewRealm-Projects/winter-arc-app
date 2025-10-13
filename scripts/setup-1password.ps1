# Setup 1Password CLI and migrate secrets
# Run this script in a NEW PowerShell window after installing 1Password CLI

Write-Host "==================================" -ForegroundColor Cyan
Write-Host "1Password Setup for Winter Arc App" -ForegroundColor Cyan
Write-Host "==================================" -ForegroundColor Cyan
Write-Host ""

# Step 1: Check if op is in PATH
Write-Host "Step 1: Checking 1Password CLI installation..." -ForegroundColor Cyan
$opPath = Get-Command op -ErrorAction SilentlyContinue

if (-not $opPath) {
    Write-Host "  1Password CLI not found in PATH" -ForegroundColor Yellow
    Write-Host "  Searching for installation..." -ForegroundColor Yellow

    # Common installation paths
    $possiblePaths = @(
        "$env:ProgramFiles\1Password CLI\op.exe",
        "$env:LOCALAPPDATA\Microsoft\WinGet\Packages\AgileBits.1Password.CLI_*\op.exe"
    )

    $foundPath = $null
    foreach ($path in $possiblePaths) {
        if (Test-Path $path) {
            $foundPath = $path
            break
        }
        # Check wildcard paths
        $matches = Get-ChildItem $path -ErrorAction SilentlyContinue
        if ($matches) {
            $foundPath = $matches[0].FullName
            break
        }
    }

    if ($foundPath) {
        Write-Host "  Found at: $foundPath" -ForegroundColor Green
        Write-Host ""
        Write-Host "  Adding to PATH for this session..." -ForegroundColor Yellow
        $env:PATH = "$($foundPath | Split-Path);$env:PATH"
        Write-Host "  Added to PATH" -ForegroundColor Green
    } else {
        Write-Host "  ERROR: Could not find 1Password CLI" -ForegroundColor Red
        Write-Host "  Please install it: https://1password.com/downloads/command-line/" -ForegroundColor Yellow
        Write-Host ""
        Write-Host "  Or restart PowerShell after installation" -ForegroundColor Yellow
        exit 1
    }
}

# Step 2: Check if signed in
Write-Host ""
Write-Host "Step 2: Checking 1Password sign-in status..." -ForegroundColor Cyan
try {
    op account list | Out-Null
    Write-Host "  Already signed in to 1Password" -ForegroundColor Green
} catch {
    Write-Host "  Not signed in to 1Password" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "  Please sign in now..." -ForegroundColor Yellow
    Write-Host "  Run: op account add" -ForegroundColor Cyan
    Write-Host ""

    $response = Read-Host "Have you signed in? (y/n)"
    if ($response -ne "y") {
        Write-Host "  Please sign in first, then run this script again" -ForegroundColor Yellow
        exit 1
    }
}

# Step 3: Check if vault exists
Write-Host ""
Write-Host "Step 3: Checking for 'winter-arc-app' vault..." -ForegroundColor Cyan
try {
    op vault get "winter-arc-app" | Out-Null
    Write-Host "  Vault 'winter-arc-app' found" -ForegroundColor Green
} catch {
    Write-Host "  Vault 'winter-arc-app' not found" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "  Please create the vault in 1Password:" -ForegroundColor Yellow
    Write-Host "  1. Open 1Password app" -ForegroundColor Cyan
    Write-Host "  2. Click '+' -> New Vault" -ForegroundColor Cyan
    Write-Host "  3. Name it: winter-arc-app" -ForegroundColor Cyan
    Write-Host ""

    $response = Read-Host "Have you created the vault? (y/n)"
    if ($response -ne "y") {
        Write-Host "  Please create the vault first, then run this script again" -ForegroundColor Yellow
        exit 1
    }
}

# Step 4: Migrate secrets
Write-Host ""
Write-Host "Step 4: Migrating secrets from .env.local..." -ForegroundColor Cyan
Write-Host ""

& "$PSScriptRoot\migrate-to-1password.ps1"

# Step 5: Test access
Write-Host ""
Write-Host "Step 5: Testing 1Password access..." -ForegroundColor Cyan
try {
    $apiKey = op read "op://winter-arc-app/Firebase Production/api_key"
    Write-Host "  Successfully retrieved Firebase API Key" -ForegroundColor Green
    Write-Host "  Key starts with: $($apiKey.Substring(0, 10))..." -ForegroundColor Gray
} catch {
    Write-Host "  ERROR: Could not read from 1Password" -ForegroundColor Red
    Write-Host "  Error: $_" -ForegroundColor Red
    exit 1
}

# Step 6: Summary
Write-Host ""
Write-Host "==================================" -ForegroundColor Green
Write-Host "Setup Complete!" -ForegroundColor Green
Write-Host "==================================" -ForegroundColor Green
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Cyan
Write-Host ""
Write-Host "1. Test local development:" -ForegroundColor Yellow
Write-Host "   npm run dev:1p-prod" -ForegroundColor White
Write-Host ""
Write-Host "2. Add manual secrets:" -ForegroundColor Yellow
Write-Host "   - Sentry Auth Token" -ForegroundColor White
Write-Host "   - GitHub Pages Deploy Token" -ForegroundColor White
Write-Host ""
Write-Host "3. Setup GitHub Actions:" -ForegroundColor Yellow
Write-Host "   - Create Service Account" -ForegroundColor White
Write-Host "   - Add OP_SERVICE_ACCOUNT_TOKEN to GitHub" -ForegroundColor White
Write-Host ""
Write-Host "See docs/1PASSWORD_QUICKSTART.md for details" -ForegroundColor Cyan
Write-Host ""
