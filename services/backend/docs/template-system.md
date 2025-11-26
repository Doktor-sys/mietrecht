# Template System - Dokumentation

## Übersicht

Das Template-System ermöglicht die automatische Generierung von rechtlichen Musterbriefen und Dokumenten. Es unterstützt dynamische Personalisierung mit Nutzerdaten und bietet Anleitungen zur korrekten Verwendung.

## Features

- **Vordefinierte Templates** für häufige mietrechtliche Situationen
- **Dynamische Platzhalter** für Personalisierung
- **Automatische Formatierung** von Daten, Zahlen und Währungen
- **Rechtliche Hinweise** und Anleitungen
- **Mehrsprachigkeit** (aktuell Deutsch)
- **Validierung** erforderlicher Felder

## Verfügbare Templates

### 1. Mietminderungsschreiben
**Typ:** `rent_reduction`  
**Kategorie:** `RENT_REDUCTION`

Schreiben zur Anzeige eines Mangels und Ankündigung einer Mietminderung.

**Erforderliche Felder:**
- `tenantName`: Name des Mieters
- `landlordName`: Name des Vermieters
- `propertyAddress`: Adresse des Mietobjekts
- `defectDescription`: Beschreibung des Mangels

**Optionale Felder:**
- `tenantAddress`: Adresse des Mieters
- `landlordAddress`: Adresse des Vermieters
- `date`: Datum des Schreibens
- `deadline`: Frist zur Mängelbeseitigung
- `defectStartDate`: Beginn des Mangels
- `rentReductionPercentage`: Prozentsatz der Mietminderung
- `rentReductionAmount`: Betrag der Mietminderung in EUR

### 2. Widerspruch gegen Mieterhöhung
**Typ:** `rent_increase_objection`  
**Kategorie:** `RENT_INCREASE`

Widerspruch gegen eine Mieterhöhung mit Verweis auf den Mietspiegel.

**Erforderliche Felder:**
- `tenantName`
- `landlordName`
- `propertyAddress`
- `rentIncreaseAmount`: Neue geforderte Miete

**Optionale Felder:**
- `currentRent`: Aktuelle Miete
- `comparableRent`: Vergleichsmiete laut Mietspiegel
- `city`: Stadt für Mietspiegel
- `rentIncreaseNoticeDate`: Datum der Mieterhöhung

### 3. Fristsetzung zur Mängelbeseitigung
**Typ:** `deadline_letter`  
**Kategorie:** `REPAIRS`

Fristsetzung mit Androhung rechtlicher Konsequenzen.

**Erforderliche Felder:**
- `tenantName`
- `landlordName`
- `propertyAddress`
- `deadline`: Frist zur Mängelbeseitigung

**Optionale Felder:**
- `defectDescription`: Beschreibung des Mangels

### 4. Widerspruch gegen Nebenkostenabrechnung
**Typ:** `utility_bill_objection`  
**Kategorie:** `UTILITY_COSTS`

Widerspruch gegen fehlerhafte Nebenkostenabrechnung.

**Erforderliche Felder:**
- `tenantName`
- `landlordName`
- `propertyAddress`

**Optionale Felder:**
- `billingYear`: Abrechnungsjahr
- `billingPeriodStart`: Beginn des Abrechnungszeitraums
- `billingPeriodEnd`: Ende des Abrechnungszeitraums
- `formalDefects`: Formelle Mängel
- `nonDeductibleCosts`: Nicht umlagefähige Kosten
- `calculationErrors`: Berechnungsfehler
- `missingDocuments`: Fehlende Belege
- `undisputedAmount`: Unstrittiger Betrag
- `responseDeadline`: Frist für Antwort

## API-Verwendung

### Dokument generieren

