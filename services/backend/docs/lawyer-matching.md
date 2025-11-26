# Lawyer Matching Service - Dokumentation

## Übersicht

Der LawyerMatchingService ermöglicht die intelligente Vermittlung von Nutzern zu spezialisierten Mietrechtsanwälten. Er bietet Suchfunktionen, Match-Scoring und ein Bewertungssystem.

## Features

- **Intelligente Suche** mit mehreren Filterkriterien
- **Geografische Nähe** - Distanzberechnung und Sortierung
- **Match-Scoring** - Automatische Bewertung der Eignung
- **Spezialisierungs-Erkennung** aus Fallbeschreibungen
- **Bewertungssystem** für Anwälte
- **Automatische Empfehlungen** basierend auf Fall-Risiko
- **Verfügbarkeits-Prüfung** mit Zeitslots

## API-Verwendung

### Anwälte suchen

```typescript
import { LawyerMatchingService } from './services/LawyerMatchingService';

const lawyerService = new LawyerMatchingService(prisma);

const result = await lawyerService.searchLawyers({
  location: 'Berlin, 10115',
  specializations: ['Mietminderung', 'Kündigungsschutz'],
  maxDistance: 20, // km
  minRating: 4.0,
  languages: ['de'],
  maxHourlyRate: 250,
  availableFrom: new Date(),
  availableTo: new Date('2024-12-31')
}, 1, 10); // page, limit

console.log('Gefundene Anwälte:', result.lawyers.length);
console.log('Gesamt:', result.total);
console.log('Seite:', result.page, 'von', result.totalPages);

result.lawyers.forEach(lawyer => {
  console.log(`${lawyer.name} - ${lawyer.rating}/5`);
  console.log(`Distanz: ${lawyer.distance} km`);
  console.log(`Verfügbare Termine: ${lawyer.availableSlots?.length}`);
});
```

### Beste Matches finden

```typescript
const matches = await lawyerService.findBestMatches(
  'Meine Heizung ist seit 3 Wochen kaputt und ich möchte die Miete mindern',
  'Berlin, 10115',
  5 // Top 5 Matches
);

matches.forEach(lawyer => {
  console.log(`${lawyer.name}`);
  console.log(`Spezialisierungen: ${lawyer.specializations.join(', ')}`);
  console.log(`Bewertung: ${lawyer.rating}/5 (${lawyer.reviewCount} Bewertungen)`);
  console.log(`Distanz: ${lawyer.distance} km`);
});
```

### Anwaltsprofil abrufen

```typescript
const profile = await lawyerService.getLawyerProfile('lawyer-id');

if (profile) {
  console.log('Name:', profile.name);
  console.log('Spezialisierungen:', profile.specializations);
  console.log('Standort:', profile.location);
  console.log('Bewertung:', profile.rating);
  console.log('Stundensatz:', profile.hourlyRate, 'EUR');
  console.log('Sprachen:', profile.languages);
  
  console.log('\nVerfügbare Termine:');
  profile.availableSlots?.forEach(slot => {
    console.log(`- ${slot.startTime} bis ${slot.endTime}`);
  });
  
  console.log('\nAktuelle Bewertungen:');
  profile.reviewSummary?.recentReviews.forEach(review => {
    console.log(`${review.rating}/5: ${review.comment}`);
  });
}
```

### Bewertung hinzufügen

```typescript
await lawyerService.addReview(
  'lawyer-id',
  'user-id',
  'booking-id',
  5, // Rating 1-5
  'Sehr kompetent und hilfsbereit. Hat mir bei meinem Mietproblem sehr geholfen.'
);
```

### Anwalt für Fall empfehlen

```typescript
const recommendation = await lawyerService.recommendLawyerForCase(
  'case-id',
  'user-id'
);

if (recommendation.shouldRecommend) {
  console.log('Empfehlung:', recommendation.reason);
  console.log('Passende Anwälte:');
  
  recommendation.lawyers?.forEach(lawyer => {
    console.log(`- ${lawyer.name} (${lawyer.rating}/5)`);
  });
}
```

## Suchkriterien

### LawyerSearchCriteria Interface

```typescript
interface LawyerSearchCriteria {
  location?: string;              // "Berlin, 10115"
  specializations?: string[];     // ["Mietminderung", "Kündigung"]
  maxDistance?: number;           // in km
  minRating?: number;             // 1.0 - 5.0
  languages?: string[];           // ["de", "en"]
  availableFrom?: Date;           // Frühester Termin
  availableTo?: Date;             // Spätester Termin
  maxHourlyRate?: number;         // in EUR
}
```

### Beispiele

