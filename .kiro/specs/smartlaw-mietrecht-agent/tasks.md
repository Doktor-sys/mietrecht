# Implementierungsplan: SmartLaw Agent – Mietrecht

## 1. Projektstruktur und Grundlagen einrichten

- [x] 1.1 Monorepo-Struktur mit Backend und Frontend erstellen
  - Erstelle Projektverzeichnisse für services/, web-app/, mobile-app/, shared/
  - Konfiguriere Lerna oder Nx für Monorepo-Management
  - Richte Docker-Compose für lokale Entwicklung ein
  - _Anforderungen: 1.1, 1.4_

- [x] 1.2 Backend-Grundstruktur mit Express.js implementieren
  - Erstelle Express.js Server mit TypeScript-Konfiguration
  - Implementiere grundlegende Middleware (CORS, Helmet, Rate Limiting)
  - Richte OpenAPI 3.0 Dokumentation mit Swagger ein
  - Schreibe Unit Tests für Server-Setup
  - _Anforderungen: 1.1, 7.1_

- [x] 1.3 Datenbank-Schema und Migrationen erstellen
  - Implementiere PostgreSQL-Datenbankschema für User, Case, LegalKnowledge Modelle
  - Erstelle Prisma/TypeORM Migrationen für alle Tabellen
  - Richte Redis für Caching und Sessions ein
  - Schreibe Datenbank-Verbindungstests
  - _Anforderungen: 7.4, 9.1_

## 2. Authentication und User Management implementieren

- [x] 2.1 JWT-basierte Authentifizierung entwickeln
  - Implementiere AuthService mit register, login, refreshToken Methoden
  - Erstelle JWT Token-Generierung und -Validierung
  - Implementiere Passwort-Hashing mit bcrypt
  - Schreibe Unit Tests für alle Auth-Funktionen
  - _Anforderungen: 7.1, 7.3_

- [x] 2.2 User Management Service erstellen
  - Implementiere UserService für Profilverwaltung und Präferenzen
  - Erstelle DSGVO-konforme Datenmodelle mit Einwilligungsmanagement
  - Implementiere Nutzertyp-Unterscheidung (tenant/landlord/business)
  - Schreibe Integration Tests für User-CRUD-Operationen
  - _Anforderungen: 1.5, 7.3, 7.4, 7.5_

- [x] 2.3 E-Mail-Verifizierung und Passwort-Reset implementieren
  - Erstelle E-Mail-Service mit Nodemailer
  - Implementiere E-Mail-Verifizierungs-Workflow
  - Erstelle sicheren Passwort-Reset-Mechanismus
  - Schreibe Tests für E-Mail-Funktionalitäten
  - _Anforderungen: 7.1, 7.4_

## 3. Rechtsdatenbank und Knowledge Base entwickeln

- [x] 3.1 Legal Knowledge Service implementieren
  - Erstelle KnowledgeService für Rechtsdaten-Verwaltung
  - Implementiere Elasticsearch-Integration für Volltext-Suche
  - Erstelle Datenmodelle für Gesetze, Urteile und Verordnungen
  - Schreibe Unit Tests für Suchfunktionalitäten
  - _Anforderungen: 2.1, 2.4, 2.5_

- [x] 3.2 Mietspiegel-Integration entwickeln
  - Implementiere MietspiegelService für lokale Mietdaten
  - Erstelle APIs für Mietpreis-Berechnungen nach Standort
  - Implementiere Caching für Mietspiegel-Daten
  - Schreibe Integration Tests für Mietspiegel-Abfragen
  - _Anforderungen: 6.1, 6.4_

- [x] 3.3 Rechtsdaten-Import und -Update-System erstellen
  - Implementiere automatische Datenaktualisierung für Gesetze und Urteile
  - Erstelle Batch-Import für BGB-Paragraphen und Gerichtsentscheidungen
  - Implementiere Versionierung für Rechtsdaten-Updates
  - Schreibe Tests für Datenimport-Prozesse
  - _Anforderungen: 9.1, 9.2, 9.4_

## 4. KI-gestützte Chat-Funktionalität entwickeln

- [x] 4.1 NLP Processing Engine implementieren
  - Integriere OpenAI GPT-4 API für deutsche Rechtstexte
  - Implementiere Intent Recognition für mietrechtliche Anfragen
  - Erstelle Context Extraction für relevante Rechtsfakten
  - Schreibe Unit Tests für NLP-Komponenten mit Mock-Responses
  - _Anforderungen: 4.1, 4.2_

