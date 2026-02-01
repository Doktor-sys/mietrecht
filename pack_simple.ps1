Write-Host "Erstelle vereinfachtes Deployment-Paket..."
$files = @(
    "mietrecht_full.py",
    "requirements.txt", 
    "Dockerfile",
    ".env"
)

# Nur benötigte Dateien zippen
Compress-Archive -Path $files -DestinationPath mietrecht_simple.zip -Force

Write-Host "FERTIG: mietrecht_simple.zip erstellt"
Write-Host "Größe: $(Get-Item mietrecht_simple.zip).Length Bytes"