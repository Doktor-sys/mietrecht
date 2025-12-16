# Mietrecht - Lokales Test-Startskript

Kurze Anleitung zur Verwendung von `start_local_test.bat` für lokale Entwicklung und Tests.

## Zweck
- Startet Backend und Mobile-App lokal.
- Synchronisiert die Datenbank mit Prisma (`prisma db push`).
- Nutzt lokale PostgreSQL-Instanz standardmäßig (konfigurierbar).
- Schreibt Logdateien (`start_local_test.log`, `backend.log`).

## Voraussetzungen
- Windows (PowerShell oder CMD)
- Node.js (mind. v18.0 empfohlen)
- npm
- Lokale PostgreSQL-Instanz oder erreichbarer DB-Host

## Schnellstart
1. Ins Projektverzeichnis wechseln:
```powershell
cd D:\JurisMind\Mietrecht
```
2. Skript ausführen:
```powershell
.\start_local_test.bat
```

Das Skript prüft Node/npm-Version, prüft PostgreSQL auf `PGHOST:PGPORT` (Standard `localhost:5432`), führt `npx prisma db push` aus, startet das Backend und die Mobile-App. Logausgaben werden in `start_local_test.log` bzw. `backend.log` geschrieben.

## Wichtige Umgebungsvariablen

## PowerShell-Variante

Es gibt zusätzlich eine PowerShell-Version des Startskripts: `start_local_test.ps1`.

- Ausführen (im Repo-Root):
```powershell
.\start_local_test.ps1
```

- Verhalten: entspricht funktional dem Batch-Skript, nutzt aber PowerShell‑Funktionen:
  - bessere Logrotation mit Timestamp
  - prüft `node`/`npm` (Node >= 18 empfohlen)
  - prüft PostgreSQL auf `PGHOST:PGPORT` (Override: `SKIP_PG_CHECK=1`)
  - startet Backend in einem neuen PowerShell-Fenster (Standard: Backend-Logging aktiviert)
  - startet die Mobile-App und installiert ggf. Abhängigkeiten

- Wichtige Umgebungsvariablen (wiederholt):
  - `PGHOST`, `PGPORT` — DB-Host/Port (Defaults: `localhost` / `5432`)
  - `SKIP_PG_CHECK=1` — Weiterfahren trotz nicht erreichbarer DB
  - `BACKEND_LOG` — `1` oder `0` (Standard `1`)
  - `BACKEND_LOGFILE` — Pfad zur Backend-Logdatei

Die PowerShell-Variante ist nützlich, wenn du PowerShell‑spezifische Features bevorzugst oder die Ausgaben direkt in Dateien sammeln möchtest.

## Logs & Rotation
- `start_local_test.log` enthält Ablauf-Infos, Fehler und die Ausgaben von `prisma db push` und `npm install`.
- Logrotation ist aktiv: Dateien >5MB werden timestamp-rotated; es werden bis zu 5 Backups behalten.

## Zurücksetzen auf Originalskript
Falls etwas schiefgeht, ist eine Kopie des Originals angelegt: `start_local_test.bat.bak`.

## Weiteres
Wenn du möchtest, kann ich das Skript in eine PowerShell-Variante konvertieren oder weitere Checks/CI-Anpassungen vornehmen.

---
Automatisch hinzugefügt.
# SmartLaw Mietrecht — Vollständiges System

Intelligente rechtliche Analyse- und Entscheidungsplattform für deutsches Mietrecht mit erweiterten KI/ML-Funktionen, Offline-Unterstützung und Real-Time-Datenintegration.

**Aktuelle Version:** 1.2.1 (7. Dezember 2025)

---

## 🚀 Schnelleinstieg

### Voraussetzungen
- Node.js 18+ und npm
- Docker & Docker Compose (optional, für Container-Deployment)
- PostgreSQL 13+ (für Produktionsumgebungen)
- Redis (optional, für erweiterte Caching-Funktionen)

### Installation (lokal)

```bash
# Repository klonen
git clone <repository-url>
cd "JurisMind - Mietrecht 01"

# Dependencies installieren
npm install

# Umgebungsvariablen konfigurieren
cp .env.example .env
# Bearbeite .env mit deinen Einstellungen

# Datenbank initialisieren
npm run db:setup

# Entwicklungsserver starten
npm run dev
```

### Docker-Deployment

```bash
docker-compose up -d
```

## Projektübersicht

