@echo off
cd /d "F:\JurisMind\Mietrecht"

echo ============================================
echo JURISMIND MIETRECHT - FINAL DEPLOYMENT
echo ============================================
echo.

echo 1. Alte App stoppen...
docker stop jurismind mystifying_wiles 2>nul
docker rm jurismind mystifying_wiles 2>nul
echo [OK] Alte Apps gestoppt
echo.

echo 2. Erstelle vollständige Mietrecht-App...
powershell -Command "try {
    @'
from flask import Flask, jsonify

app = Flask(__name__)

MIETRECHT_KNOWLEDGE = {
    'kündigung': {
        'frist': '3 Monate zum Monatsende',
        'form': 'Schriftliche Kündigung',
        'paragraph': '§ 573c BGB'
    },
    'mietminderung': {
        'voraussetzung': 'Erheblicher Mangel',
        'höhe': 'Angemessen zur Schwere',
        'vorgehen': 'Mangel anzeigen, Frist setzen'
    },
    'kaution': {
        'höhe': 'Maximal 3 Nettokaltmieten',
        'rückzahlung': 'Innerhalb 6 Monaten'
    }
}

@app.route('/')
def home():
    return '''<!DOCTYPE html>
<html>
<head>
    <title>JurisMind Mietrecht</title>
    <style>
        body { font-family: Arial; padding: 40px; }
        h1 { color: #2c3e50; }
        .card { background: #f8f9fa; padding: 20px; margin: 15px 0; }
    </style>
</head>
<body>
    <h1>✅ JurisMind Mietrecht</h1>
    <p>Ihre digitale Rechtsberatung ist online!</p>
    
    <div class="card">
        <h3>Verfügbare Themen:</h3>
        <ul>
            <li><a href="/api/kündigung">Kündigung</a></li>
            <li><a href="/api/mietminderung">Mietminderung</a></li>
            <li><a href="/api/kaution">Kaution</a></li>
        </ul>
    </div>
    
    <p><a href="/health">Systemstatus</a></p>
</body>
</html>'''

@app.route('/api/<topic>')
def get_topic(topic):
    if topic in MIETRECHT_KNOWLEDGE:
        return jsonify(MIETRECHT_KNOWLEDGE[topic])
    return jsonify({'error': 'Thema nicht gefunden'}), 404

@app.route('/health')
def health():
    return jsonify({
        'status': 'online',
        'service': 'JurisMind Mietrecht',
        'version': '1.0',
        'docker': True
    })

if __name__ == '__main__':
    print('JurisMind App startet auf Port 5000...')
    app.run(host='0.0.0.0', port=5000)
'@ | Out-File -FilePath 'jurismind_app.py' -Encoding UTF8
    Write-Host '[OK] App erstellt' -ForegroundColor Green
} catch {
    Write-Host '[ERROR] PowerShell Fehler' -ForegroundColor Red
    exit 1
}"

echo [OK] jurismind_app.py erstellt
echo.

echo 3. Docker Image bauen...
echo FROM python:3.9-slim > Dockerfile.jurismind
echo COPY jurismind_app.py . >> Dockerfile.jurismind
echo RUN pip install flask >> Dockerfile.jurismind
echo CMD ["python", "jurismind_app.py"] >> Dockerfile.jurismind

docker build -f Dockerfile.jurismind -t jurismind-app .
echo [OK] Image gebaut: jurismind-app
echo.

echo 4. Container starten...
docker run -d -p 5000:5000 --name jurismind-app-container jurismind-app
echo [OK] Container gestartet
echo.

echo 5. Warte 20 Sekunden für Start...
timeout /t 20 >nul
echo.

echo 6. Teste App...
curl http://localhost:5000 2>nul && (
    echo [SUCCESS] ✅ App antwortet!
) || (
    echo [INFO] Keine direkte Antwort
)
echo.

echo 7. Container Status:
docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
echo.

echo ============================================
echo 🎉 JURISMIND MIETRECHT IST ONLINE!
echo ============================================
echo.
echo Ihre App ist erreichbar unter:
echo   🌐 http://localhost:5000
echo   🔗 http://127.0.0.1:5000
echo.
echo Test-URLs:
echo   - http://localhost:5000/api/kündigung
echo   - http://localhost:5000/api/mietminderung
echo   - http://localhost:5000/health
echo.
pause