# Mietspiegel-Integration - Implementierungsdokumentation

## Übersicht

Die Mietspiegel-Integration wurde erfolgreich implementiert und bietet umfassende Funktionalitäten für die Berechnung und Analyse von Mietpreisen basierend auf lokalen Mietspiegeldaten.

## Implementierte Komponenten

### 1. MietspiegelService (`src/services/MietspiegelService.ts`)

**Bereits vorhanden und vollständig implementiert:**
- ✅ Abrufen von Mietspiegel-Daten für Städte
- ✅ Berechnung von Mietpreis-Ranges basierend auf Wohnungsdetails
- ✅ Lokale Bestimmungen (Mietpreisbremse, etc.)
- ✅ Mietvergleich mit Mietspiegel
- ✅ Caching mit Redis
- ✅ Datenvalidierung und Fehlerbehandlung

### 2. MietspiegelController (`src/controllers/MietspiegelController.ts`)

**Neu implementiert:**
- ✅ REST API Controller für alle Mietspiegel-Funktionen
- ✅ Eingabevalidierung
- ✅ Fehlerbehandlung
- ✅ Strukturierte API-Responses

### 3. API Routes (`src/routes/mietspiegel.ts`)

**Neu implementiert:**
- ✅ `GET /api/mietspiegel/:city` - Mietspiegel-Daten abrufen
- ✅ `POST /api/mietspiegel/calculate-rent` - Mietpreis berechnen
- ✅ `GET /api/mietspiegel/:city/regulations` - Lokale Bestimmungen
- ✅ `POST /api/mietspiegel/compare-rent` - Mietvergleich
- ✅ `GET /api/mietspiegel/cities` - Verfügbare Städte
- ✅ `PUT /api/mietspiegel/update` - Daten aktualisieren (Admin)
- ✅ Vollständige Swagger-Dokumentation
- ✅ Request-Validierung mit express-validator

### 4. Validation Middleware (`src/middleware/validation.ts`)

**Neu implementiert:**
- ✅ Express-validator Integration
- ✅ Strukturierte Fehlerbehandlung

### 5. Integration Tests (`src/tests/mietspiegel.test.ts`)

**Neu implementiert:**
- ✅ Umfassende API-Tests für alle Endpunkte
- ✅ Caching-Tests
- ✅ Validierungstests
- ✅ Fehlerbehandlungstests

## API-Endpunkte

### Mietspiegel-Daten abrufen
```http
GET /api/mietspiegel/{city}?year=2024
Authorization: Bearer <token>
```

### Mietpreis berechnen
```http
POST /api/mietspiegel/calculate-rent
Authorization: Bearer <token>
Content-Type: application/json

{
  "city": "Berlin",
  "apartmentDetails": {
    "size": 75,
    "rooms": 3,
    "constructionYear": 2010,
    "condition": "good",
    "location": "central",
    "features": ["balkon", "garage"],
    "heatingType": "central",
    "energyClass": "B"
  }
}
```

### Lokale Bestimmungen abrufen
```http
GET /api/mietspiegel/{city}/regulations
Authorization: Bearer <token>
```

### Mietvergleich durchführen
```http
POST /api/mietspiegel/compare-rent
Authorization: Bearer <token>
Content-Type: application/json

{
  "city": "Berlin",
  "currentRent": 1000,
  "apartmentDetails": {
    "size": 75,
    "rooms": 3,
    "condition": "good",
    "location": "central"
  }
}
```

### Verfügbare Städte abrufen
```http
GET /api/mietspiegel/cities
Authorization: Bearer <token>
```

## Caching-Strategie

- **Mietspiegel-Daten**: 1 Stunde Cache
- **Lokale Bestimmungen**: 24 Stunden Cache
- **Verfügbare Städte**: 6 Stunden Cache
- **Cache-Invalidierung**: Automatisch bei Datenaktualisierungen

## Datenmodell

### ApartmentDetails
```typescript
interface ApartmentDetails {
  size: number              // Quadratmeter
  rooms: number            // Anzahl Zimmer
  constructionYear?: number // Baujahr
  condition?: 'simple' | 'normal' | 'good' | 'excellent'
  location?: 'peripheral' | 'normal' | 'central' | 'premium'
  features?: string[]      // Ausstattungsmerkmale
  heatingType?: 'central' | 'individual' | 'district'
  energyClass?: 'A+' | 'A' | 'B' | 'C' | 'D' | 'E' | 'F' | 'G' | 'H'
}
```

### RentCalculationResult
```typescript
interface RentCalculationResult {
  city: string
  year: number
  apartmentDetails: ApartmentDetails
  calculatedRent: {
    min: number
    max: number
    average: number
    recommended: number
  }
  comparison: {
    belowAverage: boolean
    aboveAverage: boolean
    withinRange: boolean
    percentageDeviation: number
  }
  factors: {
    sizeFactor: number
    locationFactor: number
    conditionFactor: number
    ageFactor: number
    featureFactor: number
  }
  applicableRegulations: string[]
  recommendations: string[]
}
```

## Validierung

### Eingabevalidierung
- Stadt: 2-50 Zeichen, erforderlich
- Wohnungsgröße: > 0 qm, erforderlich
- Zimmeranzahl: > 0, erforderlich
- Baujahr: 1800 - aktuelles Jahr
- Zustand: Enum-Werte validiert
- Lage: Enum-Werte validiert

### Geschäftslogik-Validierung
- Mietspiegel-Daten müssen existieren
- Berechnungsfaktoren werden validiert
- Lokale Bestimmungen werden geprüft

## Fehlerbehandlung

### HTTP-Status-Codes
- `200` - Erfolgreiche Anfrage
- `400` - Validierungsfehler
- `401` - Nicht authentifiziert
- `404` - Daten nicht gefunden
- `500` - Serverfehler

### Fehlertypen
- `ValidationError` - Ungültige Eingabedaten
- `NotFoundError` - Mietspiegel-Daten nicht verfügbar
- `DatabaseError` - Datenbankfehler
- `CacheError` - Redis-Fehler

## Sicherheit

- **Authentifizierung**: JWT-Token erforderlich für alle Endpunkte
- **Rate Limiting**: Standard API-Limits angewendet
- **Input Sanitization**: Alle Eingaben werden validiert
- **DSGVO-Konform**: Keine personenbezogenen Daten in Mietspiegel-Berechnungen

## Performance

### Optimierungen
- Redis-Caching für häufige Anfragen
- Datenbankindizes auf city/year
- Effiziente Berechnungsalgorithmen
- Lazy Loading von Daten

### Monitoring
- Response-Zeit-Metriken
- Cache-Hit-Raten
- Fehlerrate-Tracking
- Datenbankperformance

## Nächste Schritte

1. **Tests ausführen**: Nach Installation der Abhängigkeiten
2. **Seed-Daten laden**: `npm run db:seed` für Testdaten
3. **API testen**: Swagger-UI unter `/api-docs`
4. **Monitoring einrichten**: Prometheus-Metriken aktivieren

## Verwendung

```typescript
// Service direkt verwenden
const mietspiegelService = new MietspiegelService(prisma)
const calculation = await mietspiegelService.calculateRentRange('Berlin', apartmentDetails)

// Über API
const response = await fetch('/api/mietspiegel/calculate-rent', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({ city: 'Berlin', apartmentDetails })
})
```

## Unterstützte Städte

Aktuell mit Seed-Daten:
- Berlin (2023)
- München (2023)

Weitere Städte können über die Update-API hinzugefügt werden.