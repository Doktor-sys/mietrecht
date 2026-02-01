@echo off
cls
echo ==========================================================
echo       Einfacher Docker Run
echo ==========================================================
echo.

REM Administrator check
net session >nul 2>&1
if %errorlevel% neq 0 (
    echo BITTE ALS ADMINISTRATOR AUSFUEHREN!
    pause
    exit /b 1
)

echo 1. Stoppe alte Container...
docker stop mietrecht-simple 2>nul
docker rm mietrecht-simple 2>nul

echo 2. Baue Image...
docker build -t mietrecht-simple .

echo 3. Starte Container...
docker run -d --name mietrecht-simple -p 7000:5000 mietrecht-simple

echo 4. Warte...
timeout /t 5 >nul

echo 5. Ergebnisse...
echo =================== DOCKER PS ===================
docker ps | findstr "mietrecht"
echo.

echo =================== LOGS ===================
docker logs mietrecht-simple
echo.

echo =================== TEST ===================
echo Teste mit curl oder Browser:
echo 1. Browser: http://localhost:7000
echo 2. Curl: curl http://localhost:7000
echo.

start http://localhost:7000 2>nul
pause