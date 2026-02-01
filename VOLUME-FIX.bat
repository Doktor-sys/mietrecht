@echo off
cd /d "F:\JurisMind\Mietrecht"
cls
echo ========================================
echo     ULTIMATIVE LOSUNG
echo ========================================
echo.

echo 1. Erstelle einfache app.py...
echo from flask import Flask > app.py
echo. >> app.py
echo app = Flask(__name__) >> app.py
echo. >> app.py
echo @app.route('/') >> app.py
echo def home(): >> app.py
echo     return "MIETRECHT APP FUNKTIONIERT" >> app.py
echo. >> app.py
echo if __name__ == '__main__': >> app.py
echo     app.run(host='0.0.0.0', port=5000) >> app.py

echo 2. Starte Docker mit Volume Mount...
docker stop mietrecht-ultra 2>nul
docker rm mietrecht-ultra 2>nul

docker run -d -p 7000:5000 --name mietrecht-ultra -v "%cd%:/app" -w /app python:3.9-slim sh -c "pip install flask && python app.py"

echo 3. Warte 5 Sekunden...
timeout /t 5 >nul

echo 4. Zeige Logs...
docker logs mietrecht-ultra

echo 5. Oeffne Browser...
start http://localhost:7000

echo.
echo FERTIG! Druecke eine Taste...
pause