@echo off
echo ========================================================
echo   SmartLaw Mietrecht - Local Testing Environment (DRY RUN)
echo ========================================================
echo.
echo Dies ist ein sicherer Testlauf. Es werden keine externen Befehle ausgefuehrt.
echo.
setlocal
cd /d "%~dp0"

REM Logging: logfile im Repo-Root (separat vom echten Log)
set "LOGFILE=%~dp0start_local_test.dryrun.log"
echo ======================================================== > "%LOGFILE%"
echo DryRun Start: %date% %time% >> "%LOGFILE%"
echo ======================================================== >> "%LOGFILE%"

REM Setze sichere Defaults fuer Dry-Run: SKIP_PG_CHECK=1 to avoid DB contact




















































































exit /b 0pauseendlocalecho Dry run abgeschlossen. Details in %LOGFILE%.echo [DryRun] Mobile-App-Start: "cd mobile-app && npm start" (nicht ausgefuehrt) >> "%LOGFILE%"echo [DryRun] Mobile-App-Start: "cd mobile-app && npm start" (nicht ausgefuehrt)REM Simuliere Mobile-App-Startecho [DryRun] Backend-Start: "cd services\backend && npm run dev" (nicht ausgefuehrt) >> "%LOGFILE%"echo [DryRun] Backend-Start: "cd services\backend && npm run dev" (nicht ausgefuehrt)REM Simuliere Backend-Start)    echo [DryRun] PostgreSQL-Check waere ausgefuehrt worden (PGHOST=%PGHOST% PGPORT=%PGPORT%). >> "%LOGFILE%"    echo [DryRun] PostgreSQL-Check waere ausgefuehrt worden (PGHOST=%PGHOST% PGPORT=%PGPORT%).) else (    echo [DryRun] SKIP_PG_CHECK=1 gesetzt -> Datenbank-Check / prisma db push wird nicht ausgefuehrt. >> "%LOGFILE%"    echo [DryRun] SKIP_PG_CHECK=1 gesetzt -> Datenbank-Check / prisma db push wird nicht ausgefuehrt.if "%SKIP_PG_CHECK%"=="1" (REM Simuliere Datenbank-Sync (kein Aufruf von prisma)echo [Info] Node %NODEVER% / npm %NPMVER% gefunden.echo [Info] Node %NODEVER% / npm %NPMVER% gefunden. >> "%LOGFILE%")        echo [Warn] npm-Version %NPMVER% ist kleiner als empfohlen %MIN_NPM_MAJOR%. >> "%LOGFILE%"        echo [Warn] npm-Version %NPMVER% ist kleiner als empfohlen %MIN_NPM_MAJOR%.if %NPM_MAJOR% LSS %MIN_NPM_MAJOR% (if not defined NPM_MAJOR set "NPM_MAJOR=0"for /f "tokens=1 delims=." %%A in ("%NPMVER%") do set "NPM_MAJOR=%%A"if not defined NPMVER set "NPMVER=0"for /f "usebackq tokens=*" %%A in (`npm -v 2^>nul`) do set "NPMVER=%%A")        exit /b 1        endlocal        echo [Error] Node-Version %NODEVER% ist kleiner als die erforderliche %MIN_NODE_MAJOR%.%MIN_NODE_MINOR% >> "%LOGFILE%"        echo [Error] Node-Version %NODEVER% ist kleiner als die erforderliche %MIN_NODE_MAJOR%.%MIN_NODE_MINOR%if %NODE_MAJOR%==%MIN_NODE_MAJOR% if %NODE_MINOR% LSS %MIN_NODE_MINOR% ()        exit /b 1        endlocal        echo [Error] Node-Version %NODEVER% ist kleiner als die erforderliche %MIN_NODE_MAJOR%.x >> "%LOGFILE%"        echo [Error] Node-Version %NODEVER% ist kleiner als die erforderliche %MIN_NODE_MAJOR%.xif %NODE_MAJOR% LSS %MIN_NODE_MAJOR% (if not defined NODE_MINOR set "NODE_MINOR=0"if not defined NODE_MAJOR set "NODE_MAJOR=0")        set "NODE_MINOR=%%B"        set "NODE_MAJOR=%%A"for /f "tokens=1,2 delims=." %%A in ("%NODEVER%") do ()    set "NODEVER=") else (    )        set "NODEVER=%NODEVER_RAW%"    ) else (        set "NODEVER=%NODEVER_RAW:~1%"    if "%NODEVER_RAW:~0,1%"=="v" (if not ""=="%NODEVER_RAW%" (if not defined NODEVER_RAW set "NODEVER_RAW="for /f "usebackq tokens=*" %%A in (`node -v 2^>nul`) do set "NODEVER_RAW=%%A")    exit /b 1    endlocal    echo [Error] npm nicht im PATH gefunden. Bitte Node.js installieren. >> "%LOGFILE%"    echo [Error] npm nicht im PATH gefunden. Bitte Node.js installieren.where npm >nul 2>&1 || ()    exit /b 1    endlocal    echo [Error] node nicht im PATH gefunden. Bitte Node.js installieren. >> "%LOGFILE%"    echo [Error] node nicht im PATH gefunden. Bitte Node.js installieren.where node >nul 2>&1 || (set "MIN_NPM_MAJOR=8"set "MIN_NODE_MINOR=0"set "MIN_NODE_MAJOR=18"REM Versionschecks (kopiert aus start_local_test.bat)if "%BACKEND_LOG%"=="" set "BACKEND_LOG=0"nif "%SKIP_PG_CHECK%"=="" set "SKIP_PG_CHECK=1"