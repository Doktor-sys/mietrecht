# Benachrichtigungs- und Alarmsystem

## Übersicht

Dieses Dokument beschreibt das Benachrichtigungs- und Alarmsystem für den Mietrecht-Agenten. Das System ermöglicht es, relevante Ereignisse und kritische Situationen sofort zu erkennen und zu benachrichtigen.

## Komponenten

### 1. Benachrichtigungskanäle ([notificationService.js](file:///d:/%20-%202025%20-%2022.06-%20copy%20C/_AA_Postfach%2001.01.2025/03.07.2025%20Arbeit%2002.11.2025/JurisMind%20-%20Mietrecht%2001/scripts/notifications/notificationService.js))

Das System unterstützt verschiedene Benachrichtigungskanäle:

- **E-Mail**: Voll funktionsfähige E-Mail-Benachrichtigungen
- **SMS**: Stub-Implementierung für SMS-Benachrichtigungen
- **Push**: Stub-Implementierung für Push-Benachrichtigungen
- **Stub**: Testkanal für Entwicklung und Debugging

### 2. Benachrichtigungsvorlagen ([templates.js](file:///d:/%20-%202025%20-%2022.06-%20copy%20C/_AA_Postfach%2001.01.2025/03.07.2025%20Arbeit%2002.11.2025/JurisMind%20-%20Mietrecht%2001/scripts/notifications/templates.js))

Vordefinierte Vorlagen für verschiedene Benachrichtigungstypen:

- Neue Gerichtsentscheidungen
- Systemmeldungen
- Leistungswarnungen
- Tägliche Zusammenfassungen

### 3. Alarmregeln ([alertRules.js](file:///d:/%20-%202025%20-%2022.06-%20copy%20C/_AA_Postfach%2001.01.2025/03.07.2025%20Arbeit%2002.11.2025/JurisMind%20-%20Mietrecht%2001/scripts/notifications/alertRules.js))

Vordefinierte Regeln für die Auslösung von Alarmen:

- Hohe Fehlerquote
- Niedrige Cache-Trefferquote
- Hohe Antwortzeiten
- Offline-Datenquellen
- Fehlende neue Entscheidungen

### 4. Hauptbenachrichtigungsmodul ([notificationManager.js](file:///d:/%20-%202025%20-%2022.06-%20copy%20C/_AA_Postfach%2001.01.2025/03.07.2025%20Arbeit%2002.11.2025/JurisMind%20-%20Mietrecht%2001/scripts/notifications/notificationManager.js))

Zentrales Modul zur Verwaltung des Benachrichtigungssystems:

- Koordination aller Benachrichtigungskanäle
- Verwaltung von Alarmregeln
- Senden von Benachrichtigungen
- Prüfung auf auszulösende Alarme

## Verwendung

### Initialisierung des Benachrichtigungssystems

```javascript
const { NotificationManager } = require('./notifications/notificationManager.js');

const notificationConfig = {
  email: {
    enabled: true,
    service: 'gmail',
    user: 'your-email@gmail.com',
    pass: 'your-password'
  },
  sms: {
    enabled: false // No SMS configuration in this example
  },
  push: {
    enabled: false // No push configuration in this example
  },
  adminRecipients: ['admin@example.com']
};

const notificationManager = new NotificationManager(notificationConfig);
```

### Senden einer Benachrichtigung

```javascript
// Send notification to lawyers about a new decision
const decision = {
  caseNumber: 'VIII ZR 123/24',
  court: 'Bundesgerichtshof',
  date: '2025-12-01',
  topics: ['Mietrecht', 'Kündigung'],
  summary: 'Wichtige Entscheidung zum Mietvertragsrecht',
  practiceImplications: 'Auswirkungen auf die Praxis',
  url: 'https://example.com/decision'
};

const relevantLawyers = [
  { name: 'Max Mustermann', email: 'max@example.com' }
];

await notificationManager.notifyLawyersAboutDecision(decision, relevantLawyers);
```

### Prüfung auf Alarme

```javascript
// Check for system alerts
const alerts = await notificationManager.checkForAlerts();
console.log('Triggered alerts:', alerts);
```

## Konfiguration

Das Benachrichtigungssystem kann über die Konfiguration angepasst werden:

- Aktivierung/Deaktivierung von Benachrichtigungskanälen
- Konfiguration der Kanaleinstellungen (z.B. E-Mail-Server)
- Festlegung von Administratoren für Systemmeldungen
- Anpassung von Alarmregeln und Schwellenwerten

## Erweiterbarkeit

Das System ist modular aufgebaut und kann leicht erweitert werden:

- Hinzufügen neuer Benachrichtigungskanäle
- Erstellen zusätzlicher Benachrichtigungsvorlagen
- Definition neuer Alarmregeln
- Integration externer Benachrichtigungsdienste