# SmartLaw Backend

Backend-Service für die SmartLaw Mietrecht-Anwendung.

## Schnellstart

### 1. Installation

```bash
npm install
```

### 2. Umgebungsvariablen einrichten

```bash
# Kopiere .env.example
cp .env.example .env

# Generiere KMS Encryption Keys
node scripts/generate-kms-keys.js

# Füge die generierten Keys zu .env hinzu
# Konfiguriere weitere Umgebungsvariablen (DATABASE_URL, JWT_SECRET, etc.)
```

### 3. Datenbank einrichten

```bash
# Generiere Prisma Client
npx prisma generate

# Führe Migrationen aus
npx prisma migrate dev

# Optional: Fülle mit Testdaten
npx ts-node prisma/seed.ts
```

### 4. Validierung

```bash
# Validiere KMS-Konfiguration
node scripts/validate-kms-config.js
```

### 5. Server starten

```bash
# Development
npm run dev

# Production
npm run build
npm start
```

## Verfügbare Skripte

### Development
- `npm run dev` - Starte Development Server mit Hot Reload
- `npm run build` - Baue für Produktion
- `npm start` - Starte Production Server

### Testing
- `npm test` - Führe alle Tests aus
- `npm run test:watch` - Tests im Watch-Modus
- `npm run test:coverage` - Tests mit Coverage-Report

### Datenbank
- `npx prisma generate` - Generiere Prisma Client
- `npx prisma migrate dev` - Entwicklungs-Migrationen
- `npx prisma migrate deploy` - Produktions-Migrationen
- `npx prisma studio` - Öffne Prisma Studio (DB GUI)

### KMS (Key Management System)
- `node scripts/generate-kms-keys.js` - Generiere Encryption Keys
- `node scripts/validate-kms-config.js` - Validiere KMS-Konfiguration

Siehe [scripts/README.md](scripts/README.md) für Details.

### TLS/HTTPS
- `npm run certs:generate` - Generiere Entwicklungszertifikate
- `npm run certs:info` - Zeige Zertifikat-Informationen
- `./scripts/setup-production-certs.sh <domain> <email>` - Setup Let's Encrypt (Produktion)

Siehe [docs/TASK_11.1.12_TLS_IMPLEMENTATION.md](docs/TASK_11.1.12_TLS_IMPLEMENTATION.md) für Details.

## Makefile (Linux/Mac)

Für Linux/Mac-Systeme steht ein Makefile zur Verfügung:

```bash
make help           # Zeige alle verfügbaren Befehle
make setup          # Komplettes Setup für neue Entwickler
make dev            # Starte Development Server
make kms-generate   # Generiere KMS Keys
make kms-validate   # Validiere KMS Konfiguration
make db-setup       # Datenbank einrichten
make db-seed        # Testdaten einfügen
```

## Projektstruktur

```
services/backend/
├── src/
│   ├── config/          # Konfigurationsdateien
│   ├── controllers/     # API Controller
│   ├── middleware/      # Express Middleware
│   ├── routes/          # API Routes
│   ├── services/        # Business Logic
│   │   └── kms/        # Key Management System
│   ├── types/          # TypeScript Type Definitions
│   ├── utils/          # Hilfsfunktionen
│   └── index.ts        # Server Entry Point
├── prisma/
│   ├── schema.prisma   # Datenbank-Schema
│   ├── migrations/     # Datenbank-Migrationen
│   └── seed.ts         # Seed-Daten
├── scripts/
│   ├── generate-kms-keys.js      # KMS Keys Generator
│   ├── validate-kms-config.js    # KMS Validator
│   └── README.md                 # Scripts Dokumentation
├── docs/               # Dokumentation
├── data/              # Statische Daten (Templates, etc.)
└── tests/             # Tests
```

## Technologie-Stack

- **Runtime:** Node.js mit TypeScript
- **Framework:** Express.js
- **Datenbank:** PostgreSQL mit Prisma ORM
- **Cache:** Redis
- **Search:** Elasticsearch
- **Storage:** MinIO (S3-kompatibel)
- **AI:** OpenAI GPT-4
- **Testing:** Jest
- **Documentation:** OpenAPI 3.0 (Swagger)

## Wichtige Konfigurationen

### Erforderliche Umgebungsvariablen