```typescript
import { TemplateService } from './services/TemplateService';

const templateService = new TemplateService(prisma);

const templateData = {
  tenantName: 'Max Mustermann',
  tenantAddress: 'Musterstraße 1, 12345 Berlin',
  landlordName: 'Erika Musterfrau',
  landlordAddress: 'Vermietergasse 10, 12345 Berlin',
  propertyAddress: 'Musterstraße 1, Wohnung 3, 12345 Berlin',
  defectDescription: 'Die Heizung in der Wohnung funktioniert seit dem 15.11.2024 nicht mehr. Trotz mehrfacher Meldung wurde der Mangel nicht behoben.',
  defectStartDate: '15.11.2024',
  deadline: new Date('2024-12-15'),
  rentReductionPercentage: 20,
  rentReductionAmount: 200,
  date: new Date()
};

const document = await templateService.generateDocument(
  'template-id',
  templateData,
  'user-id'
);

console.log(document.content); // Generierter Brief
console.log(document.instructions); // Anweisungen zur Verwendung
console.log(document.legalNotes); // Rechtliche Hinweise
```

### Templates auflisten

```typescript
// Alle Templates
const allTemplates = await templateService.listTemplates();

// Nach Kategorie filtern
const rentTemplates = await templateService.listTemplates('RENT_REDUCTION');
```

### Template abrufen

```typescript
const template = await templateService.getTemplate('template-id');

console.log(template.name);
console.log(template.requiredFields);
console.log(template.optionalFields);
```

## Platzhalter-System

Templates verwenden doppelte geschweifte Klammern für Platzhalter: `{{fieldName}}`

### Automatische Formatierung

- **Datum**: `{{date}}` → "15.12.2024"
- **Zahlen**: `{{rentAmount}}` → "1.500,00"
- **Arrays**: `{{legalReferences}}` → "§ 536 BGB, § 558 BGB"

### Beispiel-Template

```
{{tenantName}}
{{tenantAddress}}

{{landlordName}}
{{landlordAddress}}

{{date}}

Betreff: Mietminderung - {{propertyAddress}}

Sehr geehrte/r {{landlordName}},

hiermit zeige ich einen Mangel an: {{defectDescription}}

Die Miete wird um {{rentReductionPercentage}}% gemindert.

Mit freundlichen Grüßen
{{tenantName}}
```

## Anweisungen und Hinweise

Jedes generierte Dokument enthält:

### 1. Verwendungsanweisungen
Schritt-für-Schritt-Anleitung zur korrekten Verwendung des Dokuments:
- Wann das Dokument zu versenden ist
- Wie es zu versenden ist (Einschreiben mit Rückschein)
- Was zu beachten ist
- Welche Fristen gelten

### 2. Rechtliche Hinweise
- Relevante Gesetzesgrundlagen (z.B. § 536 BGB)
- Wichtige Rechtsprechung
- Risiken und Konsequenzen
- Hinweis auf professionelle Rechtsberatung

## Validierung

Der Service validiert automatisch:
- Vorhandensein erforderlicher Felder
- Template-Status (aktiv/inaktiv)
- Datentypen und Formate

Bei fehlenden Pflichtfeldern wird ein `ValidationError` geworfen.

## Neue Templates erstellen

### 1. Template-Datei erstellen

Erstelle eine `.txt`-Datei in `services/backend/data/templates/`:

```
{{tenantName}}
{{tenantAddress}}

{{landlordName}}
{{landlordAddress}}

{{date}}

Betreff: {{subject}}

Sehr geehrte/r {{landlordName}},

{{content}}

Mit freundlichen Grüßen
{{tenantName}}
```

### 2. Template registrieren

Füge das Template in `seedTemplates.ts` hinzu:

```typescript
{
  name: 'Mein neues Template',
  type: 'my_template_type',
  description: 'Beschreibung',
  category: 'OTHER',
  filename: 'my-template.txt'
}
```

### 3. Erforderliche Felder definieren

Erweitere `getRequiredFields()` in `TemplateService.ts`:

```typescript
private getRequiredFields(templateType: string): string[] {
  const fieldMap: Record<string, string[]> = {
    // ...
    my_template_type: ['tenantName', 'landlordName', 'subject', 'content']
  };
  return fieldMap[templateType] || ['tenantName', 'landlordName'];
}
```

### 4. Anweisungen hinzufügen

Erweitere `generateInstructions()` in `TemplateService.ts`:

```typescript
case 'my_template_type':
  instructions.push(
    '1. Erste Anweisung',
    '2. Zweite Anweisung',
    // ...
  );
  break;
```

### 5. Templates laden

```bash
npm run seed:templates
```

## Best Practices

### 1. Platzhalter benennen
- Verwende aussagekräftige Namen: `tenantName` statt `name`
- Verwende camelCase: `rentAmount` statt `rent_amount`
- Sei konsistent über alle Templates hinweg

### 2. Formatierung
- Nutze die automatische Formatierung für Datum und Zahlen
- Verwende `{{date}}` für das aktuelle Datum
- Verwende `{{deadline}}` für Fristen

### 3. Rechtliche Hinweise
- Füge immer relevante Gesetzesgrundlagen hinzu
- Weise auf Risiken hin
- Empfehle bei komplexen Fällen professionelle Beratung

### 4. Anweisungen
- Gib klare Schritt-für-Schritt-Anleitungen
- Erkläre, wie das Dokument zu versenden ist
- Weise auf Fristen hin
- Erkläre mögliche Konsequenzen

### 5. Validierung
- Definiere alle erforderlichen Felder
- Validiere Datentypen
- Gib hilfreiche Fehlermeldungen

## Fehlerbehandlung

```typescript
try {
  const document = await templateService.generateDocument(
    templateId,
    data,
    userId
  );
} catch (error) {
  if (error instanceof NotFoundError) {
    // Template existiert nicht
  } else if (error instanceof ValidationError) {
    // Erforderliche Felder fehlen
  } else {
    // Anderer Fehler
  }
}
```

## Testing

```bash
# Alle Template-Tests ausführen
npm test -- templateService.test.ts

# Spezifischen Test ausführen
npm test -- templateService.test.ts -t "should generate rent reduction letter"
```

## Beispiel-Workflow

```typescript
// 1. Verfügbare Templates abrufen
const templates = await templateService.listTemplates('RENT_REDUCTION');

// 2. Template-Details anzeigen
const template = await templateService.getTemplate(templates[0].id);
console.log('Erforderliche Felder:', template.requiredFields);

// 3. Daten sammeln
const data: TemplateData = {
  tenantName: 'Max Mustermann',
  landlordName: 'Erika Musterfrau',
  propertyAddress: 'Musterstraße 1',
  defectDescription: 'Heizung defekt',
  rentReductionPercentage: 20
};

// 4. Dokument generieren
const document = await templateService.generateDocument(
  template.id,
  data,
  userId
);

// 5. Dokument anzeigen
console.log('Inhalt:', document.content);
console.log('Anweisungen:', document.instructions);
console.log('Rechtliche Hinweise:', document.legalNotes);

// 6. Als PDF speichern (siehe Document Generator Service)
```

## Erweiterungen

### Geplante Features

1. **Mehrsprachigkeit**
   - Englische Templates
   - Türkische Templates
   - Arabische Templates

2. **Erweiterte Formatierung**
   - Markdown-Unterstützung
   - HTML-Templates
   - Bedingte Abschnitte

3. **Template-Editor**
   - Web-basierter Editor
   - Vorschau-Funktion
   - Versionierung

4. **Automatische Vervollständigung**
   - KI-gestützte Vorschläge
   - Kontextbasierte Empfehlungen

## Support

Bei Fragen oder Problemen:
- Dokumentation: `/docs/template-system.md`
- Tests: `/src/tests/templateService.test.ts`
- Service: `/src/services/TemplateService.ts`
- Templates: `/data/templates/`
