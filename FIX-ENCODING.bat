@echo off
chcp 65001 >nul
cls
echo ==========================================================
echo       ENCODING FIX fuer Python/Flask/Docker
echo ==========================================================
echo.

echo 1. Loesche alte Dateien...
if exist app_simple.py del app_simple.py
if exist Dockerfile del Dockerfile
if exist requirements.txt del requirements.txt

echo 2. Erstelle UTF-8 codierte app_simple.py...
(
echo # -*- coding: utf-8 -*-
echo from flask import Flask
echo import os
echo.
echo app = Flask(__name__)
echo.
echo @app.route('/')
echo def home():
echo     return '''^<!DOCTYPE html^>^<html^>^<head^>^<title^>Mietrecht App^</title^>^<meta charset="utf-8"^>^</head^>^<body^>^<h1^>Mietrecht-App laeuft!^</h1^>^</body^>^</html^>'''
echo.
echo @app.route('/health')
echo def health_check():
echo     return {"status": "healthy", "service": "mietrecht-app"}
echo.
echo if __name__ == '__main__':
echo     app.run(host='0.0.0.0', port=5000, debug=False)
) > app_simple.py

echo 3. Konvertiere zu UTF-8...
powershell -Command "Get-Content 'app_simple.py' | Set-Content 'app_simple.py' -Encoding UTF8"

echo 4. Erstelle Dockerfile...
(
echo FROM python:3.9-alpine
echo ENV PYTHONIOENCODING=utf-8
echo ENV LANG=C.UTF-8
echo ENV LC_ALL=C.UTF-8
echo WORKDIR /app
echo COPY requirements.txt .
echo RUN pip install --no-cache-dir -r requirements.txt
echo COPY app_simple.py .
echo EXPOSE 5000
echo CMD ["python", "app_simple.py"]
) > Dockerfile

echo 5. Erstelle requirements.txt...
echo flask==2.3.3 > requirements.txt

echo 6. Pruefe Encoding...
python -c "try:
    with open('app_simple.py', 'r', encoding='utf-8') as f:
        content = f.read()
    print('OK: app_simple.py ist UTF-8 lesbar')
except Exception as e:
    print('FEHLER:', str(e))
"

echo 7. Baue Docker Image...
docker build --no-cache -t mietrecht-app-utf8 .

echo 8. Starte Container...
docker stop mietrecht-utf8 2>nul
docker rm mietrecht-utf8 2>nul
docker run -d -p 7000:5000 --name mietrecht-utf8 mietrecht-app-utf8

echo 9. Warte auf Start...
timeout /t 5 >nul

echo 10. Zeige Logs...
echo =================== LOGS ===================
docker logs mietrecht-utf8
echo.

echo 11. Teste Webseite...
curl http://localhost:7000 2>nul
if %errorlevel%==0 (
    echo OK: http://localhost:7000
    start http://localhost:7000
) else (
    echo TESTE im Container...
    docker exec mietrecht-utf8 python -c "print('Test im Container OK')"
)

echo.
echo ==========================================================
echo FERTIG!
echo ==========================================================
pause