```typescript
// Nur hochbewertete Anwälte in der Nähe
const topLawyers = await lawyerService.searchLawyers({
  location: 'München, 80331',
  maxDistance: 10,
  minRating: 4.5
});

// Spezialisierte Anwälte mit Verfügbarkeit
const available = await lawyerService.searchLawyers({
  specializations: ['Kündigungsschutz'],
  availableFrom: new Date(),
  availableTo: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // nächste 7 Tage
});

// Günstige Anwälte
const affordable = await lawyerService.searchLawyers({
  maxHourlyRate: 150,
  minRating: 4.0
});

// Mehrsprachige Anwälte
const multilingual = await lawyerService.searchLawyers({
  languages: ['de', 'en', 'tr']
});
```

## Match-Scoring

Der Service berechnet automatisch einen Match-Score (0-100) basierend auf:

### Scoring-Faktoren

1. **Spezialisierung (40 Punkte)**
   - Übereinstimmung mit benötigten Spezialisierungen
   - Je mehr Matches, desto höher der Score

2. **Bewertung (30 Punkte)**
   - Durchschnittliche Bewertung des Anwalts
   - 5/5 = 30 Punkte, 4/5 = 24 Punkte, etc.

3. **Verfügbarkeit (15 Punkte)**
   - Vorhandensein freier Termine
   - Mehr Termine = höherer Score

4. **Distanz (15 Punkte)**
   - Geografische Nähe zum Nutzer
   - < 10 km = volle Punkte
   - Jeder weitere km reduziert Score

### Beispiel

```typescript
// Anwalt mit perfektem Match:
// - Spezialisierung: Mietminderung ✓ (40 Punkte)
// - Bewertung: 4.8/5 (28.8 Punkte)
// - Verfügbarkeit: 3 Termine (15 Punkte)
// - Distanz: 5 km (14 Punkte)
// = 97.8 Punkte (Excellent Match)
```

## Spezialisierungs-Erkennung

Der Service erkennt automatisch benötigte Spezialisierungen aus Fallbeschreibungen:

### Erkannte Keywords

| Keyword | Spezialisierung |
|---------|----------------|
| mietminderung | Mietminderung |
| kündigung | Kündigungsschutz |
| nebenkosten, betriebskosten | Nebenkostenabrechnung |
| mieterhöhung | Mieterhöhung |
| schimmel, mangel | Mängel und Schäden |
| modernisierung | Modernisierung |
| kaution | Kaution |

### Beispiele

```typescript
// "Meine Heizung ist kaputt" → ["Mängel und Schäden"]
// "Kündigung erhalten" → ["Kündigungsschutz"]
// "Nebenkosten zu hoch" → ["Nebenkostenabrechnung"]
// "Schimmel in der Wohnung" → ["Mängel und Schäden"]
```

## Distanzberechnung

### Vereinfachte Implementierung

Aktuell basiert auf PLZ-Differenz:
- 1 PLZ-Punkt ≈ 2 km
- Beispiel: 10115 → 10178 = 63 * 2 = 126 km

### Produktion

In Produktion sollte eine Geocoding-API verwendet werden:

```typescript
// Google Maps Distance Matrix API
// Mapbox Distance API
// OpenStreetMap Nominatim
```

## Bewertungssystem

### Bewertung hinzufügen

**Voraussetzungen:**
- Buchung muss abgeschlossen sein (`COMPLETED`)
- Nutzer muss Buchung erstellt haben
- Buchung darf noch nicht bewertet sein

**Validierung:**
- Rating: 1-5 (Integer)
- Kommentar: Optional

```typescript
try {
  await lawyerService.addReview(
    'lawyer-id',
    'user-id',
    'booking-id',
    5,
    'Sehr gute Beratung!'
  );
} catch (error) {
  if (error.message.includes('Rating must be')) {
    // Ungültiges Rating
  } else if (error.message.includes('completed')) {
    // Buchung nicht abgeschlossen
  } else if (error.message.includes('already reviewed')) {
    // Bereits bewertet
  }
}
```

### Automatische Rating-Aktualisierung

Nach jeder neuen Bewertung wird automatisch:
1. Durchschnittliche Bewertung neu berechnet
2. Anzahl der Bewertungen aktualisiert
3. Anwaltsprofil aktualisiert

## Automatische Empfehlungen

### Empfehlungskriterien

Der Service empfiehlt automatisch einen Anwalt wenn:

1. **Kündigungsfall** (`category === 'TERMINATION'`)
   - Grund: "Kündigungen erfordern professionelle rechtliche Beratung"

2. **Hohe Priorität** (`priority === 'HIGH'`)
   - Grund: "Hohe Priorität des Falls"

### Verwendung

```typescript
const recommendation = await lawyerService.recommendLawyerForCase(
  caseId,
  userId
);

if (recommendation.shouldRecommend) {
  // Zeige Empfehlung
  showRecommendation(recommendation.reason, recommendation.lawyers);
} else {
  // Keine Empfehlung nötig
  continueWithAI();
}
```

## LawyerProfile Interface

