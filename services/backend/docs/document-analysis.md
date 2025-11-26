# Document Analysis Service - Dokumentation

## Übersicht

Der DocumentAnalysisService ist eine zentrale Komponente des SmartLaw Mietrecht-Systems, die automatisierte Analyse von Mietdokumenten durchführt. Der Service erkennt rechtliche Probleme, bewertet Risiken und gibt konkrete Handlungsempfehlungen.

## Unterstützte Dokumenttypen

### 1. Mietverträge (RENTAL_CONTRACT)

**Analysefunktionen:**
- Erkennung unwirksamer Klauseln (Schönheitsreparaturen, Kleinreparaturen, Tierhaltung)
- Prüfung der Mietpreishöhe gegen lokalen Mietspiegel
- Validierung der Kaution (max. 3 Monatskaltmieten)
- Überprüfung von Kündigungsfristen
- Erkennung fehlender Pflichtangaben

**Beispiel-Issues:**
- Unwirksame Schönheitsreparaturklausel
- Überhöhte Miete (Mietpreisbremse)
- Zu hohe Kaution
- Verkürzte Kündigungsfristen

### 2. Nebenkostenabrechnungen (UTILITY_BILL)

**Analysefunktionen:**
- Prüfung des Abrechnungszeitraums (12 Monate)
- Erkennung nicht umlagefähiger Kosten
- Validierung der Abrechnungsfrist (12 Monate nach Periodenende)
- Plausibilitätsprüfung der Berechnungen

**Beispiel-Issues:**
- Nicht umlagefähige Verwaltungskosten
- Verspätete Abrechnung
- Ungültiger Abrechnungszeitraum
- Berechnungsfehler

### 3. Abmahnungen (WARNING_LETTER)

**Analysefunktionen:**
- Erkennung von Kündigungsandrohungen
- Prüfung gesetzter Fristen
- Validierung der formalen Anforderungen
- Bewertung der Dringlichkeit

**Beispiel-Issues:**
- Kündigungsandrohung (kritisch)
- Ablaufende Frist (dringend)
- Formale Mängel der Abmahnung

## API-Schnittstellen

### analyzeDocument(documentId: string)

Analysiert ein hochgeladenes Dokument und gibt eine vollständige Analyse zurück.

```typescript
const analysis = await documentAnalysisService.analyzeDocument('doc-123');

// Rückgabe:
{
  documentId: 'doc-123',
  documentType: 'RENTAL_CONTRACT',
  extractedData: {
    landlordName: 'Max Mustermann',
    tenantName: 'Erika Musterfrau',
    rentAmount: 1500,
    // ...
  },
  issues: [
    {
      type: 'excessive_rent',
      severity: 'warning',
      description: 'Die Miete liegt 25% über dem lokalen Mietspiegel.',
      legalBasis: '§ 556d BGB (Mietpreisbremse)',
      suggestedAction: 'Prüfen Sie, ob die Mietpreisbremse anwendbar ist.'
    }
  ],
  recommendations: [
    {
      type: 'rent_reduction',
      description: 'Mögliche Mietminderung aufgrund überhöhter Miete',
      priority: 'high',
      actionRequired: true,
      legalReferences: ['§ 556d BGB']
    }
  ],
  riskLevel: 'medium',
  confidence: 0.85,
  analyzedAt: '2024-01-15T10:30:00Z'
}
```

### getAnalysis(documentId: string)

Ruft eine bereits gespeicherte Analyse ab.

```typescript
const analysis = await documentAnalysisService.getAnalysis('doc-123');
```

### getUserAnalyses(userId: string)

Ruft alle Analysen eines Nutzers ab.

```typescript
const analyses = await documentAnalysisService.getUserAnalyses('user-456');
```

## Datenmodelle

### DocumentAnalysis

```typescript
interface DocumentAnalysis {
  documentId: string;
  documentType: DocumentType;
  extractedData: Record<string, any>;
  issues: Issue[];
  recommendations: Recommendation[];
  riskLevel: 'low' | 'medium' | 'high';
  confidence: number;
  analyzedAt: Date;
}
```

### Issue

```typescript
interface Issue {
  type: string;
  severity: 'info' | 'warning' | 'critical';
  description: string;
  legalBasis?: string;
  suggestedAction?: string;
}
```

### Recommendation

```typescript
interface Recommendation {
  type: string;
  description: string;
  priority: 'low' | 'medium' | 'high';
  actionRequired: boolean;
  legalReferences?: string[];
}
```

## Risikobewertung

Der Service bewertet das Risiko eines Dokuments auf drei Stufen:

- **LOW**: Keine kritischen Probleme gefunden
- **MEDIUM**: Warnungen vorhanden, die Aufmerksamkeit erfordern
- **HIGH**: Kritische Probleme, die sofortiges Handeln erfordern

**Risiko-Faktoren:**
- Unwirksame Klauseln → HIGH
- Kündigungsandrohungen → HIGH
- Überhöhte Miete/Kaution → MEDIUM
- Nicht umlagefähige Kosten → MEDIUM
- Fehlende Informationen → LOW

