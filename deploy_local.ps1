# SmartLaw Deployment Script

Write-Host "🚀 Starting Deployment..." -ForegroundColor Cyan

if (-not (Test-Path ".env")) {
    if (Test-Path ".env.example") {
        Copy-Item ".env.example" ".env"
        Write-Host "✅ .env created." -ForegroundColor Green
    }
}

Write-Host "🐳 Running docker-compose..."
docker-compose -f docker-compose.dev.yml up -d

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Services started!" -ForegroundColor Green
    Write-Host "   - Web App: http://localhost:3000"
    Write-Host "   - Backend: http://localhost:3001"
} else {
    Write-Host "❌ Deployment failed." -ForegroundColor Red
}
