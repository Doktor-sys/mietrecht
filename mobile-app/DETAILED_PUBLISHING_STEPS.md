# Detaillierte Schritte für die Mobile App Publication

## 1. Vorbereitung

### 1.1. Expo Account erstellen
1. Besuchen Sie https://expo.dev/signup
2. Erstellen Sie ein neues Konto mit einer gültigen E-Mail-Adresse
3. Bestätigen Sie Ihre E-Mail-Adresse

### 1.2. Apple Developer Account (für iOS)
1. Besuchen Sie https://developer.apple.com/
2. Melden Sie sich mit Ihrer Apple-ID an oder erstellen Sie eine neue
3. Zahlen Sie die jährliche Gebühr von 99 USD

### 1.3. Google Play Developer Account (für Android)
1. Besuchen Sie https://play.google.com/console/
2. Melden Sie sich mit Ihrem Google-Konto an
3. Zahlen Sie die einmalige Registrierungsgebühr von 25 USD

## 2. Projekt-Setup

### 2.1. Anmelden bei Expo
```bash
eas login
```
Geben Sie Ihre Expo-Anmeldeinformationen ein, wenn Sie dazu aufgefordert werden.

### 2.2. Projekt initialisieren
```bash
eas init
```
Folgen Sie den Anweisungen:
1. Wählen Sie "Create a new project"
2. Geben Sie einen Projektnamen ein (z.B. "SmartLaw Mietrecht")
3. Notieren Sie sich die Projekt-ID, die generiert wird

### 2.3. Projekt-ID in app.json aktualisieren
Öffnen Sie die `app.json`-Datei und ersetzen Sie `"your-eas-project-id"` mit der tatsächlichen Projekt-ID.

## 3. App-Build

### 3.1. Entwicklungsversion
Für interne Tests:
```bash
eas build --profile development --platform android
eas build --profile development --platform ios
```

### 3.2. Vorschauversion
Für Tests vor der Veröffentlichung:
```bash
eas build --profile preview --platform android
eas build --profile preview --platform ios
```

### 3.3. Produktionsversion
Für die Veröffentlichung im App Store/Google Play:
```bash
eas build --profile production --platform android
eas build --profile production --platform ios
```

## 4. App Store Connect (iOS)