```typescript
interface LawyerProfile {
  id: string;
  name: string;
  email: string;
  specializations: string[];
  location: string;
  rating: number;
  reviewCount: number;
  hourlyRate: number | null;
  languages: string[];
  verified: boolean;
  isActive: boolean;
  
  // Erweiterte Felder
  distance?: number; // in km
  availableSlots?: Array<{
    id: string;
    startTime: Date;
    endTime: Date;
  }>;
  reviewSummary?: {
    averageRating: number;
    totalReviews: number;
    recentReviews: Array<{
      rating: number;
      comment: string;
      createdAt: Date;
    }>;
  };
}
```

## Integration mit Express

### Such-Endpoint

```typescript
app.get('/api/lawyers/search', async (req, res) => {
  try {
    const criteria: LawyerSearchCriteria = {
      location: req.query.location as string,
      specializations: req.query.specializations 
        ? (req.query.specializations as string).split(',')
        : undefined,
      maxDistance: req.query.maxDistance 
        ? parseInt(req.query.maxDistance as string)
        : undefined,
      minRating: req.query.minRating 
        ? parseFloat(req.query.minRating as string)
        : undefined
    };

    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;

    const result = await lawyerService.searchLawyers(criteria, page, limit);

    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
```

### Match-Endpoint

```typescript
app.post('/api/lawyers/find-matches', async (req, res) => {
  try {
    const { caseDescription, userLocation, limit } = req.body;

    const matches = await lawyerService.findBestMatches(
      caseDescription,
      userLocation,
      limit || 5
    );

    res.json({ matches });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
```

### Bewertungs-Endpoint

```typescript
app.post('/api/lawyers/:lawyerId/reviews', async (req, res) => {
  try {
    const { lawyerId } = req.params;
    const { bookingId, rating, comment } = req.body;
    const userId = req.user.id;

    await lawyerService.addReview(
      lawyerId,
      userId,
      bookingId,
      rating,
      comment
    );

    res.json({ success: true });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});
```

## Best Practices

### 1. Caching
Cache häufige Suchanfragen:

```typescript
const cache = new Map();
const cacheKey = JSON.stringify(criteria);

if (cache.has(cacheKey)) {
  return cache.get(cacheKey);
}

const result = await lawyerService.searchLawyers(criteria);
cache.set(cacheKey, result);
```

### 2. Pagination
Verwende immer Pagination für große Ergebnismengen:

```typescript
const pageSize = 10;
let page = 1;
let hasMore = true;

while (hasMore) {
  const result = await lawyerService.searchLawyers(criteria, page, pageSize);
  
  // Verarbeite Ergebnisse
  processLawyers(result.lawyers);
  
  hasMore = page < result.totalPages;
  page++;
}
```

### 3. Fehlerbehandlung
Fange spezifische Fehler ab:

```typescript
try {
  await lawyerService.addReview(lawyerId, userId, bookingId, rating);
} catch (error) {
  if (error instanceof ValidationError) {
    // Validierungsfehler
  } else if (error instanceof NotFoundError) {
    // Nicht gefunden
  } else {
    // Anderer Fehler
  }
}
```

### 4. Distanz-Optimierung
Verwende Geocoding-API für präzise Distanzen:

```typescript
// Beispiel mit Google Maps
async calculateDistance(loc1: string, loc2: string): Promise<number> {
  const response = await googleMaps.distanceMatrix({
    origins: [loc1],
    destinations: [loc2]
  });
  
  return response.rows[0].elements[0].distance.value / 1000; // in km
}
```

## Testing

```bash
# Alle Tests ausführen
npm test -- lawyerMatching.test.ts

# Spezifischen Test ausführen
npm test -- lawyerMatching.test.ts -t "should search lawyers"
```

## Beispiel-Workflow

```typescript
// 1. Nutzer beschreibt Problem
const caseDescription = "Meine Heizung ist kaputt und der Vermieter reagiert nicht";
const userLocation = "Berlin, 10115";

// 2. Finde beste Matches
const matches = await lawyerService.findBestMatches(
  caseDescription,
  userLocation,
  5
);

// 3. Zeige Matches dem Nutzer
console.log('Top 5 Anwälte für Ihren Fall:');
matches.forEach((lawyer, index) => {
  console.log(`${index + 1}. ${lawyer.name}`);
  console.log(`   Bewertung: ${lawyer.rating}/5`);
  console.log(`   Distanz: ${lawyer.distance} km`);
  console.log(`   Verfügbar: ${lawyer.availableSlots?.length} Termine`);
});

// 4. Nutzer wählt Anwalt
const selectedLawyer = matches[0];

// 5. Zeige Profil
const profile = await lawyerService.getLawyerProfile(selectedLawyer.id);

// 6. Nutzer bucht Termin (siehe BookingService)

// 7. Nach Beratung: Bewertung
await lawyerService.addReview(
  selectedLawyer.id,
  userId,
  bookingId,
  5,
  'Sehr hilfreich!'
);
```

## Support

Bei Fragen oder Problemen:
- Dokumentation: `/docs/lawyer-matching.md`
- Tests: `/src/tests/lawyerMatching.test.ts`
- Service: `/src/services/LawyerMatchingService.ts`
