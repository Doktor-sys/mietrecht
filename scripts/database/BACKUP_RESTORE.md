# Datenbank-Backup und Wiederherstellung

## Übersicht

Dieses Dokument beschreibt die Backup- und Wiederherstellungsfunktionen für die Datenbank des Mietrecht-Agenten. Diese Funktionen ermöglichen es, regelmäßige Sicherungen der Datenbank durchzuführen und bei Bedarf aus einem Backup wiederherzustellen.

## Funktionen

### Backup der Datenbank

Die [backupDatabase](file:///d:/%20-%202025%20-%2022.06-%20copy%20C/_AA_Postfach%2001.01.2025/03.07.2025%20Arbeit%2002.11.2025/JurisMind%20-%20Mietrecht%2001/scripts/database/backupRestore.js#L27-L46)-Funktion erstellt eine Kopie der aktuellen Datenbankdatei an einem angegebenen Speicherort.

```javascript
const { backupDatabase } = require('./database/backupRestore.js');

// Backup der Datenbank erstellen
await backupDatabase('/pfad/zum/backup/mietrecht_agent_backup.db');
```

### Wiederherstellung der Datenbank

Die [restoreDatabase](file:///d:/%20-%202025%20-%2022.06-%20copy%20C/_AA_Postfach%2001.01.2025/03.07.2025%20Arbeit%2002.11.2025/JurisMind%20-%20Mietrecht%2001/scripts/database/backupRestore.js#L54-L82)-Funktion stellt die Datenbank aus einer Backup-Datei wieder her.

```javascript
const { restoreDatabase } = require('./database/backupRestore.js');

// Datenbank aus Backup wiederherstellen
await restoreDatabase('/pfad/zum/backup/mietrecht_agent_backup.db');
```

### Automatische Backups

Die [scheduleBackups](file:///d:/%20-%202025%20-%2022.06-%20copy%20C/_AA_Postfach%2001.01.2025/03.07.2025%20Arbeit%2002.11.2025/JurisMind%20-%20Mietrecht%2001/scripts/database/backupRestore.js#L92-L112)-Funktion plant automatische Backups in regelmäßigen Intervallen.

```javascript
const { scheduleBackups } = require('./database/backupRestore.js');

// Automatische Backups alle 24 Stunden in einem bestimmten Verzeichnis
scheduleBackups('/pfad/zum/backup/verzeichnis', 24);
```

### Auflisten vorhandener Backups

Die [listBackups](file:///d:/%20-%202025%20-%2022.06-%20copy%20C/_AA_Postfach%2001.01.2025/03.07.2025%20Arbeit%2002.11.2025/JurisMind%20-%20Mietrecht%2001/scripts/database/backupRestore.js#L121-L148)-Funktion listet alle verfügbaren Backup-Dateien in einem Verzeichnis auf.

```javascript
const { listBackups } = require('./database/backupRestore.js');

// Verfügbare Backups auflisten
const backups = await listBackups('/pfad/zum/backup/verzeichnis');
console.log(backups);
```

## Verwendung

### Manuelle Backups

Um ein manuelles Backup zu erstellen, kann die [backupDatabase](file:///d:/%20-%202025%20-%2022.06-%20copy%20C/_AA_Postfach%2001.01.2025/03.07.2025%20Arbeit%2002.11.2025/JurisMind%20-%20Mietrecht%2001/scripts/database/backupRestore.js#L27-L46)-Funktion verwendet werden. Es wird empfohlen, Backups an einem sicheren Ort außerhalb des Anwendungsverzeichnisses zu speichern.

### Automatische Backups

Für Produktivumgebungen wird empfohlen, automatische Backups zu aktivieren. Dies kann durch Aufrufen der [scheduleBackups](file:///d:/%20-%202025%20-%2022.06-%20copy%20C/_AA_Postfach%2001.01.2025/03.07.2025%20Arbeit%2002.11.2025/JurisMind%20-%20Mietrecht%2001/scripts/database/backupRestore.js#L92-L112)-Funktion beim Start der Anwendung erfolgen.

### Wiederherstellung

Bei Datenverlust oder Beschädigung der Datenbank kann die [restoreDatabase](file:///d:/%20-%202025%20-%2022.06-%20copy%20C/_AA_Postfach%2001.01.2025/03.07.2025%20Arbeit%2002.11.2025/JurisMind%20-%20Mietrecht%2001/scripts/database/backupRestore.js#L54-L82)-Funktion verwendet werden, um die Datenbank aus einem Backup wiederherzustellen. Stellen Sie sicher, dass die Anwendung vor der Wiederherstellung gestoppt wird.

## Best Practices

1. **Regelmäßige Backups**: Führen Sie regelmäßig Backups durch, idealerweise täglich oder häufiger je nach Datenänderungsrate.

2. **Sichere Speicherorte**: Speichern Sie Backups an einem sicheren Ort, vorzugsweise auf einem separaten Server oder Cloud-Speicher.

3. **Backup-Validierung**: Prüfen Sie regelmäßig, ob Ihre Backups lesbar und vollständig sind.

4. **Versionskontrolle**: Behalten Sie mehrere Backup-Versionen bei, um auf verschiedene Zeitpunkte zurückgreifen zu können.

5. **Verschlüsselung**: Erwägen Sie die Verschlüsselung sensibler Backup-Daten.

6. **Testen der Wiederherstellung**: Testen Sie regelmäßig den Wiederherstellungsprozess, um sicherzustellen, dass Backups funktionieren.