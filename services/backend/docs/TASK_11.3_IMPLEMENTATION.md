# Task 11.3: Audit Logging und Monitoring - Implementierung

## Übersicht

Diese Implementierung vervollständigt Task 11.3 "Audit Logging und Monitoring implementieren" und bietet ein umfassendes System für:

1. **Audit-Logging**: Vollständige Protokollierung aller Datenzugriffe und sicherheitsrelevanten Ereignisse
2. **Security-Monitoring**: Echtzeit-Überwachung mit Anomalie-Erkennung
3. **Compliance-Reporting**: Detaillierte Reports für Datenschutz-Audits und DSGVO-Compliance

## Implementierte Komponenten

### 1. AuditService (`src/services/AuditService.ts`)

Der zentrale Service für Audit-Logging mit folgenden Features:

#### Event-Typen
- **Authentifizierung**: Login, Logout, Registrierung, Passwort-Reset
- **Datenzugriff**: Read, Create, Update, Delete, Export
- **Dokumente**: Upload, Download, Analyse, Löschung
- **Chat & KI**: Nachrichten, KI-Anfragen, Antworten, Eskalationen
- **Anwaltsvermittlung**: Suche, Buchung, Beratung, Fallübertragung
- **DSGVO**: Einwilligungen, Datenexporte, Löschungen, Korrekturen
- **Sicherheit**: Unberechtigte Zugriffe, fehlgeschlagene Logins, verdächtige Aktivitäten
- **System**: Fehler, Konfigurationsänderungen, Admin-Aktionen

#### Hauptfunktionen

```typescript
// Event protokollieren
await auditService.logEvent(
  AuditEventType.DATA_READ,
  'read_user_profile',
  'success',
  {
    userId: 'user-123',
    resourceType: 'user',
    resourceId: 'profile-456',
    ipAddress: '192.168.1.1',
    metadata: { fields: ['email', 'name'] }
  }
);

// Logs abfragen
const logs = await auditService.queryLogs({
  userId: 'user-123',
  eventType: AuditEventType.DATA_READ,
  startDate: new Date('2024-01-01'),
  endDate: new Date('2024-12-31'),
  limit: 100
});

// Anomalien erkennen
const anomalies = await auditService.detectAnomalies(
  'user-123',
  undefined,
  60 // Zeitfenster in Minuten
);

// Compliance-Report generieren
const report = await auditService.generateComplianceReport(
  new Date('2024-01-01'),
  new Date('2024-12-31')
);
```

#### Anomalie-Erkennung

Der Service erkennt automatisch:
- Mehrfache fehlgeschlagene Login-Versuche (≥5 in 60 Min)
- Ungewöhnlich hohe Anzahl von Datenzugriffen (≥100 in 60 Min)
- Zugriff von mehreren IP-Adressen (≥3 in 60 Min)
- Aktivitäten außerhalb der Geschäftszeiten
- Verdächtige Datenexport-Sequenzen (≥3 in 60 Min)

#### Integritätssicherung

Alle Audit-Log-Einträge werden mit HMAC-SHA256 signiert:
```typescript
// Signatur verifizieren
const isValid = auditService.verifyLogEntry(logEntry);
```

### 2. SecurityMonitoringService (`src/services/SecurityMonitoringService.ts`)

Echtzeit-Security-Monitoring mit automatischer Anomalie-Erkennung.

#### Features

**Kontinuierliches Monitoring**
```typescript
// Monitoring starten (alle 5 Minuten)
await securityMonitoring.startMonitoring(5);
```

**Security-Checks**
- Verdächtige Login-Muster
- Ungewöhnliche Datenzugriffe
- Rate-Limit-Überschreitungen
- Anomalie-Erkennung

**Alert-Management**
```typescript
// Aktive Alerts abrufen
const criticalAlerts = securityMonitoring.getActiveAlerts('critical');

// Alert bestätigen
securityMonitoring.acknowledgeAlert('alert-123');
```

**Security-Metriken**
```typescript
const metrics = await securityMonitoring.generateSecurityMetrics(
  new Date('2024-01-01'),
  new Date('2024-12-31')
);

// Enthält:
// - Gesamtanzahl Events
// - Fehlgeschlagene Logins
// - Unberechtigte Zugriffe
// - Verdächtige Aktivitäten
// - Top-Nutzer nach Aktivität
// - Top-Ressourcen nach Zugriffen
```

#### Alert-Schweregrade

- **Critical**: Sofortige Aktion erforderlich (z.B. Brute-Force-Angriff)
- **High**: Dringende Überprüfung nötig (z.B. mehrfache fehlgeschlagene Logins)
- **Medium**: Überwachung empfohlen (z.B. ungewöhnliche Zugriffsmuster)
- **Low**: Informativ (z.B. Rate-Limit-Überschreitung)

