# SmartLaw B2B API Documentation

## Übersicht

Die SmartLaw B2B API ermöglicht es Geschäftskunden (Wohnungsgenossenschaften, Hausverwaltungen, Immobilienunternehmen), die SmartLaw-Funktionalitäten in ihre eigenen Systeme zu integrieren.

## Authentifizierung

### API-Key-basierte Authentifizierung

Alle B2B-API-Endpunkte erfordern einen gültigen API-Key, der im `X-API-Key` Header übertragen wird.

```http
X-API-Key: sk_live_1234567890abcdef...
```

### API-Key-Typen

- **Test Keys**: `sk_test_...` - Für Entwicklung und Tests
- **Live Keys**: `sk_live_...` - Für Produktionsumgebung

### Berechtigungen

API-Keys haben spezifische Berechtigungen:

- `document:analyze` - Einzeldokument-Analyse
- `document:batch` - Batch-Dokumentenanalyse
- `chat:query` - KI-Chat-Anfragen
- `template:generate` - Musterdokument-Generierung
- `lawyer:search` - Anwaltssuche
- `analytics:read` - Nutzungsstatistiken
- `webhook:manage` - Webhook-Konfiguration
- `*` - Alle Berechtigungen

## Rate Limiting und Quotas

### Rate Limits

- **Standard**: 1.000 Requests pro Minute
- **Professional**: 5.000 Requests pro Minute
- **Enterprise**: 10.000 Requests pro Minute

### Monatliche Quotas

- **Standard**: 10.000 Requests pro Monat
- **Professional**: 100.000 Requests pro Monat
- **Enterprise**: Unbegrenzt

### Rate Limit Headers

```http
X-RateLimit-Limit: 1000
X-RateLimit-Remaining: 999
X-RateLimit-Reset: 1640995200
```

## Endpunkte

### 1. API-Status

**GET** `/api/b2b/status`

Gibt den aktuellen Status des API-Keys und die Limits zurück.

**Response:**
```json
{
  "success": true,
  "data": {
    "apiKey": {
      "name": "Production API Key",
      "permissions": ["*"]
    },
    "rateLimit": {
      "limit": 1000,
      "used": 42,
      "remaining": 958,
      "resetTime": "2024-01-01T12:01:00Z"
    },
    "quota": {
      "limit": 10000,
      "used": 1250,
      "remaining": 8750,
      "resetDate": "2024-02-01T00:00:00Z"
    },
    "status": "active"
  }
}
```

### 2. Dokumentenanalyse

**POST** `/api/b2b/analyze/document`

Analysiert ein einzelnes Dokument.

**Request:**
```http
Content-Type: multipart/form-data

file: [Binary file data]
documentType: rental_contract
metadata: {"propertyId": "prop_123", "tenantId": "tenant_456"}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "documentId": "doc_789",
    "analysis": {
      "riskLevel": "medium",
      "confidence": 0.85,
      "issues": [
        {
          "type": "invalid_clause",
          "severity": "warning",
          "description": "Unwirksame Schönheitsreparaturklausel gefunden",
          "legalBasis": "§ 307 BGB",
          "suggestedAction": "Klausel prüfen und ggf. anpassen"
        }
      ],
      "recommendations": [
        {
          "type": "legal_review",
          "priority": "medium",
          "description": "Rechtliche Überprüfung der Klauseln empfohlen"
        }
      ],
      "extractedData": {
        "rent": 1200.00,
        "deposit": 3600.00,
        "tenantName": "Max Mustermann",
        "landlordName": "Immobilien GmbH"
      }
    }
  }
}
```

### 3. Batch-Dokumentenanalyse

**POST** `/api/b2b/analyze/batch`

Startet eine Batch-Analyse für mehrere Dokumente.

**Request:**
```json
{
  "documents": [
    {
      "id": "doc_1",
      "type": "rental_contract",
      "url": "https://your-storage.com/doc1.pdf"
    },
    {
      "id": "doc_2",
      "type": "utility_bill",
      "url": "https://your-storage.com/doc2.pdf"
    }
  ]
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "batchJobId": "batch_abc123",
    "status": "pending",
    "totalItems": 2,
    "estimatedCompletionTime": "2024-01-01T12:05:00Z"
  }
}
```

### 4. KI-Chat-Anfrage

**POST** `/api/b2b/chat/query`

Sendet eine Anfrage an die KI und erhält eine rechtliche Einschätzung.

