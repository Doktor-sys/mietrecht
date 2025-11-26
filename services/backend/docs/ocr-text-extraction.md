# OCR und Text-Extraktion

## Übersicht

Die OCR (Optical Character Recognition) und Text-Extraktion Komponente ermöglicht es, Text aus PDF-Dokumenten und Bildern zu extrahieren und strukturierte Daten aus Mietrechtsdokumenten zu gewinnen.

## Technologie-Stack

- **Tesseract.js**: OCR-Engine für Bildverarbeitung (trainiert für deutsche Sprache)
- **pdf-parse**: PDF-Text-Extraktion für native PDF-Dokumente
- **Regex-basierte Extraktion**: Strukturierte Datenextraktion aus deutschen Rechtsdokumenten

## Funktionalität

### 1. Text-Extraktion

#### PDF-Dokumente
```typescript
const result = await OCRService.extractTextFromPDF(buffer);
// {
//   text: "Extrahierter Text...",
//   confidence: 1.0,
//   language: "deu",
//   pageCount: 5
// }
```

#### Bild-Dokumente
```typescript
const result = await OCRService.extractTextFromImage(buffer);
// {
//   text: "Extrahierter Text...",
//   confidence: 0.95,
//   language: "deu"
// }
```

### 2. Strukturierte Datenextraktion

#### Mietverträge
Extrahiert folgende Felder aus Mietverträgen:
- Vermieter-Name
- Mieter-Name
- Adresse des Mietobjekts
- Grundmiete / Kaltmiete
- Nebenkosten / Betriebskosten
- Kaution
- Wohnfläche (m²)
- Zimmeranzahl
- Mietbeginn
- Mietende (bei befristeten Verträgen)

```typescript
const data = OCRService.extractRentalContractData(text);
// {
//   landlordName: "Max Mustermann",
//   tenantName: "Anna Schmidt",
//   address: "Musterstraße 123, 12345 Berlin",
//   rentAmount: 850.00,
//   additionalCosts: 150.00,
//   deposit: 2550.00,
//   squareMeters: 65,
//   roomCount: 2.5,
//   startDate: "01.01.2024"
// }
```

#### Nebenkostenabrechnungen
Extrahiert folgende Felder:
- Abrechnungszeitraum (Start und Ende)
- Gesamtbetrag (Nachzahlung oder Guthaben)
- Heizkosten
- Wasserkosten

```typescript
const data = OCRService.extractUtilityBillData(text);
// {
//   billingPeriodStart: "01.01.2023",
//   billingPeriodEnd: "31.12.2023",
//   totalAmount: 1234.56,
//   heatingCosts: 800.00,
//   waterCosts: 250.00
// }
```

#### Abmahnungen / Warnschreiben
Extrahiert folgende Informationen:
- Datum des Schreibens
- Frist / Deadline
- Kündigungsdrohung erkannt (boolean)
- Rechtliche Schritte angedroht (boolean)

```typescript
const data = OCRService.extractWarningLetterData(text);
// {
//   date: "15.03.2024",
//   deadline: "31.03.2024",
//   containsTerminationThreat: true,
//   containsLegalThreat: false
// }
```

### 3. Text-Preprocessing für deutsche Rechtstexte

Bereitet deutschen Rechtstext für weitere Verarbeitung auf:

```typescript
const preprocessed = OCRService.preprocessGermanLegalText(text);
// {
//   originalText: "Original...",
//   cleanedText: "Bereinigter Text ohne übermäßige Leerzeichen",
//   normalizedText: "Text mit normalisierten Umlauten (ä->ae, ö->oe, ü->ue)",
//   paragraphs: ["Absatz 1", "Absatz 2", ...],
//   sentences: ["Satz 1", "Satz 2", ...]
// }
```

## API-Endpunkte

### Text extrahieren
```
POST /api/documents/:documentId/extract-text
```

Extrahiert reinen Text aus einem Dokument.

**Response:**
```json
{
  "success": true,
  "data": {
    "text": "Extrahierter Text...",
    "confidence": 0.95,
    "language": "deu",
    "pageCount": 3
  }
}
```

### Mietvertrag analysieren
```
POST /api/documents/:documentId/analyze-rental-contract
```

Extrahiert strukturierte Daten aus einem Mietvertrag.

**Response:**
```json
{
  "success": true,
  "data": {
    "ocrConfidence": 0.95,
    "extractedData": {
      "landlordName": "Max Mustermann",
      "tenantName": "Anna Schmidt",
      "rentAmount": 850.00,
      "deposit": 2550.00
    },
    "preprocessed": {
      "paragraphCount": 15,
      "sentenceCount": 87
    }
  }
}
```

