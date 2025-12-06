# 🚀 SmartLaw Mietrecht — Umfassender Deployment Guide

**Version:** 1.2.2 (7. Dezember 2025)  
**Status:** ✅ Production Ready

Vollständige, von Grund auf dokumentierte Anleitung für das Deployment des SmartLaw Mietrecht Systems mit allen v1.2.0+ Features (NJW-Integration, Enhanced APIs, Mobile Offline, Visual Regression Testing).

---

## 📋 Inhaltsverzeichnis

1. [Schnellstart (2 Minuten)](#-schnellstart-2-minuten)
2. [Systemarchitektur](#-systemarchitektur)
3. [Voraussetzungen](#-voraussetzungen)
4. [Umgebungsvariablen](#-umgebungsvariablen)
5. [Docker-Deployment](#-docker-deployment)
6. [Lokal-Deployment](#-lokal-deployment)
7. [Production (Heroku)](#-production-deployment-heroku)
8. [Post-Deployment Verifizierung](#-post-deployment-verifizierung)
9. [Health Checks](#-health-checks)
10. [Monitoring & Logging](#-monitoring--logging)
11. [Troubleshooting](#-troubleshooting)
12. [Performance Tuning](#-performance-tuning)
13. [Security Checklist](#-security-checklist)

---

## 🏃 Schnellstart (2 Minuten)

```bash
# 1. Repository klonen
git clone <repository-url>
cd "JurisMind - Mietrecht 01"
npm install

# 2. Umgebung vorbereiten
cp .env.example .env
# WICHTIG: .env anpassen!

# 3. Docker starten
docker-compose -f docker-compose.dev.yml up -d

# 4. Datenbank initialisieren
docker-compose exec backend npm run db:setup

# 5. Health Check
curl http://localhost:3001/health
# Expected: { "status": "ok" }
```

**Services sind erreichbar unter:**
- Backend: `http://localhost:3001`
- Web-App: `http://localhost:3000`
- API Docs: `http://localhost:3001/api-docs`

---

## 📦 Systemarchitektur

### Service-Übersicht

```
SmartLaw Mietrecht (v1.2.2)
│
├── 🔧 Backend Service (Port 3001)
│   ├── Node.js 18+ / Express
│   ├── PostgreSQL (Datenbank)
│   ├── Redis (Cache)
│   ├── KMS (Encryption)
│   ├── NJW-API-Integration (NEU)
│   ├── Asana-Integration (NEU)
│   └── Monitoring (Prometheus)
│
├── 🎨 Web-App (Port 3000)
│   ├── React 18 / Vite
│   ├── Redux State Management
│   ├── Material UI + TailwindCSS
│   ├── Visual Regression Testing (NEU)
│   └── E2E Testing (Playwright)
│
├── 📱 Mobile-App (React Native)
│   ├── Offline Queue (NEU)
│   ├── Local SQLite Database
│   ├── Push Notifications
│   └── E2E Testing (Detox)
│
└── 🔍 Supporting Services
    ├── Prometheus (Metrics)
    ├── Grafana (Dashboards)
    ├── ELK Stack (Logging)
    ├── Sentry (Error Tracking)
    └── Mailgun (Email)
```

### Deployment-Topologien

| Environment | Services | Database | Cache | Best For |
|---|---|---|---|---|
| **Development** | All (containerized) | PostgreSQL (Docker) | Redis (Docker) | Rapid Development |
| **Staging** | All (containerized) | PostgreSQL (external) | Redis (external) | UAT, Pre-Release |
| **Production** | All (managed services) | RDS / Heroku Postgres | ElastiCache / Heroku Redis | Customer-Facing |

---

## ⚙️ Voraussetzungen

### System Requirements

| Anforderung | Development | Staging | Production |
|---|---|---|---|
| **CPU** | 2 cores | 4 cores | 8+ cores |
| **RAM** | 4 GB | 8 GB | 16+ GB |
| **Storage** | 20 GB | 50 GB | 100+ GB |
| **Netzwerk** | 1 Mbps | 10 Mbps | 100+ Mbps |

### Software & Tools

```bash
# Mindestversionen (getestet)
Node.js:        18.16.0 LTS+
npm:            9.6.0+
Docker:         20.10+
Docker Compose: 2.0+
Git:            2.37+
PostgreSQL:     13.0+ (external oder Docker)
Redis:          7.0+ (external oder Docker)
```

### Versionen überprüfen

```bash
node --version       # v18.16.0+
npm --version        # 9.6.0+
docker --version     # Docker version 20.10+
docker-compose --version  # Docker Compose version 2.0+
```

### API-Credentials (für Production)

- **NJW-API-Key:** Von NJW beantragen (https://www.njw.de/api)
- **Heroku-Token:** https://dashboard.heroku.com/account/applications/authorizations/new
- **GitHub-Token:** https://github.com/settings/tokens
- **AWS-Credentials:** (optional) AWS IAM User mit S3 + KMS Zugriff

---

## 🔐 Umgebungsvariablen

### Kritische Sicherheitsvariablen

```bash
# 1. Encryption Keys
KMS_MASTER_KEY=<32-hex-chars>          # !!! Generieren mit: npm run kms:generate
JWT_SECRET=<min-32-chars-random>       # !!! Generieren: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
CSRF_TOKEN_SECRET=<min-32-chars>       # !!! Weitere Secrets generieren wie oben

# 2. Database Verbindung
DATABASE_URL=postgresql://user:pass@host:5432/db
DATABASE_POOL_SIZE=20
DATABASE_SSL=true                      # Nur Production

# 3. Redis Cache
REDIS_URL=redis://user:pass@host:6379/0
REDIS_TLS=true                         # Nur Production

# 4. NJW-API Integration (NEU v1.2.0+)
NJW_API_KEY=<nette-juristische-api-key>
NJW_API_ENDPOINT=https://api.njw.de/v2
NJW_CACHE_TTL=1800                     # 30 Minuten

# 5. API Security
CORS_ORIGIN=https://yourdomain.com,https://app.yourdomain.com
API_RATE_LIMIT=10                      # Requests pro Minute
API_TIMEOUT=30000

# 6. Logging
LOG_LEVEL=info                         # error, warn, info, debug
STRUCTURED_LOGS=true
SENTRY_DSN=https://...@sentry.io/...   # Optional: Error tracking

# 7. Email (Mailgun)
SMTP_HOST=smtp.mailgun.org
SMTP_PORT=587
SMTP_USER=postmaster@yourdomain.com
SMTP_PASS=<mailgun-password>

# 8. Asana Integration (NEU v1.2.0+)
ASANA_API_TOKEN=<personal-access-token>
ASANA_WORKSPACE_ID=<workspace-id>
ASANA_PROJECT_ID=<project-id>

# 9. Optional: AWS Services
AWS_REGION=eu-central-1
AWS_ACCESS_KEY_ID=<key>
AWS_SECRET_ACCESS_KEY=<secret>
```

### Umgebungsvariablen vorbereiten

```bash
# 1. Template kopieren
cp .env.example .env.production

# 2. KMS Master Key generieren
npm run kms:generate
# Output: KMS_MASTER_KEY=a1b2c3d4e5f6...

# 3. JWT Secret erzeugen
node -e "console.log('JWT_SECRET=' + require('crypto').randomBytes(32).toString('hex'))"

# 4. Datei bearbeiten mit Secrets
nano .env.production
# Oder mit IDE: code .env.production

# 5. Test: Variablen laden
source .env.production
echo $DATABASE_URL
```

---

## 🐳 Docker-Deployment

### Docker Compose Varianten

```bash
# Development (mit Hot-Reload, Debug-Logs)
docker-compose -f docker-compose.dev.yml up -d

# Staging / Production-ähnlich
docker-compose up -d

# Spezifische Konfigurationen (falls vorhanden)
docker-compose -f docker-compose.microservices.yml up -d
docker-compose -f docker-compose.mietrecht.yml up -d
docker-compose -f docker-compose.performance.yml up -d
```

### Schritt-für-Schritt Setup

```bash
# 1. .env vorbereiten
cp .env.example .env
nano .env
# Setze: DATABASE_URL, REDIS_URL, KMS_MASTER_KEY, NJW_API_KEY

# 2. Docker Images bauen (optional)
docker-compose build --no-cache

# 3. Services starten
docker-compose up -d

# 4. Status überprüfen
docker-compose ps
# Ausgabe:
# NAME                STATE        STATUS
# smartlaw-backend    running      Up 2 minutes
# smartlaw-web-app    running      Up 2 minutes
# smartlaw-postgres   running      Up 2 minutes
# smartlaw-redis      running      Up 2 minutes

# 5. Datenbank initialisieren
docker-compose exec backend npm run db:setup
docker-compose exec backend npm run db:migrate

# 6. Health Check
curl http://localhost:3001/health
# Response: { "status": "ok" }
```

### Docker-Befehle Referenz

```bash
# Logs
docker-compose logs -f backend              # Follow
docker-compose logs backend --tail 100      # Last 100 lines
docker-compose logs --timestamps            # Mit Zeit

# Services verwalten
docker-compose restart backend
docker-compose stop postgres
docker-compose start

# In Container einsteigen
docker-compose exec backend bash
docker-compose exec postgres psql -U smartlaw

# Cleanup
docker-compose down                    # Stop & remove
docker-compose down -v                 # Auch volumes löschen
docker-compose prune                   # Cleanup dangling resources
```

---

## 🖥️ Lokal-Deployment (ohne Docker)

### Setup mit lokal installierten Services

```bash
# 1. PostgreSQL & Redis installieren
# macOS:
brew install postgresql redis
brew services start postgresql
brew services start redis

# Ubuntu:
sudo apt-get install postgresql postgresql-contrib redis-server
sudo systemctl start postgresql
sudo systemctl start redis-server

# Windows (via WSL):
wsl apt-get install postgresql redis-server

# 2. Node Dependencies
npm install

# 3. Backend starten (Terminal 1)
cd services/backend
npm install
npm run dev         # http://localhost:3001

# 4. Web-App starten (Terminal 2)
cd services/web-app
npm install
npm run dev         # http://localhost:3000

# 5. Mobile-App starten (Terminal 3, optional)
cd services/mobile-app
npm install
npm run start       # Metro Bundler
npm run android     # oder: npm run ios

# 6. Tests durchführen
npm run test
npm run visual-test  # Playwright/Detox
```

### PostgreSQL & Redis testen

```bash
# PostgreSQL
psql -U postgres -c "SELECT version();"

# Redis
redis-cli ping      # Response: PONG
redis-cli INFO      # Detaillierte Info

# Connection Strings
DATABASE_URL="postgresql://postgres:password@localhost:5432/smartlaw_dev"
REDIS_URL="redis://localhost:6379/0"
```

---

## 🌐 Production Deployment (Heroku)

### Heroku Setup (erste Konfiguration)

```bash
# 1. Heroku CLI installieren
# macOS: brew tap heroku/brew && brew install heroku
# Windows: https://devcenter.heroku.com/articles/heroku-cli

# 2. Heroku Login
heroku login
# Browser öffnet sich zur Authentifizierung

# 3. App erstellen
heroku create smartlaw-mietrecht --region eu
# Oder: Bestehende App verbinden
heroku apps:info smartlaw-mietrecht

# 4. Buildpacks setzen
heroku buildpacks:set heroku/nodejs

# 5. Environment Variables setzen
heroku config:set KMS_MASTER_KEY="<generated-key>"
heroku config:set JWT_SECRET="<long-random-secret>"
heroku config:set NODE_ENV="production"
heroku config:set NJW_API_KEY="<api-key>"

# 6. Add-ons provisionieren
heroku addons:create heroku-postgresql:standard-0    # Database
heroku addons:create heroku-redis:premium-0          # Cache
heroku addons:create sendgrid:starter                # Email
heroku addons:create sentry:team                     # Error Tracking (optional)
```

### Deployment durchführen

```bash
# Option 1: Git Push
git push heroku main

# Option 2: Manuell
git push heroku develop:main

# Option 3: Docker Image
heroku container:login
docker tag smartlaw:latest registry.heroku.com/smartlaw-mietrecht/web
docker push registry.heroku.com/smartlaw-mietrecht/web
heroku container:release -a smartlaw-mietrecht web

# Logs anzeigen
heroku logs --tail
heroku logs --tail --dyno=web
heroku logs -n 100 --source=app
```

### Post-Deployment auf Heroku

```bash
# 1. Datenbank-Migration
heroku run "npm run db:setup" --exit-code=1
heroku run "npm run db:migrate"

# 2. Health Check
curl https://smartlaw-mietrecht.herokuapp.com/health

# 3. Datenbank inspizieren
heroku pg:info
heroku pg:psql --exit-code=1  # Direkt in psql einsteigen

# 4. Redis inspizieren
heroku redis:info
heroku redis:cli               # Direkt in Redis-CLI einsteigen

# 5. App Restart (bei Bedarf)
heroku restart

# 6. Skalierung konfigurieren
heroku ps:scale web=2         # 2 Dynos
heroku ps:type standard-1x    # Standard Dyno Type
heroku autoscaling:enable web --min=2 --max=5  # Auto-scaling
```

---

## ✅ Post-Deployment Verifizierung

### Sofort nach Deployment

```bash
# Docker
docker-compose ps
# Status sollte "Up" sein für alle

# Heroku
heroku apps:info smartlaw-mietrecht
heroku ps               # Aktuell laufende Prozesse

# Health Endpoints testen
curl http://localhost:3001/health
curl https://smartlaw-mietrecht.herokuapp.com/health
```

### Feature-Spezifische Tests

```bash
# NJW-API Integration Test (NEU v1.2.0+)
curl -X GET http://localhost:3001/api/v1/njw/cases \
  -H "Authorization: Bearer <jwt-token>"

# Enhanced Risk Assessment (NEU v1.2.0+)
curl -X POST http://localhost:3001/api/v1/risk-assessment/enhanced \
  -H "Authorization: Bearer <jwt-token>" \
  -H "Content-Type: application/json" \
  -d '{"caseId": "12345", "enhancedAnalysis": true}'

# Mobile Offline Queue (NEU v1.2.0+)
curl http://localhost:3001/api/v1/mobile/offline-queue/status

# Authentication testen
curl -X POST http://localhost:3001/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "test@example.com", "password": "test123"}'
```

### Browser-Tests

Öffne in deinem Browser:

- **Web-App:** `http://localhost:3000` oder `https://smartlaw-mietrecht.herokuapp.com`
- **API Dokumentation:** `http://localhost:3001/api-docs`
- **Health Dashboard:** `http://localhost:3001/health/comprehensive`
- **Prometheus:** `http://localhost:9090` (falls aktiviert)
- **Grafana:** `http://localhost:3000/grafana` (falls aktiviert)

---

## 🏥 Health Checks

### Health Check Endpoints

```bash
# 1. Simple Health Check (Liveness)
GET /health
Response: { "status": "ok", "timestamp": "2025-12-07T10:15:30Z" }

# 2. Comprehensive Health Check
GET /health/comprehensive
Response: {
  "status": "ok",
  "timestamp": "2025-12-07T10:15:30Z",
  "database": { "status": "ok", "latency": "5ms" },
  "cache": { "status": "ok", "latency": "2ms" },
  "diskSpace": { "status": "ok", "available": "45GB" },
  "memory": { "status": "ok", "usage": "62%" },
  "cpu": { "status": "ok", "usage": "25%" }
}

# 3. CLI Health Check
npm run health:cli
# Exit Code 0 = OK, Exit Code 1 = Issues
```

### Health Check konfigurieren (Docker)

```yaml
# In docker-compose.yml:
services:
  backend:
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3001/health"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 40s
```

---

## 📊 Monitoring & Logging

### Logs anzeigen

```bash
# Docker
docker-compose logs -f backend

# Heroku
heroku logs --tail
heroku logs --source=app --dyno=web

# Datei speichern
docker-compose logs backend > logs.txt
heroku logs > heroku-logs.txt
```

### Log Level konfigurieren

```bash
LOG_LEVEL=debug          # Development
LOG_LEVEL=info           # Staging
LOG_LEVEL=warn           # Production
LOG_LEVEL=error          # Emergency Only

STRUCTURED_LOGS=true     # JSON-Format
LOG_FORMAT=json          # Für ELK Integration
```

### Monitoring (Prometheus/Grafana)

```bash
# Prometheus
kubectl port-forward svc/prometheus 9090:9090
# Öffne http://localhost:9090

# Grafana
kubectl port-forward svc/grafana 3000:3000
# Öffne http://localhost:3000 (Standard: admin/admin)

# Wichtige Metriken:
# - http_request_duration_seconds
# - database_query_duration_seconds
# - error_rate
# - uptime
```

---

## 🆘 Troubleshooting

### Problem: "Port already in use"

```bash
# Identifiziere Prozess
# macOS/Linux:
lsof -i :3001
kill -9 <PID>

# Windows (PowerShell):
netstat -ano | findstr :3001
taskkill /PID <PID> /F

# Alternative: Port in .env ändern
API_PORT=3002
```

### Problem: "Database connection failed"

```bash
# 1. DATABASE_URL prüfen
echo $DATABASE_URL

# 2. Verbindung testen
psql $DATABASE_URL -c "SELECT 1;"

# 3. Container restart
docker-compose restart postgres

# 4. Logs prüfen
docker-compose logs postgres
```

### Problem: "KMS_MASTER_KEY not found"

```bash
# 1. Key generieren
npm run kms:generate

# 2. .env aktualisieren
echo "KMS_MASTER_KEY=<generated>" >> .env

# 3. Container rebuild
docker-compose down
docker-compose up -d

# 4. Heroku
heroku config:set KMS_MASTER_KEY="<key>"
```

### Problem: "NJW-API returns 401"

```bash
# 1. API Key prüfen
heroku config | grep NJW_API_KEY

# 2. Endpoint prüfen
NJW_API_ENDPOINT=https://api.njw.de/v2  # Richtig?

# 3. Rate Limit erhöhen
heroku config:set NJW_RATE_LIMIT=50

# 4. Logs prüfen
heroku logs --tail | grep "njw"
```

### Problem: "Memory usage too high"

```bash
# 1. Heap Size erhöhen (Heroku)
heroku config:set NODE_OPTIONS="--max-old-space-size=512"

# 2. Cache leeren
redis-cli FLUSHDB

# 3. Container neustarten
docker-compose restart backend
heroku restart
```

---

## ⚡ Performance Tuning

### Production Optimierungen

```bash
# Rate Limiting
API_RATE_LIMIT=100
REQUEST_TIMEOUT=30000

# Database Connection Pool
DATABASE_POOL_SIZE=20

# Redis Optimierungen
REDIS_MAX_RETRIES=3
REDIS_POOL_SIZE=10

# Caching Strategien
NJW_CACHE_TTL=3600         # 1 Stunde
SESSION_CACHE_TTL=86400    # 1 Tag
QUERY_CACHE_TTL=600        # 10 Minuten

# Compression
GZIP_ENABLED=true
COMPRESSION_LEVEL=6
```

---

## 🔒 Security Checklist (Pre-Production)

- [ ] KMS_MASTER_KEY generiert & sicher gespeichert
- [ ] JWT_SECRET ist mindestens 32 Zeichen
- [ ] DATABASE_URL nutzt SSL (sslmode=require)
- [ ] CORS_ORIGIN nur legitime Domains
- [ ] NODE_ENV=production
- [ ] LOG_LEVEL nicht auf "debug"
- [ ] Alle Default-Passwords gelöscht
- [ ] HTTPS aktiviert (Heroku automatisch)
- [ ] Rate Limiting konfiguriert
- [ ] Security Headers aktiviert
- [ ] Backup-Strategie konfiguriert
- [ ] Monitoring & Alerting aktiv

---

## 📞 Support & Ressourcen

- **Hauptdokumentation:** [README.md](README.md)
- **NJW-Integration:** [NJW_INTEGRATION_SUMMARY.md](NJW_INTEGRATION_SUMMARY.md)
- **Sicherheit:** [SECURITY_IMPROVEMENTS.md](SECURITY_IMPROVEMENTS.md)
- **API Docs:** `http://localhost:3001/api-docs`
- **Changelog:** [CHANGELOG.md](CHANGELOG.md)
- **Asana Integration:** [ASANA_IMPLEMENTATION_PLAN.md](ASANA_IMPLEMENTATION_PLAN.md)

---

**Zuletzt aktualisiert:** 7. Dezember 2025  
**Dokumentversion:** 1.2.2  
**Status:** ✅ Production Ready