**Request:**
```json
{
  "query": "Kann ein Mieter die Miete wegen defekter Heizung mindern?",
  "context": {
    "propertyType": "apartment",
    "location": "Berlin"
  },
  "sessionId": "session_123"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "response": "Ja, bei einer defekten Heizung kann der Mieter grundsätzlich eine Mietminderung geltend machen...",
    "confidence": 0.92,
    "legalReferences": [
      {
        "reference": "§ 536 BGB",
        "title": "Minderung bei Sach- und Rechtsmängeln",
        "url": "https://www.gesetze-im-internet.de/bgb/__536.html"
      }
    ],
    "suggestedActions": [
      {
        "type": "document_generation",
        "description": "Mietminderungsschreiben erstellen",
        "templateType": "rent_reduction_letter"
      }
    ],
    "escalationRecommended": false
  }
}
```

### 5. Musterdokument-Generierung

**POST** `/api/b2b/templates/generate`

Generiert ein rechtliches Musterdokument basierend auf den bereitgestellten Daten.

**Request:**
```json
{
  "templateType": "rent_reduction_letter",
  "data": {
    "tenantName": "Max Mustermann",
    "tenantAddress": "Musterstraße 1, 12345 Berlin",
    "landlordName": "Vermieter GmbH",
    "landlordAddress": "Vermieterstraße 10, 12345 Berlin",
    "propertyAddress": "Musterstraße 1, 12345 Berlin",
    "issue": "Defekte Heizung seit 15.12.2023",
    "reductionAmount": 150.00,
    "reductionPercentage": 15
  }
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "templateType": "rent_reduction_letter",
    "content": "Sehr geehrte Damen und Herren,\n\nhiermit teile ich Ihnen mit, dass...",
    "metadata": {
      "wordCount": 245,
      "legalReferences": ["§ 536 BGB"],
      "generatedAt": "2024-01-01T12:00:00Z"
    },
    "instructions": [
      "Brief per Einschreiben versenden",
      "Kopie für eigene Unterlagen aufbewahren",
      "Frist von 14 Tagen setzen"
    ]
  }
}
```

### 6. Anwaltssuche

**GET** `/api/b2b/lawyers/search`

Sucht nach qualifizierten Mietrechtsanwälten.

**Query Parameters:**
- `location` (optional): Standort oder PLZ
- `specialization` (optional): Spezialisierung
- `limit` (optional): Anzahl Ergebnisse (max. 50)

**Response:**
```json
{
  "success": true,
  "data": {
    "lawyers": [
      {
        "id": "lawyer_123",
        "name": "Dr. Maria Schmidt",
        "location": "Berlin",
        "specializations": ["Mietrecht", "Wohnungseigentumsrecht"],
        "rating": 4.8,
        "reviewCount": 127,
        "hourlyRate": 180.00,
        "availableSlots": [
          "2024-01-15T10:00:00Z",
          "2024-01-15T14:00:00Z"
        ]
      }
    ],
    "total": 1
  }
}
```

### 7. Nutzungsstatistiken

**GET** `/api/b2b/analytics/usage`

Gibt Nutzungsstatistiken für den API-Key zurück.

**Query Parameters:**
- `period` (optional): `day`, `week`, `month` (default: `month`)

**Response:**
```json
{
  "success": true,
  "data": {
    "period": "month",
    "startDate": "2024-01-01T00:00:00Z",
    "endDate": "2024-01-31T23:59:59Z",
    "metrics": {
      "apiRequests": 1250,
      "documentAnalyses": 89,
      "chatInteractions": 456,
      "templateGenerations": 23
    },
    "quota": {
      "used": 1250,
      "limit": 10000,
      "remaining": 8750,
      "resetDate": "2024-02-01T00:00:00Z"
    }
  }
}
```

### 8. Webhook-Konfiguration

**POST** `/api/b2b/webhooks`

Konfiguriert Webhooks für Event-Benachrichtigungen.

**Request:**
```json
{
  "url": "https://your-app.com/webhooks/smartlaw",
  "events": [
    "document.analyzed",
    "batch.completed",
    "chat.escalated"
  ]
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "webhookId": "webhook_456",
    "url": "https://your-app.com/webhooks/smartlaw",
    "events": [
      "document.analyzed",
      "batch.completed",
      "chat.escalated"
    ],
    "secret": "whsec_1234567890abcdef..."
  }
}
```

## Webhook-Events

### Event-Typen

- `document.analyzed` - Dokumentenanalyse abgeschlossen
- `batch.completed` - Batch-Job abgeschlossen
- `batch.failed` - Batch-Job fehlgeschlagen
- `chat.escalated` - Chat-Anfrage eskaliert
- `template.generated` - Musterdokument generiert

### Webhook-Payload

```json
{
  "id": "evt_123",
  "type": "document.analyzed",
  "created": "2024-01-01T12:00:00Z",
  "data": {
    "documentId": "doc_789",
    "organizationId": "org_456",
    "analysis": {
      "riskLevel": "medium",
      "confidence": 0.85
    }
  }
}
```

### Webhook-Signatur-Verifizierung

Webhooks werden mit HMAC-SHA256 signiert:

