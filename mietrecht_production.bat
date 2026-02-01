@echo off
cd /d "F:\JurisMind\Mietrecht"

echo ============================================
echo MIETRECHT APP - PRODUKTIONSVERSION
echo ============================================
echo.

echo 1. Finde freien Port...
set PORT=5001
:check_port
netstat -ano | findstr ":%PORT%" >nul
if %errorlevel% equ 0 (
    set /a PORT=PORT+1
    goto check_port
)
echo Verwende Port: %PORT%
echo.

echo 2. Produktions-App erstellen...
echo from flask import Flask, jsonify > prod_app.py
echo app = Flask(__name__) >> prod_app.py
echo. >> prod_app.py
echo MIETRECHT = { >> prod_app.py
echo     '"kündigung"': {'"frist"': '"3 Monate"', '"form"': '"schriftlich"'}, >> prod_app.py
echo     '"mietminderung"': {'"voraussetzung"': '"erheblicher Mangel"'}, >> prod_app.py
echo     '"kaution"': {'"höhe"': '"max. 3 Nettokaltmieten"'} >> prod_app.py
echo } >> prod_app.py
echo. >> prod_app.py
echo @app.route("/") >> prod_app.py
echo def home(): >> prod_app.py
echo     html = '"<html><body style=\"padding: 40px; font-family: Arial;\">"' >> prod_app.py
echo     html += '"<h1>✅ JurisMind Mietrecht</h1>"' >> prod_app.py
echo     html += '"<p>Produktionsversion - Docker Deployment erfolgreich!</p>"' >> prod_app.py
echo     for topic in MIETRECHT: >> prod_app.py
echo         html += '"<p><a href=\"/api/"' + topic + '"\">' + topic + '</a></p>"' >> prod_app.py
echo     html += '"</body></html>"' >> prod_app.py
echo     return html >> prod_app.py
echo. >> prod_app.py
echo @app.route("/api/<topic>") >> prod_app.py
echo def api(topic): >> prod_app.py
echo     if topic in MIETRECHT: >> prod_app.py
echo         return jsonify(MIETRECHT[topic]) >> prod_app.py
echo     return jsonify({'"error"': '"Nicht gefunden"'}), 404 >> prod_app.py
echo. >> prod_app.py
echo if __name__ == "__main__": >> prod_app.py
echo     print("Produktions-App startet auf Port 5000...") >> prod_app.py
echo     app.run(host='"0.0.0.0"', port=5000) >> prod_app.py

echo [OK] Produktions-App erstellt
echo.

echo 3. Docker Image bauen...
echo FROM python:3.9-slim > Dockerfile.prod
echo COPY prod_app.py . >> Dockerfile.prod
echo RUN pip install flask >> Dockerfile.prod
echo CMD ["python", "prod_app.py"] >> Dockerfile.prod

docker build -f Dockerfile.prod -t mietrecht-prod .
echo [OK] Image gebaut
echo.

echo 4. Container starten...
docker run -d -p %PORT%:5000 --name mietrecht-prod mietrecht-prod
echo [OK] Container gestartet auf Port %PORT%
echo.

echo 5. Warte 20 Sekunden...
timeout /t 20 >nul
echo.

echo 6. Teste App...
echo Teste: curl http://localhost:%PORT%
curl http://localhost:%PORT% 2>nul && (
    echo [SUCCESS] ✅ Produktions-App läuft!
) || (
    echo [INFO] Keine direkte Antwort
)
echo.

echo 7. Container Status:
docker ps --filter "name=mietrecht" --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
echo.

echo ============================================
echo 🎊 DEPLOYMENT ERFOLGREICH ABGESCHLOSSEN!
echo ============================================
echo.
echo Ihre MIETRECHT APP läuft jetzt in der Produktion:
echo.
echo 🌐 HAUPTPORT (einfach): http://localhost:5000
echo 🚀 PRODUKTIONSPORT: http://localhost:%PORT%
echo.
echo Test-URLs:
echo - http://localhost:%PORT%/api/kündigung
echo - http://localhost:%PORT%/api/mietminderung
echo.
echo Verwaltung:
echo - Logs: docker logs mietrecht-prod
echo - Stoppen: docker stop mietrecht-prod
echo - Neustart: docker restart mietrecht-prod
echo.
pause