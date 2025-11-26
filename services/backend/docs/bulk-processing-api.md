# Bulk Processing API - SmartLaw Mietrecht Agent

## Übersicht

Die Bulk Processing API ermöglicht es Business-Kunden, große Mengen von Dokumenten und Chat-Anfragen effizient zu verarbeiten. Diese API ist speziell für Wohnungsgenossenschaften, Hausverwaltungen und andere Organisationen konzipiert, die regelmäßig viele mietrechtliche Anfragen bearbeiten müssen.

## Authentifizierung

Alle Bulk-Processing-Endpunkte erfordern eine gültige API-Key-Authentifizierung über den `X-API-Key` Header.

```http
X-API-Key: your-api-key-here
```

## Bulk Document Analysis

### Batch-Analyse starten

Startet eine asynchrone Batch-Analyse für mehrere Dokumente.

**Endpunkt:** `POST /api/b2b/analyze/batch`

**Berechtigungen:** `document:batch`

**Request Body:**
```json
{
  "documents": [
    {
      "id": "doc_001",
      "filename": "mietvertrag_001.pdf",
      "content": "base64-encoded-content",
      "mimeType": "application/pdf",
      "type": "rental_contract",
      "metadata": {
        "tenant": "Max Mustermann",
        "property": "Musterstraße 1, Berlin"
      }
    },
    {
      "id": "doc_002",
      "filename": "nebenkosten_002.pdf",
      "content": "base64-encoded-content",
      "mimeType": "application/pdf",
      "type": "utility_bill",
      "metadata": {
        "period": "2024",
        "property": "Musterstraße 2, Berlin"
      }
    }
  ],
  "webhookUrl": "https://your-domain.com/webhook/batch-complete"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "batchJobId": "job_abc123",
    "status": "pending",
    "totalItems": 2,
    "estimatedCompletionTime": "2024-11-12T15:30:00Z",
    "statusUrl": "/api/b2b/bulk/status/job_abc123"
  }
}
```

### Unterstützte Dokumenttypen

- `rental_contract` - Mietverträge
- `utility_bill` - Nebenkostenabrechnungen
- `warning_letter` - Abmahnungen
- `termination` - Kündigungsschreiben

## Bulk Chat Processing

### Bulk Chat-Anfragen

Verarbeitet mehrere Chat-Anfragen in einem Batch.

**Endpunkt:** `POST /api/b2b/chat/bulk`

**Berechtigungen:** `chat:bulk`

**Request Body:**
```json
{
  "queries": [
    {
      "id": "query_001",
      "query": "Kann ich die Miete mindern wenn die Heizung seit 2 Wochen kaputt ist?",
      "context": {
        "location": "Berlin",
        "propertyType": "apartment",
        "tenantType": "private"
      },
      "sessionId": "session_123"
    },
    {
      "id": "query_002",
      "query": "Wie hoch darf eine Mieterhöhung in München sein?",
      "context": {
        "location": "München",
        "currentRent": 1200
      }
    }
  ],
  "webhookUrl": "https://your-domain.com/webhook/chat-bulk-complete"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "batchJobId": "job_def456",
    "status": "pending",
    "totalItems": 2,
    "estimatedCompletionTime": "2024-11-12T15:25:00Z",
    "statusUrl": "/api/b2b/bulk/status/job_def456"
  }
}
```

## Job Management

### Job-Status abrufen

**Endpunkt:** `GET /api/b2b/bulk/status/{jobId}`

**Berechtigungen:** `bulk:read`

**Response:**
```json
{
  "success": true,
  "data": {
    "jobId": "job_abc123",
    "status": "processing",
    "totalItems": 100,
    "processedItems": 45,
    "successfulItems": 42,
    "failedItems": 3,
    "progress": 45,
    "estimatedTimeRemaining": 275,
    "results": [
      {
        "id": "doc_001",
        "result": {
          "documentId": "doc_uuid_001",
          "riskLevel": "medium",
          "confidence": 0.87,
          "issueCount": 2,
          "recommendationCount": 3
        }
      }
    ],
    "errors": [
      {
        "id": "doc_003",
        "error": "Document format not supported"
      }
    ]
  }
}
```