```javascript
const crypto = require('crypto');

function verifyWebhookSignature(payload, signature, secret) {
  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(payload)
    .digest('hex');
  
  return signature === `sha256=${expectedSignature}`;
}
```

## Fehlerbehandlung

### HTTP-Status-Codes

- `200` - Erfolg
- `400` - Ungültige Anfrage
- `401` - Authentifizierung erforderlich
- `403` - Unzureichende Berechtigungen
- `429` - Rate Limit überschritten
- `500` - Serverfehler

### Fehler-Response-Format

```json
{
  "error": "invalid_request",
  "message": "The request is missing required parameters",
  "details": {
    "field": "documentType",
    "code": "required"
  }
}
```

### Häufige Fehler

#### Rate Limit überschritten
```json
{
  "error": "rate_limit_exceeded",
  "message": "Rate limit of 1000 requests per minute exceeded",
  "retryAfter": 60
}
```

#### Quota überschritten
```json
{
  "error": "quota_exceeded",
  "message": "Monthly quota of 10000 requests exceeded",
  "quotaUsed": 10000,
  "quotaLimit": 10000
}
```

## SDKs und Code-Beispiele

### JavaScript/Node.js

```javascript
const SmartLawAPI = require('@smartlaw/api');

const client = new SmartLawAPI({
  apiKey: 'sk_live_...',
  baseURL: 'https://api.smartlaw.de'
});

// Dokumentenanalyse
const analysis = await client.documents.analyze({
  file: fs.createReadStream('contract.pdf'),
  documentType: 'rental_contract'
});

// Chat-Anfrage
const response = await client.chat.query({
  query: 'Kann ich die Miete mindern?',
  sessionId: 'session_123'
});
```

### Python

```python
import smartlaw

client = smartlaw.Client(api_key='sk_live_...')

# Dokumentenanalyse
with open('contract.pdf', 'rb') as f:
    analysis = client.documents.analyze(
        file=f,
        document_type='rental_contract'
    )

# Chat-Anfrage
response = client.chat.query(
    query='Kann ich die Miete mindern?',
    session_id='session_123'
)
```

### cURL

```bash
# Dokumentenanalyse
curl -X POST https://api.smartlaw.de/api/b2b/analyze/document \
  -H "X-API-Key: sk_live_..." \
  -F "file=@contract.pdf" \
  -F "documentType=rental_contract"

# Chat-Anfrage
curl -X POST https://api.smartlaw.de/api/b2b/chat/query \
  -H "X-API-Key: sk_live_..." \
  -H "Content-Type: application/json" \
  -d '{
    "query": "Kann ich die Miete mindern?",
    "sessionId": "session_123"
  }'
```

## Best Practices

### 1. Fehlerbehandlung

Implementieren Sie robuste Fehlerbehandlung für alle API-Aufrufe:

```javascript
try {
  const result = await client.documents.analyze(params);
  // Erfolgreiche Verarbeitung
} catch (error) {
  if (error.status === 429) {
    // Rate Limit - Retry nach Wartezeit
    await sleep(error.retryAfter * 1000);
    return retry();
  } else if (error.status === 401) {
    // Authentifizierungsfehler - API-Key prüfen
    throw new Error('Invalid API key');
  }
  // Andere Fehler behandeln
}
```

### 2. Batch-Verarbeitung

Für große Datenmengen verwenden Sie Batch-Endpunkte:

```javascript
// Statt einzelner Requests
for (const doc of documents) {
  await client.documents.analyze(doc); // Ineffizient
}

// Batch-Verarbeitung verwenden
const batchJob = await client.documents.analyzeBatch({
  documents: documents
});

// Status überwachen
const result = await client.batches.waitForCompletion(batchJob.id);
```

### 3. Webhook-Implementierung

Verwenden Sie Webhooks für asynchrone Verarbeitung:

```javascript
app.post('/webhooks/smartlaw', (req, res) => {
  const signature = req.headers['x-smartlaw-signature'];
  
  if (!verifySignature(req.body, signature, webhookSecret)) {
    return res.status(401).send('Invalid signature');
  }
  
  const event = req.body;
  
  switch (event.type) {
    case 'document.analyzed':
      handleDocumentAnalyzed(event.data);
      break;
    case 'batch.completed':
      handleBatchCompleted(event.data);
      break;
  }
  
  res.status(200).send('OK');
});
```

## Support

### Kontakt

- **E-Mail**: api-support@smartlaw.de
- **Dokumentation**: https://docs.smartlaw.de
- **Status-Page**: https://status.smartlaw.de

### Rate Limit-Erhöhung

Für höhere Rate Limits kontaktieren Sie unser Sales-Team unter enterprise@smartlaw.de.

### SLA

- **Verfügbarkeit**: 99.9%
- **Response Time**: < 500ms (95. Perzentil)
- **Support Response**: < 4 Stunden (Business-Tage)