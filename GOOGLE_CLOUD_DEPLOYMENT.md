# Google Cloud Run Deployment Guide

## Voraussetzungen
- Google Cloud SDK installiert
- Projekt: beaming-sunset-484720-e5
- Billing aktiviert
- gcloud CLI authentifiziert

## Schnellstart

### 1. Lokal testen
```bash
# Lokale Entwicklungsumgebung starten
docker compose -f docker-compose.cloud.yml up --build

# Test im Browser: http://localhost:5000
```

### 2. Auf Google Cloud Run bereitstellen
```bash
# Deployment-Skript ausführen
chmod +x deploy_cloud_run.sh
./deploy_cloud_run.sh
```

### 3. Manuelle Bereitstellung (alternativ)
```bash
# 1. Authentifizierung
gcloud auth login
gcloud config set project beaming-sunset-484720-e5

# 2. APIs aktivieren
gcloud services enable run.googleapis.com containerregistry.googleapis.com cloudbuild.googleapis.com

# 3. Container bauen und pushen
gcloud builds submit --tag gcr.io/beaming-sunset-484720-e5/jurismind-mietrecht --file Dockerfile.cloudrun

# 4. Auf Cloud Run deployen
gcloud run deploy jurismind-mietrecht \
    --image gcr.io/beaming-sunset-484720-e5/jurismind-mietrecht \
    --platform managed \
    --region europe-west1 \
    --allow-unauthenticated \
    --port 5000 \
    --memory 1Gi \
    --cpu 1
```

## Wichtige Dateien
- `cloudbuild.yaml` - Automatisches Build und Deployment
- `Dockerfile.cloudrun` - Google Cloud optimiertes Dockerfile
- `docker-compose.cloud.yml` - Lokale Entwicklungsumgebung
- `deploy_cloud_run.sh` - Automatisches Deployment-Skript

## Nach der Bereitstellung
1. Service-URL aus Ausgabe kopieren
2. Domain verknüpfen (optional)
3. HTTPS-Zertifikat wird automatisch bereitgestellt
4. Monitoring in Google Cloud Console einrichten

## Updates bereitstellen
Einfach das Deployment-Skript erneut ausführen oder neue Commits pushen (wenn CI/CD aktiviert).