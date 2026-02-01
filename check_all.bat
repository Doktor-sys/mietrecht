@echo off
echo ============================================
echo SYSTEM CHECK - MIETRECHT APP
echo ============================================
echo.

echo 1. Docker Status:
docker --version
echo.

echo 2. Laufende Container:
docker ps
echo.

echo 3. Alle Container:
docker ps -a
echo.

echo 4. Ports 5000-5010 testen:
for /L %%i in (5000,1,5010) do (
    curl http://localhost:%%i >nul 2>&1
    if !errorlevel! equ 0 echo   Port %%i: ANTWORDET
)
echo.

echo 5. Docker Images:
docker images | findstr /i "mietrecht flask"
echo.

echo 6. Docker System Info:
docker info | findstr "Containers Running"
echo.

echo ============================================
echo EMPFEHLUNG
echo ============================================
echo.
echo Führen Sie diesen Befehl aus:
echo docker run -d -p 5070:5000 --name test python:3.9-alpine sh -c "pip install flask && python -c 'from flask import Flask; app=Flask(\"t\"); @app.route(\"/\"); def h(): return\"TEST\"; app.run(host=\"0.0.0.0\", port=5000)'"
echo.
echo Dann: timeout /t 30 && start http://localhost:5070
echo.
pause