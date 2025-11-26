# Document Generator Service - Dokumentation

## Übersicht

Der DocumentGeneratorService erweitert das Template-System um PDF-Generierung und Export-Funktionen. Er ermöglicht die Erstellung professionell formatierter rechtlicher Dokumente mit Anweisungen und rechtlichen Hinweisen.

## Features

- **PDF-Generierung** aus Templates mit PDFKit
- **Anpassbare Formatierung** (Schriftgröße, Ränder, Seitengröße)
- **Automatische Seitennummerierung** und Footer
- **Vorschau-Funktion** vor der PDF-Generierung
- **Text-Export** als Alternative zu PDF
- **Batch-Verarbeitung** für mehrere Dokumente
- **Datei-Verwaltung** mit automatischer Speicherung

## API-Verwendung

### PDF generieren

```typescript
import { DocumentGeneratorService } from './services/DocumentGeneratorService';
import { TemplateService } from './services/TemplateService';

const documentGenerator = new DocumentGeneratorService(prisma);
const templateService = new TemplateService(prisma);

// 1. Template generieren
const generatedTemplate = await templateService.generateDocument(
  'template-id',
  {
    tenantName: 'Max Mustermann',
    landlordName: 'Erika Musterfrau',
    propertyAddress: 'Musterstraße 1',
    defectDescription: 'Heizung defekt',
    rentReductionPercentage: 20
  },
  'user-id'
);

// 2. PDF generieren
const pdf = await documentGenerator.generatePDF(generatedTemplate, {
  includeInstructions: true,
  includeLegalNotes: true,
  fontSize: 11,
  margin: 50,
  pageSize: 'A4'
});

// 3. PDF verwenden
console.log('PDF Size:', pdf.size);
console.log('Filename:', pdf.filename);

// PDF speichern oder an Client senden
fs.writeFileSync(`./output/${pdf.filename}`, pdf.buffer);
```

### Vorschau generieren

```typescript
// Vorschau ohne PDF-Generierung
const preview = await documentGenerator.generatePreview(
  'template-id',
  {
    tenantName: 'Max Mustermann',
    landlordName: 'Erika Musterfrau'
  },
  'user-id'
);

console.log('Content:', preview.content);
console.log('Instructions:', preview.instructions);
console.log('Legal Notes:', preview.legalNotes);
console.log('Metadata:', preview.metadata);
```

### Generieren und Speichern in einem Schritt

```typescript
const { filePath, pdf } = await documentGenerator.generateAndSavePDF(
  'template-id',
  templateData,
  'user-id',
  {
    includeInstructions: true,
    includeLegalNotes: true
  }
);

console.log('PDF saved to:', filePath);
console.log('File size:', pdf.size);
```

### Als Text exportieren

```typescript
const { buffer, filename } = await documentGenerator.exportAsText(
  generatedTemplate,
  true // Include metadata
);

fs.writeFileSync(`./output/${filename}`, buffer);
```

### Batch-Verarbeitung

```typescript
const requests = [
  {
    templateId: 'template-1',
    data: { tenantName: 'User 1', landlordName: 'Landlord 1' },
    userId: 'user-1'
  },
  {
    templateId: 'template-2',
    data: { tenantName: 'User 2', landlordName: 'Landlord 2' },
    userId: 'user-2'
  }
];

const results = await documentGenerator.generateBatchPDFs(requests);

results.forEach((result, index) => {
  if (result.success) {
    console.log(`PDF ${index + 1} generated:`, result.pdf.filename);
  } else {
    console.error(`PDF ${index + 1} failed:`, result.error);
  }
});
```

## PDF-Optionen

### PDFOptions Interface

```typescript
interface PDFOptions {
  includeInstructions?: boolean;  // Standard: true
  includeLegalNotes?: boolean;    // Standard: true
  fontSize?: number;              // Standard: 11 (8-16)
  margin?: number;                // Standard: 50 (20-100)
  pageSize?: 'A4' | 'LETTER';    // Standard: 'A4'
}
```

### Beispiele

```typescript
// Minimales PDF (nur Hauptinhalt)
const minimalPDF = await documentGenerator.generatePDF(template, {
  includeInstructions: false,
  includeLegalNotes: false
});

// Großer Text für bessere Lesbarkeit
const largeFontPDF = await documentGenerator.generatePDF(template, {
  fontSize: 14,
  margin: 60
});

// US Letter Format
const letterPDF = await documentGenerator.generatePDF(template, {
  pageSize: 'LETTER'
});
```

