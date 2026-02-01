@echo off
::
:: SmartLaw Mietrecht - Local Testing Environment 🧪
:: ========================================================
::
:: Umgebungsvariablen:
::   PGHOST          - PostgreSQL Host (Standard: localhost)
::   PGPORT          - PostgreSQL Port (Standard: 5432)
::   SKIP_PG_CHECK   - Überspringe PostgreSQL-Prüfung (Standard: nicht gesetzt)
::                    Setze auf 1 um die Prüfung zu überspringen
::   BACKEND_LOG     - Backend Logging aktivieren (Standard: 1)
::                    Setze auf 0 um Logging zu deaktivieren
::   BACKEND_LOGFILE - Backend Logdatei (Standard: backend.log)
::
:: Verwende lokale PostgreSQL-Instanz anstelle von Docker
::
echo ========================================================
echo   SmartLaw Mietrecht - Local Testing Environment 🧪
echo ========================================================
echo.
echo Verwende lokale PostgreSQL-Instanz anstelle von Docker
echo.

REM Überspringe Docker und verwende lokale PostgreSQL
echo [Skipping Docker] Verwende lokale PostgreSQL-Instanz
echo.

setlocal
cd /d "%~dp0"

REM Logging: logfile im Repo-Root
set "LOGFILE=%~dp0start_local_test.log"
REM Log-Rotation: Wenn >5MB, rotiere mit Timestamp und behalte bis zu 5 Backups
if exist "%LOGFILE%" (
        for %%I in ("%LOGFILE%") do set "LOGSIZE=%%~zI"
        if defined LOGSIZE if %LOGSIZE% GTR 5242880 (
                for /f "usebackq tokens=*" %%T in (`powershell -NoProfile -Command "Get-Date -Format yyyyMMdd-HHmmss"`) do set "TS=%%T"
                set "ROTATED=%LOGFILE%.%TS%"
                move /Y "%LOGFILE%" "%ROTATED%" >nul 2>&1
                REM Aufräumen: behalte nur die neuesten 5 Backups
                for /f "delims=" %%F in ('cmd /c "dir /b /o:-d "%CD%\start_local_test.log.*" 2>nul"') do (
                        setlocal enabledelayedexpansion
                        set /a count+=1
                        if !count! GTR 5 del "%%~fF"
                        endlocal
                )
        )
)

echo ======================================================== > "%LOGFILE%"
echo Start: %date% %time% >> "%LOGFILE%"
echo ======================================================== >> "%LOGFILE%"

REM Prüfe Voraussetzungen (Node / npm) + Mindestversionen
set "MIN_NODE_MAJOR=18"
set "MIN_NODE_MINOR=0"
set "MIN_NPM_MAJOR=8"

where node >nul 2>&1 || (
        echo [Error] node nicht im PATH gefunden. Bitte Node.js installieren.
        echo [Error] node nicht im PATH gefunden. Bitte Node.js installieren. >> "%LOGFILE%"
        pause
        endlocal
        exit /b 1
)
where npm >nul 2>&1 || (
        echo [Error] npm nicht im PATH gefunden. Bitte Node.js installieren.
        echo [Error] npm nicht im PATH gefunden. Bitte Node.js installieren. >> "%LOGFILE%"
        pause
        endlocal
        exit /b 1
)

REM Prüfe Node-Version (z. B. v18.0.0+)
REM Lese komplette Version (z.B. "v18.16.0" oder "18.16.0")
for /f "usebackq tokens=*" %%A in (`node -v 2^>nul`) do set "NODEVER_RAW=%%A"
if not defined NODEVER_RAW set "NODEVER_RAW="
REM Entferne optionales führendes 'v'
if not ""=="%NODEVER_RAW%" (
    if "%NODEVER_RAW:~0,1%"=="v" (
        set "NODEVER=%NODEVER_RAW:~1%"
    ) else (
        set "NODEVER=%NODEVER_RAW%"
    )
) else (
    set "NODEVER="
)
for /f "tokens=1,2 delims=." %%A in ("%NODEVER%") do (
        set "NODE_MAJOR=%%A"
        set "NODE_MINOR=%%B"
)
if not defined NODE_MAJOR set "NODE_MAJOR=0"
if not defined NODE_MINOR set "NODE_MINOR=0"
if %NODE_MAJOR% LSS %MIN_NODE_MAJOR% (
        echo [Error] Node-Version %NODEVER% ist kleiner als die erforderliche %MIN_NODE_MAJOR%.x
        echo [Error] Node-Version %NODEVER% ist kleiner als die erforderliche %MIN_NODE_MAJOR%.x >> "%LOGFILE%"
        pause
        endlocal
        exit /b 1
)
if %NODE_MAJOR%==%MIN_NODE_MAJOR% if %NODE_MINOR% LSS %MIN_NODE_MINOR% (
        echo [Error] Node-Version %NODEVER% ist kleiner als die erforderliche %MIN_NODE_MAJOR%.%MIN_NODE_MINOR%
        echo [Error] Node-Version %NODEVER% ist kleiner als die erforderliche %MIN_NODE_MAJOR%.%MIN_NODE_MINOR% >> "%LOGFILE%"
        pause
        endlocal
        exit /b 1
)

