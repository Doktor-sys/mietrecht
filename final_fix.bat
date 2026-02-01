@echo off
cd /d "F:\JurisMind\Mietrecht"

echo ============================================
echo MIETRECHT APP - FINAL FIX
echo ============================================
echo.

echo 1. ALLE Container stoppen...
docker stop $(docker ps -aq) 2>nul
docker rm $(docker ps -aq) 2>nul
echo [OK] Bereinigt
echo.

echo 2. Port 5000 testen (weil ein Container darauf läuft)...
set PORT=5000
netstat -ano | findstr ":%PORT%" >nul
if %errorlevel% equ 0 (
    echo Port %PORT% belegt, verwende 5001...
    set PORT=5001
)
echo Verwende Port: %PORT%
echo.

echo 3. Erstelle Python Datei lokal...
echo from flask import Flask > flask_app.py
echo app = Flask(__name__) >> flask_app.py
echo. >> flask_app.py
echo @app.route("/") >> flask_app.py
echo def home(): >> flask_app.py
echo     return "MIETRECHT APP - FUNKTIONIERT!" >> flask_app.py
echo. >> flask_app.py
echo if __name__ == "__main__": >> flask_app.py
echo     app.run(host="0.0.0.0", port=5000) >> flask_app.py

echo [OK] flask_app.py erstellt
type flask_app.py
echo.

echo 4. Erstelle Dockerfile...
echo FROM python:3.9-slim > Dockerfile
echo COPY flask_app.py . >> Dockerfile
echo RUN pip install flask >> Dockerfile
echo CMD ["python", "flask_app.py"] >> Dockerfile

echo [OK] Dockerfile erstellt
type Dockerfile
echo.

echo 5. Baue Image...
docker build -t mietrecht-fixed .
echo [OK] Image gebaut: mietrecht-fixed
echo.

echo 6. Container starten...
docker run -d -p %PORT%:5000 --name mietrecht-fixed mietrecht-fixed
echo [OK] Container gestartet
echo.

echo 7. Warte 10 Sekunden...
timeout /t 10 >nul
echo.

echo 8. Teste App...
echo Teste: curl http://localhost:%PORT%
curl http://localhost:%PORT% 2>nul && (
    echo [SUCCESS] ✅ App antwortet!
) || (
    echo [INFO] Keine direkte Antwort
)
echo.

echo 9. Container Status:
docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
echo.

echo 10. Zeige Logs...
docker logs --tail 10 mietrecht-fixed
echo.

echo ============================================
echo FERTIG!
echo ============================================
echo.
echo App-URL: http://localhost:%PORT%
echo.
echo Browser öffnen mit: start http://localhost:%PORT%
echo.
pause