- [x] 4.2 Legal Case Classifier entwickeln
  - Implementiere Klassifizierung für Mietrechts-Kategorien (Mietminderung, Kündigung, etc.)
  - Erstelle Confidence-Bewertung für KI-Antworten
  - Implementiere Eskalations-Logik für komplexe Fälle
  - Schreibe Tests für verschiedene Falltypen und Konfidenz-Level
  - _Anforderungen: 4.1, 4.4, 4.5_

- [x] 4.3 Chat Service mit Conversation Management erstellen
  - Implementiere ChatService für Konversations-Verwaltung
  - Erstelle Message-Handling mit Verlaufsspeicherung
  - Implementiere Real-time Updates mit WebSockets
  - Schreibe Integration Tests für Chat-Flows
  - _Anforderungen: 4.2, 4.3_

- [x] 4.4 AI Response Generation mit Legal References implementieren
  - Erstelle Response-Generator mit Rechtsbezügen (§ 536 BGB, etc.)
  - Implementiere Handlungsempfehlungen basierend auf Falltyp
  - Erstelle Template-Referenzen für Musterbriefe
  - Schreibe Tests für Response-Qualität und Rechtsbezüge
  - _Anforderungen: 2.4, 4.2, 4.3_

## 5. Dokumentenanalyse-System entwickeln

- [x] 5.1 Document Upload und Storage implementieren
  - Erstelle sicheren File-Upload mit Validierung und Virus-Scanning
  - Implementiere MinIO für verschlüsselte Dokumentenspeicherung
  - Erstelle Metadaten-Extraktion für verschiedene Dokumenttypen
  - Schreibe Tests für File-Upload und -Validierung
  - _Anforderungen: 3.1, 7.1, 7.2_

- [x] 5.2 OCR und Text-Extraktion implementieren
  - Integriere OCR-Engine für PDF- und Bild-Dokumente
  - Implementiere strukturierte Datenextraktion für Mietverträge
  - Erstelle Text-Preprocessing für deutsche Rechtsdokumente
  - Schreibe Tests für OCR-Genauigkeit und Datenextraktion
  - _Anforderungen: 3.1, 3.2, 3.3_

- [x] 5.3 Document Analysis Service für Mietdokumente erstellen
  - Implementiere Analyse-Engine für Mietverträge, Nebenkostenabrechnungen, Abmahnungen
  - Erstelle Issue-Detection für häufige Probleme und Rechtsfehler
  - Implementiere Risk-Assessment und Empfehlungs-System
  - Schreibe Tests für verschiedene Dokumenttypen und Problemerkennung
  - _Anforderungen: 3.1, 3.2, 3.3, 3.4, 3.5_

## 6. Template Generation System entwickeln

- [x] 6.1 Template Engine für Musterbriefe implementieren
  - Erstelle Template-System für Mietminderungs- und Widerspruchsschreiben
  - Implementiere dynamische Personalisierung mit Nutzerdaten
  - Erstelle Vorlagen für Fristsetzungen und rechtliche Schreiben
  - Schreibe Tests für Template-Generierung und Personalisierung
  - _Anforderungen: 8.1, 8.2, 8.3, 8.4_

- [x] 6.2 Document Generator mit rechtlichen Anleitungen erstellen
  - Implementiere PDF-Generierung für fertige Musterbriefe
  - Erstelle Anleitungen für ordnungsgemäße Verwendung und Timing
  - Implementiere Vorschau-Funktionalität für generierte Dokumente
  - Schreibe Tests für PDF-Generierung und Anleitung-Integration
  - _Anforderungen: 8.4, 8.5_

## 7. Anwaltsvermittlung-System entwickeln

- [x] 7.1 Lawyer Directory und Matching Service implementieren
  - Erstelle Anwaltsdatenbank mit Spezialisierungen und Standorten
  - Implementiere geografische Suche und Filterung nach Kriterien
  - Erstelle Bewertungs- und Review-System für Anwälte
  - Schreibe Tests für Anwaltssuche und Matching-Algorithmus
  - _Anforderungen: 5.1, 5.2, 5.4, 5.5_

