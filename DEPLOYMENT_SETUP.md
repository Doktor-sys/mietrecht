# 🚀 SmartLaw Agent - Automatisches Deployment Setup

## 📋 Voraussetzungen

1. **GitHub Repository** für Ihren Code
2. **Server** mit Docker und Docker Compose
3. **SSH-Zugang** zum Server

## 🔧 Setup-Schritte

### 1. GitHub Repository erstellen

```bash
# Repository initialisieren (falls noch nicht geschehen)
git init
git add .
git commit -m "Initial commit: SmartLaw Agent"
git branch -M main
git remote add origin https://github.com/IHR_USERNAME/smartlaw-agent.git
git push -u origin main
```

### 2. GitHub Secrets konfigurieren

Gehen Sie zu Ihrem GitHub Repository → Settings → Secrets and variables → Actions

Fügen Sie folgende Secrets hinzu:

| Secret Name | Beschreibung | Beispiel |
|-------------|--------------|----------|
| `SERVER_HOST` | Server IP-Adresse | `35.195.246.45` |
| `SERVER_USER` | SSH Benutzername | `root` oder `ubuntu` |
| `SERVER_SSH_KEY` | Private SSH Key | `-----BEGIN OPENSSH PRIVATE KEY-----...` |
| `SERVER_PORT` | SSH Port (optional) | `22` |
| `DOCKER_USERNAME` | Docker Hub Username (optional) | `ihr_username` |
| `DOCKER_PASSWORD` | Docker Hub Token (optional) | `dckr_pat_...` |

### 3. Server vorbereiten

SSH-Verbindung zum Server:

```bash
ssh root@35.195.246.45
```

Auf dem Server:

```bash
# Docker installieren (falls nicht vorhanden)
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh

# Docker Compose installieren
sudo curl -L "https://github.com/docker/compose/releases/download/v2.24.0/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Git installieren
apt update && apt install -y git curl

# Repository klonen
cd /opt
git clone https://github.com/IHR_USERNAME/smartlaw-agent.git
cd smartlaw-agent

# Umgebungsvariablen setzen
cp .env.example .env
nano .env  # API Keys eintragen
```

### 4. Manuelles Deployment testen

```bash
# Auf dem Server
cd /opt/smartlaw-agent
./deploy.sh
```

Oder auf Windows (lokal):
```cmd
deploy.bat
```

### 5. Automatisches Deployment aktivieren

Nach dem Push zu GitHub wird automatisch deployed:

```bash
git add .
git commit -m "Update: Bereinigte Anwendung"
git push origin main
```

## 🔍 Monitoring

### Logs anzeigen
```bash
# Auf dem Server
docker-compose -f docker-compose.prod.yml logs -f
```

### Container Status
```bash
docker-compose -f docker-compose.prod.yml ps
```

### Health Check
```bash
curl https://35-195-246-45.nip.io/smartlaw-agent/health
```

## 🛠️ Troubleshooting

### Deployment fehlgeschlagen
1. GitHub Actions Logs prüfen
2. Server SSH-Verbindung testen
3. Docker auf Server prüfen

### SSL-Zertifikat Probleme
```bash
# Caddy Logs prüfen
docker-compose -f docker-compose.prod.yml logs caddy
```

### Anwendung nicht erreichbar
```bash
# Container neu starten
docker-compose -f docker-compose.prod.yml restart
```

## 📞 Support

Bei Problemen:
1. GitHub Actions Logs prüfen
2. Server-Logs analysieren
3. Health-Check URLs testen

---

**🎉 Nach dem Setup:** Jeder `git push` löst automatisch ein Deployment aus!