SmartLaw Mietrecht ist eine innovative Plattform, die Mieter und Vermieter mit KI-gestützter Rechtsberatung, Dokumentenanalyse und Anwaltsvermittlung unterstützt. Seit v1.2.0 integriert die Plattform erweiterte KI/ML-Funktionen, Offline-Unterstützung und Echtzeitdaten aus der Neuen Juristischen Wochenschrift (NJW).

---

## 📋 Projektstruktur

```
.
├── services/
│   ├── backend/              # Node.js/Express Backend (Port 3001)
│   ├── web-app/              # React Frontend (Port 3000)
│   └── mobile-app/           # React Native Mobile
├── scripts/                   # Utility-Skripte & Agenten
│   ├── njw_api_client.js      # NJW-Datenintegration (NEU v1.2.0+)
│   └── mietrecht_agent_*.js   # Verschiedene Agent-Versionen
├── docs/                      # Zentrale Dokumentation
├── CHANGELOG.md               # Version History (aktuell: v1.2.1)
└── docker-compose.yml         # Container-Orchestrierung
```

---

## 🎯 Neue Funktionen (v1.2.0+)

### ✨ NJW-Datenbankintegration (NEU)
- Automatischer Abruf aus Neue-Juristische-Wochenschrift
- Intelligentes Caching (TTL: 30 Min, konfigurierbar)
- Rate-Limiting & Retry-Mechanismen (3 Versuche, exponential backoff)
- Kombinierte Datenquellen: BGH, Landgerichte, NJW
- **Dokumentation:** [NJW_INTEGRATION_SUMMARY.md](NJW_INTEGRATION_SUMMARY.md)

### ✨ Erweiterte Backend-APIs (ML/NLP)
- **Enhanced Risk Assessment:** Konfidenzscores bis 0.9+
- **Advanced Strategy Recommendations:** KI-gestützte Strategien
- **Endpoint:** `/api/risk-assessment/.../enhanced`
- **Dokumentation:** [services/backend/API_DOCUMENTATION.md](services/backend/API_DOCUMENTATION.md)

### ✨ Mobile Offline-Funktionen
- Offline-Queue mit Auto-Sync (max. 100 Einträge, 7 Tage Retention)
- Push-Kanäle (default, chat, legal_updates, reminders)
- E2E-getestet mit Detox
- **Dokumentation:** [mobile-app/OFFLINE_FUNCTIONALITY_DOCUMENTATION.md](mobile-app/OFFLINE_FUNCTIONALITY_DOCUMENTATION.md)

### ✨ Visual Regression Testing
- Playwright (Web) & Detox (Mobile)
- Strikte Toleranz: 0.1%
- Baseline-Management & CI-Integration
- **Dokumentation:** [web-app/VISUAL_REGRESSION_TESTING_ENHANCED.md](web-app/VISUAL_REGRESSION_TESTING_ENHANCED.md)

### ✨ Enhanced Data Sources
- Caching, Rate-Limiting, Retry-Mechanismen
- BGH, Landgerichte, NJW API-Clients
- Geplant: Redis-Integration, Circuit-Breaker
- **Dokumentation:** [scripts/README_DATA_SOURCES.md](scripts/README_DATA_SOURCES.md)

### ✨ Erweiterte Sicherheit
- KMS (Key Management Service) für Envelope Encryption
- Rate-Limiting & IP-Reputation
- Audit-Logging mit Korrelations-IDs
- CSRF/Token-Schutz, Container-Härtung
- Security Scanning in CI/CD
- **Dokumentation:** [SECURITY_IMPROVEMENTS.md](SECURITY_IMPROVEMENTS.md)

### ✨ Task-Management (Asana-Integration)
- Strukturierte Aufgabenverwaltung (Prioritäten, Estimates, Dependencies)
- GitHub-Webhooks mit Asana-Sync
- Status-Tracking & Reporting
- **Dokumentation:** [ASANA_IMPLEMENTATION_PLAN.md](ASANA_IMPLEMENTATION_PLAN.md)

### ✨ Monitoring & Logging
- Strukturierte Logs mit Korrelations-IDs
- Real-Time-Threat-Detection
- Erweiterte Alerting-Regeln
- Log-Retention-Policy (30 Tage)

---

## 🔧 Technologie-Stack

### Backend (Node.js/Express)
- **Framework:** Node.js 18+ mit Express
- **Datenbank:** PostgreSQL 13+ mit Prisma ORM
- **Cache:** Redis für Session & Caching
- **KMS:** Key Management Service (Envelope Encryption)
- **Logging:** Winston mit strukturierten Logs
- **Monitoring:** Prometheus/Grafana
- **Auth:** JWT mit Refresh Tokens & Biometrie-Unterstützung
- **Testing:** Jest, Integration Tests, Security Tests