- [x] 7.2 Booking und Consultation Management erstellen
  - Implementiere Terminbuchungs-System mit Kalender-Integration
  - Erstelle Video-Chat-Integration für Online-Beratungen
  - Implementiere sichere Datenübertragung zwischen KI-System und Anwälten
  - Schreibe Tests für Buchungsprozess und Datenübertragung
  - _Anforderungen: 5.1, 5.3_

- [x] 7.3 Payment Integration für Anwaltsgebühren implementieren
  - Integriere Payment Gateway für Beratungsgebühren
  - Implementiere Rechnungsstellung und Zahlungsabwicklung
  - Erstelle Transparenz für Kosten und Gebührenstrukturen
  - Schreibe Tests für Payment-Flows und Fehlerbehandlung
  - _Anforderungen: 5.1, 5.4_

## 8. Web-Frontend entwickeln

- [x] 8.1 React.js Grundstruktur mit TypeScript erstellen
  - Erstelle React-App mit TypeScript und Material-UI
  - Implementiere Redux Toolkit für State Management
  - Richte React Router für Navigation ein
  - Schreibe Component Tests mit React Testing Library
  - _Anforderungen: 1.1, 1.2_

- [x] 8.2 Barrierefreie UI-Komponenten implementieren
  - Erstelle WCAG 2.1 AA-konforme Komponenten mit ARIA-Labels
  - Implementiere Screenreader-Support und Keyboard-Navigation
  - Erstelle mehrsprachige UI mit i18n (Deutsch, Türkisch, Arabisch)
  - Schreibe Accessibility Tests mit axe-core
  - _Anforderungen: 1.4, 1.5_

- [x] 8.3 Chat-Interface mit Real-time Updates entwickeln
  - Implementiere Chat-UI mit WebSocket-Verbindung
  - Erstelle Message-Komponenten mit Typing-Indikatoren
  - Implementiere File-Upload für Dokumente im Chat
  - Schreibe E2E Tests für Chat-Funktionalität
  - _Anforderungen: 4.1, 4.2, 4.3_

- [x] 8.4 Document Upload und Analysis Interface erstellen
  - Implementiere Drag-and-Drop File-Upload mit Progress-Anzeige
  - Erstelle Analyse-Ergebnis-Darstellung mit Issue-Highlighting
  - Implementiere Download-Funktionalität für generierte Dokumente
  - Schreibe Tests für Document-Upload und -Analysis UI
  - _Anforderungen: 3.1, 3.4, 8.4_

- [x] 8.5 Lawyer Search und Booking Interface entwickeln
  - Erstelle Anwaltssuche mit Karten-Integration und Filteroptionen
  - Implementiere Terminbuchungs-Interface mit Kalender-Widget
  - Erstelle Bewertungs- und Review-Interface für Anwälte
  - Schreibe Tests für Lawyer-Matching und Booking-Flow
  - _Anforderungen: 5.1, 5.2, 5.5_

## 9. Mobile App entwickeln

- [x] 9.1 React Native Grundstruktur erstellen
  - Erstelle React Native App für iOS und Android
  - Implementiere Navigation mit React Navigation
  - Richte Redux für Mobile State Management ein
  - Schreibe Mobile-spezifische Tests mit Detox
  - _Anforderungen: 1.1, 1.4_

- [x] 9.2 Mobile Chat und Document Features implementieren
  - Portiere Chat-Funktionalität für Mobile mit optimierter UX
  - Implementiere Kamera-Integration für Dokument-Scanning
  - Erstelle Push-Notifications für Chat-Updates
  - Schreibe Tests für Mobile-spezifische Features
  - _Anforderungen: 1.1, 3.1, 4.1_

## 10. B2B API und Business Features entwickeln

- [x] 10.1 B2B API Gateway und Authentication implementieren
  - Erstelle separate API-Endpunkte für Business-Kunden
  - Implementiere API-Key-basierte Authentifizierung für B2B
  - Erstelle Rate Limiting und Quota Management für Business-Accounts
  - Schreibe API-Dokumentation und Tests für B2B-Endpunkte
  - _Anforderungen: 10.1, 10.5_

- [x] 10.2 Bulk Processing und Batch Analysis erstellen
  - Implementiere Massenabfrage-Verarbeitung für mehrere Dokumente
  - Erstelle Batch-Dokumentenanalyse mit Progress-Tracking
  - Implementiere Reporting und Analytics für Business-Kunden
  - Schreibe Performance Tests für Bulk-Operations
  - _Anforderungen: 10.1, 10.2, 10.4_

