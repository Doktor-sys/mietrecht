# 🚀 SmartLaw Mietrecht Agent - Deployment Guide

## Overview

Vollständige Anleitung für das Deployment des SmartLaw Mietrecht Agent Systems.

## 📦 Architektur

```
SmartLaw Platform
├── Backend Service (Node.js/Express)
├── Web-App (React/TypeScript)
├── Mobile App (React Native)
├── Database (PostgreSQL)
├── Cache (Redis)
├── Storage (MinIO)
├── Search (Elasticsearch)
└── Monitoring (Prometheus + Grafana)
```

---

## 🐳 Docker Deployment

### Voraussetzungen

- Docker 20.10+
- Docker Compose 2.0+
- 4GB RAM minimum
- 20GB Speicherplatz

### Lokale Entwicklungsumgebung

```bash
# 1. Environment-Variablen setzen
cp .env.example .env
# Bearbeiten Sie .env mit Ihren Konfigurationen

# 2. Starten Sie alle Services
docker-compose -f docker-compose.dev.yml up -d

# 3. Datenbank-Migration
docker-compose exec backend npm run db:migrate

# 4. Seeds (optional)
docker-compose exec backend npm run db:seed

# 5. Logs überwachen
docker-compose logs -f backend
```

### Production Build

```bash
# Backend
cd services/backend
docker build -t smartlaw/backend:latest .

# Web-App
cd web-app
docker build -t smartlaw/webapp:latest .

# Push zu Registry
docker push smartlaw/backend:latest
docker push smartlaw/webapp:latest
```

---

## ☸️ Kubernetes Deployment

### Voraussetzungen

- Kubernetes Cluster (1.24+)
- kubectl konfiguriert
- Helm 3+ (optional)

### Deployment-Schritte

#### 1. Namespace erstellen
```bash
kubectl create namespace smartlaw-production
kubectl create namespace monitoring
```

#### 2. Secrets konfigurieren
```bash
# Database Credentials
kubectl create secret generic db-credentials \
  --from-literal=username=smartlaw \
  --from-literal=password=<your-password> \
  --from-literal=database=smartlaw_prod \
  -n smartlaw-production

# API Keys
kubectl create secret generic api-keys \
  --from-literal=openai-key=<your-openai-key> \
  --from-literal=stripe-key=<your-stripe-key> \
  -n smartlaw-production

# JWT Secret
kubectl create secret generic jwt-secret \
  --from-literal=secret=<your-jwt-secret> \
  -n smartlaw-production
```

#### 3. Infrastructure deployen
```bash
# PostgreSQL, Redis, MinIO, Elasticsearch
kubectl apply -f k8s/infrastructure.yaml

# Warten bis bereit
kubectl wait --for=condition=ready pod -l app=postgres -n smartlaw-production --timeout=300s
```

#### 4. Backend deployen
```bash
kubectl apply -f k8s/backend.yaml

# Status prüfen
kubectl get pods -n smartlaw-production
kubectl logs -f deployment/smartlaw-backend -n smartlaw-production
```

#### 5. Web-App deployen
```bash
kubectl apply -f k8s/webapp.yaml
```

#### 6. Ingress konfigurieren
```bash
kubectl apply -f k8s/ingress.yaml
```

#### 7. Monitoring deployen
```bash
kubectl apply -f k8s/monitoring.yaml
kubectl apply -f k8s/logging.yaml
```

### Zugriff auf Services

```bash
# Lokaler Zugriff via Port-Forward
kubectl port-forward svc/smartlaw-backend 3001:3001 -n smartlaw-production
kubectl port-forward svc/smartlaw-webapp 3000:3000 -n smartlaw-production
kubectl port-forward svc/grafana 3002:80 -n monitoring
kubectl port-forward svc/prometheus-service 9090:80 -n monitoring
```

---

## 📊 Monitoring & Observability

### Prometheus Metriken

**Verfügbare Metriken:**
- `http_request_duration_ms` - HTTP Request Latency
- `http_requests_total` - Total HTTP Requests
- `active_connections` - Aktive Verbindungen
- `db_query_duration_ms` - Datenbank Query Latency
- `ai_response_duration_ms` - KI-Response Zeit
- `document_processing_duration_ms` - Dokumentenverarbeitung
- `bulk_job_processing_duration_ms` - Bulk-Job Performance

**Zugriff:**
```
http://localhost:9090
```

### Grafana Dashboards

**Pre-configured Dashboards:**
1. **System Overview** - CPU, Memory, Network
2. **API Performance** - Request Rate, Latency, Errors
3. **Database Metrics** - Query Performance, Connection Pool
4. **KI Analytics** - Response Quality, Confidence Levels
5. **User Activity** - Active Users, Sessions, Conversions

**Zugriff:**
```
http://localhost:3002
Default Credentials: admin/admin
```

### ELK Stack (Logging)