### Frontend (React/Vite)
- **Framework:** React 18 mit Vite
- **State:** Redux Toolkit
- **UI:** Material UI + TailwindCSS
- **Routing:** React Router v6
- **Testing:** Playwright (Visual Regression)

### Mobile (React Native)
- **Framework:** React Native (Expo/Native)
- **State:** Redux Toolkit
- **Offline:** Lokale SQLite-Datenbank + Sync-Queue
- **Testing:** Detox (E2E), Jest (Unit)

---

## 📖 Kernfunktionen (Übersicht)

### Intelligente Chat-Beratung
- KI-gestützter Rechtsassistent für Mietrecht
- Kontextbewusste Antworten basierend auf Unterhaltungsverlauf
- Integration mit juristischen Datenquellen (NJW, BGH, Landgerichte)
- Multimodale Eingabe (Text, Dokumente, Bilder)
- ML/NLP-basierte Auswertungen

### Dokumentenmanagement
- Hochladen und Analyse von Mietrecht-Dokumenten
- Automatische Extraktion relevanter Informationen
- KI-gestützte Dokumentenerstellung
- Versionskontrolle und Historie

### Anwaltsvermittlung & Buchung
- Matching-Algorithmus für passende Anwälte
- Bewertungen und Rezensionen
- Online-Terminvereinbarung
- Zahlungsintegration
- Fallmanagement-Tools

### Mietspiegel & Preisanalyse
- Zugriff auf aktuelle Mietspiegeldaten
- Regionale Preisanalysen
- Vergleichstools für Mietpreise
- Markttrends und Statistiken

### Business-Partner-Integrationen
- API für externe Dienste
- Whitelabel-Lösungen
- Kanzleimanagementsysteme (Lexware, DATEV)
- Buchhaltungssysteme (Lexoffice, FastBill)
- Kalender-Sync (Google, Outlook, Exchange)


### Umfassende Sicherheit (v1.2.0+)
- **KMS-Verschlüsselung:** Key Management Service mit Master Keys
- **Authentifizierung:** JWT-Tokens, Biometrie, 2FA
- **DSGVO-Compliance:** Audit-Protokollierung, Datenschutz by Design
- **Input-Validierung:** Strict validation auf allen Eingaben
- **CORS & Headers:** CSP, X-Frame-Options, X-Content-Type-Options
- **Rate-Limiting & IP-Reputation:** Schutz vor Brute-Force
- **Security Scanning:** Automatisiert in CI/CD (GitHub Actions)

### Barrierefreiheit & Benutzerfreundlichkeit
- WCAG 2.1 AA-konforme Oberfläche
- Unterstützung für Screenreader
- Anpassbare Darstellung
- Tastaturnavigation
- Mehrsprachige UI (Deutsch/English)

### Umfassendes Monitoring & Health Checks
- **Einfacher Health Check:** `GET /health` (Liveness Check)
- **Umfassender Health Check:** `GET /health/comprehensive`
  - Datenbankkonnektivität ✓
  - Festplattenspeicher ✓
  - Speichernutzung ✓
  - CPU-Auslastung ✓
  - Netzwerk-Konnektivität ✓
- **CLI Health Check:** Skriptbasiert für Automatisierung
- **Real-Time-Überwachung:** Prometheus/Grafana Dashboards
- **Alerting:** Konfigurierbare Alarmregeln
- **Strukturierte Logs:** Mit Korrelations-IDs

---

## 🚀 Verfügbare Scripts

### Backend
```bash
npm run dev              # Entwicklungsserver
npm run build            # Production-Build
npm run start            # Production-Server
npm run test             # Tests ausführen
npm run test:security    # Sicherheits-Tests
npm run db:migrate       # Datenbank-Migrationen
npm run health           # Health Check ausführen
```

### Web-App
```bash
npm run dev              # Entwicklungsserver
npm run build            # Production-Build
npm run test             # Jest-Tests
npm run visual-test      # Visual Regression Tests (Playwright)
npm run lint             # Code-Linting
```

### Mobile-App
```bash
npm run start            # Metro Bundler
npm run android          # Android Emulator
npm run ios              # iOS Simulator
npm run test             # Jest-Tests
npm run visual-test      # Detox E2E-Tests
```

