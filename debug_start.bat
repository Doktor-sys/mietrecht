@echo off
chcp 65001 >nul
setlocal enabledelayedexpansion

REM Create a log file with timestamp
for /f "tokens=2-4 delims=/ " %%a in ('date /t') do set mydate=%%c-%%a-%%b
for /f "tokens=1-3 delims=:." %%a in ('echo %time%') do set mytime=%%a-%%b-%%c
set LOGFILE=startup_%mydate%_%mytime%.log

echo Logging to %LOGFILE%
echo %date% %time% - Starting SmartLaw Mietrecht > %LOGFILE%

echo.
echo ========================================================>> %LOGFILE% 2>&1
echo   SmartLaw Mietrecht - Entwicklungsumgebung>> %LOGFILE% 2>&1
echo ========================================================>> %LOGFILE% 2>&1
echo.>> %LOGFILE% 2>&1

echo [INFO] Checking system requirements...>> %LOGFILE% 2>&1

REM Check for Node.js
echo [INFO] Checking Node.js installation...>> %LOGFILE% 2>&1
where node >> %LOGFILE% 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Node.js not found. Please install Node.js from https://nodejs.org/>> %LOGFILE% 2>&1
    echo [ERROR] Node.js not found. Please install Node.js from https://nodejs.org/
    timeout /t 10
    exit /b 1
)

REM Check for Docker
echo [INFO] Checking Docker installation...>> %LOGFILE% 2>&1
docker --version >> %LOGFILE% 2>&1
if %errorlevel% neq 0 (
    echo [WARNING] Docker not found or not running. Some features may be limited.>> %LOGFILE% 2>&1
    echo [WARNING] Docker not found or not running. Some features may be limited.
    set DOCKER_AVAILABLE=0
) else (
    set DOCKER_AVAILABLE=1
)

REM Check for required ports
echo [INFO] Checking required ports...>> %LOGFILE% 2>&1
for %%p in (3000 3001 5432) do (
    netstat -ano | findstr ":%%p " >> %LOGFILE% 2>&1
    if !errorlevel! equ 0 (
        echo [WARNING] Port %%p is in use.>> %LOGFILE% 2>&1
        echo [WARNING] Port %%p is in use.
    )
)

echo.
echo [INFO] Starting services...>> %LOGFILE% 2>&1

echo [1] Start with Docker (recommended)>> %LOGFILE% 2>&1
echo [2] Start without Docker>> %LOGFILE% 2>&1
echo [3] Cancel>> %LOGFILE% 2>&1
echo.>> %LOGFILE% 2>&1

:get_choice
set /p choice="Please choose an option [1-3]: "
if "%choice%"=="" goto get_choice
if "%choice%"=="1" goto option_1
if "%choice%"=="2" goto option_2
if "%choice%"=="3" goto option_3
goto get_choice

:option_1
    echo [INFO] Selected: Start with Docker>> %LOGFILE% 2>&1
    if "%DOCKER_AVAILABLE%"=="0" (
        echo [ERROR] Docker is not available. Please start Docker Desktop first.>> %LOGFILE% 2>&1
        echo [ERROR] Docker is not available. Please start Docker Desktop first.
        timeout /t 5
        goto :eof
    )
    echo [INFO] Starting Docker services...>> %LOGFILE% 2>&1
    docker-compose -f docker-compose.dev.yml up -d >> %LOGFILE% 2>&1
    if %errorlevel% neq 0 (
        echo [ERROR] Failed to start Docker services. Check the log file: %LOGFILE%>> %LOGFILE% 2>&1
        echo [ERROR] Failed to start Docker services. Check the log file: %LOGFILE%
        timeout /t 5
        goto :eof
    )
    goto start_services

:option_2
    echo [INFO] Selected: Start without Docker>> %LOGFILE% 2>&1
    goto start_services

:option_3
    echo [INFO] Operation cancelled by user>> %LOGFILE% 2>&1
    echo.
    echo Operation cancelled.
    timeout /t 2
    goto :eof

:start_services
    echo [INFO] Starting backend service...>> %LOGFILE% 2>&1
    start "Backend" cmd /k "cd services\backend && npm install && npm run dev"
    
    echo [INFO] Starting web app...>> %LOGFILE% 2>&1
    start "Web App" cmd /k "cd web-app && npm install && npm start"
    
    echo.>> %LOGFILE% 2>&1
    echo ========================================================>> %LOGFILE% 2>&1
    echo   Development environment started!>> %LOGFILE% 2>&1
    echo   Log file: %LOGFILE%>> %LOGFILE% 2>&1
    echo ========================================================>> %LOGFILE% 2>&1
    
    echo.
    echo Development environment started!
    echo Log file: %LOGFILE%
    echo.
    echo Press any key to exit...
    pause >nul

goto :eof
