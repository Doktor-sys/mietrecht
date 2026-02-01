@echo off
cd /d "F:\JurisMind\Mietrecht"
docker stop mietrecht-app 2>nul
docker rm mietrecht-app 2>nul
docker run -d -p 7000:5000 --name mietrecht-app -v "%cd%:/app" -w /app python:3.9-slim sh -c "pip install flask && python app.py"
timeout /t 3
docker logs mietrecht-app
start http://localhost:7000
echo.
echo App gestartet! Browser sollte sich geoeffnet haben.
pause