# API-Dokumentation des Mietrecht-Agenten

## Übersicht

Die API des Mietrecht-Agenten ermöglicht den programmatischen Zugriff auf Entscheidungsdaten, Systemkonfiguration und Analyseergebnisse. Die API folgt den RESTful-Prinzipien und verwendet JSON für Anfragen und Antworten.

## Basis-URL

```
https://api.mietrecht-agent.de/v1
```

## Authentifizierung

Alle API-Anfragen erfordern eine Authentifizierung mit einem API-Token.

### Token erhalten

```http
POST /auth/token
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123"
}
```

**Antwort:**

```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "expires_in": 3600
}
```

### Authentifizierter Request

```http
GET /decisions
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

## Rate Limiting

Die API ist auf 1000 Anfragen pro Stunde pro Benutzer begrenzt. Bei Überschreitung wird der HTTP-Status 429 zurückgegeben.

## Fehlerbehandlung

### Fehlercodes

| Status Code | Beschreibung |
|-------------|--------------|
| 200 | Erfolgreiche Anfrage |
| 400 | Ungültige Anfrage |
| 401 | Nicht autorisiert |
| 403 | Zugriff verboten |
| 404 | Ressource nicht gefunden |
| 429 | Rate Limit überschritten |
| 500 | Interner Serverfehler |

### Fehlerformat

```json
{
  "error": {
    "code": "INVALID_REQUEST",
    "message": "Die Anfrage war ungültig",
    "details": "Fehlender Parameter: decision_id"
  }
}
```

## Endpunkte

### Entscheidungen

#### Alle Entscheidungen abrufen

```http
GET /decisions
```

**Parameter:**

| Parameter | Typ | Beschreibung | Standard |
|-----------|-----|--------------|----------|
| limit | integer | Maximale Anzahl an Ergebnissen | 50 |
| offset | integer | Offset für Pagination | 0 |
| since | string (ISO 8601) | Nur Entscheidungen seit diesem Datum | - |
| until | string (ISO 8601) | Nur Entscheidungen bis zu diesem Datum | - |
| court | string | Filter nach Gericht | - |
| topic | string | Filter nach Thema | - |

**Antwort:**

```json
{
  "decisions": [
    {
      "id": "BGH-VIII-ZR-161-17",
      "court": "Bundesgerichtshof",
      "location": "Karlsruhe",
      "decision_date": "2017-12-13",
      "case_number": "VIII ZR 161/17",
      "topics": ["Mietrecht", "Modernisierung", "Mieterhöhung"],
      "summary": "Der Bundesgerichtshof entschied über die Zulässigkeit einer Mieterhöhung nach Modernisierungsmaßnahmen.",
      "url": "https://juris.bundesgerichtshof.de/cgi-bin/rechtsprechung/document.py?Gericht=bgh&Art=en&Datum=2017-12-13&Seite=1&Sort=1&SucheNach=&Aktenzeichen=VIII%20ZR%20161%2F17",
      "judges": ["Präsident Dr. Kratz", "Dr. Röhlinger", "Dr. Siems", "Dr. Wiegand", "Dr. Seibt"],
      "practice_implications": "Die Entscheidung klärt die Voraussetzungen für zulässige Mieterhöhungen nach Modernisierungsmaßnahmen.",
      "importance": "high",
      "source": "bgh",
      "processed": true,
      "created_at": "2017-12-14T09:30:00Z",
      "updated_at": "2017-12-14T09:30:00Z"
    }
  ],
  "pagination": {
    "limit": 50,
    "offset": 0,
    "total": 1250
  }
}
```

#### Eine bestimmte Entscheidung abrufen

```http
GET /decisions/{decision_id}
```

**Antwort:**

```json
{
  "id": "BGH-VIII-ZR-161-17",
  "court": "Bundesgerichtshof",
  "location": "Karlsruhe",
  "decision_date": "2017-12-13",
  "case_number": "VIII ZR 161/17",
  "topics": ["Mietrecht", "Modernisierung", "Mieterhöhung"],
  "summary": "Der Bundesgerichtshof entschied über die Zulässigkeit einer Mieterhöhung nach Modernisierungsmaßnahmen.",
  "full_text": "Vollständiger Entscheidungstext...",
  "url": "https://juris.bundesgerichtshof.de/cgi-bin/rechtsprechung/document.py?Gericht=bgh&Art=en&Datum=2017-12-13&Seite=1&Sort=1&SucheNach=&Aktenzeichen=VIII%20ZR%20161%2F17",
  "judges": ["Präsident Dr. Kratz", "Dr. Röhlinger", "Dr. Siems", "Dr. Wiegand", "Dr. Seibt"],
  "practice_implications": "Die Entscheidung klärt die Voraussetzungen für zulässige Mieterhöhungen nach Modernisierungsmaßnahmen.",
  "importance": "high",
  "source": "bgh",
  "processed": true,
  "created_at": "2017-12-14T09:30:00Z",
  "updated_at": "2017-12-14T09:30:00Z"
}
```

#### Neue Entscheidung erstellen

```http
POST /decisions
Content-Type: application/json

