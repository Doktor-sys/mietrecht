# Installationsanleitung des Mietrecht-Agenten

## Systemvoraussetzungen

### Betriebssystem
Der Mietrecht-Agent kann auf folgenden Betriebssystemen installiert werden:
- Windows 10 oder höher
- macOS 10.15 (Catalina) oder höher
- Linux (Ubuntu 20.04 LTS oder höher, CentOS 8 oder höher)

### Softwareanforderungen
- Node.js Version 18.x oder höher
- npm Version 8.x oder höher
- SQLite Version 3.35 oder höher (wird automatisch installiert)

### Hardwareanforderungen
- Prozessor: 2 Kerne oder mehr
- Arbeitsspeicher: 4 GB RAM (empfohlen: 8 GB)
- Festplattenspeicher: 10 GB freier Speicherplatz
- Internetverbindung: Für Datenabruf und Updates

## Installation

### Schritt 1: Node.js installieren

#### Windows/macOS
1. Laden Sie Node.js von [nodejs.org](https://nodejs.org/) herunter
2. Führen Sie den Installer aus
3. Folgen Sie den Installationsanweisungen

#### Ubuntu/Debian
```bash
# Node.js-Repository hinzufügen
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -

# Node.js installieren
sudo apt-get install -y nodejs
```

#### CentOS/RHEL
```bash
# Node.js-Repository hinzufügen
curl -fsSL https://rpm.nodesource.com/setup_18.x | sudo bash -

# Node.js installieren
sudo yum install -y nodejs
```

### Schritt 2: Projekt herunterladen

#### Mit Git (empfohlen)
```bash
# Repository klonen
git clone https://github.com/your-organization/mietrecht-agent.git

# In das Projektverzeichnis wechseln
cd mietrecht-agent
```

#### Als ZIP-Datei
1. Laden Sie die neueste Version von der [GitHub-Releases-Seite](https://github.com/your-organization/mietrecht-agent/releases) herunter
2. Entpacken Sie die ZIP-Datei
3. Wechseln Sie in das entpackte Verzeichnis

### Schritt 3: Abhängigkeiten installieren

```bash
# Im Projektverzeichnis
npm install
```

Dieser Befehl installiert alle erforderlichen Abhängigkeiten, einschließlich:
- sqlite3 für die Datenbank
- nodemailer für E-Mail-Benachrichtigungen
- cheerio für HTML-Parsing
- axios für HTTP-Anfragen

### Schritt 4: Datenbank initialisieren

```bash
# Datenbank initialisieren
node scripts/database/init/initDb.js
```

Dieser Befehl:
- Erstellt das Datenbankverzeichnis
- Erstellt die SQLite-Datenbankdatei
- Erstellt alle erforderlichen Tabellen
- Fügt Standarddaten hinzu

### Schritt 5: Konfiguration anpassen

1. Kopieren Sie die Beispielkonfigurationsdatei:
   ```bash
   cp config.example.json config.json
   ```

2. Bearbeiten Sie `config.json` mit einem Texteditor:
   ```json
   {
     "bgh": {
       "baseUrl": "https://juris.bundesgerichtshof.de/cgi-bin/rechtsprechung",
       "searchEndpoint": "/list.py?Gericht=bgh&Art=en",
       "userAgent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
     },
     "email": {
       "service": "gmail",
       "user": "ihre-email@gmail.com",
       "pass": "ihr-passwort"
     },
     "notification": {
       "enabled": true,
       "method": "email"
     },
     "processing": {
       "autoSummarize": true,
       "extractTopics": true
     }
   }
   ```

3. Passen Sie die Einstellungen entsprechend Ihrer Anforderungen an:
   - E-Mail-Konfiguration für Benachrichtigungen
   - BGH-API-Einstellungen
   - Verarbeitungsoptionen

### Schritt 6: Ersten Anwalt hinzufügen

```bash
# Interaktives Skript zum Hinzufügen eines Anwalts
node scripts/addLawyer.js
```

Oder fügen Sie manuell Daten zur Datenbank hinzu:
```sql
INSERT INTO lawyers (name, email, law_firm, practice_areas, regions) 
VALUES ('Max Mustermann', 'max@example.com', 'Musterkanzlei', '["Mietrecht","Wohnungsrecht"]', '["Berlin","Brandenburg"]');
```

## Erstausführung

### Entwicklungsserver starten

Für Entwicklung und Tests:
```bash
# Web-Konfigurationsoberfläche starten
npm run dev
```

Der Entwicklungsserver ist dann unter `http://localhost:3000` erreichbar.

### Produktionsmodus

Für den produktiven Betrieb:
```bash
# Hauptanwendung starten
npm start
```

Oder direkt:
```bash
# Hauptanwendung starten
node scripts/mietrecht_agent.js
```

## Systemdienst einrichten (Linux)

Um den Mietrecht-Agenten als Systemdienst zu betreiben:

1. Erstellen Sie eine Servicedatei:
   ```bash
   sudo nano /etc/systemd/system/mietrecht-agent.service
   ```

2. Fügen Sie folgenden Inhalt hinzu:
   ```ini
   [Unit]
   Description=Mietrecht Agent
   After=network.target

   [Service]
   Type=simple
   User=mietrecht
   WorkingDirectory=/path/to/mietrecht-agent
   ExecStart=/usr/bin/node scripts/mietrecht_agent.js
   Restart=always
   RestartSec=10
   Environment=NODE_ENV=production

   [Install]
   WantedBy=multi-user.target
   ```

3. Passen Sie den Pfad und den Benutzer an Ihre Installation an

4. Aktivieren und starten Sie den Dienst:
   ```bash
   # Dienst aktivieren
   sudo systemctl enable mietrecht-agent

   # Dienst starten
   sudo systemctl start mietrecht-agent

   # Dienststatus prüfen
   sudo systemctl status mietrecht-agent
   ```

## Geplante Ausführung (Cron)

Um den Mietrecht-Agenten regelmäßig auszuführen, können Sie einen Cron-Job einrichten:

1. Crontab öffnen:
   ```bash
   crontab -e
   ```

2. Fügen Sie eine Zeile für die gewünschte Ausführungshäufigkeit hinzu:
   ```bash
   # Jede Stunde ausführen
   0 * * * * /usr/bin/node /path/to/mietrecht-agent/scripts/mietrecht_agent.js >> /var/log/mietrecht-agent.log 2>&1
   ```

## Docker-Installation (optional)

Der Mietrecht-Agent kann auch in einem Docker-Container betrieben werden:

1. Docker installieren (falls noch nicht geschehen)

2. Dockerfile erstellen:
   ```dockerfile
   FROM node:18-alpine

   WORKDIR /app

   COPY package*.json ./
   RUN npm install

   COPY . .

   RUN node scripts/database/init/initDb.js

   EXPOSE 3000

   CMD ["node", "scripts/mietrecht_agent.js"]
   ```

3. Docker-Image bauen:
   ```bash
   docker build -t mietrecht-agent .
   ```

4. Container starten:
   ```bash
   docker run -d \
     --name mietrecht-agent \
     -p 3000:3000 \
     -v /path/to/local/data:/app/scripts/database/data \
     mietrecht-agent
   ```

## Konfiguration

### E-Mail-Einstellungen

Für Gmail:
```json
{
  "email": {
    "service": "gmail",
    "user": "ihre-email@gmail.com",
    "pass": "ihr-app-passwort"
  }
}
```

Hinweis: Für Gmail wird ein App-Passwort statt des regulären Kontopassworts benötigt.

### Datenquellen konfigurieren

Standardmäßig sind folgende Datenquellen konfiguriert:
- BGH (Bundesgerichtshof)
- Landgerichte
- BVerfG (Bundesverfassungsgericht)
- Beck-Online

Sie können diese in der Konfigurationsdatei anpassen oder erweitern.

## Erste Schritte nach der Installation

1. **Web-Oberfläche aufrufen**: Navigieren Sie zu `http://localhost:3000`
2. **Anwälte hinzufügen**: Fügen Sie über die Oberfläche Anwälte mit ihren Präferenzen hinzu
3. **Konfiguration prüfen**: Überprüfen Sie die Systemeinstellungen
4. **Ersten Testlauf durchführen**: Führen Sie einen manuellen Scan durch
5. **Benachrichtigungen testen**: Stellen Sie sicher, dass E-Mail-Benachrichtigungen funktionieren

## Fehlerbehebung

### Häufige Probleme

#### Datenbankfehler
```
Error: Cannot open database
```
Lösung: Stellen Sie sicher, dass die Datenbank initialisiert wurde:
```bash
node scripts/database/init/initDb.js
```

#### Node.js-Version zu alt
```
Error: Node.js version 18 or higher is required
```
Lösung: Aktualisieren Sie Node.js auf Version 18 oder höher.

#### Berechtigungsfehler
```
Error: EACCES: permission denied
```
Lösung: Stellen Sie sicher, dass der Benutzer Schreibrechte für das Projektverzeichnis hat.

#### E-Mail-Versand fehlschlägt
Lösung: 
1. Überprüfen Sie die E-Mail-Konfiguration
2. Bei Gmail: Verwenden Sie ein App-Passwort
3. Prüfen Sie die Spam-Ordner

### Logs prüfen

Die Anwendung schreibt Logs in verschiedene Dateien:
- `logs/app.log`: Allgemeine Anwendungslogs
- `logs/error.log`: Fehlerlogs
- `logs/database.log`: Datenbankbezogene Logs

### Support

Bei Installationsproblemen wenden Sie sich bitte an:
- **E-Mail**: support@mietrecht-agent.de
- **GitHub Issues**: [https://github.com/your-organization/mietrecht-agent/issues](https://github.com/your-organization/mietrecht-agent/issues)

## Updates

### Auf neue Version aktualisieren

1. Projektverzeichnis wechseln:
   ```bash
   cd /path/to/mietrecht-agent
   ```

2. Neueste Version herunterladen:
   ```bash
   git pull origin main
   ```

   Oder bei ZIP-Installation: Neue Version herunterladen und entpacken

3. Abhängigkeiten aktualisieren:
   ```bash
   npm install
   ```

4. Datenbankschema aktualisieren (falls erforderlich):
   ```bash
   node scripts/database/migrate.js
   ```

5. Anwendung neu starten

### Sicherung vor Updates

Vor wichtigen Updates sollten Sie ein Backup erstellen:
```bash
# Datenbank sichern
cp scripts/database/data/mietrecht_agent.db scripts/database/data/mietrecht_agent.backup.db

# Konfiguration sichern
cp config.json config.backup.json
```

## Deinstallation

### Projektordner entfernen
```bash
# Projektordner löschen
rm -rf /path/to/mietrecht-agent
```

### Systemdienst entfernen (falls eingerichtet)
```bash
# Dienst stoppen
sudo systemctl stop mietrecht-agent

# Dienst deaktivieren
sudo systemctl disable mietrecht-agent

# Servicedatei entfernen
sudo rm /etc/systemd/system/mietrecht-agent.service

# Systemd neu laden
sudo systemctl daemon-reload
```

### Cron-Jobs entfernen
```bash
# Crontab öffnen
crontab -e

# Entfernen Sie die Zeilen für den Mietrecht-Agenten
```

### Docker-Container entfernen
```bash
# Container stoppen und entfernen
docker stop mietrecht-agent
docker rm mietrecht-agent

# Image entfernen
docker rmi mietrecht-agent
```