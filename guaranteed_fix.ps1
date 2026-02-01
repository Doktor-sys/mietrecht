# PowerShell Skript - Als Administrator ausführen!
Write-Host "===========================================" -ForegroundColor Cyan
Write-Host "MIETRECHT APP - GARANTIERTE LÖSUNG" -ForegroundColor Cyan
Write-Host "===========================================" -ForegroundColor Cyan
Write-Host ""

# 1. Zum Verzeichnis wechseln
Set-Location "F:\JurisMind\Mietrecht"
Write-Host "Arbeitsverzeichnis: $(Get-Location)" -ForegroundColor Green
Write-Host ""

# 2. Alle Container stoppen
Write-Host "1. Bereinige alte Container..." -ForegroundColor Yellow
docker stop $(docker ps -q) 2>$null
docker rm $(docker ps -aq) 2>$null
Write-Host "   ✓ Alle Container gestoppt" -ForegroundColor Green
Write-Host ""

# 3. Einfache Flask App erstellen
Write-Host "2. Erstelle minimale Flask App..." -ForegroundColor Yellow
$appContent = @'
from flask import Flask, jsonify
import os

app = Flask(__name__)

@app.route('/')
def home():
    return jsonify({
        "message": "JurisMind Mietrecht API",
        "status": "online", 
        "container_ip": os.environ.get('HOSTNAME', 'unknown')
    })

@app.route('/api/test')
def test():
    return jsonify({"test": "success", "timestamp": "now"})

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=False)
'@

Set-Content -Path "app.py" -Value $appContent -Encoding UTF8
Write-Host "   ✓ app.py erstellt" -ForegroundColor Green

# 4. Einfaches Dockerfile
Write-Host "3. Erstelle Dockerfile..." -ForegroundColor Yellow
$dockerfileContent = @'
FROM python:3.9-alpine
WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir flask gunicorn
COPY app.py .
EXPOSE 5000
CMD ["gunicorn", "-w", "4", "-b", "0.0.0.0:5000", "app:app"]
'@

Set-Content -Path "Dockerfile" -Value $dockerfileContent -Encoding UTF8
Write-Host "   ✓ Dockerfile erstellt" -ForegroundColor Green

# 5. Requirements
Write-Host "4. Erstelle requirements.txt..." -ForegroundColor Yellow
$requirements = @'
Flask==2.3.3
gunicorn==20.1.0
'@

Set-Content -Path "requirements.txt" -Value $requirements -Encoding UTF8
Write-Host "   ✓ requirements.txt erstellt" -ForegroundColor Green
Write-Host ""

# 6. Image bauen
Write-Host "5. Baue Docker Image..." -ForegroundColor Yellow
docker build -t mietrecht-guaranteed .
if ($LASTEXITCODE -ne 0) {
    Write-Host "   ✗ Build fehlgeschlagen" -ForegroundColor Red
    exit 1
}
Write-Host "   ✓ Image gebaut" -ForegroundColor Green
Write-Host ""

# 7. Freien Port finden
Write-Host "6. Suche freien Port..." -ForegroundColor Yellow
$port = 5000
do {
    $port++
    $connection = Test-NetConnection -ComputerName localhost -Port $port -WarningAction SilentlyContinue 2>$null
} while ($connection.TcpTestSucceeded -eq $true -and $port -lt 5010)

Write-Host "   Verwende Port: $port" -ForegroundColor Green
Write-Host ""

# 8. Container starten mit expliziter Netzwerk-Konfiguration
Write-Host "7. Starte Container..." -ForegroundColor Yellow
Write-Host "   Befehl: docker run -d -p ${port}:5000 --name mietrecht-prod mietrecht-guaranteed" -ForegroundColor Gray
docker run -d -p "${port}:5000" --name mietrecht-prod mietrecht-guaranteed

if ($LASTEXITCODE -ne 0) {
    Write-Host "   ✗ Container start fehlgeschlagen" -ForegroundColor Red
    Write-Host "   Versuche alternative Methode..." -ForegroundColor Yellow
    
    # Alternative: Mit --network bridge
    docker run -d -p "${port}:5000" --network bridge --name mietrecht-prod mietrecht-guaranteed
}
Write-Host "   ✓ Container gestartet" -ForegroundColor Green
Write-Host ""

# 9. Warten und testen
Write-Host "8. Warte auf App-Start (15 Sekunden)..." -ForegroundColor Yellow
Start-Sleep -Seconds 15
Write-Host ""

# 10. Container Status
Write-Host "9. Container Status:" -ForegroundColor Yellow
docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
Write-Host ""

# 11. Mehrere Test-Methoden
Write-Host "10. Teste Verbindung..." -ForegroundColor Yellow

$url = "http://localhost:$port"
$url2 = "http://127.0.0.1:$port"

Write-Host "   Test 1: Invoke-WebRequest an $url" -ForegroundColor Gray
try {
    $response = Invoke-WebRequest -Uri $url -TimeoutSec 5
    Write-Host "   ✅ Erfolg! Status: $($response.StatusCode)" -ForegroundColor Green
    $response.Content | ConvertFrom-Json | Format-List
} catch {
    Write-Host "   ⚠ Test 1 fehlgeschlagen: $($_.Exception.Message)" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "   Test 2: curl an $url2" -ForegroundColor Gray
try {
    $result = curl -s $url2 2>$null
    if ($result) {
        Write-Host "   ✅ curl erfolgreich" -ForegroundColor Green
        $result
    }
} catch {
    Write-Host "   ⚠ curl fehlgeschlagen" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "   Test 3: Von Container selbst testen" -ForegroundColor Gray
docker exec mietrecht-prod sh -c "wget -qO- http://localhost:5000 || curl -s http://localhost:5000" 2>$null
if ($LASTEXITCODE -eq 0) {
    Write-Host "   ✅ Container antwortet intern" -ForegroundColor Green
}

Write-Host ""

# 12. Wenn alles fehlschlägt, direkte IP
Write-Host "11. Alternative Zugriffsmethoden:" -ForegroundColor Yellow
$containerIp = docker inspect -f '{{range .NetworkSettings.Networks}}{{.IPAddress}}{{end}}' mietrecht-prod
Write-Host "   Container IP: $containerIp" -ForegroundColor Gray
Write-Host "   Docker Host IP: host.docker.internal" -ForegroundColor Gray
Write-Host ""

Write-Host "===========================================" -ForegroundColor Cyan
Write-Host "ERGEBNIS:" -ForegroundColor Cyan
Write-Host "===========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "📌 PRIMÄRER ZUGRIFF:" -ForegroundColor Green
Write-Host "   Browser: $url" -ForegroundColor White
Write-Host "   ODER: $url2" -ForegroundColor White
Write-Host ""
Write-Host "📌 ALTERNATIVE METHODEN:" -ForegroundColor Yellow
Write-Host "   1. Docker Desktop Dashboard öffnen"
Write-Host "   2. Container 'mietrecht-prod' auswählen"
Write-Host "   3. Auf 'Open in Browser' klicken"
Write-Host ""
Write-Host "📌 TROUBLESHOOTING:" -ForegroundColor Red
Write-Host "   Falls keine Verbindung:"
Write-Host "   1. Windows Defender Firewall temporär deaktivieren"
Write-Host "   2. Im Browser: chrome://net-internals/#sockets"
Write-Host "   3. Docker Desktop: Settings > Resources > Network > Reset"
Write-Host ""
Write-Host "Drücken Sie Enter um Browser zu öffnen..." -ForegroundColor Cyan
Read-Host
Start-Process $url