{
  "court": "Bundesgerichtshof",
  "location": "Karlsruhe",
  "decision_date": "2025-12-01",
  "case_number": "VIII ZR 999/25",
  "topics": ["Mietrecht", "Kündigung"],
  "summary": "Zusammenfassung der Entscheidung",
  "full_text": "Vollständiger Entscheidungstext",
  "url": "https://example.com/decision/VIII-ZR-999-25",
  "judges": ["Richter A", "Richter B"],
  "practice_implications": "Praktische Auswirkungen",
  "importance": "medium",
  "source": "bgh"
}
```

**Antwort:**

```json
{
  "id": "BGH-VIII-ZR-999-25",
  "message": "Entscheidung erfolgreich erstellt"
}
```

### Anwälte

#### Alle Anwälte abrufen

```http
GET /lawyers
```

**Antwort:**

```json
{
  "lawyers": [
    {
      "id": 1,
      "name": "Max Mustermann",
      "email": "max@example.com",
      "law_firm": "Musterkanzlei",
      "practice_areas": ["Mietrecht", "Wohnungsrecht"],
      "regions": ["Berlin", "Brandenburg"],
      "created_at": "2025-01-15T10:30:00Z",
      "updated_at": "2025-01-15T10:30:00Z"
    }
  ]
}
```

#### Einen bestimmten Anwalt abrufen

```http
GET /lawyers/{lawyer_id}
```

**Antwort:**

```json
{
  "id": 1,
  "name": "Max Mustermann",
  "email": "max@example.com",
  "law_firm": "Musterkanzlei",
  "practice_areas": ["Mietrecht", "Wohnungsrecht"],
  "regions": ["Berlin", "Brandenburg"],
  "preferences": {
    "court_levels": ["Bundesgerichtshof", "Landgericht"],
    "topics": ["Mietminderung", "Kündigung"],
    "frequency": "daily",
    "importance_threshold": "medium"
  },
  "created_at": "2025-01-15T10:30:00Z",
  "updated_at": "2025-01-15T10:30:00Z"
}
```

#### Neuen Anwalt erstellen

```http
POST /lawyers
Content-Type: application/json

{
  "name": "Erika Musterfrau",
  "email": "erika@example.com",
  "law_firm": "Musterkanzlei Berlin",
  "practice_areas": ["Mietrecht", "Arbeitsrecht"],
  "regions": ["Berlin"]
}
```

**Antwort:**

```json
{
  "id": 2,
  "message": "Anwalt erfolgreich erstellt"
}
```

### Analyse

#### Entscheidungstrends abrufen

```http
GET /analytics/trends
```

**Parameter:**

| Parameter | Typ | Beschreibung | Standard |
|-----------|-----|--------------|----------|
| months | integer | Anzahl der Monate für die Analyse | 12 |

**Antwort:**

```json
{
  "monthly_trends": {
    "2025-10": 45,
    "2025-11": 52,
    "2025-12": 38
  },
  "top_topics": [
    ["Mietrecht", 120],
    ["Kündigung", 85],
    ["Modernisierung", 67]
  ],
  "court_distribution": [
    ["Bundesgerichtshof", 45],
    ["Landgericht Berlin", 78],
    ["Landgericht Hamburg", 32]
  ]
}
```

#### Anwaltspezialisierungen abrufen

```http
GET /analytics/lawyer-specializations
```

**Antwort:**

```json
{
  "practice_area_distribution": [
    ["Mietrecht", 45],
    ["Wohnungsrecht", 23],
    ["Arbeitsrecht", 18]
  ],
  "total_lawyers": 86
}
```

### System

#### Systemstatus abrufen

```http
GET /system/status
```

**Antwort:**

```json
{
  "agent_status": "running",
  "last_run": "2025-12-01T14:30:00Z",
  "next_run": "2025-12-01T15:30:00Z",
  "total_decisions_processed": 1250,
  "successful_runs": 245,
  "failed_runs": 3,
  "data_sources": {
    "bgh": {
      "status": "online",
      "last_check": "2025-12-01T14:25:00Z"
    },
    "landgerichte": {
      "status": "online",
      "last_check": "2025-12-01T14:28:00Z"
    }
  },
  "performance": {
    "avg_response_time": 1250,
    "cache_hit_rate": 0.85,
    "active_requests": 2
  }
}
```

#### Konfiguration abrufen

```http
GET /system/config
```

**Antwort:**

```json
{
  "bgh": {
    "base_url": "https://juris.bundesgerichtshof.de/cgi-bin/rechtsprechung",
    "search_endpoint": "/list.py?Gericht=bgh&Art=en",
    "user_agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
  },
  "email": {
    "service": "gmail",
    "user": "user@example.com"
  },
  "notification": {
    "enabled": true,
    "method": "email"
  },
  "processing": {
    "auto_summarize": true,
    "extract_topics": true
  }
}
```

#### Konfiguration aktualisieren

```http
PUT /system/config
Content-Type: application/json