## 11. Sicherheit und DSGVO-Compliance implementieren

- [ ] 11.1 Ende-zu-Ende-Verschlüsselung und Key Management System implementieren
  
- [x] 11.1.1 Datenbank-Schema für KMS erstellen
  - Erweitere Prisma Schema mit EncryptionKey, RotationSchedule, KeyAuditLog und MasterKeyConfig Models
  - Erstelle Indizes für Performance-Optimierung (tenant_id, status, expires_at)
  - Generiere und teste Prisma Migration
  - _Anforderungen: 7.1, 7.2_

- [x] 11.1.2 Master Key Manager implementieren
  - Implementiere MasterKeyManager mit getMasterKey(), validateMasterKey() und rotateMasterKey()
  - Lade Master Key aus Umgebungsvariable mit Validierung
  - Füge Fehlerbehandlung für fehlenden Master Key hinzu
  - _Anforderungen: 7.1, 7.2_

- [x] 11.1.3 Key Storage Layer implementieren
  - Implementiere KeyStorage Service mit saveKey(), getKey(), updateKeyStatus(), listKeys() und deleteKey()
  - Füge Tenant-Isolation auf Datenbankebene hinzu
  - Implementiere Envelope Encryption (Master Key verschlüsselt DEKs)
  - _Anforderungen: 7.1, 7.2_

- [x] 11.1.4 Key Cache Manager mit Redis implementieren
  - Implementiere KeyCacheManager mit cacheKey(), getCachedKey(), invalidateKey() und getCacheStats()
  - Konfiguriere LRU-Eviction mit 5-Minuten TTL
  - Füge Cache-Hit-Rate-Tracking hinzu
  - _Anforderungen: 7.1, 7.2_

- [x] 11.1.5 Audit Logger für Compliance implementieren
  - Implementiere AuditLogger mit logKeyCreation(), logKeyAccess(), logKeyRotation() und logSecurityEvent()
  - Füge HMAC-Signierung für alle Audit-Log-Einträge hinzu
  - Implementiere queryAuditLog() mit Filteroptionen und HMAC-Verifikation
  - _Anforderungen: 7.1, 7.4_

- [x] 11.1.6 Key Rotation Manager implementieren
  - Implementiere KeyRotationManager mit rotateKey(), scheduleRotation() und checkAndRotateExpiredKeys()
  - Erstelle Cron-Job für automatische Rotation nach konfigurierbarem Intervall
  - Implementiere reEncryptData() für Daten-Re-Encryption bei Rotation
  - _Anforderungen: 7.1, 7.2_

- [x] 11.1.7 KeyManagementService Hauptservice implementieren
  - Implementiere createKey() mit Envelope Encryption und Tenant-Isolation
  - Implementiere getKey() mit Cache-Integration und Berechtigungsprüfung
  - Implementiere Lebenszyklus-Methoden: activateKey(), deactivateKey(), markKeyCompromised(), deleteKey()
  - Implementiere Backup/Recovery: exportKeys() und importKeys()
  - Integriere alle Sub-Services (MasterKeyManager, KeyStorage, KeyCache, AuditLogger, RotationManager)
  - _Anforderungen: 7.1, 7.2, 7.4_

- [x] 11.1.8 EncryptionService mit KMS integrieren
  - Füge KeyManagementService als Dependency zu EncryptionService hinzu
  - Implementiere encryptWithKMS() und decryptWithKMS() Methoden
  - Erweitere bestehende Methoden (encryptObject, encryptFile) für optionale KMS-Integration
  - Füge Key-Referenzen (keyId, keyVersion) zu EncryptionResult hinzu
  - Behalte Backward-Compatibility für bestehende Verschlüsselungen
  - _Anforderungen: 7.1, 7.2_

- [x] 11.1.9 Service-Integration für verschlüsselte Daten
  - Integriere KMS in DocumentStorageService für Dokument-Verschlüsselung
  - _Anforderungen: 4.1, 4.2, 4.4, 4.5_

## 13. Deployment und Infrastructure

