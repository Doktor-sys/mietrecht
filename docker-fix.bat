@echo off
cls
echo ==========================================================
echo       Docker Windows Fix fuer Laufwerk F:
echo ==========================================================
echo.
echo Docker ist auf: C:\Program Files\Docker
echo Projekt ist auf: %cd%
echo.

REM 1. Pruefe ob wir auf F: sind
echo [1/5] Pruefe Laufwerk...
if /i "%cd:~0,2%"=="F:" (
    echo INFO: Projekt auf Laufwerk F: erkannt
    echo Dies kann bei Docker Windows Probleme verursachen.
) else (
    echo OK: Projekt auf Laufwerk C: oder anderen
)

REM 2. Setze Docker Context zu Windows (nicht Linux)
echo [2/5] Setze Docker Context...
docker context use default 2>nul
echo.

REM 3. Alternative: Projekt nach C: kopieren
echo [3/5] Erstelle Backup auf C:...
if not exist "C:\Temp\Mietrecht" mkdir "C:\Temp\Mietrecht"
xcopy /Y /E ".\*" "C:\Temp\Mietrecht\" >nul
echo Projekt nach C:\Temp\Mietrecht kopiert.
echo.

REM 4. Von C: aus arbeiten
echo [4/5] Wechsle zu C: und starte Docker...
cd /d "C:\Temp\Mietrecht"
echo Jetzt in: %cd%
echo.

REM 5. Vereinfachtes Docker-Setup
echo [5/5] Starte Container von C: aus...
if exist "Dockerfile" (
    echo Baue Image...
    docker build -t mietrecht-fixed .
    
    echo Starte Container...
    docker run -d -p 7001:5000 --name mietrecht-fixed-container mietrecht-fixed
    
    timeout /t 3 >nul
    
    echo.
    echo ==========================================================
    echo                    ERGEBNIS
    echo ==========================================================
    echo Container laeuft auf: http://localhost:7001
    echo (Port 7001 statt 7000, um Konflikte zu vermeiden)
    echo.
    echo Docker Logs:
    docker logs --tail 5 mietrecht-fixed-container
) else (
    echo FEHLER: Dockerfile nicht gefunden in C:\Temp\Mietrecht
)

echo.
pause