### Nebenkostenabrechnung analysieren
```
POST /api/documents/:documentId/analyze-utility-bill
```

Extrahiert Daten aus einer Nebenkostenabrechnung.

### Abmahnung analysieren
```
POST /api/documents/:documentId/analyze-warning-letter
```

Analysiert eine Abmahnung und erkennt Drohungen.

## Genauigkeit und Limitierungen

### OCR-Genauigkeit
- **Native PDFs**: 100% Genauigkeit (direkte Textextraktion)
- **Gescannte PDFs**: 85-95% Genauigkeit (abhängig von Bildqualität)
- **Fotos**: 70-90% Genauigkeit (abhängig von Beleuchtung und Auflösung)

### Verbesserung der OCR-Qualität
1. **Bildqualität**: Mindestens 300 DPI für gescannte Dokumente
2. **Kontrast**: Hoher Kontrast zwischen Text und Hintergrund
3. **Ausrichtung**: Gerade ausgerichtete Dokumente
4. **Beleuchtung**: Gleichmäßige Beleuchtung bei Fotos

### Limitierungen
- Handschriftliche Texte werden nicht zuverlässig erkannt
- Stark verschmutzte oder beschädigte Dokumente können Probleme bereiten
- Komplexe Layouts mit mehreren Spalten können die Extraktion erschweren
- Tabellen werden als Fließtext extrahiert

## Regex-Patterns für deutsche Rechtsdokumente

Die Extraktion verwendet spezialisierte Regex-Patterns für deutsche Mietrechtsdokumente:

### Geldbeträge
```regex
(\d+[.,]\d+)\s*(?:EUR|€|Euro)
```

### Datumsangaben
```regex
(\d{1,2}\.\d{1,2}\.\d{4})
```

### Flächenangaben
```regex
(\d+[.,]?\d*)\s*(?:m²|qm|Quadratmeter)
```

### Rechtliche Begriffe
- Vermieter / Mieter
- Grundmiete / Kaltmiete / Nettomiete
- Nebenkosten / Betriebskosten
- Kaution / Sicherheit
- Mietbeginn / Mietende
- Kündigung / Abmahnung

## Performance

### Verarbeitungszeiten (Durchschnitt)
- **PDF (1 Seite)**: < 1 Sekunde
- **PDF (10 Seiten)**: 2-3 Sekunden
- **Bild (OCR)**: 3-5 Sekunden pro Seite

### Ressourcennutzung
- **Memory**: ~100-200 MB pro OCR-Worker
- **CPU**: Intensiv während OCR-Verarbeitung

## Best Practices

### 1. Worker-Management
```typescript
// Worker initialisieren
await OCRService.initialize();

// Nach Verwendung beenden
await OCRService.terminate();
```

### 2. Error Handling
```typescript
try {
  const result = await OCRService.extractTextFromPDF(buffer);
} catch (error) {
  logger.error('OCR failed:', error);
  // Fallback oder Fehlerbehandlung
}
```

### 3. Caching
Für häufig verwendete Dokumente sollte das OCR-Ergebnis gecacht werden:
```typescript
// Ergebnis in Datenbank speichern
await prisma.document.update({
  where: { id: documentId },
  data: {
    extractedText: result.text,
    ocrConfidence: result.confidence
  }
});
```

## Zukünftige Erweiterungen

1. **Machine Learning**: Trainierte Modelle für bessere Feldextraktion
2. **Layout-Analyse**: Intelligente Erkennung von Dokumentstrukturen
3. **Multi-Language**: Unterstützung für Türkisch und Arabisch
4. **Tabellen-Extraktion**: Strukturierte Extraktion von Tabellendaten
5. **Handschrifterkennung**: Erkennung handschriftlicher Notizen

## Testing

Umfassende Tests sind in `src/tests/ocrService.test.ts` implementiert:
- Unit Tests für alle Extraktionsfunktionen
- Genauigkeitstests mit Beispieldokumenten
- Edge-Case-Tests für fehlerhafte Eingaben
- Performance-Tests für große Dokumente

## Abhängigkeiten

```json
{
  "tesseract.js": "^5.0.0",
  "pdf-parse": "^1.1.1"
}
```

## Konfiguration

Keine zusätzliche Konfiguration erforderlich. Tesseract.js lädt automatisch die deutschen Sprachdaten beim ersten Aufruf.