### Utilities & Agents
```bash
npm run test-njw-api            # NJW-API-Client testen
npm run test-mietrecht-agent    # Mietrecht-Agent testen
npm run test-data-sources       # Data Sources testen
npm run health:cli              # CLI Health Check
```

---

## 🔐 Sicherheit & Umgebungsvariablen

### Kritische Umgebungsvariablen
```bash
# KMS & Encryption
KMS_MASTER_KEY=<32-Char-Hex-String>        # Master Key für KMS
JWT_SECRET=<Long-Random-String>             # JWT Signing Key

# Database & Cache
DATABASE_URL=postgresql://user:pass@host    # PostgreSQL Connection
REDIS_URL=redis://host:6379                 # Redis Connection (optional)

# API & Rate Limiting
API_RATE_LIMIT=10                           # Requests pro Minute
NJW_API_KEY=<API-Key>                       # NJW-Datenbank-Zugang (optional)

# Security
CORS_ORIGIN=https://yourdomain.com          # CORS-Origins
CSRF_ENABLED=true                           # CSRF-Schutz aktivieren

# Monitoring
LOG_LEVEL=info                              # Log-Level (error, warn, info, debug)
SENTRY_DSN=<Sentry-URL>                     # Error Tracking (optional)
```

**Detaillierte Sicherheits-Dokumentation:** [SECURITY_IMPROVEMENTS.md](SECURITY_IMPROVEMENTS.md)

---

## 📚 Dokumentation & Guides

