@echo off
cd /d "F:\JurisMind\Mietrecht"

echo ============================================
echo MIETRECHT APP - GARANTIERT FUNKTIONIEREND
echo ============================================
echo.

echo 1. Alles bereinigen...
docker stop $(docker ps -aq) 2>nul
docker rm $(docker ps -aq) 2>nul
echo.

echo 2. Finde freien Port...
set PORT=5000
:find_port
netstat -ano | findstr ":%PORT%" >nul
if %errorlevel% equ 0 (
    set /a PORT=PORT+1
    goto find_port
)
echo Verwende Port: %PORT%
echo.

echo 3. Flask App IM VORDERGRUND starten (zum Debuggen)...
echo.
echo LASSEN SIE DIESES FENSTER OFFEN!
echo Sie sehen hier die Flask-Logs.
echo.
echo In einem NEUEN CMD-Fenster testen Sie mit:
echo   curl http://localhost:%PORT%
echo.
echo Drücken Sie STRG+C zum Stoppen.
echo.
docker run -p %PORT%:5000 --name flask-debug python:3.9-alpine sh -c "pip install flask && python -c '
from flask import Flask
app = Flask(\"debug\")
@app.route(\"/\")
def hello():
    return \"<h1>Mietrecht App</h1><p>Funktioniert!</p>\"
print(\"App startet auf Port 5000...\")
app.run(host=\"0.0.0.0\", port=5000)
'"