### 4.1. App erstellen
1. Melden Sie sich bei App Store Connect an (https://appstoreconnect.apple.com/)
2. Klicken Sie auf "Meine Apps"
3. Klicken Sie auf das "+"-Symbol und wählen Sie "Neue App"
4. Füllen Sie die erforderlichen Informationen aus:
   - Plattform: iOS
   - Name: SmartLaw Mietrecht
   - Primäre Sprache: Deutsch
   - Bundle-ID: com.smartlaw.mietrecht
   - SKU: SMARTLAW-MIETRECHT-001
   - Benutzerzugriff: Wählen Sie die entsprechenden Benutzer aus

### 4.2. App-Informationen
Füllen Sie die folgenden Abschnitte aus:
- App-Bewertung
- Preis und Verfügbarkeit
- App-Informationen
  - Beschreibung: "SmartLaw Mietrecht ist eine innovative mobile App, die Mieter und Vermieter mit KI-gestützter Rechtsberatung, Dokumentenanalyse und Anwaltvermittlung unterstützt. Die App bietet sofortige Hilfe bei allen Mietrechtsfragen und ermöglicht es Nutzern, rechtliche Probleme schnell und effizient zu lösen."
  - Keywords: mietrecht, recht, juristisch, mieter, vermieter, rechtsberatung, ki, dokumente, anwalt
  - Unterstützte Sprachen: Deutsch
  - Datenschutzrichtlinie: https://smartlaw.de/privacy
- App Review Informationen
  - Kontaktdaten
  - Demo-Kontoinformationen (falls erforderlich)

### 4.3. Screenshots und Vorschaubilder
Laden Sie die erforderlichen Screenshots hoch:
- iPhone 6.7" Display (1290 x 2796)
- iPhone 5.5" Display (1242 x 2208)
- iPad Pro (12.9") (2048 x 2732)

### 4.4. Build hochladen
1. Laden Sie den Build von Expo herunter
2. Verwenden Sie Transporter oder Xcode Organizer, um den Build hochzuladen
3. Warten Sie auf die Verarbeitung durch App Store Connect

## 5. Google Play Console (Android)

### 5.1. App erstellen
1. Melden Sie sich bei der Google Play Console an (https://play.google.com/console/)
2. Klicken Sie auf "App erstellen"
3. Füllen Sie die erforderlichen Informationen aus:
   - Titel: SmartLaw Mietrecht
   - Standardsprache: Deutsch
   - App oder Spiel: App
   - Kostenlos oder kostenpflichtig: Kostenlos
   - Paketname: com.smartlaw.mietrecht
   - SHA1-Zertifikat-Fingerabdruck: Wird nach dem ersten Upload bereitgestellt

### 5.2. Store-Eintrag
Füllen Sie die folgenden Abschnitte aus:
- Dashboard
- App-Integrität
- App-Inhalte
- Zielgruppe und Inhalte
- Datenschutz und Sicherheit
- Werbung
- Hauptkategorie: Produktivität
- App-Typ: Anwendung

### 5.3. Store-Präsenz
- Kurzbeschreibung: "Rechtliche Unterstützung für Mieter und Vermieter mit KI-gestützter Beratung"
- Vollständige Beschreibung: "SmartLaw Mietrecht ist eine innovative mobile App, die Mieter und Vermieter mit KI-gestützter Rechtsberatung, Dokumentenanalyse und Anwaltvermittlung unterstützt. Die App bietet sofortige Hilfe bei allen Mietrechtsfragen und ermöglicht es Nutzern, rechtliche Probleme schnell und effizient zu lösen.

Hauptfunktionen:
- KI-gestützte Rechtsberatung für alle Mietrechtsfragen
- Dokumentenanalyse mit Kamera-Scanning
- Anwaltvermittlung bei komplexen Fällen
- Chat-Funktionalität mit Echtzeit-Updates
- Umfassende Wissensdatenbank zu Mietrechtsthemen

Perfekt für Mieter, die Hilfe bei Mängeln, Mietminderung oder Kündigungen benötigen, sowie für Vermieter, die rechtliche Unterstützung bei Mieterhöhungen, Modernisierungen oder Verträgen suchen."
- Grafiken:
  - App-Icon (512 x 512)
  - Screenshots
  - Promografiken
- Videos (optional)

### 5.4. Content-Rating
Füllen Sie den Content-Rating-Fragebogen aus

### 5.5. Kontaktangaben
- E-Mail-Adresse: support@smartlaw.de
- Website: https://smartlaw.de
- Datenschutzrichtlinie: https://smartlaw.de/privacy

### 5.6. APK hochladen
1. Erstellen Sie eine neue Version
2. Laden Sie die APK-Datei hoch
3. Füllen Sie die Versionsinformationen aus
4. Überprüfen und veröffentlichen Sie

## 6. Sicherheitsüberlegungen

### 6.1. API-Schlüssel
- Stellen Sie sicher, dass alle API-Schlüssel in Umgebungsvariablen gespeichert sind
- Verwenden Sie keine fest codierten Schlüssel in der App

### 6.2. Datenverschlüsselung
- Alle sensiblen Daten sollten verschlüsselt übertragen werden
- Verwenden Sie HTTPS für alle API-Anfragen

### 6.3. Authentifizierung
- Implementieren Sie sichere Token-Verwaltung
- Verwenden Sie Refresh Tokens für langfristige Sitzungen

## 7. Testing vor der Veröffentlichung

### 7.1. Funktionstests
- Testen Sie alle Hauptfunktionen der App
- Überprüfen Sie die Benutzeroberfläche auf verschiedenen Geräten
- Testen Sie die App auf verschiedenen Betriebssystemversionen

### 7.2. Leistungstests
- Überprüfen Sie die App-Leistung
- Testen Sie den Speicherverbrauch
- Überprüfen Sie die Batterienutzung

### 7.3. Sicherheitstests
- Führen Sie Sicherheitsprüfungen durch
- Überprüfen Sie die Datenverschlüsselung
- Testen Sie die Authentifizierung

## 8. Nach der Veröffentlichung

### 8.1. Monitoring
- Überwachen Sie die App-Performance
- Verfolgen Sie Absturzberichte
- Überprüfen Sie Benutzerbewertungen

### 8.2. Updates
- Planen Sie regelmäßige Updates
- Beheben Sie Fehler schnell
- Fügen Sie neue Funktionen hinzu

### 8.3. Marketing
- Bewerben Sie die App in relevanten Kanälen
- Sammeln Sie Benutzerfeedback
- Verbessern Sie die App-Beschreibung und Screenshots basierend auf dem Feedback

## 9. Fehlerbehebung

### Häufige Probleme

1. **Build-Fehler**:
   - Überprüfen Sie die Build-Logs
   - Stellen Sie sicher, dass alle Abhängigkeiten korrekt sind
   - Überprüfen Sie die Konfigurationsdateien

2. **App Store Rejects**:
   - Lesen Sie die Ablehnungsgründe sorgfältig
   - Beheben Sie die identifizierten Probleme
   - Senden Sie die App erneut zur Überprüfung

3. **Performance-Probleme**:
   - Verwenden Sie Profiling-Tools
   - Optimieren Sie Bilder und Ressourcen
   - Reduzieren Sie die Anzahl der Abhängigkeiten

## 10. Kontakt

Für Support bei der Veröffentlichung wenden Sie sich an:
- E-Mail: support@smartlaw.de
- Website: https://smartlaw.de