### Job-Status-Werte

- `pending` - Job wartet auf Verarbeitung
- `processing` - Job wird aktuell verarbeitet
- `completed` - Job erfolgreich abgeschlossen
- `failed` - Job fehlgeschlagen
- `cancelled` - Job wurde abgebrochen

### Job abbrechen

**Endpunkt:** `POST /api/b2b/bulk/cancel/{jobId}`

**Berechtigungen:** `bulk:manage`

**Response:**
```json
{
  "success": true,
  "message": "Batch job cancelled successfully"
}
```

### Alle Jobs auflisten

**Endpunkt:** `GET /api/b2b/bulk/jobs`

**Berechtigungen:** `bulk:read`

**Query Parameter:**
- `status` - Filtere nach Job-Status
- `type` - Filtere nach Job-Typ
- `limit` - Anzahl Ergebnisse (Standard: 50, Max: 100)
- `offset` - Offset für Paginierung

**Response:**
```json
{
  "success": true,
  "data": {
    "jobs": [
      {
        "id": "job_abc123",
        "type": "document_analysis",
        "status": "completed",
        "totalItems": 50,
        "processedItems": 50,
        "createdAt": "2024-11-12T14:00:00Z",
        "completedAt": "2024-11-12T14:15:00Z"
      }
    ],
    "pagination": {
      "total": 25,
      "limit": 50,
      "offset": 0,
      "hasMore": false
    }
  }
}
```

## Analytics und Reporting

### Erweiterte Analytics

**Endpunkt:** `GET /api/b2b/analytics/advanced`

**Berechtigungen:** `analytics:advanced`

**Query Parameter:**
- `startDate` - Start-Datum (ISO 8601)
- `endDate` - End-Datum (ISO 8601)
- `groupBy` - Gruppierung: `day`, `week`, `month`

**Response:**
```json
{
  "success": true,
  "data": {
    "period": {
      "start": "2024-10-12T00:00:00Z",
      "end": "2024-11-12T00:00:00Z",
      "groupBy": "day"
    },
    "metrics": {
      "totalRequests": 1250,
      "documentAnalyses": 800,
      "chatInteractions": 350,
      "templateGenerations": 100,
      "bulkJobs": 25,
      "averageConfidence": 0.84,
      "topDocumentTypes": [
        { "type": "rental_contract", "count": 400 },
        { "type": "utility_bill", "count": 250 }
      ],
      "riskLevelDistribution": [
        { "level": "low", "count": 500 },
        { "level": "medium", "count": 250 },
        { "level": "high", "count": 50 }
      ],
      "errorRate": 0.02
    },
    "quota": {
      "used": 8500,
      "limit": 10000,
      "remaining": 1500,
      "utilizationRate": 85
    }
  }
}
```

### Nutzungsbericht

**Endpunkt:** `GET /api/b2b/analytics/report`

**Berechtigungen:** `analytics:read`

**Query Parameter:**
- `period` - Berichtszeitraum: `week`, `month`, `quarter`

**Response:**
```json
{
  "success": true,
  "data": {
    "organizationId": "org_123",
    "reportPeriod": "month",
    "generatedAt": "2024-11-12T15:00:00Z",
    "summary": {
      "totalApiCalls": 1250,
      "totalDocuments": 800,
      "totalChatMessages": 350,
      "totalBulkJobs": 25,
      "successRate": 98
    },
    "breakdown": {
      "byService": [
        { "service": "Document Analysis", "count": 800, "percentage": 64 },
        { "service": "Chat Interactions", "count": 350, "percentage": 28 },
        { "service": "Template Generation", "count": 100, "percentage": 8 }
      ]
    },
    "recommendations": [
      "Ihre Bulk-Processing-Nutzung ist effizient. Erwägen Sie weitere Automatisierung.",
      "Die durchschnittliche Dokumentenqualität ist hoch (Konfidenz: 84%)."
    ]
  }
}
```