### 3. ComplianceReportingService (`src/services/ComplianceReportingService.ts`)

Umfassende Compliance-Reports für Audits und regulatorische Anforderungen.

#### Detaillierter Compliance-Report

```typescript
const report = await complianceReporting.generateDetailedReport(
  new Date('2024-01-01'),
  new Date('2024-12-31'),
  'tenant-123' // Optional
);
```

**Report-Inhalte:**

1. **Basis-Statistiken**
   - Gesamtanzahl Events
   - Events nach Typ
   - Fehlgeschlagene Operationen
   - Sicherheitsvorfälle
   - DSGVO-Anfragen

2. **DSGVO-Compliance-Status**
   - Datensubjekt-Anfragen (Auskunft, Löschung, Korrektur)
   - Durchschnittliche Antwortzeit
   - Einwilligungsverwaltung
   - Datenschutzverletzungen
   - Compliance-Score (0-100)

3. **Datenschutzmaßnahmen**
   - Verschlüsselungsrate
   - MFA-Adoption
   - Audit-Log-Integrität
   - Retention-Compliance

4. **Incident-Zusammenfassung**
   - Incidents nach Schweregrad
   - Durchschnittliche Lösungszeit
   - Incidents nach Typ

5. **Nutzeraktivitäts-Zusammenfassung**
   - Aktive Nutzer
   - Neue/Gelöschte Nutzer
   - Top-Aktivitäten

#### Export-Formate

```typescript
// CSV-Export
const csv = await complianceReporting.exportReportAsCSV(report);

// PDF-Export
const pdf = await complianceReporting.exportReportAsPDF(report);
```

### 4. Datenbank-Schema

**AuditLog-Tabelle** (`audit_logs`)

```sql
CREATE TABLE "audit_logs" (
    "id" TEXT PRIMARY KEY,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "eventType" TEXT NOT NULL,
    "userId" TEXT,
    "tenantId" TEXT,
    "resourceType" TEXT,
    "resourceId" TEXT,
    "action" TEXT NOT NULL,
    "result" TEXT NOT NULL,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "metadata" JSONB,
    "hmacSignature" TEXT NOT NULL
);
```

**Indizes für Performance:**
- `userId + timestamp`
- `tenantId + timestamp`
- `eventType + timestamp`
- `resourceType + resourceId`
- `result + timestamp`

### 5. API-Endpunkte (`src/routes/audit.ts`)

#### Audit-Logs abfragen
```
GET /api/audit/logs
Query-Parameter:
  - userId: string
  - eventType: string
  - startDate: ISO-8601
  - endDate: ISO-8601
  - limit: number (default: 100)
  - offset: number (default: 0)
```

#### Audit-Logs exportieren
```
GET /api/audit/logs/export
Query-Parameter:
  - format: 'json' | 'csv'
  - startDate: ISO-8601 (required)
  - endDate: ISO-8601 (required)
```

#### Anomalien erkennen
```
GET /api/audit/anomalies
Query-Parameter:
  - userId: string
  - tenantId: string
  - timeWindowMinutes: number (default: 60)
```

#### Security-Alerts abrufen
```
GET /api/audit/security/alerts
Query-Parameter:
  - severity: 'low' | 'medium' | 'high' | 'critical'
```

#### Alert bestätigen
```
POST /api/audit/security/alerts/:alertId/acknowledge
```

#### Security-Metriken
```
GET /api/audit/security/metrics
Query-Parameter:
  - startDate: ISO-8601 (required)
  - endDate: ISO-8601 (required)
```

#### Compliance-Report
```
GET /api/audit/compliance/report
Query-Parameter:
  - startDate: ISO-8601 (required)
  - endDate: ISO-8601 (required)
  - tenantId: string
```

#### Compliance-Report exportieren
```
GET /api/audit/compliance/report/export
Query-Parameter:
  - format: 'csv' | 'pdf'
  - startDate: ISO-8601 (required)
  - endDate: ISO-8601 (required)
  - tenantId: string
```

## Integration in bestehende Services

### Beispiel: UserService

```typescript
import { AuditService, AuditEventType } from './AuditService';

class UserService {
  private auditService: AuditService;

  async getUserProfile(userId: string, requestingUserId: string): Promise<UserProfile> {
    try {
      const profile = await this.prisma.user.findUnique({
        where: { id: userId }
      });

      // Erfolgreichen Zugriff protokollieren
      await this.auditService.logDataAccess(
        AuditEventType.DATA_READ,
        requestingUserId,
        'user',
        userId,
        'read_profile',
        'success'
      );

      return profile;
    } catch (error) {
      // Fehlgeschlagenen Zugriff protokollieren
      await this.auditService.logDataAccess(
        AuditEventType.DATA_READ,
        requestingUserId,
        'user',
        userId,
        'read_profile',
        'failure',
        { error: error.message }
      );
      throw error;
    }
  }

  async deleteUser(userId: string): Promise<void> {
    // DSGVO-Löschung protokollieren
    await this.auditService.logGDPREvent(
      AuditEventType.GDPR_DATA_DELETION,
      userId,
      'delete_user_data'
    );

    await this.prisma.user.delete({ where: { id: userId } });
  }
}
```

