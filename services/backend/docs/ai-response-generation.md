# AI Response Generation mit Legal References

## Übersicht

Der `AIResponseGenerator` ist eine zentrale Komponente des SmartLaw Mietrecht-Systems, die KI-gestützte Antworten mit präzisen Rechtsbezügen, Handlungsempfehlungen und Template-Referenzen generiert.

## Architektur

### Komponenten

```
AIResponseGenerator
├── Legal Reference Finder
│   ├── Knowledge Base Search
│   ├── Mandatory References
│   └── Fallback References
├── Action Recommendation Engine
│   ├── Category-specific Actions
│   ├── Priority Assignment
│   └── Deadline Management
├── Template Matcher
│   └── Document Template References
└── Natural Language Generator
    ├── OpenAI Integration
    └── Fallback Response Generator
```

## Hauptfunktionen

### 1. Response Generation

```typescript
async generateResponse(
  classification: ClassificationResult,
  userQuery: string,
  conversationContext?: string
): Promise<AIResponse>
```

Generiert eine umfassende KI-Antwort mit:
- Natürlichsprachiger Erklärung
- Rechtlichen Referenzen (§ 536 BGB, etc.)
- Konkreten Handlungsempfehlungen
- Verfügbaren Musterdokumenten
- Eskalationsempfehlungen

### 2. Legal References

Der Service findet automatisch relevante Rechtsnormen basierend auf:

#### Mandatory References (Pflicht-Referenzen)

Jede Kategorie hat vordefinierte Pflicht-Referenzen:

**Mietminderung:**
- § 536 BGB - Mietminderung bei Sach- und Rechtsmängeln
- § 536a BGB - Schadensersatzanspruch des Mieters

**Kündigung:**
- § 573 BGB - Ordentliche Kündigung des Vermieters
- § 543 BGB - Fristlose Kündigung aus wichtigem Grund
- § 574 BGB - Widerspruch des Mieters

**Nebenkosten:**
- § 556 BGB - Vereinbarung über Betriebskosten
- BetrKV - Betriebskostenverordnung

**Mieterhöhung:**
- § 558 BGB - Mieterhöhung bis zur ortsüblichen Vergleichsmiete
- § 559 BGB - Mieterhöhung nach Modernisierung

#### Dynamic References (Dynamische Referenzen)

Zusätzlich werden relevante Rechtsnormen aus der Knowledge Base gesucht basierend auf:
- Kategorie-spezifischen Keywords
- Extrahierten Fakten aus der Nutzeranfrage
- Semantischer Ähnlichkeit

### 3. Action Recommendations

Generiert konkrete, priorisierte Handlungsempfehlungen:

```typescript
interface ActionRecommendation {
  action: string;              // "Mangel dokumentieren"
  priority: 'high' | 'medium' | 'low';
  deadline?: string;           // "14 Tage", "Sofort"
  legalBasis?: string;         // "§ 536 BGB"
  details?: string;            // Zusätzliche Erklärung
}
```

#### Beispiel: Mietminderung

1. **Mangel dokumentieren** (Priorität: hoch)
   - Erstellen Sie Fotos und notieren Sie das Datum
   - Rechtsbasis: § 536 BGB

2. **Vermieter schriftlich informieren** (Priorität: hoch, Frist: Sofort)
   - Setzen Sie eine angemessene Frist zur Mängelbeseitigung (14 Tage)
   - Rechtsbasis: § 536c BGB

3. **Mietminderung berechnen** (Priorität: mittel)
   - Orientieren Sie sich an der Mietminderungstabelle

4. **Miete mindern** (Priorität: mittel, Frist: Nach Ablauf der Frist)
   - Mindern Sie die Miete erst nach erfolgloser Fristsetzung
   - Rechtsbasis: § 536 BGB Abs. 1

### 4. Template References

Verweist auf verfügbare Musterdokumente:

```typescript
interface TemplateReference {
  templateId: string;          // "rent_reduction_notice"
  templateName: string;        // "Mietminderungsanzeige"
  description: string;         // Beschreibung des Templates
  applicableFor: string[];     // ["Mängel", "Heizungsausfall"]
}
```

#### Verfügbare Templates

**Mietminderung:**
- Mietminderungsanzeige
- Mietminderungsschreiben

**Kündigung:**
- Widerspruch gegen Kündigung

**Nebenkosten:**
- Widerspruch Nebenkostenabrechnung
- Belegeinsicht fordern

**Mieterhöhung:**
- Widerspruch Mieterhöhung

**Kaution:**
- Kautionsrückforderung

### 5. Natural Language Generation

#### Mit OpenAI (bevorzugt)

Verwendet GPT-4 für natürlichsprachige, empathische Antworten:

```typescript
Systemanweisung:
- Verwende klare, verständliche Sprache (kein Juristendeutsch)
- Beziehe dich auf konkrete Gesetzesparagraphen
- Gib praktische Handlungsempfehlungen
- Weise auf Fristen und Deadlines hin
- Empfehle bei komplexen Fällen einen Fachanwalt
- Sei empathisch und unterstützend
```

#### Fallback (ohne OpenAI)

Generiert strukturierte Antworten basierend auf Templates:

