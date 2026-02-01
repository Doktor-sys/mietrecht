# Mietrecht Agent mit NLP-Funktionen

Diese Dokumentation beschreibt die erweiterten Natural Language Processing (NLP) Funktionen für den Mietrecht Agenten.

## Übersicht

Der Mietrecht Agent mit NLP-Funktionen bietet erweiterte Möglichkeiten zur Analyse und Verarbeitung von Gerichtsentscheidungen durch den Einsatz von Natural Language Processing Technologien. Die Erweiterungen umfassen:

1. **Automatische Zusammenfassung** - Erstellung präziser Zusammenfassungen von Urteilen
2. **Themenextraktion** - Identifizierung relevanter Rechtsgebiete in Entscheidungen
3. **Entitätenextraktion** - Erkennung von Personen, Organisationen und Orten
4. **Wichtigkeitsklassifizierung** - Automatische Bewertung der Bedeutung von Entscheidungen
5. **Praxisimplikationen** - Generierung von praktischen Auswirkungen für Anwälte

## Funktionen

### Automatische Zusammenfassung

Die Funktion erstellt präzise Zusammenfassungen von langen Gerichtsentscheidungen, um Anwälten Zeit zu sparen.

```javascript
const { summarizeDecision } = require('./nlp_processor.js');

const summary = summarizeDecision(fullDecisionText);
```

### Themenextraktion

Identifiziert relevante Rechtsgebiete und Themen in Gerichtsentscheidungen.

```javascript
const { extractTopics } = require('./nlp_processor.js');

const topics = extractTopics(fullDecisionText);
```

### Entitätenextraktion

Erkennt und extrahiert wichtige Entitäten wie Personen, Organisationen und Orte aus Entscheidungen.

```javascript
const { extractEntities } = require('./nlp_processor.js');

const entities = extractEntities(fullDecisionText);
// Resultat: { persons: [...], organizations: [...], locations: [...] }
```

### Wichtigkeitsklassifizierung

Bewertet automatisch die Bedeutung von Entscheidungen (hoch, mittel, niedrig).

```javascript
const { classifyImportance } = require('./nlp_processor.js');

const importance = classifyImportance(decisionObject);
```

### Praxisimplikationen

Generiert praktische Auswirkungen von Entscheidungen für die Anwaltspraxis.

```javascript
const { generatePracticeImplications } = require('./nlp_processor.js');

const implications = generatePracticeImplications(fullDecisionText);
```

### Entscheidungsvergleich

Vergleicht zwei Gerichtsentscheidungen auf Ähnlichkeit.

```javascript
const { compareDecisions } = require('./nlp_processor.js');

const similarity = compareDecisions(decision1, decision2);
```

## Installation

Die NLP-Funktionen verwenden dieselben Abhängigkeiten wie das bestehende Projekt:

```bash
npm install
```

## Verwendung

### Ausführen des erweiterten Mietrecht-Agenten

```bash
npm run mietrecht-agent-nlp
```

### Ausführen der NLP-Tests

```bash
npm run test-nlp
npm run test-mietrecht-nlp
```

## Integration mit dem Mietrecht-Agenten

Die NLP-Funktionen können nahtlos in den bestehenden Mietrecht-Agenten integriert werden:

```javascript
const { enhanceDecisionsWithNLP } = require('./mietrecht_agent_nlp.js');

// Verbessere Entscheidungen mit NLP-Analyse
const enhancedDecisions = enhanceDecisionsWithNLP(rawDecisions);
```

## Zukünftige Verbesserungen

Geplante Erweiterungen für die NLP-Funktionen umfassen:

1. **Integration echter NLP-Dienste** - Anbindung an AWS Comprehend, Google Natural Language oder ähnliche Dienste
2. **Maschinelles Lernen Modelle** - Training spezialisierter Modelle für juristische Texte
3. **Sprachunterstützung** - Erweiterung auf mehrere Sprachen
4. **Sentiment-Analyse** - Erkennung der Stimmung in Gerichtsentscheidungen
5. **Rechtsfolgen-Extraktion** - Automatische Identifizierung von konkreten Rechtsfolgen

## Architektur

### NLP-Prozessor (`nlp_processor.js`)

Das Kernmodul für die Natural Language Processing Funktionen:

- `summarizeDecision()` - Erstellt Zusammenfassungen
- `extractTopics()` - Extrahiert relevante Themen
- `extractEntities()` - Erkennt Entitäten
- `classifyImportance()` - Bewertet Wichtigkeit
- `generatePracticeImplications()` - Generiert Praxisimplikationen
- `compareDecisions()` - Vergleicht Entscheidungen

### Erweiterter Mietrecht-Agent (`mietrecht_agent_nlp.js`)

Der Agent mit integrierten NLP-Funktionen:

- `enhanceDecisionsWithNLP()` - Verbessert Entscheidungen mit NLP
- `filterDecisionsForLawyer()` - Filtert Entscheidungen nach Anwaltseinstellungen
- `generateNewsletter()` - Erstellt personalisierte Newsletter mit NLP-Inhalten

## Support

Für Fragen oder Probleme mit den NLP-Funktionen wenden Sie sich bitte an das Entwicklungsteam.