### Beispiel: AuthController

```typescript
import { AuditService, AuditEventType } from '../services/AuditService';

class AuthController {
  async login(req: Request, res: Response) {
    const { email, password } = req.body;
    const ipAddress = req.ip;
    const userAgent = req.get('user-agent');

    try {
      const user = await authService.login(email, password);

      // Erfolgreichen Login protokollieren
      await auditService.logAuthentication(
        AuditEventType.USER_LOGIN,
        user.id,
        'success',
        ipAddress,
        userAgent
      );

      res.json({ success: true, user });
    } catch (error) {
      // Fehlgeschlagenen Login protokollieren
      await auditService.logAuthentication(
        AuditEventType.FAILED_LOGIN,
        email, // Nutzer-ID nicht verfügbar
        'failure',
        ipAddress,
        userAgent,
        { reason: error.message }
      );

      res.status(401).json({ success: false, error: 'Invalid credentials' });
    }
  }
}
```

## Umgebungsvariablen

Füge zu `.env` hinzu:

```bash
# Audit Logging
AUDIT_HMAC_KEY=<64-character-hex-string>

# Security Monitoring
SECURITY_MONITORING_INTERVAL=5  # Minuten
SECURITY_ALERT_RETENTION_DAYS=30

# Compliance
AUDIT_LOG_RETENTION_DAYS=2555  # 7 Jahre für DSGVO
```

## Sicherheitsfeatures

### 1. HMAC-Signierung

Alle Audit-Log-Einträge werden mit HMAC-SHA256 signiert, um Manipulationen zu erkennen:

```typescript
// Automatisch bei jedem Log-Eintrag
const hmacSignature = crypto
  .createHmac('sha256', hmacKey)
  .update(JSON.stringify(logData))
  .digest('hex');
```

### 2. Integritätsprüfung

```typescript
// Stichprobenartige Prüfung
const logs = await auditService.queryLogs({ limit: 100 });
for (const log of logs) {
  if (!auditService.verifyLogEntry(log)) {
    logger.error(`Integrity check failed for log ${log.id}`);
    // Alert auslösen
  }
}
```

### 3. Retention-Policy

```typescript
// Alte Logs bereinigen (nach 7 Jahren)
const deletedCount = await auditService.cleanupOldLogs(2555);
```

## Performance-Optimierungen

### 1. Datenbank-Indizes

Optimierte Indizes für häufige Abfragen:
- Zeitbasierte Abfragen (timestamp)
- Nutzer-spezifische Abfragen (userId + timestamp)
- Event-Typ-Abfragen (eventType + timestamp)
- Ressourcen-Abfragen (resourceType + resourceId)

### 2. Batch-Logging

Für hohe Last kann Batch-Logging implementiert werden:

```typescript
class BatchAuditLogger {
  private buffer: AuditLogEntry[] = [];
  private batchSize = 100;

  async log(entry: AuditLogEntry) {
    this.buffer.push(entry);
    
    if (this.buffer.length >= this.batchSize) {
      await this.flush();
    }
  }

  async flush() {
    if (this.buffer.length === 0) return;
    
    await prisma.auditLog.createMany({
      data: this.buffer
    });
    
    this.buffer = [];
  }
}
```

### 3. Asynchrones Logging

Audit-Logging sollte die Hauptoperation nicht blockieren:

```typescript
// Fire-and-forget
auditService.logEvent(...).catch(error => {
  logger.error('Audit logging failed:', error);
});
```

## Monitoring und Alerting

### 1. Prometheus-Metriken

```typescript
import { Counter, Histogram } from 'prom-client';

const auditLogCounter = new Counter({
  name: 'audit_logs_total',
  help: 'Total number of audit log entries',
  labelNames: ['eventType', 'result']
});

const anomalyCounter = new Counter({
  name: 'security_anomalies_total',
  help: 'Total number of detected anomalies',
  labelNames: ['anomalyType', 'severity']
});
```

### 2. Alert-Konfiguration

Kritische Alerts sollten sofort eskaliert werden:

```typescript
if (alert.severity === 'critical') {
  // Email-Benachrichtigung
  await emailService.sendAlert(alert);
  
  // Slack-Benachrichtigung
  await slackService.sendAlert(alert);
  
  // PagerDuty-Integration
  await pagerDutyService.createIncident(alert);
}
```