### Analytics exportieren

**Endpunkt:** `GET /api/b2b/analytics/export`

**Berechtigungen:** `analytics:export`

**Query Parameter:**
- `startDate` - Start-Datum
- `endDate` - End-Datum
- `format` - Export-Format: `json`, `csv`, `pdf`

**Response:** Datei-Download im gewählten Format

## Webhooks

### Webhook-Konfiguration

**Endpunkt:** `POST /api/b2b/webhooks`

**Berechtigungen:** `webhook:manage`

**Request Body:**
```json
{
  "url": "https://your-domain.com/webhook",
  "events": [
    "batch.completed",
    "batch.failed",
    "quota.warning"
  ]
}
```

### Webhook-Events

#### batch.completed
```json
{
  "event": "batch.completed",
  "jobId": "job_abc123",
  "organizationId": "org_123",
  "timestamp": "2024-11-12T15:30:00Z",
  "data": {
    "type": "document_analysis",
    "totalItems": 100,
    "successfulItems": 97,
    "failedItems": 3,
    "processingTime": 450
  }
}
```

#### batch.failed
```json
{
  "event": "batch.failed",
  "jobId": "job_def456",
  "organizationId": "org_123",
  "timestamp": "2024-11-12T15:35:00Z",
  "data": {
    "error": "Service temporarily unavailable",
    "processedItems": 25,
    "totalItems": 100
  }
}
```

## Rate Limits und Quotas

### Standard-Limits

- **Rate Limit:** 1000 Requests pro Minute
- **Batch-Größe:** Max. 100 Items pro Batch
- **Monatliche Quota:** Abhängig vom Plan
  - Basic: 10.000 Requests
  - Professional: 50.000 Requests
  - Enterprise: 200.000 Requests

### Quota-Überwachung

Alle API-Responses enthalten Header mit aktueller Quota-Nutzung:

```http
X-RateLimit-Limit: 1000
X-RateLimit-Remaining: 847
X-RateLimit-Reset: 1699876800
X-Quota-Limit: 50000
X-Quota-Used: 12450
X-Quota-Remaining: 37550
```

## Fehlerbehandlung

### Standard-Fehlercodes

- `400` - Bad Request (ungültige Parameter)
- `401` - Unauthorized (ungültiger API-Key)
- `403` - Forbidden (unzureichende Berechtigungen)
- `404` - Not Found (Job nicht gefunden)
- `429` - Too Many Requests (Rate Limit überschritten)
- `500` - Internal Server Error

### Fehler-Response-Format

```json
{
  "error": "Rate limit exceeded",
  "message": "Rate limit of 1000 requests per minute exceeded",
  "code": "RATE_LIMIT_EXCEEDED",
  "retryAfter": 60
}
```

## Best Practices

### Performance-Optimierung

1. **Batch-Größe:** Verwenden Sie Batches von 20-50 Items für optimale Performance
2. **Parallele Jobs:** Vermeiden Sie zu viele gleichzeitige Jobs
3. **Webhooks:** Nutzen Sie Webhooks statt Polling für Job-Status-Updates
4. **Caching:** Implementieren Sie Client-seitiges Caching für Analytics-Daten

### Fehlerbehandlung

1. **Retry-Logic:** Implementieren Sie exponential backoff für fehlgeschlagene Requests
2. **Partial Success:** Behandeln Sie teilweise erfolgreiche Batches angemessen
3. **Monitoring:** Überwachen Sie Ihre Fehlerrate und Quota-Nutzung

### Sicherheit

1. **API-Key-Rotation:** Rotieren Sie API-Keys regelmäßig
2. **HTTPS:** Verwenden Sie immer HTTPS für API-Calls
3. **Webhook-Validierung:** Validieren Sie Webhook-Signaturen
4. **Datenminimierung:** Senden Sie nur notwendige Daten

## Code-Beispiele

### Node.js/JavaScript