**Elasticsearch:**
- Centralized Logging
- Log Aggregation
- Full-Text Search

**Kibana:**
- Log Visualization
- Custom Dashboards
- Alerting

**Zugriff:**
```
kubectl port-forward svc/kibana 5601:5601 -n monitoring
http://localhost:5601
```

---

## 🔍 Health Checks

### Backend Health Endpoint
```bash
# Liveness Probe
curl http://localhost:3001/health

# Readiness Probe
curl http://localhost:3001/health/ready

# Response
{
  "status": "healthy",
  "timestamp": "2025-11-22T00:00:00.000Z",
  "services": {
    "database": "connected",
    "redis": "connected",
    "elasticsearch": "connected",
    "minio": "connected"
  }
}
```

### Kubernetes Health Checks
```yaml
livenessProbe:
  httpGet:
    path: /health
    port: 3001
  initialDelaySeconds: 30
  periodSeconds: 10

readinessProbe:
  httpGet:
    path: /health/ready
    port: 3001
  initialDelaySeconds: 10
  periodSeconds: 5
```

---

## 🔄 CI/CD Pipeline

### GitHub Actions Workflow

**Automatisiert:**
1. ✅ Linting & Type Checking
2. ✅ Unit Tests
3. ✅ Integration Tests
4. ✅ E2E Tests
5. ✅ Security Scanning
6. ✅ Docker Build
7. ✅ Push to Registry
8. ✅ Deploy to Staging
9. ✅ Smoke Tests
10. ✅ Deploy to Production (manual approval)

**Workflow-Datei:** `.github/workflows/deploy.yml`

### Manual Deployment

```bash
# Build
npm run build

# Test
npm run test:all

# Deploy zu Staging
kubectl apply -f k8s/ --context=staging

# Smoke Tests
npm run test:smoke -- --env=staging

# Deploy zu Production (nach Approval)
kubectl apply -f k8s/ --context=production
```

---

## 🔐 Sicherheit

### SSL/TLS Zertifikate

```bash
# Cert-Manager installieren
kubectl apply -f https://github.com/cert-manager/cert-manager/releases/download/v1.13.0/cert-manager.yaml

# Let's Encrypt Issuer konfigurieren
kubectl apply -f k8s/cert-issuer.yaml
```

### Secrets Management

**Empfehlung:** Verwenden Sie externe Secrets Manager:
- AWS Secrets Manager
- Azure Key Vault
- HashiCorp Vault
- Google Secret Manager

### Network Policies

```bash
# Netzwerk-Isolation
kubectl apply -f k8s/network-policies.yaml
```

---

## 📈 Skalierung

### Horizontal Pod Autoscaling

```bash
# Backend Auto-Scaling
kubectl autoscale deployment smartlaw-backend \
  --cpu-percent=70 \
  --min=2 --max=10 \
  -n smartlaw-production

# Status überwachen
kubectl get hpa -n smartlaw-production
```

### Vertikale Skalierung

```bash
# Resources anpassen in k8s/backend.yaml
resources:
  requests:
    memory: "512Mi"
    cpu: "500m"
  limits:
    memory: "2Gi"
    cpu: "2000m"
```

---

## 🧪 Testing in Production

### Smoke Tests
```bash
npm run test:smoke -- --env=production
```

### Load Testing
```bash
# k6 Load Test
k6 run tests/load/api-load-test.js

# Artillery
artillery run tests/load/scenarios.yml
```

---

## 🚨 Troubleshooting

### Häufige Probleme

**1. Pod startet nicht**
```bash
kubectl describe pod <pod-name> -n smartlaw-production
kubectl logs <pod-name> -n smartlaw-production
```

**2. Database Connection Fehler**
```bash
# Prüfen Sie Database Pod
kubectl get pods -l app=postgres -n smartlaw-production

# Verbindung testen
kubectl exec -it <backend-pod> -n smartlaw-production -- \
  psql -h postgres -U smartlaw -d smartlaw_prod
```

**3. Hohe Latenz**
```bash
# Prometheus Queries
rate(http_request_duration_ms_sum[5m]) / rate(http_request_duration_ms_count[5m])

# Top Slow Queries
kubectl exec -it <postgres-pod> -- \
  psql -c "SELECT * FROM pg_stat_statements ORDER BY mean_time DESC LIMIT 10;"
```

---

## 📚 Weitere Ressourcen

- [API-Dokumentation](./API_DOCUMENTATION.md)
- [Architecture Decision Records](./docs/adr/)
- [Runbook](./docs/runbook.md)
- [Disaster Recovery Plan](./docs/disaster-recovery.md)

---

## 📞 Support

- **Email:** devops@smartlaw.de
- **Slack:** #smartlaw-ops
- **On-Call:** PagerDuty Integration

---

**Version:** 1.0.0  
**Last Updated:** 2025-11-22  
**Maintained by:** SmartLaw DevOps Team
