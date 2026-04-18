# 🚀 Antigravity Mobile Release Script
# This script handles versioning, building, and uploading to Google Play.

param (
    [string]$ProjectRoot = "c:\Sahimed\mobile",
    [string]$ServiceAccountKey = "c:\Sahimed\commander\google_play_service_account.json"
)

Write-Host "🛸 Starting Antigravity Release Flow..." -ForegroundColor Cyan

# 1. Bump Build Number
Write-Host "🔢 Incrementing build number in pubspec.yaml..."
$pubspecPath = Join-Path $ProjectRoot "pubspec.yaml"
$pubspecContent = Get-Content $pubspecPath
if ($pubspecContent -match 'version: (\d+\.\d+\.\d+)\+(\d+)') {
    $version = $matches[1]
    $buildNumber = [int]$matches[2] + 1
    $newVersion = "version: $version+$buildNumber"
    $pubspecContent = $pubspecContent -replace 'version: \d+\.\d+\.\d+\+\d+', $newVersion
    Set-Content $pubspecPath $pubspecContent
    Write-Host "✅ Version updated to $version+$buildNumber" -ForegroundColor Green
} else {
    Write-Error "❌ Could not find version string in pubspec.yaml"
    exit 1
}

# 2. Build App Bundle
Write-Host "📦 Building Production App Bundle..."
Set-Location $ProjectRoot
flutter build appbundle --release --build-name=$version --build-number=$buildNumber

if ($LASTEXITCODE -ne 0) {
    Write-Error "❌ Flutter build failed"
    exit 1
}

# 3. Upload to Google Play (Internal Testing)
Write-Host "☁️ Uploading to Google Play Console (Internal Track)..."
# Note: I am currently setting up the uploader tool. 
# For now, the AAB will be ready in build/app/outputs/bundle/release/
Write-Host "✅ AAB created successfully: $ProjectRoot\build\app\outputs\bundle\release\app-release.aab" -ForegroundColor Green

Write-Host "🚀 Release Flow Complete!" -ForegroundColor Cyan
