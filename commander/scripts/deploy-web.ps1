# 🚀 Antigravity Web Deployment Script
# This script builds and deploys the Sahimed Next.js website to Firebase.

param (
    [string]$WebsiteRoot = "c:\Sahimed\website"
)

Write-Host "🛸 Starting Antigravity Web Deployment..." -ForegroundColor Cyan

# 1. Dependency Check
Write-Host "📦 Checking dependencies..."
Set-Location $WebsiteRoot
if (!(Test-Path "node_modules")) {
    Write-Host "Installing dependencies..."
    npm install
}

# 2. Build Production Bundle
Write-Host "🏗️ Building Next.js production bundle..."
npm run build

if ($LASTEXITCODE -ne 0) {
    Write-Error "❌ Website build failed"
    exit 1
}

# 3. Deploy to Firebase
Write-Host "☁️ Deploying to Firebase Hosting..."
Set-Location "c:\Sahimed"
firebase deploy --only hosting

if ($LASTEXITCODE -ne 0) {
    Write-Error "❌ Firebase deployment failed"
    exit 1
}

Write-Host "✅ Website is now LIVE on Firebase Hosting!" -ForegroundColor Green
Write-Host "🚀 Web Deployment Flow Complete!" -ForegroundColor Cyan