- [x] 13.1 Docker-Container und Kubernetes-Deployment erstellen
  - Erstelle Dockerfiles für alle Services
  - Implementiere Kubernetes-Manifeste für Production-Deployment
  - Richte CI/CD Pipeline mit GitHub Actions ein
  - Schreibe Infrastructure-as-Code mit Terraform
  - _Anforderungen: 7.1, 9.5_

- [x] 13.2 Monitoring und Observability implementieren
  - Implementiere Prometheus Metriken für alle Services
  - Erstelle Grafana Dashboards für System-Monitoring
  - Richte ELK Stack für Centralized Logging ein
  - Implementiere Health Checks und Alerting
  - _Anforderungen: 9.5_

## 14. Integration und System Testing

- [ ] 14.1 End-to-End Integration Tests implementieren
  - Erstelle vollständige User Journey Tests von Registration bis Anwalts-Vermittlung
  - Implementiere Cross-Service Integration Tests
  - Erstelle Load Tests für erwartete Nutzerlasten
  - Schreibe Disaster Recovery Tests
  - _Anforderungen: Alle_

- [ ] 14.2 User Acceptance Testing vorbereiten
  - Erstelle Test-Szenarien für verschiedene Nutzertypen
## 6. Template Generation System entwickeln

- [x] 6.1 Template Engine für Musterbriefe implementieren
  - Erstelle Template-System für Mietminderungs- und Widerspruchsschreiben
  - Implementiere dynamische Personalisierung mit Nutzerdaten
  - Erstelle Vorlagen für Fristsetzungen und rechtliche Schreiben
  - Schreibe Tests für Template-Generierung und Personalisierung
  - _Anforderungen: 8.1, 8.2, 8.3, 8.4_

- [x] 6.2 Document Generator mit rechtlichen Anleitungen erstellen
  - Implementiere PDF-Generierung für fertige Musterbriefe
  - Erstelle Anleitungen für ordnungsgemäße Verwendung und Timing
  - Implementiere Vorschau-Funktionalität für generierte Dokumente
  - Schreibe Tests für PDF-Generierung und Anleitung-Integration
  - _Anforderungen: 8.4, 8.5_

## 7. Anwaltsvermittlung-System entwickeln

- [x] 7.1 Lawyer Directory und Matching Service implementieren
  - Erstelle Anwaltsdatenbank mit Spezialisierungen und Standorten
  - Implementiere geografische Suche und Filterung nach Kriterien
  - Erstelle Bewertungs- und Review-System für Anwälte
  - Schreibe Tests für Anwaltssuche und Matching-Algorithmus
  - _Anforderungen: 5.1, 5.2, 5.4, 5.5_

- [x] 7.2 Booking und Consultation Management erstellen
  - Implementiere Terminbuchungs-System mit Kalender-Integration
  - Erstelle Video-Chat-Integration für Online-Beratungen
  - Implementiere sichere Datenübertragung zwischen KI-System und Anwälten
  - Schreibe Tests für Buchungsprozess und Datenübertragung
  - _Anforderungen: 5.1, 5.3_

- [x] 7.3 Payment Integration für Anwaltsgebühren implementieren
  - Integriere Payment Gateway für Beratungsgebühren
  - Implementiere Rechnungsstellung und Zahlungsabwicklung
  - Erstelle Transparenz für Kosten und Gebührenstrukturen
  - Schreibe Tests für Payment-Flows und Fehlerbehandlung
  - _Anforderungen: 5.1, 5.4_

## 8. Web-Frontend entwickeln

- [x] 8.1 React.js Grundstruktur mit TypeScript erstellen
  - Erstelle React-App mit TypeScript und Material-UI
  - Implementiere Redux Toolkit für State Management
  - Richte React Router für Navigation ein
  - Schreibe Component Tests mit React Testing Library
  - _Anforderungen: 1.1, 1.2_

- [x] 8.2 Barrierefreie UI-Komponenten implementieren
  - Erstelle WCAG 2.1 AA-konforme Komponenten mit ARIA-Labels
  - Implementiere Screenreader-Support und Keyboard-Navigation
  - Erstelle mehrsprachige UI mit i18n (Deutsch, Türkisch, Arabisch)
  - Schreibe Accessibility Tests mit axe-core
  - _Anforderungen: 1.4, 1.5_

