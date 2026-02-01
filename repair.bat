@echo off
cd /d F:\JurisMind\Mietrecht

echo 1. Stoppe Container...
docker stop mietrecht 2>nul
docker rm mietrecht 2>nul
echo.

echo 2. Korrigiere app.py...
echo from flask import Flask > app.py
echo. >> app.py
echo app = Flask(__name__) >> app.py
echo. >> app.py
echo @app.route('/') >> app.py
echo def hello(): >> app.py
echo     return "JurisMind Mietrecht App ist online!" >> app.py
echo. >> app.py
echo @app.route('/api/health') >> app.py
echo def health(): >> app.py
echo     return "OK" >> app.py
echo. >> app.py
echo if __name__ == '__main__': >> app.py
echo     app.run(host='0.0.0.0', port=5000) >> app.py
echo [OK] app.py erstellt
echo.

echo 3. Korrigiere Dockerfile...
echo FROM python:3.9-slim > Dockerfile
echo WORKDIR /app >> Dockerfile
echo COPY requirements.txt . >> Dockerfile
echo RUN pip install --no-cache-dir -r requirements.txt >> Dockerfile
echo COPY . . >> Dockerfile
echo ENV FLASK_APP=app.py >> Dockerfile
echo EXPOSE 5000 >> Dockerfile
echo CMD ["python", "-c", "from app import app; app.run(host='0.0.0.0', port=5000)"] >> Dockerfile
echo [OK] Dockerfile erstellt
echo.

echo 4. Baue Image neu...
docker build --no-cache -t mietrecht-app .
if %errorlevel% neq 0 (
    echo [ERROR] Build fehlgeschlagen!
    pause
    exit /b 1
)
echo [OK] Image gebaut
echo.

echo 5. Starte Container...
set PORT=5001
docker run -d -p %PORT%:5000 --name mietrecht mietrecht-app
echo [OK] Container gestartet
echo.

echo 6. Warte 5 Sekunden...
timeout /t 5 >nul
echo.

echo 7. Teste App...
echo Container Logs:
docker logs --tail 3 mietrecht
echo.

echo Teste Verbindung:
curl http://localhost:%PORT% 2>nul
if %errorlevel% equ 0 (
    echo [SUCCESS] App funktioniert!
    echo.
    echo Oeffnen Sie: http://localhost:%PORT%
) else (
    echo [WARNING] App antwortet nicht direkt
    echo Versuche es in 10 Sekunden im Browser...
)
echo.

pause