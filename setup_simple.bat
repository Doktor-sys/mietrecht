@echo off
cd /d F:\JurisMind\Mietrecht

echo Erstelle Dockerfile...
echo FROM python:3.9-slim > Dockerfile
echo WORKDIR /app >> Dockerfile
echo COPY requirements.txt . >> Dockerfile
echo RUN pip install -r requirements.txt >> Dockerfile
echo COPY . . >> Dockerfile
echo ENV FLASK_APP=app.py >> Dockerfile
echo CMD ["flask", "run", "--host=0.0.0.0"] >> Dockerfile

echo Erstelle requirements.txt...
if not exist requirements.txt (
    echo Flask > requirements.txt
)

echo Erstelle app.py...
if not exist app.py (
    echo from flask import Flask, jsonify > app.py
    echo app = Flask(__name__) >> app.py
    echo. >> app.py
    echo @app.route('/') >> app.py
    echo def home(): >> app.py
    echo     return "Mietrecht App ist online" >> app.py
    echo. >> app.py
    echo if __name__ == '__main__': >> app.py
    echo     app.run(debug=True) >> app.py
)

echo Baue Docker Image...
docker build -t mietrecht-app .

echo Starte Container...
docker run -d -p 5001:5000 --name mietrecht mietrecht-app

echo.
echo Fertig! Oeffnen Sie: http://localhost:5001
pause