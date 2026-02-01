Write-Host "Verpacke JurisMind für Deployment..."
$files = @(
    "mietrecht_full.py",
    "requirements.txt",
    "Dockerfile",
    ".env",
    "docker-compose.prod.yml",
    "static"
)

# Zip erstellen (überschreiben falls existiert)
Compress-Archive -Path $files -DestinationPath deployment.zip -Force

Write-Host "FERTIG: deployment.zip wurde erstellt."
Write-Host "Diese Datei können Sie jetzt auf den Server hochladen."
