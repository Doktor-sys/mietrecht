# System Administration Guide

This guide provides instructions for the operation, maintenance, and monitoring of the SmartLaw system.

## 1. Monitoring & Observability

### Metrics (Prometheus)
The backend service exposes standard Prometheus metrics at `/metrics`.
- **URL:** `http://localhost:3000/metrics`
- **Key Metrics:**
    - `http_request_duration_seconds`: Latency of API requests.
    - `http_requests_total`: Throughput and error rates.
    - `process_cpu_seconds_total`: CPU usage.
    - `process_resident_memory_bytes`: Memory usage.

### Visualization (Grafana)
Dashboards should be configured to visualize the above metrics.
- **SLA Dashboard:**
    - **Availability:** Percentage of successful requests (2xx/3xx vs 5xx). Target: > 99.9%.
    - **Latency:** p95 request duration. Target: < 500ms.

## 2. Load Testing

Load tests are located in `load-tests/locustfile.py`.

### Running Tests
Prerequisites: Python 3 and Locust installed (`pip install locust`).

```bash
# Run with web interface (http://localhost:8089)
locust -f load-tests/locustfile.py

# Run headless (CI/CD mode)
locust -f load-tests/locustfile.py --headless -u 100 -r 10 --run-time 1m
```

### SLA Verification
The load test script automatically checks for SLA violations (Exit Code 1 on failure):
- Failure Ratio > 0.1%
- p95 Latency > 500ms

## 3. Database Management

### Backups
Regular backups of the PostgreSQL database are essential.

```bash
# Backup
pg_dump -U postgres -d smartlaw > backup_$(date +%Y%m%d).sql

# Restore
psql -U postgres -d smartlaw < backup_YYYYMMDD.sql
```

### Migrations
Database schema changes are managed via Prisma.

```bash
# Apply migrations
npx prisma migrate deploy

# Reset database (Development only)
npx prisma migrate reset
```

## 4. Disaster Recovery

In case of critical failures (e.g., database loss), follow the **Disaster Recovery Plan** (`docs/DISASTER_RECOVERY.md` - to be created if not exists).
- **RPO (Recovery Point Objective):** 24 hours (daily backups).
- **RTO (Recovery Time Objective):** 4 hours.

## 5. Deployment

Deployment is handled via Docker. See `services/backend/Dockerfile` and `docker-compose.yml` for details.

```bash
# Build and start services
docker-compose up -d --build

# View logs
docker-compose logs -f backend
```
