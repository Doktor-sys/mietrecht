# Task 11.3: Audit Logging und Monitoring - Setup-Anleitung

## Voraussetzungen

- PostgreSQL-Datenbank läuft
- Node.js und npm installiert
- Prisma CLI verfügbar

## Installation

### 1. Datenbank-Migration ausführen

Die Audit-Log-Tabelle muss in der Datenbank erstellt werden:

```bash
cd services/backend
npx prisma migrate deploy
```

Oder für Entwicklung:

```bash
npx prisma migrate dev
```

### 2. Prisma Client regenerieren

Nach der Migration muss der Prisma Client neu generiert werden:

```bash
npx prisma generate
```

### 3. Umgebungsvariablen konfigurieren

Füge folgende Variablen zu `.env` hinzu:

```bash
# Audit Logging
AUDIT_HMAC_KEY=<generiere-64-zeichen-hex-string>

# Security Monitoring
SECURITY_MONITORING_INTERVAL=5  # Minuten
SECURITY_ALERT_RETENTION_DAYS=30

# Compliance
AUDIT_LOG_RETENTION_DAYS=2555  # 7 Jahre für DSGVO
```

#### HMAC-Key generieren

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

## Verwendung

### 1. Audit-Service initialisieren

```typescript
import { PrismaClient } from '@prisma/client';
import { AuditService } from './services/AuditService';

const prisma = new PrismaClient();
const auditService = new AuditService(prisma);
```

### 2. Security-Monitoring starten

```typescript
import { SecurityMonitoringService } from './services/SecurityMonitoringService';

const securityMonitoring = new SecurityMonitoringService(prisma, auditService);

// Monitoring starten (alle 5 Minuten)
await securityMonitoring.startMonitoring(5);
```

### 3. Events protokollieren

```typescript
// Erfolgreichen Login protokollieren
await auditService.logAuthentication(
  AuditEventType.USER_LOGIN,
  userId,
  'success',
  req.ip,
  req.get('user-agent')
);

// Datenzugriff protokollieren
await auditService.logDataAccess(
  AuditEventType.DATA_READ,
  userId,
  'user',
  resourceId,
  'read_profile',
  'success'
);

// DSGVO-Event protokollieren
await auditService.logGDPREvent(
  AuditEventType.GDPR_DATA_DELETION,
  userId,
  'delete_user_data'
);
```

### 4. Compliance-Reports generieren

```typescript
import { ComplianceReportingService } from './services/ComplianceReportingService';

const complianceReporting = new ComplianceReportingService(
  prisma,
  auditService,
  securityMonitoring
);

const report = await complianceReporting.generateDetailedReport(
  new Date('2024-01-01'),
  new Date('2024-12-31')
);

// Als CSV exportieren
const csv = await complianceReporting.exportReportAsCSV(report);
```

## API-Endpunkte

Alle Endpunkte erfordern Admin-Authentifizierung:

```bash
# Audit-Logs abfragen
GET /api/audit/logs?userId=xxx&startDate=2024-01-01&endDate=2024-12-31

# Logs exportieren
GET /api/audit/logs/export?format=csv&startDate=2024-01-01&endDate=2024-12-31

# Anomalien erkennen
GET /api/audit/anomalies?userId=xxx&timeWindowMinutes=60

# Security-Alerts abrufen
GET /api/audit/security/alerts?severity=critical

# Alert bestätigen
POST /api/audit/security/alerts/:alertId/acknowledge

# Security-Metriken
GET /api/audit/security/metrics?startDate=2024-01-01&endDate=2024-12-31

# Compliance-Report
GET /api/audit/compliance/report?startDate=2024-01-01&endDate=2024-12-31

# Compliance-Report exportieren
GET /api/audit/compliance/report/export?format=csv&startDate=2024-01-01&endDate=2024-12-31
```

## Troubleshooting

### Fehler: "Property 'auditLog' does not exist on type 'PrismaClient'"

**Lösung:**
1. Stelle sicher, dass die Migration ausgeführt wurde: `npx prisma migrate deploy`
2. Regeneriere den Prisma Client: `npx prisma generate`
3. Starte den TypeScript-Server neu (in VS Code: Cmd/Ctrl + Shift + P → "TypeScript: Restart TS Server")

### Fehler: "AUDIT_HMAC_KEY not set"

**Lösung:**
Generiere einen HMAC-Key und füge ihn zu `.env` hinzu:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### Fehler: "Admin-Rechte erforderlich"

**Lösung:**
Nur Benutzer mit `userType: BUSINESS` haben Zugriff auf Audit-Endpunkte. In einer Produktionsumgebung sollte eine separate Admin-Rolle implementiert werden.

## Performance-Tipps

### 1. Indizes nutzen

Die Audit-Log-Tabelle hat bereits optimierte Indizes. Nutze sie in Abfragen:

```typescript
// Gut: Nutzt Index
const logs = await auditService.queryLogs({
  userId: 'user-123',
  startDate: new Date('2024-01-01'),
  endDate: new Date('2024-12-31')
});

// Schlecht: Keine Indizes
const logs = await prisma.auditLog.findMany({
  where: {
    metadata: {
      path: ['someField'],
      equals: 'someValue'
    }
  }
});
```

### 2. Batch-Logging für hohe Last

```typescript
// Für hohe Last: Batch-Logging implementieren
const batchLogger = new BatchAuditLogger(prisma, 100);
await batchLogger.log(entry);
// Wird automatisch geflusht bei 100 Einträgen
```

### 3. Asynchrones Logging

```typescript
// Blockiert Hauptoperation nicht
auditService.logEvent(...).catch(error => {
  logger.error('Audit logging failed:', error);
});
```

### 4. Alte Logs bereinigen

```typescript
// Cron-Job für tägliche Bereinigung
cron.schedule('0 2 * * *', async () => {
  const deletedCount = await auditService.cleanupOldLogs(2555);
  logger.info(`Cleaned up ${deletedCount} old audit logs`);
});
```

## Monitoring

### Prometheus-Metriken

```typescript
import { Counter, Histogram } from 'prom-client';

const auditLogCounter = new Counter({
  name: 'audit_logs_total',
  help: 'Total number of audit log entries',
  labelNames: ['eventType', 'result']
});

// Bei jedem Log-Eintrag
auditLogCounter.inc({ eventType, result });
```

### Grafana-Dashboard

Empfohlene Metriken:
- Audit-Logs pro Stunde
- Fehlgeschlagene Operationen
- Security-Alerts nach Schweregrad
- Compliance-Score über Zeit
- Top-Nutzer nach Aktivität

## Sicherheitshinweise

1. **HMAC-Key schützen**: Niemals in Git committen
2. **Admin-Zugriff beschränken**: Nur vertrauenswürdige Benutzer
3. **Logs regelmäßig prüfen**: Automatische Integritätschecks
4. **Retention-Policy einhalten**: 7 Jahre für DSGVO
5. **Alerts ernst nehmen**: Kritische Alerts sofort untersuchen

## Weitere Dokumentation

- [Vollständige Implementierungsdokumentation](./TASK_11.3_IMPLEMENTATION.md)
- [Zusammenfassung](./TASK_11.3_SUMMARY.md)
- [Prisma Schema](../prisma/schema.prisma)
- [API-Routen](../src/routes/audit.ts)
