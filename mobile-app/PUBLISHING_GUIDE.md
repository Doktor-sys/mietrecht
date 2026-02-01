# SmartLaw Mietrecht - Mobile App Publishing Guide

## Voraussetzungen

Bevor Sie die App veröffentlichen, stellen Sie sicher, dass folgende Voraussetzungen erfüllt sind:

1. **Expo Account**: Erstellen Sie einen Expo-Account unter https://expo.dev/
2. **Apple Developer Account**: Für iOS-Veröffentlichung benötigen Sie einen Apple Developer Account
3. **Google Play Developer Account**: Für Android-Veröffentlichung benötigen Sie einen Google Play Developer Account
4. **EAS CLI**: Installiert mit `npm install -g eas-cli`

## Projekt-Setup

1. **Dependencies installieren**:
   ```bash
   npm install
   ```

2. **EAS-Projekt konfigurieren**:
   - Melden Sie sich bei Ihrem Expo-Account an:
     ```bash
     eas login
     ```
   - Erstellen Sie ein neues EAS-Projekt:
     ```bash
     eas init
     ```
   - Dies wird Ihre `app.json` automatisch mit der korrekten `projectId` aktualisieren. Falls nicht, tragen Sie diese manuell unter `extra.eas.projectId` ein.

## App-Build

### Entwicklungsversion

Für interne Tests:
```bash
eas build --profile development --platform android
eas build --profile development --platform ios
```

### Vorschauversion

Für Tests vor der Veröffentlichung:
```bash
eas build --profile preview --platform android
eas build --profile preview --platform ios
```

### Produktionsversion

Für die Veröffentlichung im App Store/Google Play:
```bash
eas build --profile production --platform android
eas build --profile production --platform ios
```

## App Store Connect (iOS)

### 1. App erstellen
1. Melden Sie sich bei App Store Connect an
2. Klicken Sie auf "Meine Apps"
3. Klicken Sie auf das "+"-Symbol und wählen Sie "Neue App"
4. Füllen Sie die erforderlichen Informationen aus:
   - Plattform: iOS
   - Name: SmartLaw Mietrecht
   - Primäre Sprache: Deutsch
   - Bundle-ID: com.smartlaw.mietrecht
   - SKU: SMARTLAW-MIETRECHT-001
   - Benutzerzugriff: Wählen Sie die entsprechenden Benutzer aus

### 2. App-Informationen
Füllen Sie die folgenden Abschnitte aus:
- App-Bewertung
- Preis und Verfügbarkeit
- App-Informationen
  - Beschreibung
  - Keywords: mietrecht, recht, juristisch, mieter, vermieter
  - Unterstützte Sprachen: Deutsch
  - Datenschutzrichtlinie: https://smartlaw.de/privacy
- App Review Informationen
  - Kontaktdaten
  - Demo-Kontoinformationen (falls erforderlich)

### 3. Screenshots und Vorschaubilder
Laden Sie die erforderlichen Screenshots hoch:
- iPhone 6.7" Display (1290 x 2796)
- iPhone 5.5" Display (1242 x 2208)
- iPad Pro (12.9") (2048 x 2732)

### 4. Build hochladen
1. Laden Sie den Build von Expo herunter
2. Verwenden Sie Transporter oder Xcode Organizer, um den Build hochzuladen
3. Warten Sie auf die Verarbeitung durch App Store Connect

## Google Play Console (Android)

### 1. App erstellen
1. Melden Sie sich bei der Google Play Console an
2. Klicken Sie auf "App erstellen"
3. Füllen Sie die erforderlichen Informationen aus:
   - Titel: SmartLaw Mietrecht
   - Standardsprache: Deutsch
   - App oder Spiel: App
   - Kostenlos oder kostenpflichtig: Kostenlos
   - Paketname: com.smartlaw.mietrecht
   - SHA1-Zertifikat-Fingerabdruck: Wird nach dem ersten Upload bereitgestellt

### 2. Store-Eintrag
Füllen Sie die folgenden Abschnitte aus:
- Dashboard
- App-Integrität
- App-Inhalte
- Zielgruppe und Inhalte
- Datenschutz und Sicherheit
- Werbung
- Hauptkategorie: Produktivität
- App-Typ: Anwendung

### 3. Store-Präsenz
- Kurzbeschreibung: Rechtliche Unterstützung für Mieter und Vermieter
- Vollständige Beschreibung: Detaillierte Beschreibung der App-Funktionen
- Grafiken:
  - App-Icon (512 x 512)
  - Screenshots
  - Promografiken
- Videos (optional)

### 4. Content-Rating
Füllen Sie den Content-Rating-Fragebogen aus

### 5. Kontaktangaben
- E-Mail-Adresse
- Website: https://smartlaw.de
- Datenschutzrichtlinie: https://smartlaw.de/privacy

### 6. APK hochladen
1. Erstellen Sie eine neue Version
2. Laden Sie die APK-Datei hoch
3. Füllen Sie die Versionsinformationen aus
4. Überprüfen und veröffentlichen Sie

## Sicherheitsüberlegungen

### 1. API-Schlüssel
- Stellen Sie sicher, dass alle API-Schlüssel in Umgebungsvariablen gespeichert sind
- Verwenden Sie keine fest codierten Schlüssel in der App

### 2. Datenverschlüsselung
- Alle sensiblen Daten sollten verschlüsselt übertragen werden
- Verwenden Sie HTTPS für alle API-Anfragen

### 3. Authentifizierung
- Implementieren Sie sichere Token-Verwaltung
- Verwenden Sie Refresh Tokens für langfristige Sitzungen

## Testing vor der Veröffentlichung

### 1. Funktionstests
- Testen Sie alle Hauptfunktionen der App
- Überprüfen Sie die Benutzeroberfläche auf verschiedenen Geräten
- Testen Sie die App auf verschiedenen Betriebssystemversionen

### 2. Leistungstests
- Überprüfen Sie die App-Leistung
- Testen Sie den Speicherverbrauch
- Überprüfen Sie die Batterienutzung

### 3. Sicherheitstests
- Führen Sie Sicherheitsprüfungen durch
- Überprüfen Sie die Datenverschlüsselung
- Testen Sie die Authentifizierung

## Nach der Veröffentlichung

### 1. Monitoring
- Überwachen Sie die App-Performance
- Verfolgen Sie Absturzberichte
- Überprüfen Sie Benutzerbewertungen

### 2. Updates
- Planen Sie regelmäßige Updates
- Beheben Sie Fehler schnell
- Fügen Sie neue Funktionen hinzu

### 3. Marketing
- Bewerben Sie die App in relevanten Kanälen
- Sammeln Sie Benutzerfeedback
- Verbessern Sie die App-Beschreibung und Screenshots basierend auf dem Feedback

## Fehlerbehebung

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

## Kontakt

Für Support bei der Veröffentlichung wenden Sie sich an:
- E-Mail: support@smartlaw.de
- Website: https://smartlaw.de