{
  "notification": {
    "enabled": false
  }
}
```

**Antwort:**

```json
{
  "message": "Konfiguration erfolgreich aktualisiert"
}
```

## Webhooks

Der Mietrecht-Agent unterstützt Webhooks für Echtzeit-Benachrichtigungen.

### Webhook registrieren

```http
POST /webhooks
Content-Type: application/json

{
  "url": "https://your-service.com/webhook",
  "events": ["new_decision", "system_alert"]
}
```

### Webhook-Payload

```json
{
  "event": "new_decision",
  "timestamp": "2025-12-01T14:30:00Z",
  "data": {
    "decision": {
      "id": "BGH-VIII-ZR-999-25",
      "court": "Bundesgerichtshof",
      "case_number": "VIII ZR 999/25",
      "decision_date": "2025-12-01",
      "topics": ["Mietrecht", "Kündigung"],
      "summary": "Zusammenfassung der neuen Entscheidung"
    }
  }
}
```

## SDKs und Bibliotheken

### JavaScript/Node.js

```javascript
const MietrechtAgent = require('mietrecht-agent-sdk');

const client = new MietrechtAgent({
  baseUrl: 'https://api.mietrecht-agent.de/v1',
  token: 'your-api-token'
});

// Entscheidungen abrufen
const decisions = await client.getDecisions({
  limit: 10,
  court: 'Bundesgerichtshof'
});

console.log(decisions);
```

### Python

```python
from mietrecht_agent import Client

client = Client(
    base_url='https://api.mietrecht-agent.de/v1',
    token='your-api-token'
)

# Entscheidungen abrufen
decisions = client.get_decisions(limit=10, court='Bundesgerichtshof')
print(decisions)
```

## Best Practices

### Paginierung

Verwenden Sie immer die Paginierungsparameter, um große Datensätze effizient abzurufen:

```javascript
let offset = 0;
const limit = 100;
let hasMore = true;

while (hasMore) {
  const response = await client.getDecisions({ limit, offset });
  processDecisions(response.decisions);
  
  if (response.decisions.length < limit) {
    hasMore = false;
  } else {
    offset += limit;
  }
}
```

### Fehlerbehandlung

Implementieren Sie immer eine robuste Fehlerbehandlung:

```javascript
try {
  const decisions = await client.getDecisions();
  displayDecisions(decisions);
} catch (error) {
  if (error.status === 429) {
    // Rate Limit überschritten, warten und erneut versuchen
    await sleep(60000); // 1 Minute warten
    return fetchDecisions();
  } else if (error.status === 401) {
    // Token ungültig, neu authentifizieren
    await refreshToken();
    return fetchDecisions();
  } else {
    // Anderer Fehler
    console.error('Fehler beim Abrufen der Entscheidungen:', error);
  }
}
```

### Caching

Implementieren Sie clientseitiges Caching für häufig abgerufene Daten:

```javascript
const cache = new Map();
const CACHE_TTL = 5 * 60 * 1000; // 5 Minuten

async function getCachedDecision(decisionId) {
  const cached = cache.get(decisionId);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.data;
  }
  
  const decision = await client.getDecision(decisionId);
  cache.set(decisionId, {
    data: decision,
    timestamp: Date.now()
  });
  
  return decision;
}
```

## Changelog

### v1.0.0 (2025-12-01)

- Initiale API-Version
- Unterstützung für Entscheidungen, Anwälte und Analysen
- Authentifizierung mit JWT-Token
- Rate Limiting implementiert