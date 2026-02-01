@echo off
cls
echo ==========================================================
echo       JurisMind: Mietrecht-App Diagnose-Tool
echo ==========================================================
echo.

REM 1. Pfadprüfung
echo [1/5] Pruefe Verzeichnis...
if /i not "%cd%"=="F:\JurisMind\Mietrecht" (
    echo FEHLER: Du bist im falschen Ordner: %cd%
    echo Bitte wechsle nach F:\JurisMind\Mietrecht
    pause
    exit /b 1
)
echo OK: Verzeichnis ist korrekt.
echo.

REM 2. Dateipruefung (Inhalt von app_simple.py)
echo [2/5] Pruefe Inhalt von app_simple.py...
if not exist "app_simple.py" (
    echo FEHLER: Datei app_simple.py existiert nicht!
    pause
    exit /b 1
)

findstr /C:"echo" app_simple.py >nul
if %errorlevel%==0 (
    echo FEHLER: Die Datei app_simple.py enthaelt noch CMD-Befehle (echo).
    echo Ich repariere die Datei jetzt automatisch...
    (
echo from flask import Flask
echo app = Flask(__name__)
echo @app.route('/')
echo def home(): return 'Mietrecht-App Diagnose: System OK'
echo if __name__ == '__main__': app.run(host='0.0.0.0', port=5000)
    ) > app_simple.py
    echo Datei wurde repariert.
) else (
    echo OK: app_simple.py sieht nach sauberem Python-Code aus.
)
echo.

REM 3. Docker Cleanup
echo [3/5] Raeume alte Docker-Reste auf...
docker stop mietrecht-container >nul 2>&1
docker rm mietrecht-container >nul 2>&1
echo OK: Alte Container entfernt.
echo.

REM 4. Build Prozess
echo [4/5] Starte Docker Build...
if not exist "Dockerfile" (
    echo FEHLER: Dockerfile existiert nicht!
    pause
    exit /b 1
)

docker build -t mietrecht-app .
if %errorlevel% neq 0 (
    echo.
    echo KRITISCHER FEHLER: Docker Build fehlgeschlagen!
    echo Bitte pruefe dein Dockerfile auf Tippfehler.
    pause
    exit /b 1
)
echo OK: Build erfolgreich.
echo.

REM 5. Start und Log-Check
echo [5/5] Starte Container und lese Logs...
docker run -d -p 7000:5000 --name mietrecht-container mietrecht-app
timeout /t 3 >nul

echo.
echo --- AKTUELLE DOCKER LOGS ---
docker logs mietrecht-container
echo ----------------------------
echo.
echo Die Diagnose ist abgeschlossen. 
echo Wenn oben kein "SyntaxError" steht, oeffne: http://localhost:7000
pause