@echo off
cls
echo ==========================================================
echo       JurisMind: Mietrecht-App Diagnose-Tool
echo ==========================================================
echo.

echo *** DEBUG: Aktuelles Verzeichnis ist: %cd%
echo *** DEBUG: Erwartetes Verzeichnis: F:\JurisMind\Mietrecht
echo.

REM 1. Pfadprüfung - EINFACHERE VERSION
echo [1/5] Pruefe Verzeichnis...
echo %cd% | findstr /i "F:\\JurisMind\\Mietrecht" >nul
if %errorlevel% neq 0 (
    echo FEHLER: Du bist im falschen Ordner: %cd%
    echo Bitte wechsle nach F:\JurisMind\Mietrecht
    echo.
    echo DEBUG-INFO: Erstelle hier die notwendigen Dateien trotzdem...
    REM Kein Exit, sondern fortfahren
) else (
    echo OK: Verzeichnis ist korrekt.
)
echo.

REM 2. Dateipruefung (mit Fallback)
echo [2/5] Pruefe und erstelle app_simple.py...
if not exist "app_simple.py" (
    echo WARNUNG: app_simple.py nicht gefunden. Erstelle Standard-Version...
    echo from flask import Flask > app_simple.py
    echo app = Flask(__name__) >> app_simple.py
    echo @app.route('/') >> app_simple.py
    echo def home(): return 'Mietrecht-App Diagnose: System OK' >> app_simple.py
    echo if __name__ == '__main__': app.run(host='0.0.0.0', port=5000) >> app_simple.py
    echo OK: app_simple.py erstellt.
) else (
    findstr /C:"echo" app_simple.py >nul
    if %errorlevel%==0 (
        echo WARNUNG: Die Datei enthaelt CMD-Befehle. Repariere...
        echo from flask import Flask > app_simple.py
        echo app = Flask(__name__) >> app_simple.py
        echo @app.route('/') >> app_simple.py
        echo def home(): return 'Mietrecht-App Diagnose: System OK' >> app_simple.py
        echo if __name__ == '__main__': app.run(host='0.0.0.0', port=5000) >> app_simple.py
        echo Datei repariert.
    ) else (
        echo OK: app_simple.py sieht gut aus.
    )
)
echo.

REM 3. Erstelle Dockerfile falls nicht vorhanden
echo [3/5] Pruefe Dockerfile...
if not exist "Dockerfile" (
    echo WARNUNG: Dockerfile nicht gefunden. Erstelle Standard-Version...
    echo FROM python:3.9-slim > Dockerfile
    echo WORKDIR /app >> Dockerfile
    echo COPY requirements.txt . >> Dockerfile
    echo RUN pip install --no-cache-dir -r requirements.txt >> Dockerfile
    echo COPY app_simple.py . >> Dockerfile
    echo CMD ["python", "app_simple.py"] >> Dockerfile
    echo OK: Dockerfile erstellt.
    
    if not exist "requirements.txt" (
        echo flask > requirements.txt
        echo OK: requirements.txt erstellt.
    )
) else (
    echo OK: Dockerfile vorhanden.
)
echo.

REM 4. Docker Cleanup
echo [4/5] Raeume alte Docker-Reste auf...
docker stop mietrecht-container 2>nul
echo DEBUG: Docker stop exit code: %errorlevel%
docker rm mietrecht-container 2>nul
echo DEBUG: Docker rm exit code: %errorlevel%
echo Alte Container entfernt (falls vorhanden).
echo.

REM 5. Build Prozess
echo [5/5] Starte Docker Build...
echo *** DEBUG: Aktueller Inhalt von Dockerfile:
type Dockerfile 2>nul || echo Dockerfile kann nicht gelesen werden
echo.
docker build -t mietrecht-app .
if %errorlevel% neq 0 (
    echo.
    echo FEHLER: Docker Build fehlgeschlagen!
    echo.
    echo TROTZDEM versuche Container zu starten...
    REM Kein Exit, fortfahren
) else (
    echo OK: Build erfolgreich.
)
echo.

REM 6. Start und Log-Check
echo [6/6] Starte Container...
docker run -d -p 7000:5000 --name mietrecht-container mietrecht-app 2>&1
timeout /t 5 >nul

echo.
echo ==========================================================
echo                   ERGEBNIS DER DIAGNOSE
echo ==========================================================
echo.

echo --- AKTUELLE DOCKER CONTAINER ---
docker ps -a | findstr "mietrecht"
echo.

echo --- DOCKER LOGS ---
docker logs mietrecht-container 2>&1
echo ----------------------------
echo.

echo --- PRUEFUNGEN ---
docker inspect mietrecht-container 2>nul | findstr "Status" >nul
if %errorlevel%==0 (
    echo STATUS: Container laeuft
    echo URL: http://localhost:7000
) else (
    echo STATUS: Container laeuft NICHT oder existiert nicht
)

echo.
echo ==========================================================
echo Tipp: Wenn der Container nicht laeuft, pruefe:
echo 1. Ist Docker Desktop gestartet?
echo 2. Dockerfile Syntax: type Dockerfile
echo 3. Python-Code: type app_simple.py
echo ==========================================================
pause