## PDF-Struktur

### Seite 1: Hauptdokument
- **Titel**: Template-Name (16pt, fett, zentriert)
- **Inhalt**: Generierter Brief (11pt, linksbündig)
- **Footer**: Generierungsdatum und Seitenzahl

### Seite 2: Anweisungen (optional)
- **Überschrift**: "Anweisungen zur Verwendung" (14pt, fett, unterstrichen)
- **Liste**: Nummerierte Anweisungen (11pt)

### Seite 2/3: Rechtliche Hinweise (optional)
- **Überschrift**: "Rechtliche Hinweise" (14pt, fett, unterstrichen)
- **Liste**: Bullet-Points mit Hinweisen (10pt)

### Alle Seiten
- **Footer**: "Generiert am [Datum] | Seite X von Y" (8pt, zentriert)

## Dateinamen-Generierung

Dateinamen werden automatisch generiert:

**Format**: `{template-name}-{datum}.pdf`

**Beispiele**:
- `mietminderungsschreiben-2024-12-15.pdf`
- `widerspruch-gegen-mieterhoehung-2024-12-15.pdf`
- `fristsetzung-zur-maengelbeseitigung-2024-12-15.pdf`

**Regeln**:
- Kleinbuchstaben
- Sonderzeichen werden durch Bindestriche ersetzt
- Umlaute werden beibehalten (ä, ö, ü)
- Datum im Format YYYY-MM-DD

## Speicherung

### Automatische Speicherung

PDFs werden automatisch in folgendem Verzeichnis gespeichert:

```
uploads/generated-documents/{userId}/{filename}.pdf
```

**Beispiel**:
```
uploads/generated-documents/user-123/mietminderungsschreiben-2024-12-15.pdf
```

### Manuelle Speicherung

```typescript
const pdf = await documentGenerator.generatePDF(template);

// Speichern
const filePath = await documentGenerator.savePDF(pdf, 'user-id', 'template-id');

console.log('Saved to:', filePath);
```

## Text-Export

### Mit Metadata

```typescript
const { buffer, filename } = await documentGenerator.exportAsText(template, true);

// Inhalt:
// Mietminderungsschreiben
// Generiert am: 15.12.2024, 10:00
// Kategorie: RENT_REDUCTION
// ================================================================================
//
// [Hauptinhalt]
//
// ================================================================================
//
// ANWEISUNGEN ZUR VERWENDUNG
// ...
```

### Ohne Metadata

```typescript
const { buffer, filename } = await documentGenerator.exportAsText(template, false);

// Inhalt:
// [Nur Hauptinhalt, Anweisungen und Hinweise]
```

## Vorschau-System

Die Vorschau-Funktion ermöglicht es, den Inhalt vor der PDF-Generierung zu prüfen:

```typescript
const preview = await documentGenerator.generatePreview(
  'template-id',
  templateData,
  'user-id'
);

// Zeige Vorschau im Frontend
return {
  content: preview.content,
  instructions: preview.instructions,
  legalNotes: preview.legalNotes,
  metadata: {
    templateName: preview.metadata.templateName,
    category: preview.metadata.category,
    generatedAt: preview.metadata.generatedAt
  }
};
```

## Fehlerbehandlung

```typescript
try {
  const pdf = await documentGenerator.generatePDF(template);
} catch (error) {
  if (error.message.includes('Font size')) {
    // Ungültige Schriftgröße
  } else if (error.message.includes('Margin')) {
    // Ungültiger Rand
  } else if (error.message.includes('Page size')) {
    // Ungültige Seitengröße
  } else {
    // Anderer Fehler
  }
}
```

## Performance-Überlegungen

### PDF-Größen

Typische PDF-Größen:
- **Nur Hauptinhalt**: 5-10 KB
- **Mit Anweisungen**: 10-15 KB
- **Vollständig (mit Hinweisen)**: 15-25 KB

### Batch-Verarbeitung

Für große Mengen:

```typescript
// Verarbeite in Batches von 10
const batchSize = 10;
for (let i = 0; i < requests.length; i += batchSize) {
  const batch = requests.slice(i, i + batchSize);
  const results = await documentGenerator.generateBatchPDFs(batch);
  
  // Verarbeite Ergebnisse
  results.forEach(result => {
    if (result.success) {
      // Speichere oder sende PDF
    }
  });
}
```

## Integration mit Express

### PDF Download-Endpoint

