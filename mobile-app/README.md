# SmartLaw Mietrecht Mobile App

## Übersicht

Die SmartLaw Mietrecht Mobile App ist eine umfassende Lösung für Mieter und Vermieter, die sofortige Hilfe bei allen Mietrechtsfragen bietet. Die App ermöglicht es Nutzern, rechtliche Probleme schnell und effizient zu lösen.

## Funktionen

### 1. KI-gestützte Rechtsberatung
- Interaktiver Chat mit KI-Assistenten für Mietrechtsfragen
- Sofortige Antworten auf rechtliche Probleme
- Personalisierte Empfehlungen basierend auf Fallhistorie

### 2. Dokumentenmanagement
- Upload und Speicherung von Mietverträgen und Nebenkostenabrechnungen
- Automatische Analyse von Dokumenten
- Versionskontrolle für rechtliche Dokumente

### 3. Anwaltsvermittlung
- Suche nach spezialisierten Mietrechtsanwälten
- Bewertungssystem für Anwälte
- Direkte Terminvereinbarung

### 4. Offline-Funktionalität
- Nutzung der App ohne Internetverbindung
- Speicherung von Nachrichten, Dokumenten und Suchergebnissen lokal
- Automatische Synchronisation bei Wiederherstellung der Verbindung
- Fortsetzung von Unterhaltungen und Aufgaben im Offline-Modus

## Technologie-Stack

### Frontend
- **Framework**: React Native mit Expo
- **State Management**: Redux Toolkit
- **UI Library**: React Native Paper
- **Navigation**: React Navigation
- **Offline Storage**: AsyncStorage
- **Netzwerküberwachung**: NetInfo

### Backend Integration
- **API Client**: Axios
- **Authentifizierung**: JWT mit SecureStore
- **Benachrichtigungen**: Expo Notifications

## Installation

### Voraussetzungen
- Node.js (Version 16 oder höher)
- npm oder yarn
- Expo CLI
- Android Studio oder Xcode für Emulatoren (optional)

### Setup
```bash
# Repository klonen
git clone <repository-url>

# In das mobile-app Verzeichnis wechseln
cd mobile-app

# Abhängigkeiten installieren
npm install

# Entwicklungsserver starten
npm start
```

## Entwicklung

### Verfügbare Scripts
- `npm start` - Startet den Expo Entwicklungsserver
- `npm run android` - Startet die App auf Android
- `npm run ios` - Startet die App auf iOS
- `npm run web` - Startet die Web-Version
- `npm test` - Führt Tests aus
- `npm run lint` - Führt ESLint aus
- `npm run build:android` - Erstellt einen Android Build
- `npm run build:ios` - Erstellt einen iOS Build

### Ordnerstruktur
```
src/
  components/     # Wiederverwendbare UI-Komponenten
  i18n/           # Internationalisierung
  navigation/     # Navigationsstruktur
  screens/        # Bildschirmkomponenten
  services/       # API und Business-Logik
  store/          # Redux Store und Slices
```

## Offline-Funktionalität

Die App bietet umfassende Offline-Fähigkeiten:

### Chat-Nachrichten
- Senden von Nachrichten auch ohne Internet
- Lokale Speicherung von Konversationen
- Automatische Synchronisation bei Wiederherstellung der Verbindung

### Dokumente
- Auswahl und Speicherung von Dokumenten im Offline-Modus
- Lokale Zwischenspeicherung von Dokument-Metadaten
- Später Upload bei Internetverbindung

### Anwaltssuche
- Zwischenspeicherung von Suchergebnissen
- Offline-Zugriff auf zuvor gesuchte Anwälte
- Automatische Aktualisierung bei Verbindung

## Sicherheit

### Datenverschlüsselung
- Sichere Speicherung von Authentifizierungstokens
- Verschlüsselung sensibler Benutzerdaten
- TLS-gesicherte API-Kommunikation

### Authentifizierung
- JWT-basierte Authentifizierung
- Sichere Token-Speicherung mit Expo SecureStore
- Automatische Abmeldung bei Inaktivität

## Tests

### Unit Tests
```bash
npm test
```

### End-to-End Tests
```bash
npm run e2e:test
```

## Bereitstellung

### Android
```bash
npm run build:android
```

### iOS
```bash
npm run build:ios
```

## Fehlerbehebung

### Häufige Probleme
1. **Weißer Bildschirm beim Start**: Entwicklungsserver neu starten
2. **Verbindungsprobleme**: Netzwerkberechtigungen prüfen
3. **Langsame Performance**: Entwicklungscache leeren

### Support
Bei Problemen kontaktieren Sie das Entwicklerteam unter support@smartlaw.example.com

## Lizenz

Dieses Projekt ist unter der MIT-Lizenz lizenziert - siehe die [LICENSE](../LICENSE) Datei für Details.

## Mitwirkende

- Entwicklerteam von SmartLaw