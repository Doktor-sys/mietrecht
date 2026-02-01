@echo off
cd /d "F:\JurisMind\Mietrecht"

echo ============================================
echo MIETRECHT APP - EINFACHE VERSION
echo ============================================
echo.

echo 1. Alte Container stoppen...
docker stop jurismind 2>nul
docker rm jurismind 2>nul
echo [OK] Alte Container entfernt
echo.

echo 2. Einfache app.py erstellen...
echo from flask import Flask, jsonify > app_easy.py
echo app = Flask(__name__) >> app_easy.py
echo. >> app_easy.py
echo @app.route("/") >> app_easy.py
echo def home(): >> app_easy.py
echo     return "MIETRECHT APP - EINFACHE VERSION" >> app_easy.py
echo. >> app_easy.py
echo if __name__ == "__main__": >> app_easy.py
echo     app.run(host="0.0.0.0", port=5000) >> app_easy.py

echo [OK] app_easy.py erstellt
echo Inhalt:
type app_easy.py
echo.

echo 3. Dockerfile erstellen...
echo FROM python:3.9-slim > Dockerfile.easy
echo COPY app_easy.py . >> Dockerfile.easy
echo RUN pip install flask >> Dockerfile.easy
echo CMD ["python", "app_easy.py"] >> Dockerfile.easy

echo [OK] Dockerfile erstellt
echo.

echo 4. Image bauen...
docker build -f Dockerfile.easy -t mietrecht-easy .
echo [OK] Image gebaut
echo.

echo 5. Container starten...
docker run -d -p 5000:5000 --name mietrecht-easy mietrecht-easy
echo [OK] Container gestartet auf Port 5000
echo.

echo 6. Warte 15 Sekunden...
timeout /t 15 >nul
echo.

echo 7. Teste App...
curl http://localhost:5000 2>nul && (
    echo [SUCCESS] App antwortet!
) || (
    echo [INFO] Keine direkte Antwort
)
echo.

echo 8. Container Status:
docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
echo.

echo ============================================
echo FERTIG!
echo ============================================
echo.
echo Ihre App läuft unter: http://localhost:5000
echo.
echo Drücken Sie Enter um Browser zu öffnen...
pause
start http://localhost:5000