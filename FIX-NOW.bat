@echo off
chcp 65001 >nul
cls
echo ========================================
echo     ENCODING PROBLEM FIX - JETZT!
echo ========================================
echo.

echo 1. Loesche alte Datei...
if exist app_simple.py del app_simple.py

echo 2. Erstelle NEUE app_simple.py (UTF-8)...
(
echo # -*- coding: utf-8 -*-
echo from flask import Flask
echo.
echo app = Flask^(__name__^)
echo.
echo @app.route^('/'^)
echo def home^(^):
echo     return '''^<!DOCTYPE html^>^<html^>^<head^>^<title^>Mietrecht App^</title^>^<meta charset="utf-8"^>^</head^>^<body^>^<h1^>Mietrecht App: System OK^</h1^>^</body^>^</html^>'''
echo.
echo @app.route^('/health'^)
echo def health^(^):
echo     return {"status": "healthy", "service": "mietrecht-app"}
echo.
echo if __name__ == '__main__':
echo     app.run^(host='0.0.0.0', port=5000^)
) > app_simple.py

echo 3. Konvertiere zu UTF-8 mit PowerShell...
powershell -Command "[System.IO.File]::WriteAllText('app_simple.py', [System.IO.File]::ReadAllText('app_simple.py'), [System.Text.Encoding]::UTF8)"

echo 4. Pruefe Datei...
python -c "
try:
    with open('app_simple.py', 'r', encoding='utf-8') as f:
        f.read()
    print('OK: Datei ist UTF-8')
except Exception as e:
    print('FEHLER:', e)
"
echo.

echo 5. Erstelle Dockerfile mit UTF-8 Environment...
(
echo FROM python:3.9-slim
echo ENV PYTHONIOENCODING=utf-8
echo ENV LANG=C.UTF-8
echo WORKDIR /app
echo COPY requirements.txt .
echo RUN pip install flask
echo COPY app_simple.py .
echo CMD ["python", "app_simple.py"]
) > Dockerfile

echo 6. Erstelle requirements.txt...
echo flask > requirements.txt

echo 7. Baue Image NEU...
docker build --no-cache -t mietrecht-fixed .

echo 8. Starte Container...
docker run -d -p 7000:5000 --name mietrecht-fixed mietrecht-fixed

echo 9. Warte...
timeout /t 3 >nul

echo 10. Zeige Logs...
docker logs mietrecht-fixed
echo.

echo 11. Teste...
curl http://localhost:7000 2>nul && echo OK: http://localhost:7000 || echo Teste manuell
start http://localhost:7000
pause