### Dokumentations-Übersicht
| Bereich | Dokumentation |
|---------|---|
| **Setup & Deployment** | [DEPLOYMENT_README.md](DEPLOYMENT_README.md) |
| **API-Dokumentation** | [services/backend/API_DOCUMENTATION.md](services/backend/API_DOCUMENTATION.md) |
| **Sicherheit** | [SECURITY_IMPROVEMENTS.md](SECURITY_IMPROVEMENTS.md) |
| **NJW-Integration** | [NJW_INTEGRATION_SUMMARY.md](NJW_INTEGRATION_SUMMARY.md) |
| **Offline-Features** | [mobile-app/OFFLINE_FUNCTIONALITY_DOCUMENTATION.md](mobile-app/OFFLINE_FUNCTIONALITY_DOCUMENTATION.md) |
| **Visual Testing** | [web-app/VISUAL_REGRESSION_TESTING_ENHANCED.md](web-app/VISUAL_REGRESSION_TESTING_ENHANCED.md) |
| **Datenquellen** | [scripts/README_DATA_SOURCES.md](scripts/README_DATA_SOURCES.md) |
| **Task Management** | [ASANA_IMPLEMENTATION_PLAN.md](ASANA_IMPLEMENTATION_PLAN.md) |
| **Health Checks** | [services/backend/README.md#health-checks](services/backend/README.md#health-checks) |
| **Zahlungsabwicklung** | [services/backend/README.md#payment](services/backend/README.md#payment) |
| **Version History** | [CHANGELOG.md](CHANGELOG.md) |

### Feature-Dokumentation (Scripts)
- [scripts/README_ADVANCED_FEATURES.md](scripts/README_ADVANCED_FEATURES.md) — Erweiterte Features
- [scripts/README_INTEGRATIONS.md](scripts/README_INTEGRATIONS.md) — API-Integrationen
- [scripts/README_NLP.md](scripts/README_NLP.md) — NLP-Prozessoren
- [scripts/README_MIETRECHT_AGENT_DE.md](scripts/README_MIETRECHT_AGENT_DE.md) — Deutscher Mietrecht-Agent

### Service-Dokumentation
- [services/backend/README.md](services/backend/README.md) — Backend-API & Entwicklung
- [services/web-app/README.md](services/web-app/README.md) — Frontend-Entwicklung
- [services/mobile-app/README.md](services/mobile-app/README.md) — Mobile-App-Entwicklung

---

## 🚢 Deployment & Bereitstellung

### Lokale Entwicklung
```bash
# Alle Services starten
docker-compose -f docker-compose.dev.yml up

# Oder manuell
npm install
npm run dev
```

### Staging-Umgebung
```bash
docker-compose up -d
```

### Production (Heroku)
```bash
heroku login
git push heroku main
heroku logs --tail
```

**Detaillierte Deployment-Anleitung:** [DEPLOYMENT_README.md](DEPLOYMENT_README.md)

---

## ✅ Testing & Quality Assurance

### Unit Tests
```bash
npm run test
npm run test:unit
```

### Integration Tests
```bash
npm run test:integration
```

### Security Testing
```bash
npm run test:security:enhanced
```

### Visual Regression (UI)
```bash
# Web (Playwright)
cd web-app && npx playwright test

# Mobile (Detox)
cd mobile-app && npm run visual-test
```

### E2E Mobile Offline Tests
```bash
cd mobile-app && npm run e2e:test
```

---

## 🤝 Contribution Guide

### Workflow
1. **Feature-Branch erstellen:** `git checkout -b feature/deine-feature`
2. **Code schreiben & testen:** `npm run test` erfolgreich
3. **Commit mit konventionellem Format:** `git commit -m "feat(scope): Beschreibung"`
4. **Pull Request öffnen** mit Testnachweis
5. **Code-Review** durch Team-Mitglieder

### Commit-Message-Format
```
<type>(<scope>): <subject>

<body>

<footer>
```

**Typen:** `feat`, `fix`, `docs`, `style`, `refactor`, `test`, `chore`, `perf`

**Beispiele:**
```bash
git commit -m "feat(njw): Integriere NJW-API-Client mit Caching"
git commit -m "fix(auth): Behebe JWT-Token-Validierungsfehler"
git commit -m "docs: Aktualisiere README mit v1.2.0 Features"
```

---

## 🆘 Troubleshooting & Support

### Häufige Probleme

| Problem | Lösung |
|---------|--------|
| **Port 3001 bereits in Verwendung** | `lsof -i :3001` → `kill -9 <PID>` |
| **Datenbank-Verbindungsfehler** | `.env` prüfen, PostgreSQL läuft? |
| **KMS-Keys nicht gefunden** | `npm run kms:generate` ausführen |
| **Redis-Fehler** | Redis installiert? `redis-cli ping` testen |
| **Tests schlagen fehl** | `npm run test:setup` ausführen, Cache löschen |
| **Visual Tests unterscheiden sich** | Baselines aktualisieren: `npm run visual-test -- --update` |

### Debug-Modus aktivieren
```bash
DEBUG=smartlaw:* npm run dev
LOG_LEVEL=debug npm start
```

### Logs anzeigen
```bash
# Docker Container Logs
docker-compose logs -f backend
docker-compose logs -f web-app

# CLI-Output
npm run dev 2>&1 | tee app.log
```

**Detailliertes Troubleshooting:** [services/backend/README.md#troubleshooting](services/backend/README.md#troubleshooting)

---

## 📞 Support & Kontakt

- **📖 Dokumentation:** Siehe [📚 Dokumentation & Guides](#-dokumentation--guides)
- **🐛 Issues:** GitHub Issues für Bug Reports & Feature Requests
- **💬 Slack/Discord:** `#development` Kanal für Diskussionen
- **📧 Email:** `dev-team@smartlaw.de`
- **📊 Status:** Siehe [DEPLOYMENT_CHECKLIST.md](DEPLOYMENT_CHECKLIST.md) für aktuelle Status

---

## 📄 Lizenz & Rechtliches

**Lizenztyp:** Proprietär — Alle Rechte vorbehalten

**Copyright:** SmartLaw GmbH 2025

**DSGVO-Compliance:** Audit-Protokollierung, Datenschutz by Design  
**Datenschutz:** [PRIVACY_POLICY.md](PRIVACY_POLICY.md)  
**Nutzungsbedingungen:** [TERMS_OF_SERVICE.md](TERMS_OF_SERVICE.md)

---

## 🎉 Version History & Releases

| Version | Datum | Highlights |
|---------|-------|-----------|
| **1.2.1** | 7. Dez 2025 | ✓ Vollständige deutsche Übersetzung, i18n Support |
| **1.2.0** | 7. Dez 2025 | ✓ NJW-Integration, Enhanced APIs (ML/NLP), Mobile Offline, Visual Regression Testing |
| **1.1.0** | 1. Dez 2025 | ✓ Enhanced Profile Preferences, Monitoring & Logging |
| **1.0.0** | 15. Nov 2025 | ✓ Initiale Release — Kernsystem stabil |

**Detaillierte Release History:** [CHANGELOG.md](CHANGELOG.md)

**Geplante Features (Roadmap):**
- Redis Circuit-Breaker-Integration
- Advanced Legal Document OCR
- Blockchain-basierte Audit Trails
- API v2 mit GraphQL-Support

---

**Zuletzt aktualisiert:** 7. Dezember 2025  
**Status:** ✅ Production Ready (v1.2.1)