- [x] 8.3 Chat-Interface mit Real-time Updates entwickeln
  - Implementiere Chat-UI mit WebSocket-Verbindung
  - Erstelle Message-Komponenten mit Typing-Indikatoren
  - Implementiere File-Upload für Dokumente im Chat
  - Schreibe E2E Tests für Chat-Funktionalität
  - _Anforderungen: 4.1, 4.2, 4.3_

- [x] 8.4 Document Upload und Analysis Interface erstellen
  - Implementiere Drag-and-Drop File-Upload mit Progress-Anzeige
  - Erstelle Analyse-Ergebnis-Darstellung mit Issue-Highlighting
  - Implementiere Download-Funktionalität für generierte Dokumente
  - Schreibe Tests für Document-Upload und -Analysis UI
  - _Anforderungen: 3.1, 3.4, 8.4_

- [x] 8.5 Lawyer Search und Booking Interface entwickeln
  - Erstelle Anwaltssuche mit Karten-Integration und Filteroptionen
  - Implementiere Terminbuchungs-Interface mit Kalender-Widget
  - Erstelle Bewertungs- und Review-Interface für Anwälte
  - Schreibe Tests für Lawyer-Matching und Booking-Flow
  - _Anforderungen: 5.1, 5.2, 5.5_

## 9. Mobile App entwickeln

- [x] 9.1 React Native Grundstruktur erstellen
  - Erstelle React Native App für iOS und Android
  - Implementiere Navigation mit React Navigation
  - Richte Redux für Mobile State Management ein
  - Schreibe Mobile-spezifische Tests mit Detox
  - _Anforderungen: 1.1, 1.4_

- [x] 9.2 Mobile Chat und Document Features implementieren
  - Portiere Chat-Funktionalität für Mobile mit optimierter UX
  - Implementiere Kamera-Integration für Dokument-Scanning
  - Erstelle Push-Notifications für Chat-Updates
  - Schreibe Tests für Mobile-spezifische Features
  - _Anforderungen: 1.1, 3.1, 4.1_

## 10. B2B API und Business Features entwickeln

- [x] 10.1 B2B API Gateway und Authentication implementieren
  - Erstelle separate API-Endpunkte für Business-Kunden
  - Implementiere API-Key-basierte Authentifizierung für B2B
  - Erstelle Rate Limiting und Quota Management für Business-Accounts
  - Schreibe API-Dokumentation und Tests für B2B-Endpunkte
  - _Anforderungen: 10.1, 10.5_

- [x] 10.2 Bulk Processing und Batch Analysis erstellen
  - Implementiere Massenabfrage-Verarbeitung für mehrere Dokumente
  - Erstelle Batch-Dokumentenanalyse mit Progress-Tracking
  - Implementiere Reporting und Analytics für Business-Kunden
  - Schreibe Performance Tests für Bulk-Operations
  - _Anforderungen: 10.1, 10.2, 10.4_

## 11. Sicherheit und DSGVO-Compliance implementieren

- [ ] 11.1 Ende-zu-Ende-Verschlüsselung und Key Management System implementieren
  
- [x] 11.1.1 Datenbank-Schema für KMS erstellen
  - Erweitere Prisma Schema mit EncryptionKey, RotationSchedule, KeyAuditLog und MasterKeyConfig Models
  - Erstelle Indizes für Performance-Optimierung (tenant_id, status, expires_at)
  - Generiere und teste Prisma Migration
  - _Anforderungen: 7.1, 7.2_

- [x] 11.1.2 Master Key Manager implementieren
  - Implementiere MasterKeyManager mit getMasterKey(), validateMasterKey() und rotateMasterKey()
  - Lade Master Key aus Umgebungsvariable mit Validierung
  - Füge Fehlerbehandlung für fehlenden Master Key hinzu
  - _Anforderungen: 7.1, 7.2_

- [x] 11.1.3 Key Storage Layer implementieren
  - Implementiere KeyStorage Service mit saveKey(), getKey(), updateKeyStatus(), listKeys() und deleteKey()
  - Füge Tenant-Isolation auf Datenbankebene hinzu
  - Implementiere Envelope Encryption (Master Key verschlüsselt DEKs)
  - _Anforderungen: 7.1, 7.2_

- [x] 11.1.4 Key Cache Manager mit Redis implementieren
  - Implementiere KeyCacheManager mit cacheKey(), getCachedKey(), invalidateKey() und getCacheStats()
  - Konfiguriere LRU-Eviction mit 5-Minuten TTL
  - Füge Cache-Hit-Rate-Tracking hinzu
  - _Anforderungen: 7.1, 7.2_