REM Prüfe npm-Version (grobe Prüfung auf Major)
for /f "usebackq tokens=*" %%A in (`npm -v 2^>nul`) do set "NPMVER=%%A"
if not defined NPMVER set "NPMVER=0"
for /f "tokens=1 delims=." %%A in ("%NPMVER%") do set "NPM_MAJOR=%%A"
if not defined NPM_MAJOR set "NPM_MAJOR=0"
if %NPM_MAJOR% LSS %MIN_NPM_MAJOR% (
        echo [Warn] npm-Version %NPMVER% ist kleiner als empfohlen %MIN_NPM_MAJOR%.
        echo [Warn] npm-Version %NPMVER% ist kleiner als empfohlen %MIN_NPM_MAJOR%. >> "%LOGFILE%"
)

echo [Info] Node %NODEVER% / npm %NPMVER% gefunden. >> "%LOGFILE%"

REM Synchronisiere die Datenbank mit Prisma
echo [1/3] Syncing Database...
echo [1/3] Syncing Database... >> "%LOGFILE%"
REM Prüfe PostgreSQL-Verfügbarkeit (konfigurierbar über PGHOST/PGPORT)
if "%PGHOST%"=="" set "PGHOST=localhost"
if "%PGPORT%"=="" set "PGPORT=5432"
echo [Info] Prüfe PostgreSQL auf %PGHOST%:%PGPORT%...
echo [Info] Prüfe PostgreSQL auf %PGHOST%:%PGPORT%... >> "%LOGFILE%"
powershell -NoProfile -Command "try { $tcp = New-Object System.Net.Sockets.TcpClient; $tcp.Connect('%PGHOST%', %PGPORT%); exit 0 } catch { exit 2 }"
if errorlevel 1 (
                if "%SKIP_PG_CHECK%"=="1" (
                        echo [Warn] PostgreSQL scheint nicht erreichbar auf %PGHOST%:%PGPORT%, aber SKIP_PG_CHECK=1 gesetzt — fahre fort.
                        echo [Warn] PostgreSQL scheint nicht erreichbar auf %PGHOST%:%PGPORT%, aber SKIP_PG_CHECK=1 gesetzt — fahre fort. >> "%LOGFILE%"
                ) else (
                        echo [Error] PostgreSQL nicht erreichbar auf %PGHOST%:%PGPORT%.
                        echo Setze `SKIP_PG_CHECK=1` um dies zu überschreiben, oder starte PostgreSQL.
                        echo [Error] PostgreSQL nicht erreichbar auf %PGHOST%:%PGPORT%. >> "%LOGFILE%"
                        echo Setze `SKIP_PG_CHECK=1` um dies zu überschreiben, oder starte PostgreSQL. >> "%LOGFILE%"
                        endlocal
                        exit /b 1
                )
)

pushd services\backend
call npx prisma db push >> "%LOGFILE%" 2>&1 || (
        echo [Error] prisma db push fehlgeschlagen.
        echo [Error] prisma db push fehlgeschlagen. >> "%LOGFILE%"
        popd
        endlocal
        exit /b 1
)
popd

REM Starte das Backend in neuem Fenster
echo [2/3] Starting Backend...
set "PORT=3000"
REM Optionales Backend-Logging: standardmäßig aktiviert (BACKEND_LOG=1). Setze BACKEND_LOG=0 um das alte Verhalten zu erzwingen.
if "%BACKEND_LOG%"=="" set "BACKEND_LOG=1"
if "%BACKEND_LOG%"=="1" (
                if "%BACKEND_LOGFILE%"=="" set "BACKEND_LOGFILE=%~dp0backend.log"
                echo [Info] Starting backend with logging to %BACKEND_LOGFILE% >> "%LOGFILE%"
                REM Ensure log directory exists (will be repo root by default)
                for %%I in ("%BACKEND_LOGFILE%") do ( if not exist "%%~dpI" mkdir "%%~dpI" ) >nul 2>&1
                REM Rotate backend logfile if too large (timestamped, keep 5)
                if exist "%BACKEND_LOGFILE%" (
                        for %%I in ("%BACKEND_LOGFILE%") do set "BLSIZE=%%~zI"
                        if defined BLSIZE if %BLSIZE% GTR 5242880 (
                                for /f "usebackq tokens=*" %%T in (`powershell -NoProfile -Command "Get-Date -Format yyyyMMdd-HHmmss"`) do set "BTS=%%T"
                                move /Y "%BACKEND_LOGFILE%" "%BACKEND_LOGFILE%.%BTS%" >nul 2>&1
                                for /f "delims=" %%F in ('cmd /c "dir /b /o:-d "%CD%\backend.log.*" 2>nul"') do (
                                        setlocal enabledelayedexpansion
                                        set /a bcount+=1
                                        if !bcount! GTR 5 del "%%~fF"
                                        endlocal
                                )
                        )
                )
                start "SmartLaw Backend" /D "%~dp0services\backend" cmd /k "npm run dev ^> \"%BACKEND_LOGFILE%\" 2^>^&1"
) else (
        echo [Info] Starting backend in new window. >> "%LOGFILE%"
        start "SmartLaw Backend" /D "%~dp0services\backend" cmd /k "npm run dev"
)

REM Starte die Mobile App
echo.
echo [3/3] Starting Mobile App...
echo   - Scan QR Code or press 'a'/'i'
echo.
pushd mobile-app
if not exist "node_modules\expo\package.json" (
        echo [Info] Dependencies not fully installed. Running npm install...
        echo [Info] Dependencies not fully installed. Running npm install... >> "%LOGFILE%"
        call npm install --legacy-peer-deps >> "%LOGFILE%" 2>&1 || (
                echo [Error] npm install failed.
                echo [Error] npm install failed. >> "%LOGFILE%"
                popd
                endlocal
                exit /b 1
        )
)

call npm start
popd

endlocal
pause