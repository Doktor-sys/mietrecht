@echo off
echo ==========================================
echo SmartLaw Production Deployment Script
echo ==========================================

REM 1. Pull latest changes
echo [1/4] Pulling latest code...
git pull origin main

REM 2. Build Containers
echo [2/4] Building production containers...
docker-compose -f docker-compose.prod.yml build

REM 3. Run Database Migrations
echo [3/4] Running database migrations...
call npx prisma migrate deploy

REM 4. Start Services
echo [4/4] Starting services...
docker-compose -f docker-compose.prod.yml up -d

echo ==========================================
echo Deployment Complete!
echo Verify status with: docker-compose -f docker-compose.prod.yml ps
echo ==========================================
pause
