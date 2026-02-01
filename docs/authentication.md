# Authentifizierungsdokumentation für den Mietrecht-Agenten

## Übersicht

Diese Dokumentation beschreibt die Authentifizierungs- und Autorisierungsmechanismen, die im Mietrecht-Agenten implementiert wurden, um den Zugriff auf die Webanwendung zu sichern.

## Implementierte Authentifizierungsmethoden

### 1. JWT-Token-basierte Authentifizierung

Wir verwenden JSON Web Tokens (JWT) zur sicheren Authentifizierung von Benutzern:

- **Token-Generierung**: Bei erfolgreicher Anmeldung wird ein JWT-Token generiert
- **Token-Gültigkeit**: Tokens sind standardmäßig 24 Stunden gültig
- **Token-Speicherung**: Tokens werden im LocalStorage des Browsers gespeichert
- **Token-Verwendung**: Jede API-Anfrage muss den Token im Authorization-Header senden

### 2. Passwort-Sicherheit

- **Passwort-Hashing**: Passwörter werden mit bcrypt gehasht
- **Salt-Rounds**: 10 Salt-Rounds für sicheres Hashing
- **Speicherung**: Nur gehashte Passwörter werden in der Datenbank gespeichert

### 3. Benutzerrollen

Wir unterstützen zwei Benutzerrollen:

1. **Benutzer (user)**: Standardrolle für normale Benutzer
2. **Administrator (admin)**: Rolle mit erweiterten Berechtigungen

## API-Endpunkte

### Authentifizierungs-Endpunkte

#### 1. Benutzerregistrierung
```
POST /api/auth/register
```
**Parameter:**
- `username` (String, erforderlich): Benutzername
- `password` (String, erforderlich): Passwort
- `role` (String, optional): Benutzerrolle (Standard: "user")

**Antwort:**
```json
{
  "message": "User registered successfully",
  "token": "JWT_TOKEN",
  "user": {
    "id": 1,
    "username": "testuser",
    "role": "user"
  }
}
```

#### 2. Benutzeranmeldung
```
POST /api/auth/login
```
**Parameter:**
- `username` (String, erforderlich): Benutzername
- `password` (String, erforderlich): Passwort

**Antwort:**
```json
{
  "message": "Login successful",
  "token": "JWT_TOKEN",
  "user": {
    "id": 1,
    "username": "testuser",
    "role": "user"
  }
}
```

#### 3. Administrator erstellen (nur für Entwicklung)
```
POST /api/auth/create-admin
```
**Antwort:**
```json
{
  "message": "Default admin user created",
  "username": "admin",
  "password": "admin123"
}
```

### Geschützte Endpunkte

Alle API-Endpunkte außer den Authentifizierungs-Endpunkten sind geschützt und erfordern einen gültigen JWT-Token im Authorization-Header:

```
Authorization: Bearer JWT_TOKEN
```

### Administrator-Endpunkte

Bestimmte Endpunkte erfordern zusätzlich die Administrator-Rolle:

```
/api/admin/*
```

## Web-Oberfläche

### Anmeldeseite

Die Anmeldeseite ist unter `/login` verfügbar und erfordert keine Authentifizierung.

### Geschützte Seiten

Alle anderen Seiten (Dashboard, Konfiguration) erfordern eine gültige Authentifizierung.

## Datenbankschema

### Benutzertabelle

```sql
CREATE TABLE users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'user',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

## Sicherheitsempfehlungen

### Für Produktionsumgebungen

1. **Geheime Schlüssel**: Verwenden Sie starke, zufällige geheime Schlüssel für JWT
2. **HTTPS**: Verwenden Sie immer HTTPS in Produktionsumgebungen
3. **Token-Ablauf**: Verkürzen Sie die Token-Gültigkeit für höhere Sicherheit
4. **Rate Limiting**: Implementieren Sie Rate Limiting für Authentifizierungs-Endpunkte
5. **Passwort-Richtlinien**: Implementieren Sie strenge Passwort-Richtlinien
6. **Zwei-Faktor-Authentifizierung**: Erwägen Sie die Implementierung von 2FA

### Umgebungsvariablen

```bash
JWT_SECRET=ihre_geheimer_schluessel_hier
JWT_EXPIRES_IN=24h
```

## Fehlerbehandlung

### Häufige Fehlercodes

- **401 Unauthorized**: Ungültige oder fehlende Authentifizierung
- **403 Forbidden**: Unzureichende Berechtigungen für den Zugriff
- **400 Bad Request**: Fehlende oder ungültige Anmeldedaten

## Testen der Authentifizierung

Sie können die Authentifizierung mit folgenden Schritten testen:

1. Erstellen Sie einen Administrator-Benutzer:
   ```bash
   curl -X POST http://localhost:3000/api/auth/create-admin
   ```

2. Melden Sie sich mit dem Administrator-Account an:
   ```bash
   curl -X POST http://localhost:3000/api/auth/login \
        -H "Content-Type: application/json" \
        -d '{"username":"admin","password":"admin123"}'
   ```

3. Verwenden Sie den erhaltenen Token für weitere API-Anfragen:
   ```bash
   curl -H "Authorization: Bearer IHRE_TOKEN_HIER" \
        http://localhost:3000/api/config
   ```

Diese Authentifizierungsimplementierung stellt sicher, dass nur autorisierte Benutzer auf die Mietrecht-Agent-Funktionen zugreifen können.