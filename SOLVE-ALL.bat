@echo off
cd /d "%~dp0"
chcp 65001 >nul
cls
echo ========================================
echo     KOMPLETTE LÖSUNG - ALLE PROBLEME
echo ========================================
echo.

echo 1. Zeige aktuelle Dateien...
echo.
dir /b
echo.

echo 2. Erstelle KORREKTE app_simple.py...
(
echo from flask import Flask
echo app = Flask(__name__)
echo.
echo @app.route('/')
echo def home():
echo     return '''<h1 style="color: green;">✅ Mietrecht App läuft!</h1><p>Docker + Flask erfolgreich</p>'''
echo.
echo if __name__ == '__main__':
echo     app.run(host='0.0.0.0', port=5000, debug=True)
) > app_simple.py

echo 3. Erstelle KORREKTES Dockerfile (mit COPY Befehl)...
(
echo FROM python:3.9-slim
echo WORKDIR /app
echo COPY app_simple.py ./
echo RUN pip install flask
echo EXPOSE 5000
echo CMD ["python", "app_simple.py"]
) > Dockerfile

echo 4. Zeige Dateien zur Kontrolle...
echo --- Dockerfile Inhalt ---
type Dockerfile
echo.
echo --- app_simple.py Inhalt (erste 5 Zeilen) ---
type app_simple.py | findstr /n "^" | findstr "^[1-5]:"
echo.

echo 5. Teste ob Dateien existieren...
if exist app_simple.py (
    echo ✅ app_simple.py existiert
) else (
    echo ❌ app_simple.py fehlt!
)

if exist Dockerfile (
    echo ✅ Dockerfile existiert
) else (
    echo ❌ Dockerfile fehlt!
)
echo.

echo 6. Teste Docker Build mit DETAILS...
echo --- DOCKER BUILD START ---
docker build --no-cache --progress=plain -t mietrecht-final .
echo --- DOCKER BUILD ENDE ---
echo.

if %errorlevel% neq 0 (
    echo ❌ BUILD FEHLGESCHLAGEN!
    echo.
    echo TESTE MANUELL:
    echo docker build -t test .
    pause
    exit /b 1
)

echo 7. Starte Container MIT VOLUMES (für Debugging)...
docker stop mietrecht-final 2>nul
docker rm mietrecht-final 2>nul

REM Wichtig: -v Parameter kopiert aktuelle Dateien in den Container
docker run -d ^
  -p 7000:5000 ^
  --name mietrecht-final ^
  -v "%cd%/app_simple.py:/app/app_simple.py" ^
  mietrecht-final

echo 8. Warte auf Start...
timeout /t 5 >nul

echo 9. Prüfe Container Status...
echo --- DOCKER PS ---
docker ps | findstr "mietrecht"
echo.

echo 10. Zeige DETAILED Logs...
echo --- CONTAINER LOGS ---
docker logs mietrecht-final
echo.

echo 11. Prüfe Dateien IM CONTAINER...
echo --- DATEIEN IM CONTAINER ---
docker exec mietrecht-final ls -la /app/
echo.
docker exec mietrecht-final cat /app/app_simple.py 2>nul | findstr /n "^" | findstr "^[1-3]:"
echo.

echo 12. Teste Flask IM CONTAINER...
docker exec mietrecht-final python -c "
try:
    from app_simple import app
    print('✅ Flask App kann importiert werden')
    print('Routes:', [str(rule) for rule in app.url_map.iter_rules()])
except Exception as e:
    print('❌ Fehler:', str(e))
"
echo.

echo 13. Teste Webseite...
curl http://localhost:7000 2>nul
if %errorlevel%==0 (
    echo ✅ Webseite antwortet!
) else (
    echo ⚠️  Teste interne Verbindung...
    docker exec mietrecht-final curl -s http://localhost:5000 2>nul && (
        echo ✅ Container antwortet intern auf Port 5000
        echo ℹ️  Problem: Port 7000 -> 5000 Mapping funktioniert nicht
    ) || echo ❌ Container antwortet nicht
)

echo.
echo 14. Öffne Browser...
start http://localhost:7000 2>nul

echo ========================================
echo     TROUBLESHOOTING
echo ========================================
echo Wenn weiße Seite: Browser F5 drücken
echo Wenn Fehler: docker logs mietrecht-final
echo.
pause