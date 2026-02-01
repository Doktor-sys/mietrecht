# Anleitung zur Aktivierung des E-Mail-Versands für den Mietrecht-Agenten

## Übersicht

Diese Anleitung beschreibt, wie der E-Mail-Versand für den Mietrecht-Agenten mit echten Datenquellen aktiviert wird. Derzeit ist der E-Mail-Versand in der Standardkonfiguration deaktiviert und muss für die produktive Nutzung aktiviert werden.

## Schritte zur Aktivierung

### 1. Konfigurationsdatei aktualisieren

Die Hauptkonfigurationsdatei [scripts/config.json](file:///F:/ - 2025 - 22.06- copy C/_AA_Postfach 01.01.2025/03.07.2025 Arbeit 02.11.2025/JurisMind - Mietrecht 01/scripts/config.json) enthält bereits die Einstellungen für den E-Mail-Versand. Stellen Sie sicher, dass der folgende Abschnitt korrekt konfiguriert ist:

```json
"notifications": {
  "email": {
    "enabled": true,
    "smtp": {
      "host": "smtp.gmail.com",
      "port": 587,
      "secure": false,
      "user": "mietrecht.agent@example.com",
      "pass": "sicheres-passwort-hier"
    }
  }
}
```

### 2. E-Mail-Konfiguration anpassen

Passen Sie die E-Mail-Konfiguration in [scripts/config/email.config.js](file:///F:/ - 2025 - 22.06- copy C/_AA_Postfach 01.01.2025/03.07.2025 Arbeit 02.11.2025/JurisMind - Mietrecht 01/scripts/config/email.config.js) an Ihre Anforderungen an:

```javascript
module.exports = {
  // Email transport configuration
  transport: {
    service: process.env.EMAIL_SERVICE || 'gmail',
    auth: {
      user: process.env.EMAIL_USER || 'mietrecht.agent@example.com',
      pass: process.env.EMAIL_PASS || 'sicheres-passwort-hier'
    }
  },
  
  // Default sender address
  from: process.env.EMAIL_FROM || 'mietrecht.agent@example.com',
  
  // Email templates configuration
  templates: {
    subjectPrefix: process.env.EMAIL_SUBJECT_PREFIX || 'Mietrechts-Urteile',
    footer: process.env.EMAIL_FOOTER || '\n\n---\nDies ist eine automatisch generierte E-Mail vom Mietrecht Agent.\n'
  }
};
```

### 3. Verwendung von Umgebungsvariablen (empfohlen für Produktion)

Für Produktionsumgebungen wird dringend empfohlen, sensible Daten wie E-Mail-Passwörter nicht in Konfigurationsdateien zu speichern, sondern als Umgebungsvariablen bereitzustellen:

- EMAIL_SERVICE
- EMAIL_USER
- EMAIL_PASS
- EMAIL_FROM
- EMAIL_SUBJECT_PREFIX
- EMAIL_FOOTER

### 4. Testen des E-Mail-Versands

Verwenden Sie das bereitgestellte Testskript, um den E-Mail-Versand zu testen:

#### Mit npm:
```bash
npm run test:email
```

#### Mit der Batch-Datei (Windows):
Doppelklicken Sie auf [scripts/test_email_sending.bat](file:///F:/ - 2025 - 22.06- copy C/_AA_Postfach 01.01.2025/03.07.2025 Arbeit 02.11.2025/JurisMind - Mietrecht 01/scripts/test_email_sending.bat)

### 5. Starten des Mietrecht-Agents

Nach erfolgreicher Konfiguration und Test können Sie den Mietrecht-Agenten mit echten Datenquellen starten:

#### Mit npm:
```bash
npm run mietrecht-agent-real-data
```

#### Mit der Batch-Datei (Windows):
Doppelklicken Sie auf [scripts/run_mietrecht_agent_real_data.bat](file:///F:/ - 2025 - 22.06- copy C/_AA_Postfach 01.01.2025/03.07.2025 Arbeit 02.11.2025/JurisMind - Mietrecht 01/scripts/run_mietrecht_agent_real_data.bat)

## Fehlerbehebung

### Häufige Probleme

1. **Authentifizierungsfehler**:
   - Stellen Sie sicher, dass Benutzername und Passwort korrekt sind
   - Bei Gmail: Verwenden Sie ein App-Passwort, wenn die zweistufige Authentifizierung aktiviert ist

2. **Verbindungsprobleme**:
   - Überprüfen Sie die SMTP-Servereinstellungen
   - Stellen Sie sicher, dass der Port nicht durch eine Firewall blockiert wird

3. **Konfigurationsfehler**:
   - Vergewissern Sie sich, dass die Konfigurationsdatei korrekt formatiert ist (JSON)
   - Prüfen Sie, ob alle erforderlichen Felder ausgefüllt sind

## Sicherheitshinweise

1. Speichern Sie niemals Passwörter in Klartext in Konfigurationsdateien in Produktionsumgebungen
2. Verwenden Sie starke Passwörter oder bevorzugt App-Passwörter
3. Beschränken Sie den Zugriff auf Konfigurationsdateien
4. Regelmäßig die Zugangsdaten überprüfen und erneuern

## Weitere Ressourcen

- [ENHANCED_MIETRECHT_AGENT_SUMMARY.md](file:///F:/ - 2025 - 22.06- copy C/_AA_Postfach 01.01.2025/03.07.2025 Arbeit 02.11.2025/JurisMind - Mietrecht 01/ENHANCED_MIETRECHT_AGENT_SUMMARY.md)
- [MIETRECHT_AGENT_COMPLETE_IMPLEMENTATION.md](file:///F:/ - 2025 - 22.06- copy C/_AA_Postfach 01.01.2025/03.07.2025 Arbeit 02.11.2025/JurisMind - Mietrecht 01/MIETRECHT_AGENT_COMPLETE_IMPLEMENTATION.md)
- [REAL_DATA_SOURCES_INTEGRATION_SUMMARY.md](file:///F:/ - 2025 - 22.06- copy C/_AA_Postfach 01.01.2025/03.07.2025 Arbeit 02.11.2025/JurisMind - Mietrecht 01/REAL_DATA_SOURCES_INTEGRATION_SUMMARY.md)