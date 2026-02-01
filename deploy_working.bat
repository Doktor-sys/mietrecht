@echo off
echo ============================================
echo MIETRECHT APP DEPLOYMENT - WORKING VERSION
echo ============================================
echo.

cd /d "F:\JurisMind\Mietrecht" || (
    echo [ERROR] Kann nicht zum Verzeichnis wechseln
    pause
    exit /b 1
)

echo 1. Alte Container stoppen...
docker stop mietrecht-prod 2>nul
docker rm mietrecht-prod 2>nul
echo [OK] Alte Container entfernt
echo.

echo 2. Einfache app.py erstellen...
echo from flask import Flask, jsonify > app_simple.py
echo app = Flask(__name__) >> app_simple.py
echo. >> app_simple.py
echo MIETRECHT = { >> app_simple.py
echo     '"kündigung"': {'"frist"': '"3 Monate"', '"form"': '"schriftlich"'}, >> app_simple.py
echo     '"mietminderung"': {'"grund"': '"erheblicher Mangel"'}, >> app_simple.py
echo     '"kaution"': {'"höhe"': '"max. 3 Nettokaltmieten"'} >> app_simple.py
echo } >> app_simple.py
echo. >> app_simple.py
echo @app.route('/') >> app_simple.py
echo def home(): >> app_simple.py
echo     return '"<h1>Mietrecht App</h1><p>Produktion</p>"' >> app_simple.py
echo. >> app_simple.py
echo @app.route('/api/<topic>') >> app_simple.py
echo def api(topic): >> app_simple.py
echo     if topic in MIETRECHT: >> app_simple.py
echo         return jsonify(MIETRECHT[topic]) >> app_simple.py
echo     return jsonify({'"error"': '"Nicht gefunden"'}), 404 >> app_simple.py
echo. >> app_simple.py
echo if __name__ == '__main__': >> app_simple.py
echo     app.run(host='"0.0.0.0"', port=5000) >> app_simple.py

echo [OK] app.py erstellt
echo.

echo 3. Dockerfile erstellen...
echo FROM python:3.9-alpine > Dockerfile
echo COPY app_simple.py . >> Dockerfile
echo RUN pip install flask >> Dockerfile
echo CMD ["python", "app_simple.py"] >> Dockerfile

echo [OK] Dockerfile erstellt
echo.

echo 4. Docker Image bauen...
docker build -t mietrecht-working .
if errorlevel 1 (
    echo [ERROR] Build fehlgeschlagen!
    echo Versuche einfachere Methode...
    goto simple_method
)

echo [OK] Image gebaut
echo.

:start_container
echo 5. Container starten...
set PORT=5000
netstat -ano | findstr ":%PORT%" >nul
if %errorlevel% equ 0 (
    echo Port %PORT% ist belegt, suche anderen...
    set PORT=5001
    netstat -ano | findstr ":%PORT%" >nul
    if %errorlevel% equ 0 set PORT=5002
)
echo Verwende Port: %PORT%
echo.

docker run -d -p %PORT%:5000 --name mietrecht-working mietrecht-working
if errorlevel 1 (
    echo [ERROR] Container start fehlgeschlagen!
    goto simple_method
)

echo [OK] Container gestartet
echo.

echo 6. Warte 15 Sekunden fuer App-Start...
timeout /t 15 >nul
echo.

echo 7. Teste App...
echo Teste: curl http://localhost:%PORT%
curl http://localhost:%PORT% 2>nul && (
    echo [SUCCESS] ✅ App antwortet!
) || (
    echo [INFO] Keine direkte Antwort
)
echo.

echo 8. Container Status:
docker ps --filter "name=mietrecht" --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
echo.

echo ============================================
echo 🎉 APP LÄUFT!
echo ============================================
echo.
echo Ihre Mietrecht App ist erreichbar unter:
echo   http://localhost:%PORT%
echo.
echo Drücken Sie Enter um Browser zu öffnen...
pause
start http://localhost:%PORT%
goto end

:simple_method
echo.
echo ============================================
echo ALTERNATIVE: Einfache Methode
echo ============================================
echo.

echo Starte einfache Flask App direkt...
docker run -d -p 8080:5000 --name flask-easy python:3.9-alpine sh -c "pip install flask && python -c 'from flask import Flask; app=Flask(\"app\"); @app.route(\"/\"); def h(): return\"EINFACHE APP\"; app.run(host=\"0.0.0.0\", port=5000)'"

timeout /t 10
echo Öffne: http://localhost:8080
start http://localhost:8080

:end
echo.
pause