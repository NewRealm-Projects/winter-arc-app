# Get Service Account Token from 1Password
# Usage: .\scripts\get-service-account-token.ps1

$item = op item get "Service Account Auth Token: GitHub Actions - Winter-Arc-App" --vault="Winter-Arc-App" --reveal --format json | ConvertFrom-Json

$token = $item.fields | Where-Object { $_.label -eq "credential" } | Select-Object -ExpandProperty value

Write-Host ""
Write-Host "================================================" -ForegroundColor Cyan
Write-Host "Service Account Token (1Password)" -ForegroundColor Cyan
Write-Host "================================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Copy this token and add it to GitHub Secrets:" -ForegroundColor Yellow
Write-Host ""
Write-Host $token -ForegroundColor Green
Write-Host ""
Write-Host "Steps:" -ForegroundColor Yellow
Write-Host "1. Go to: https://github.com/NewRealm-Projects/winter-arc-app/settings/secrets/actions" -ForegroundColor White
Write-Host "2. Click 'New repository secret'" -ForegroundColor White
Write-Host "3. Name: OP_SERVICE_ACCOUNT_TOKEN" -ForegroundColor White
Write-Host "4. Value: (paste the token above)" -ForegroundColor White
Write-Host "5. Click 'Add secret'" -ForegroundColor White
Write-Host ""
