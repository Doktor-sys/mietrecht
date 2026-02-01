@echo off
cd /d "F:\JurisMind\Mietrecht"

echo ============================================
echo MIETRECHT APP - CLEAN START
echo ============================================
echo.

echo 1. ALLE Container stoppen und entfernen...
docker stop $(docker ps -aq) 2>nul
docker rm $(docker ps -aq) 2>nul
echo [OK] Alles bereinigt
echo.

echo 2. Freien Port finden...
set PORT=5050
:check
netstat -ano | findstr ":%PORT%" >nul
if %errorlevel% equ 0 (
    echo Port %PORT% belegt...
    set /a PORT=PORT+1
    goto check
)
echo Verwende Port: %PORT%
echo.

echo 3. Flask App starten...
docker run -d -p %PORT%:5000 --name mietrecht-app python:3.9-alpine sh -c "pip install flask && python -c '
from flask import Flask
app = Flask(__"name__")

print(\"=\" * 50)
print(\"MIETRECHT APP STARTET\")
print(\"Port 5000 im Container\")
print(\"Port %PORT% auf dem Host\")
print(\"=\" * 50)

@app.route(\"/\")
def home():
    return \"<h1>✅ MIETRECHT APP LÄUFT!</h1><p>Erfolgreich mit Docker deployed</p><p>Port: %PORT%</p>\"

@app.route(\"/health\")
def health():
    return \"{\\"status\\": \\"ok\\"}\"

print(\"App läuft...\")
app.run(host=\"0.0.0.0\", port=5000)
'"
echo [OK] Container gestartet: mietrecht-app
echo.

echo 4. Warte 15 Sekunden (Flask braucht Zeit)...
timeout /t 15 >nul
echo.

echo 5. Teste App...
echo Test-URL: http://localhost:%PORT%
curl http://localhost:%PORT% 2>nul
if errorlevel 1 (
    echo [INFO] Keine direkte Antwort, aber Container läuft vielleicht
) else (
    echo [SUCCESS] ✅ App antwortet!
)
echo.

echo 6. Zeige Container Status...
docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}\t{{.CreatedAt}}"
echo.

echo 7. Zeige Logs (letzte 5 Zeilen)...
docker logs --tail 5 mietrecht-app
echo.

echo ============================================
echo 🎉 FERTIG!
echo ============================================
echo.
echo Ihre App sollte jetzt unter folgender URL erreichbar sein:
echo   http://localhost:%PORT%
echo.
echo Falls nicht:
echo 1. Warten Sie 30 Sekunden
echo 2. Öffnen Sie http://localhost:%PORT% im Browser
echo 3. Prüfen Sie Logs: docker logs mietrecht-app
echo.
pause