- [x] 11.1.5 Audit Logger für Compliance implementieren
  - Implementiere AuditLogger mit logKeyCreation(), logKeyAccess(), logKeyRotation() und logSecurityEvent()
  - Füge HMAC-Signierung für alle Audit-Log-Einträge hinzu
  - Implementiere queryAuditLog() mit Filteroptionen und HMAC-Verifikation
  - _Anforderungen: 7.1, 7.4_

- [x] 11.1.6 Key Rotation Manager implementieren
  - Implementiere KeyRotationManager mit rotateKey(), scheduleRotation() und checkAndRotateExpiredKeys()
  - Erstelle Cron-Job für automatische Rotation nach konfigurierbarem Intervall
  - Implementiere reEncryptData() für Daten-Re-Encryption bei Rotation
  - _Anforderungen: 7.1, 7.2_

- [x] 11.1.7 KeyManagementService Hauptservice implementieren
  - Implementiere createKey() mit Envelope Encryption und Tenant-Isolation
  - Implementiere getKey() mit Cache-Integration und Berechtigungsprüfung
  - Implementiere Lebenszyklus-Methoden: activateKey(), deactivateKey(), markKeyCompromised(), deleteKey()
  - Implementiere Backup/Recovery: exportKeys() und importKeys()
  - Integriere alle Sub-Services (MasterKeyManager, KeyStorage, KeyCache, AuditLogger, RotationManager)
  - _Anforderungen: 7.1, 7.2, 7.4_

- [x] 11.1.8 EncryptionService mit KMS integrieren
  - Füge KeyManagementService als Dependency zu EncryptionService hinzu
  - Implementiere encryptWithKMS() und decryptWithKMS() Methoden
  - Erweitere bestehende Methoden (encryptObject, encryptFile) für optionale KMS-Integration
  - Füge Key-Referenzen (keyId, keyVersion) zu EncryptionResult hinzu
  - Behalte Backward-Compatibility für bestehende Verschlüsselungen
  - _Anforderungen: 7.1, 7.2_

- [x] 11.1.9 Service-Integration für verschlüsselte Daten
  - Integriere KMS in DocumentStorageService für Dokument-Verschlüsselung
  - _Anforderungen: 4.1, 4.2, 4.4, 4.5_

## 13. Deployment und Infrastructure

- [ ] 13.1 Docker-Container und Kubernetes-Deployment erstellen
  - Erstelle Dockerfiles für alle Services
  - Implementiere Kubernetes-Manifeste für Production-Deployment
  - Richte CI/CD Pipeline mit GitHub Actions ein
  - Schreibe Infrastructure-as-Code mit Terraform
  - _Anforderungen: 7.1, 9.5_

- [ ] 13.2 Monitoring und Observability implementieren
  - Implementiere Prometheus Metriken für alle Services
  - Erstelle Grafana Dashboards für System-Monitoring
  - Richte ELK Stack für Centralized Logging ein
  - Implementiere Health Checks und Alerting
  - _Anforderungen: 9.5_

## 14. Integration und System Testing

- [ ] 14.1 End-to-End Integration Tests implementieren
  - Erstelle vollständige User Journey Tests von Registration bis Anwalts-Vermittlung
  - Implementiere Cross-Service Integration Tests
  - Erstelle Load Tests für erwartete Nutzerlasten
  - Schreibe Disaster Recovery Tests
  - _Anforderungen: Alle_

- [ ] 14.2 User Acceptance Testing vorbereiten
  - Erstelle Test-Szenarien für verschiedene Nutzertypen
  - Implementiere Feedback-Collection System für Beta-Tests
  - Erstelle Performance Benchmarks und SLA-Monitoring
  - Schreibe Dokumentation für System-Administration
  - _Anforderungen: Alle_

## Phase 4: Optimierung & Hardening

- [x] Task 15: Optimierung & Hardening
    - [x] 15.1: Refactoring AIResponseGenerator (Config Auslagerung)
    - [x] 15.2: Abarbeitung kritischer TODOs (GDPR, Analytics, Security)
    - [x] 15.3: Performance Optimierung (Caching, Database Indexing)
    - [x] 15.4: Code Cleanup (tsconfig, dead code)