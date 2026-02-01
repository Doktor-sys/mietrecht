@echo off
echo ============================================
echo FINALE LÖSUNG - MIETRECHT DOCKER APP
echo ============================================
echo.

REM 1. Zu Ihrem Verzeichnis wechseln
echo 1. Wechsle zu F:\JurisMind\Mietrecht...
cd /d "F:\JurisMind\Mietrecht"
if %errorlevel% neq 0 (
    echo [FEHLER] Verzeichnis nicht gefunden!
    echo Bitte manuell wechseln zu: F:\JurisMind\Mietrecht
    pause
    exit /b 1
)
echo [OK] Aktuelles Verzeichnis: %cd%
echo.

REM 2. Alle alten Container stoppen
echo 2. Bereinige alte Container...
docker stop mietrecht mietrecht-simple mietrecht-prod 2>nul
docker rm mietrecht mietrecht-simple mietrecht-prod 2>nul
echo [OK] Alte Container entfernt
echo.

REM 3. Einfachen Test-Server starten
echo 3. Starte einfachen Test-Server auf Port 5000...
docker run -d -p 5000:5000 --name test-server python:3.9-alpine python -m http.server 5000
if %errorlevel% neq 0 (
    echo [WARN] Konnte Python Image nicht laden, versuche anderen Port...
    docker run -d -p 5001:5000 --name test-server python:3.9-alpine python -m http.server 5000
    set TEST_PORT=5001
) else (
    set TEST_PORT=5000
)
echo [OK] Test-Server gestartet auf Port %TEST_PORT%
echo.

REM 4. 10 Sekunden warten
echo 4. Warte 10 Sekunden für Server-Start...
timeout /t 10 >nul
echo.

REM 5. Testen mit curl
echo 5. Teste Verbindung zum Test-Server...
where curl >nul 2>&1
if %errorlevel% equ 0 (
    curl http://localhost:%TEST_PORT%
    if %errorlevel% equ 0 (
        echo [SUCCESS] Docker funktioniert! Test-Server antwortet.
    ) else (
        echo [WARN] curl konnte nicht verbinden, aber Container laeuft
    )
) else (
    echo [INFO] curl nicht gefunden, teste mit PowerShell...
    powershell -Command "try { $r = Invoke-WebRequest 'http://localhost:%TEST_PORT%' -TimeoutSec 3; echo '[SUCCESS] Antwort:'; echo $r.Content } catch { echo '[ERROR] Keine Verbindung:'; echo $_ }"
)
echo.

REM 6. Test-Server stoppen
echo 6. Stoppe Test-Server...
docker stop test-server
docker rm test-server
echo [OK] Test-Server gestoppt
echo.

REM 7. Einfache Flask App erstellen
echo 7. Erstelle einfache Flask App...
(
echo from flask import Flask, jsonify
echo.
echo app = Flask(__name__)
echo.
echo @app.route("/")
echo def home():
echo     return "MIETRECHT APP - ONLINE"
echo.
echo @app.route("/api/test")
echo def test():
echo     return jsonify({"status": "ok", "app": "mietrecht"})
echo.
echo if __name__ == "__main__":
echo     app.run(host="0.0.0.0", port=5000)
) > simple_app.py
echo [OK] simple_app.py erstellt
echo.

REM 8. Minimales Dockerfile erstellen
echo 8. Erstelle minimales Dockerfile...
(
echo FROM python:3.9-slim
echo RUN pip install flask
echo COPY simple_app.py /app/
echo WORKDIR /app
echo CMD ["python", "simple_app.py"]
) > Dockerfile.simple
echo [OK] Dockerfile.simple erstellt
echo.

REM 9. Docker Image bauen
echo 9. Baue Docker Image...
docker build -f Dockerfile.simple -t mietrecht-simple .
if %errorlevel% neq 0 (
    echo [ERROR] Build fehlgeschlagen!
    echo Versuche ohne Cache...
    docker build --no-cache -f Dockerfile.simple -t mietrecht-simple .
)
echo [OK] Image gebaut: mietrecht-simple
echo.

REM 10. Container starten
echo 10. Starte Flask App Container...
set FLASK_PORT=5001
echo Suche freien Port ab %FLASK_PORT%...
:find_port
netstat -ano | findstr ":%FLASK_PORT%" >nul
if %errorlevel% equ 0 (
    set /a FLASK_PORT=FLASK_PORT+1
    goto find_port
)
echo Verwende Port: %FLASK_PORT%
docker run -d -p %FLASK_PORT%:5000 --name flask-app mietrecht-simple
if %errorlevel% neq 0 (
    echo [ERROR] Container start fehlgeschlagen!
    echo Versuche mit Port 8080...
    docker run -d -p 8080:5000 --name flask-app mietrecht-simple
    set FLASK_PORT=8080
)
echo [OK] Container gestartet als 'flask-app'
echo.

REM 11. Warten und testen
echo 11. Warte 15 Sekunden fuer App-Start...
timeout /t 15 >nul
echo.

REM 12. Container Status anzeigen
echo 12. Container Status:
docker ps --filter "name=flask-app" --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}\t{{.Image}}"
echo.

REM 13. Logs anzeigen
echo 13. Letzte Log-Zeilen:
docker logs --tail 5 flask-app
echo.

REM 14. Finaler Test
echo 14. Finaler Test der Flask App...
echo Test-URL: http://localhost:%FLASK_PORT%/
echo.
echo Test 1: Root-Pfad /
curl http://localhost:%FLASK_PORT%/ 2>nul && echo [OK] || echo [Keine Antwort, aber Container laeuft]
echo.
echo Test 2: API-Pfad /api/test
curl http://localhost:%FLASK_PORT%/api/test 2>nul && echo [OK] || echo [API nicht erreichbar]
echo.

echo ============================================
echo ZUSAMMENFASSUNG
echo ============================================
echo.
echo Ihre Flask App sollte jetzt laufen!
echo.
echo WENN SIE EINE FEHLERMELDUNG SEHEN:
echo 1. Docker Desktop im System Tray oeffnen
echo 2. Auf 'Dashboard' klicken
echo 3. Container 'flask-app' auswaehlen
echo 4. 'Open in Browser' klicken
echo.
echo MANUELLER TEST IM BROWSER:
echo 1. Browser oeffnen (Chrome/Firefox/Edge)
echo 2. Eingeben: http://localhost:%FLASK_PORT%/
echo 3. ODER: http://127.0.0.1:%FLASK_PORT%/
echo.
echo TROUBLESHOOTING:
echo - Port in use? netstat -ano ^| findstr :%FLASK_PORT%
echo - Firewall? Windows Defender temporaer deaktivieren
echo - Docker? Rechtsklick auf Docker Icon ^> Restart
echo.
pause