## Konfidenz-Bewertung

Die Konfidenz gibt an, wie sicher die Analyse ist (0.0 - 1.0):

- **> 0.8**: Hohe Konfidenz, viele Daten extrahiert
- **0.5 - 0.8**: Mittlere Konfidenz, einige Daten fehlen
- **< 0.5**: Niedrige Konfidenz, manuelle Prüfung empfohlen

**Faktoren:**
- Anzahl extrahierter Datenfelder
- Anzahl kritischer Issues
- Dokumentqualität (OCR-Genauigkeit)

## Rechtliche Grundlagen

Der Service referenziert folgende Rechtsgrundlagen:

### BGB (Bürgerliches Gesetzbuch)
- **§ 536 BGB**: Mietminderung bei Mängeln
- **§ 551 BGB**: Kaution (max. 3 Monatskaltmieten)
- **§ 556 BGB**: Nebenkosten
- **§ 556d BGB**: Mietpreisbremse
- **§ 573c BGB**: Kündigungsfristen

### Betriebskostenverordnung (BetrKV)
- Umlagefähige und nicht umlagefähige Kosten

### BGH-Rechtsprechung
- BGH VIII ZR 185/14: Schönheitsreparaturen
- BGH VIII ZR 52/06: Kleinreparaturklausel
- BGH VIII ZR 168/12: Tierhaltung

## Integration mit anderen Services

### OCRService
Extrahiert Text und strukturierte Daten aus Dokumenten.

```typescript
const extractedData = OCRService.extractRentalContractData(text);
```

### KnowledgeService
Liefert rechtliche Informationen und Präzedenzfälle.

```typescript
const legalText = await knowledgeService.getLegalText('§ 556d BGB');
```

### MietspiegelService
Prüft Mietpreise gegen lokale Mietspiegel.

```typescript
const rentCheck = await mietspiegelService.checkRent(address, rentAmount);
```

## Fehlerbehandlung

Der Service wirft folgende Fehler:

- **NotFoundError**: Dokument nicht gefunden
- **ValidationError**: Ungültige Eingabedaten
- **Error**: Allgemeine Verarbeitungsfehler

```typescript
try {
  const analysis = await service.analyzeDocument('doc-123');
} catch (error) {
  if (error instanceof NotFoundError) {
    // Dokument existiert nicht
  } else {
    // Anderer Fehler
  }
}
```

## Performance-Überlegungen

- **Caching**: Analysen werden in der Datenbank gespeichert
- **Batch-Verarbeitung**: Für B2B-Kunden möglich
- **Asynchrone Verarbeitung**: Lange Analysen im Hintergrund

**Typische Verarbeitungszeiten:**
- Mietvertrag: 2-5 Sekunden
- Nebenkostenabrechnung: 1-3 Sekunden
- Abmahnung: 1-2 Sekunden

## Erweiterungsmöglichkeiten

### Zukünftige Features

1. **KI-gestützte Textanalyse**
   - Integration von GPT-4 für tiefere semantische Analyse
   - Erkennung impliziter Probleme

2. **Erweiterte Dokumenttypen**
   - Mieterhöhungen
   - Modernisierungsankündigungen
   - Betriebskostenabrechnungen

3. **Automatische Musterbriefe**
   - Generierung von Widersprüchen
   - Mietminderungsschreiben
   - Fristsetzungen

4. **Vergleichsanalysen**
   - Vergleich mit ähnlichen Fällen
   - Erfolgswahrscheinlichkeit

## Testing

Der Service verfügt über umfassende Unit-Tests:

```bash
npm test -- documentAnalysis.test.ts
```

**Test-Coverage:**
- Mietvertragsanalyse
- Nebenkostenabrechnungsanalyse
- Abmahnungsanalyse
- Fehlerbehandlung
- Datenextraktion

## Beispiel-Workflow

```typescript
// 1. Dokument hochladen
const document = await documentStorageService.uploadDocument(file, userId);

// 2. Analyse durchführen
const analysis = await documentAnalysisService.analyzeDocument(document.id);

// 3. Ergebnisse prüfen
if (analysis.riskLevel === 'high') {
  // Anwalt empfehlen
  await lawyerService.recommendLawyer(userId, analysis);
}

// 4. Nutzer benachrichtigen
await notificationService.sendAnalysisResult(userId, analysis);
```

## Best Practices

1. **Immer Konfidenz prüfen**: Bei niedriger Konfidenz manuelle Prüfung empfehlen
2. **Rechtliche Hinweise**: Immer darauf hinweisen, dass dies keine Rechtsberatung ersetzt
3. **Datenschutz**: Sensible Daten verschlüsselt speichern
4. **Logging**: Alle Analysen für Audit-Zwecke protokollieren
5. **Fehlerbehandlung**: Graceful Degradation bei Teilausfällen

## Support und Wartung

Bei Fragen oder Problemen:
- Dokumentation: `/docs/document-analysis.md`
- Tests: `/src/tests/documentAnalysis.test.ts`
- Service: `/src/services/DocumentAnalysisService.ts`