```typescript
app.post('/api/documents/generate-pdf', async (req, res) => {
  try {
    const { templateId, data } = req.body;
    const userId = req.user.id;

    const generatedTemplate = await templateService.generateDocument(
      templateId,
      data,
      userId
    );

    const pdf = await documentGenerator.generatePDF(generatedTemplate);

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${pdf.filename}"`);
    res.setHeader('Content-Length', pdf.size);
    
    res.send(pdf.buffer);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
```

### Vorschau-Endpoint

```typescript
app.post('/api/documents/preview', async (req, res) => {
  try {
    const { templateId, data } = req.body;
    const userId = req.user.id;

    const preview = await documentGenerator.generatePreview(
      templateId,
      data,
      userId
    );

    res.json(preview);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
```

## Best Practices

### 1. Vorschau vor Generierung
Zeige immer eine Vorschau, bevor das PDF generiert wird:

```typescript
// 1. Vorschau anzeigen
const preview = await documentGenerator.generatePreview(templateId, data, userId);

// 2. Nutzer bestätigt
if (userConfirmed) {
  const template = await templateService.generateDocument(templateId, data, userId);
  const pdf = await documentGenerator.generatePDF(template);
}
```

### 2. Fehlerbehandlung
Fange spezifische Fehler ab:

```typescript
try {
  const pdf = await documentGenerator.generatePDF(template, options);
} catch (error) {
  logger.error('PDF generation failed:', error);
  
  // Fallback: Text-Export
  const text = await documentGenerator.exportAsText(template);
  return text;
}
```

### 3. Speicherplatz-Management
Lösche alte PDFs regelmäßig:

```typescript
// Lösche PDFs älter als 30 Tage
const thirtyDaysAgo = new Date();
thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

// Implementiere Cleanup-Job
```

### 4. Batch-Verarbeitung
Verarbeite große Mengen in Batches:

```typescript
const batchSize = 10;
const results = [];

for (let i = 0; i < requests.length; i += batchSize) {
  const batch = requests.slice(i, i + batchSize);
  const batchResults = await documentGenerator.generateBatchPDFs(batch);
  results.push(...batchResults);
}
```

### 5. Caching
Cache häufig verwendete Templates:

```typescript
const cache = new Map();

async function getCachedTemplate(templateId: string) {
  if (cache.has(templateId)) {
    return cache.get(templateId);
  }
  
  const template = await templateService.getTemplate(templateId);
  cache.set(templateId, template);
  return template;
}
```

## Testing

```bash
# Alle Tests ausführen
npm test -- documentGenerator.test.ts

# Spezifischen Test ausführen
npm test -- documentGenerator.test.ts -t "should generate PDF"
```

## Beispiel-Workflow

```typescript
// 1. Liste verfügbare Templates
const templates = await templateService.listTemplates('RENT_REDUCTION');

// 2. Wähle Template
const template = templates[0];

// 3. Sammle Daten
const data = {
  tenantName: 'Max Mustermann',
  landlordName: 'Erika Musterfrau',
  propertyAddress: 'Musterstraße 1',
  defectDescription: 'Heizung defekt seit 3 Wochen',
  rentReductionPercentage: 20
};

// 4. Generiere Vorschau
const preview = await documentGenerator.generatePreview(
  template.id,
  data,
  userId
);

// 5. Zeige Vorschau dem Nutzer
console.log('Vorschau:', preview.content);

// 6. Nutzer bestätigt -> Generiere PDF
const generatedTemplate = await templateService.generateDocument(
  template.id,
  data,
  userId
);

const pdf = await documentGenerator.generatePDF(generatedTemplate, {
  includeInstructions: true,
  includeLegalNotes: true
});

// 7. Speichere oder sende PDF
const filePath = await documentGenerator.savePDF(pdf, userId, template.id);

console.log('PDF gespeichert:', filePath);
```

## Erweiterungen

### Geplante Features

1. **Digitale Signatur**
   - PDF-Signierung
   - Zeitstempel

2. **Wasserzeichen**
   - "Entwurf" Wasserzeichen
   - Benutzerdefinierte Wasserzeichen

3. **Erweiterte Formatierung**
   - Tabellen
   - Bilder
   - Farbige Hervorhebungen

4. **E-Mail-Integration**
   - Direkter Versand per E-Mail
   - Einschreiben-Service-Integration

## Support

Bei Fragen oder Problemen:
- Dokumentation: `/docs/document-generator.md`
- Tests: `/src/tests/documentGenerator.test.ts`
- Service: `/src/services/DocumentGeneratorService.ts`
