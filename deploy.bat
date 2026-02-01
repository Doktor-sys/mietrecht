@echo off
echo ========================================
echo  SmartLaw Agent Deployment Script
echo ========================================
echo.

echo [INFO] Starting SmartLaw Agent Deployment...
echo.

REM Check if Docker is running
docker info >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Docker is not running. Please start Docker first.
    pause
    exit /b 1
)

echo [INFO] Pulling latest changes from Git...
git pull origin main
if errorlevel 1 (
    echo [WARNING] Git pull failed or no git repository found. Continuing with local files...
)

echo.
echo [INFO] Stopping existing containers...
docker-compose -f docker-compose.prod.yml down

echo.
echo [INFO] Building new Docker images...
docker-compose -f docker-compose.prod.yml build --no-cache

echo.
echo [INFO] Starting containers...
docker-compose -f docker-compose.prod.yml up -d

echo.
echo [INFO] Waiting for services to start...
timeout /t 30 /nobreak >nul

echo.
echo [INFO] Checking service health...
curl -f http://localhost:5000/health >nul 2>&1
if errorlevel 1 (
    echo [WARNING] Health check failed, but continuing...
) else (
    echo [INFO] Application is healthy!
)

echo.
echo [INFO] Cleaning up unused Docker resources...
docker system prune -f

echo.
echo ========================================
echo  Deployment completed successfully!
echo ========================================
echo.
echo Your application should be available at:
echo   - https://35-195-246-45.nip.io/smartlaw-agent
echo   - https://mietrecht.jurismind.app/smartlaw-agent
echo.

echo Container status:
docker-compose -f docker-compose.prod.yml ps

echo.
pause