```
Ich habe Ihre Anfrage als "Mietminderung" eingestuft.

**Rechtliche Grundlagen:**
- § 536 BGB: Mietminderung bei Sach- und Rechtsmängeln
- § 536a BGB: Schadensersatzanspruch des Mieters

**Empfohlene Schritte:**
1. Mangel dokumentieren (Frist: Sofort)
   Erstellen Sie Fotos und notieren Sie das Datum
2. Vermieter schriftlich informieren (Frist: Sofort)
   Setzen Sie eine angemessene Frist zur Mängelbeseitigung
...
```

## Integration

### ChatService Integration

Der `AIResponseGenerator` ist in den `ChatService` integriert:

```typescript
// In ChatService
const aiResponse = await this.responseGenerator.generateResponse(
  classification,
  userQuery,
  conversationContext
);

// Speichere Antwort mit allen Metadaten
await this.prisma.message.create({
  data: {
    caseId: conversationId,
    sender: 'AI',
    content: aiResponse.message,
    metadata: {
      legalReferences: aiResponse.legalReferences,
      actionRecommendations: aiResponse.actionRecommendations,
      templateReferences: aiResponse.templateReferences,
      escalationRecommended: aiResponse.escalationRecommended
    }
  }
});
```

### API Response Format

```json
{
  "conversationId": "uuid",
  "message": "Ich habe Ihre Anfrage analysiert...",
  "classification": {
    "category": "rent_reduction",
    "confidence": 0.85,
    "riskLevel": "medium"
  },
  "legalReferences": [
    {
      "type": "law",
      "reference": "§ 536 BGB",
      "title": "Mietminderung bei Sach- und Rechtsmängeln",
      "url": "https://www.gesetze-im-internet.de/bgb/__536.html",
      "excerpt": "Hat die Mietsache zur Zeit der Überlassung..."
    }
  ],
  "actionRecommendations": [
    {
      "action": "Mangel dokumentieren",
      "priority": "high",
      "deadline": "Sofort",
      "legalBasis": "§ 536 BGB",
      "details": "Erstellen Sie Fotos und notieren Sie das Datum"
    }
  ],
  "templateReferences": [
    {
      "templateId": "rent_reduction_notice",
      "templateName": "Mietminderungsanzeige",
      "description": "Anzeige eines Mangels mit Fristsetzung",
      "applicableFor": ["Mängel", "Heizungsausfall"]
    }
  ],
  "escalationRecommended": false
}
```

## Konfiguration

### Umgebungsvariablen

```env
# OpenAI Configuration
OPENAI_API_KEY=sk-...
OPENAI_ENDPOINT=https://api.openai.com/v1

# Fallback auf Azure OpenAI möglich
# OPENAI_ENDPOINT=https://your-resource.openai.azure.com
```

## Testing

### Unit Tests

```bash
npm test -- aiResponseGenerator.test.ts
```

Tests decken ab:
- Response-Generierung für alle Kategorien
- Legal References (Pflicht und dynamisch)
- Action Recommendations mit Prioritäten
- Template References
- Eskalationslogik
- Fallback-Mechanismen

### Test Coverage

- ✅ Mietminderung
- ✅ Kündigung
- ✅ Nebenkosten
- ✅ Mieterhöhung
- ✅ Kaution
- ✅ Mängel
- ✅ Modernisierung
- ✅ Dringlichkeitsbehandlung
- ✅ Eskalationsempfehlungen
- ✅ Fallback ohne OpenAI

## Best Practices

### 1. Rechtsbezüge

- Immer konkrete Paragraphen angeben (§ 536 BGB)
- URLs zu gesetze-im-internet.de bereitstellen
- Relevante Auszüge einbinden
- Gerichtsentscheidungen referenzieren (wenn verfügbar)

### 2. Handlungsempfehlungen

- Priorisierung nach Dringlichkeit
- Klare Fristen angeben
- Rechtliche Grundlage nennen
- Praktische Details bereitstellen
- Schrittweise Anleitung

### 3. Sprache

- Verständlich, kein Juristendeutsch
- Empathisch und unterstützend
- Strukturiert und übersichtlich
- Warnung bei Fristen
- Eskalationshinweise bei Bedarf

### 4. Fehlerbehandlung

- Graceful Degradation bei OpenAI-Ausfall
- Fallback auf Template-basierte Antworten
- Logging aller Fehler
- Immer Pflicht-Referenzen zurückgeben

## Erweiterungen

### Geplante Features

1. **Semantische Suche**
   - Embeddings für bessere Rechtsnorm-Suche
   - Vector Database Integration

2. **Personalisierung**
   - Nutzerhistorie berücksichtigen
   - Lernende Empfehlungen

3. **Multimodale Antworten**
   - Diagramme und Visualisierungen
   - Video-Anleitungen

4. **Erweiterte Templates**
   - Mehr Musterdokumente
   - Automatische Personalisierung
   - PDF-Generierung

## Anforderungen

Erfüllt folgende Anforderungen aus dem Requirements-Dokument:

- **2.4**: Verweise auf anwendbare Gesetze (§ 536 BGB, § 573 BGB, etc.)
- **4.2**: Spezifische Handlungsempfehlungen
- **4.3**: Verweise auf relevante Rechtstexte und Gerichtsentscheidungen
- **8.1-8.5**: Template-Generierung und Musterbriefe

## Siehe auch

- [Chat Service Documentation](./chat-service.md)
- [Legal Case Classifier](./legal-case-classifier.md)
- [Knowledge Service](./knowledge-service.md)
- [Template System](./template-system.md)