```bash
# Datenbank
DATABASE_URL=postgresql://user:password@localhost:5432/smartlaw_dev

# JWT
JWT_SECRET=your-secret-key

# OpenAI
OPENAI_API_KEY=your-openai-key

# KMS (Key Management System)
MASTER_ENCRYPTION_KEY=your-256-bit-master-key
KMS_AUDIT_HMAC_KEY=your-hmac-key
```

Siehe [.env.example](.env.example) für alle verfügbaren Variablen.

### KMS Setup

Das Key Management System (KMS) ist für die Verschlüsselung sensibler Daten zuständig.

**Wichtig:** Generiere sichere Keys vor dem ersten Start!

```bash
# 1. Keys generieren
node scripts/generate-kms-keys.js

# 2. Keys zu .env hinzufügen
# MASTER_ENCRYPTION_KEY=...
# KMS_AUDIT_HMAC_KEY=...

# 3. Validieren
node scripts/validate-kms-config.js
```

Siehe [docs/TASK_11.1.11_KMS_CONFIGURATION.md](docs/TASK_11.1.11_KMS_CONFIGURATION.md) für Details.

## API-Dokumentation

Die API-Dokumentation ist über Swagger verfügbar:

```
http://localhost:3001/api-docs
```

## Sicherheit

### Verschlüsselung
- Ende-zu-Ende-Verschlüsselung für sensible Daten
- Key Management System (KMS) mit Envelope Encryption
- TLS 1.3 für API-Kommunikation

### Authentifizierung
- JWT-basierte Authentifizierung
- Refresh Tokens
- Rate Limiting

### DSGVO-Compliance
- Datenminimierung
- Pseudonymisierung
- Audit-Logging (7 Jahre Retention)
- Recht auf Auskunft, Berichtigung, Löschung

### Monitoring und Alerting
- Slack Integration für Benachrichtigungen
- Microsoft Teams Integration für Benachrichtigungen
- PagerDuty Integration für kritische Alerts
- SMS Alerts via Twilio für kritische Ereignisse
- E-Mail-Benachrichtigungen mit HTML-Formatierung
- Custom Webhook Integration
- Automatische Alert-Erkennung bei Sicherheitsvorfällen
- Alert-Deduplikation zur Vermeidung von Spam
- Multi-Kanal-Benachrichtigungen basierend auf Schweregrad

## Entwicklung

### Code-Qualität

```bash
# Linting
npm run lint

# Formatting
npx prettier --write "src/**/*.{ts,js,json}"

# Type Checking
npx tsc --noEmit
```

### Testing

```bash
# Alle Tests
npm test

# Spezifische Tests
npm test -- keyStorage.test.ts

# Coverage
npm run test:coverage
```

### Debugging

```bash
# Mit VS Code Debugger
# Drücke F5 oder verwende "Run and Debug"

# Mit Node Inspector
node --inspect-brk dist/index.js
```

## Deployment

### Docker

```bash
# Build
docker build -t smartlaw-backend .

# Run
docker run -p 3001:3001 --env-file .env smartlaw-backend
```

### Kubernetes

```bash
# Deploy
kubectl apply -f k8s/

# Secrets
kubectl create secret generic kms-keys \
  --from-literal=MASTER_ENCRYPTION_KEY=<key> \
  --from-literal=KMS_AUDIT_HMAC_KEY=<key>
```

## Troubleshooting

### KMS-Fehler

```
Error: Master encryption key not found
```

**Lösung:** Generiere Keys mit `node scripts/generate-kms-keys.js`

### Datenbank-Verbindungsfehler

```
Error: Can't reach database server
```

**Lösung:** Prüfe `DATABASE_URL` in `.env` und stelle sicher, dass PostgreSQL läuft.

### Redis-Verbindungsfehler

```
Error: Redis connection failed
```

**Lösung:** Prüfe `REDIS_URL` in `.env` und stelle sicher, dass Redis läuft.

## Weitere Dokumentation

- [KMS Configuration Guide](docs/TASK_11.1.11_KMS_CONFIGURATION.md)
- [KMS Setup Guide](docs/kms-setup-guide.md)
- [Monitoring Integration Guide](docs/monitoring-integration.md)
- [Advanced Monitoring Guide](docs/advanced-monitoring.md)
- [Scripts Documentation](scripts/README.md)
- [API Documentation](http://localhost:3001/api-docs)

## Support

Bei Fragen oder Problemen:
1. Prüfe die Dokumentation in `docs/`
2. Suche in den Issues
3. Erstelle ein neues Issue mit detaillierter Beschreibung

## Lizenz

Proprietär - Alle Rechte vorbehalten