```javascript
const axios = require('axios');

class SmartLawBulkAPI {
  constructor(apiKey, baseUrl = 'https://api.smartlaw.de') {
    this.apiKey = apiKey;
    this.baseUrl = baseUrl;
    this.client = axios.create({
      baseURL: baseUrl,
      headers: {
        'X-API-Key': apiKey,
        'Content-Type': 'application/json'
      }
    });
  }

  async startBatchAnalysis(documents, webhookUrl) {
    try {
      const response = await this.client.post('/api/b2b/analyze/batch', {
        documents,
        webhookUrl
      });
      return response.data;
    } catch (error) {
      throw new Error(`Batch analysis failed: ${error.response?.data?.message}`);
    }
  }

  async getJobStatus(jobId) {
    try {
      const response = await this.client.get(`/api/b2b/bulk/status/${jobId}`);
      return response.data;
    } catch (error) {
      throw new Error(`Failed to get job status: ${error.response?.data?.message}`);
    }
  }

  async waitForCompletion(jobId, pollInterval = 5000) {
    while (true) {
      const status = await this.getJobStatus(jobId);
      
      if (status.data.status === 'completed') {
        return status.data;
      } else if (status.data.status === 'failed') {
        throw new Error('Job failed');
      }
      
      await new Promise(resolve => setTimeout(resolve, pollInterval));
    }
  }
}

// Verwendung
const api = new SmartLawBulkAPI('your-api-key');

const documents = [
  {
    id: 'doc1',
    filename: 'contract.pdf',
    content: Buffer.from(pdfContent).toString('base64'),
    mimeType: 'application/pdf',
    type: 'rental_contract'
  }
];

api.startBatchAnalysis(documents)
  .then(result => {
    console.log('Batch started:', result.data.batchJobId);
    return api.waitForCompletion(result.data.batchJobId);
  })
  .then(finalResult => {
    console.log('Analysis completed:', finalResult);
  })
  .catch(error => {
    console.error('Error:', error.message);
  });
```

### Python

```python
import requests
import time
import base64

class SmartLawBulkAPI:
    def __init__(self, api_key, base_url='https://api.smartlaw.de'):
        self.api_key = api_key
        self.base_url = base_url
        self.session = requests.Session()
        self.session.headers.update({
            'X-API-Key': api_key,
            'Content-Type': 'application/json'
        })

    def start_batch_analysis(self, documents, webhook_url=None):
        url = f"{self.base_url}/api/b2b/analyze/batch"
        payload = {
            'documents': documents,
            'webhookUrl': webhook_url
        }
        
        response = self.session.post(url, json=payload)
        response.raise_for_status()
        return response.json()

    def get_job_status(self, job_id):
        url = f"{self.base_url}/api/b2b/bulk/status/{job_id}"
        response = self.session.get(url)
        response.raise_for_status()
        return response.json()

    def wait_for_completion(self, job_id, poll_interval=5):
        while True:
            status = self.get_job_status(job_id)
            
            if status['data']['status'] == 'completed':
                return status['data']
            elif status['data']['status'] == 'failed':
                raise Exception('Job failed')
            
            time.sleep(poll_interval)

# Verwendung
api = SmartLawBulkAPI('your-api-key')

with open('contract.pdf', 'rb') as f:
    pdf_content = f.read()

documents = [{
    'id': 'doc1',
    'filename': 'contract.pdf',
    'content': base64.b64encode(pdf_content).decode('utf-8'),
    'mimeType': 'application/pdf',
    'type': 'rental_contract'
}]

result = api.start_batch_analysis(documents)
print(f"Batch started: {result['data']['batchJobId']}")

final_result = api.wait_for_completion(result['data']['batchJobId'])
print(f"Analysis completed: {final_result}")
```

## Support

Bei Fragen zur Bulk Processing API wenden Sie sich an:

- **E-Mail:** api-support@smartlaw.de
- **Dokumentation:** https://docs.smartlaw.de/bulk-processing
- **Status-Page:** https://status.smartlaw.de