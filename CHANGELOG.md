# Changelog

Alle bemerkenswerten Änderungen an diesem Projekt werden in dieser Datei dokumentiert.

Das Format basiert auf [Keep a Changelog](https://keepachangelog.com/de/1.0.0/),
und dieses Projekt folgt [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - 2025-12-01

### Hinzugefügt

- Initiale Version des Mietrecht-Agenten
- Automatische Datenbeschaffung von BGH, Landgerichten, BVerfG und Beck-Online
- Intelligente Inhaltsanalyse mit NLP-Prozessor
- Personalisierte Benachrichtigungssysteme (E-Mail, SMS, Push)
- Webbasierte Konfigurationsoberfläche mit Dashboard
- RESTful API für externen Zugriff
- Umfassende Analyse- und Berichtsfunktionen
- Persistente Speicherung in SQLite-Datenbank
- Vollständige Testabdeckung und Qualitätssicherung
- Umfassende Dokumentation (Systemarchitektur, Entwicklerdokumentation, Benutzerhandbuch, API-Dokumentation, Installationsanleitung)

### Geändert

- N/A (Initiale Version)

### Veraltet

- N/A (Initiale Version)

### Entfernt

- N/A (Initiale Version)

### Behoben

- N/A (Initiale Version)

## [0.1.0] - 2025-11-15

### Hinzugefügt

- Projektgrundstruktur und Basisimplementierung
- Grundlegende Datenbeschaffung von BGH
- Einfaches Benachrichtigungssystem
- Erste Version der Weboberfläche

### Geändert

- N/A

### Veraltet

- N/A

### Entfernt

- N/A

### Behoben

- N/A

## [1.2.0] - 2025-12-07

### Hinzugefügt

- NJW Database Integration
	- `scripts/njw_api_client.js` — NJW API Client zur Abfrage von NJW-Artikeln
	- Integration in `scripts/mietrecht_agent_real_data.js` zum Zusammenziehen von BGH/LG-Entscheidungen und NJW-Artikeln
	- Unit tests: `scripts/test_njw_api_client.js` und Integrationstest `test_mietrecht_agent_with_njw`

- Verbesserte Data Sources
	- Caching: Standard `CACHE_TTL = 30 * 60 * 1000` (30 Minuten), konfigurierbar
	- Rate Limiting: Standard `maxRequests: 10` pro `timeWindow: 60000` ms
	- Retry: Exponentielles Backoff (3 Retries, baseDelay=1000ms)
	- Spezialisierte API-Clients für BGH, Landgerichte, NJW
	- Geplant: Redis-Integration für verteiltes Caching, Circuit-Breaker-Pattern

- Backend — Enhanced APIs (ML/NLP)
	- Neue Endpunkte: `POST /api/risk-assessment/document/:documentId/enhanced`, `POST /api/risk-assessment/case/:caseId/enhanced`, `POST /api/strategy-recommendations/.../enhanced`
	- Beispiel: Response enthält `"isEnhanced": true` und `"confidence": 0.9`
	- Tests: `src/tests/unit/enhanced-strategy-recommendations.test.ts` und `scripts/ml/enhancedStrategyRecommendations.js`

- Mobile — Offline & Push
	- Offline-Queue (max. 100 Einträge), automatische Verarbeitung bei wiederhergestellter Verbindung
	- Daten-Expiration: 7 Tage (konfigurierbar)
	- Push-Channels: `default`, `chat`, `legal_updates`, `reminders` mit Scheduling-Optionen
	- E2E-Tests: `e2e/tests/offline.e2e.js` — `npm run e2e:test`

- Qualität & Visual Regression
	- Web: Playwright-Konfiguration in `web-app/playwright.config.ts`, Threshold 0.1%
	- Mobile: Detox-Setup `mobile-app/detox.config.js`
	- Lokale Befehle: `npx playwright test`, `npx playwright test --update-snapshots`

- CI/CD & Security
	- GitHub Actions: automatische Visual- und Security-Tests, Docker-Scanning, Artefakt-Archivierung
	- Security-Skripte: `scripts/test/verifyEnhancedSecurity.js`, `npm run test:security:enhanced`
	- Branch-Protection und aktualisierte Workflows

- Monitoring & Logging
	- Strukturierte Logs, Korrelations-IDs, erweiterte Alerting-Regeln, Log-Retention-Policy

### Geändert

- Visual Regression: strengere Diff-Grenzwerte und CI-Integration für frühzeitige Erkennung visueller Regressions
- CI/CD: zusätzliche Security-Prüfungen und automatisierte Lint-/Test-Skripte

### Sonstiges

- Projektweite Verbesserungen dokumentiert: Task-Management (Asana-Integration, Migrations-Checklisten), KMS-Verbesserungen, Empfehlungen für MFA und Zero-Trust-Ansätze