## Testing

### Unit Tests

```typescript
describe('AuditService', () => {
  it('should log events with HMAC signature', async () => {
    await auditService.logEvent(
      AuditEventType.DATA_READ,
      'test_action',
      'success',
      { userId: 'test-user' }
    );

    const logs = await auditService.queryLogs({ userId: 'test-user' });
    expect(logs).toHaveLength(1);
    expect(logs[0].hmacSignature).toBeDefined();
    expect(auditService.verifyLogEntry(logs[0])).toBe(true);
  });

  it('should detect multiple failed login anomaly', async () => {
    // Simuliere 5 fehlgeschlagene Logins
    for (let i = 0; i < 5; i++) {
      await auditService.logAuthentication(
        AuditEventType.FAILED_LOGIN,
        'test-user',
        'failure'
      );
    }

    const anomalies = await auditService.detectAnomalies('test-user');
    expect(anomalies).toHaveLength(1);
    expect(anomalies[0].anomalyType).toBe('multiple_failed_logins');
    expect(anomalies[0].severity).toBe('high');
  });
});
```

### Integration Tests

```typescript
describe('Audit API', () => {
  it('should export audit logs as CSV', async () => {
    const response = await request(app)
      .get('/api/audit/logs/export')
      .query({
        format: 'csv',
        startDate: '2024-01-01',
        endDate: '2024-12-31'
      })
      .set('Authorization', `Bearer ${adminToken}`);

    expect(response.status).toBe(200);
    expect(response.headers['content-type']).toContain('text/csv');
    expect(response.text).toContain('timestamp,eventType');
  });
});
```

## Best Practices

### 1. Was sollte geloggt werden?

**Immer loggen:**
- Authentifizierung (Login, Logout, Registrierung)
- Datenzugriffe (Read, Create, Update, Delete)
- DSGVO-relevante Aktionen
- Sicherheitsereignisse
- Admin-Aktionen
- Konfigurationsänderungen

**Niemals loggen:**
- Passwörter oder Credentials
- Vollständige Kreditkartennummern
- Sensible persönliche Daten (außer verschlüsselt)

### 2. Metadata-Richtlinien

```typescript
// Gut: Strukturierte, nützliche Metadata
metadata: {
  action: 'update_profile',
  changedFields: ['email', 'phone'],
  previousValues: { email: 'old@example.com' },
  newValues: { email: 'new@example.com' }
}

// Schlecht: Zu viele oder sensible Daten
metadata: {
  fullUserObject: { ... }, // Zu viel
  password: 'secret123'    // Sensibel!
}
```

### 3. Performance-Überlegungen

- Verwende asynchrones Logging
- Implementiere Batch-Processing für hohe Last
- Nutze Datenbank-Indizes effektiv
- Bereinige alte Logs regelmäßig
- Überwache Speicherverbrauch

## Compliance-Checkliste

- [x] Vollständige Protokollierung aller Datenzugriffe
- [x] HMAC-Signierung für Integritätssicherung
- [x] Anomalie-Erkennung implementiert
- [x] Security-Monitoring aktiv
- [x] Compliance-Reporting verfügbar
- [x] DSGVO-konforme Retention-Policy (7 Jahre)
- [x] Export-Funktionen für Audits
- [x] Admin-Zugriffskontrolle
- [x] Automatische Alerts bei kritischen Events

## Nächste Schritte

1. **Monitoring-Dashboard erstellen**
   - Grafana-Dashboard für Security-Metriken
   - Real-time Alert-Anzeige
   - Compliance-Score-Tracking

2. **Alert-Integration erweitern**
   - Email-Benachrichtigungen
   - Slack-Integration
   - PagerDuty für kritische Alerts

3. **Machine Learning für Anomalie-Erkennung**
   - Trainiere ML-Modelle auf historischen Daten
   - Verbessere Erkennungsgenauigkeit
   - Reduziere False Positives

4. **Automatisierte Compliance-Reports**
   - Monatliche Reports automatisch generieren
   - An Compliance-Team senden
   - Archivierung für Audits

## Zusammenfassung

Task 11.3 ist vollständig implementiert mit:

✅ **Umfassendes Audit-Logging** für alle Systemaktivitäten  
✅ **Security-Monitoring** mit Echtzeit-Anomalie-Erkennung  
✅ **Compliance-Reporting** für DSGVO-Audits  
✅ **HMAC-Signierung** für Integritätssicherung  
✅ **API-Endpunkte** für Abfragen und Exports  
✅ **Performance-Optimierungen** mit Indizes  
✅ **Retention-Policy** für 7 Jahre  

Das System ist produktionsbereit und erfüllt alle Anforderungen für Datenschutz-Audits und regulatorische Compliance.
