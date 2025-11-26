# Document Upload und Analysis Interface Implementierung

## Übersicht

Das Document Upload und Analysis Interface ermöglicht Nutzern das Hochladen von Mietdokumenten mit automatischer rechtlicher Analyse. Die Implementierung umfasst Drag & Drop, Progress-Anzeige, Issue-Highlighting und Download-Funktionalität.

## Implementierte Features

### 1. Drag-and-Drop File-Upload mit Progress-Anzeige
- **Komponente**: `DocumentUploadDialog.tsx`
- **Funktionalität**:
  - Drag & Drop Unterstützung für Dateien
  - Dateivalidierung (Typ und Größe)
  - Echtzeit-Progress-Anzeige während Upload
  - Dokumenttyp-Auswahl (Mietvertrag, Nebenkostenabrechnung, etc.)
  - Unterstützte Formate: PDF, JPG, PNG (max. 10MB)

### 2. Analyse-Ergebnis-Darstellung mit Issue-Highlighting
- **Komponente**: `DocumentAnalysisView.tsx`
- **Funktionalität**:
  - Risiko-Level-Anzeige (Niedrig, Mittel, Hoch)
  - Extrahierte Daten aus Dokumenten
  - Gefundene Probleme mit Schweregrad-Kennzeichnung
  - Rechtliche Grundlagen für jedes Problem
  - Empfohlene Maßnahmen
  - Handlungsempfehlungen mit Prioritäten

### 3. Download-Funktionalität für Dokumente
- **Funktionalität**:
  - Download von hochgeladenen Originaldokumenten
  - Automatische Dateinamen-Verwaltung
  - Blob-basierter Download für Browser-Kompatibilität

### 4. Dokumentenverwaltung
- **Seite**: `DocumentsPage.tsx`
- **Funktionalität**:
  - Übersicht aller hochgeladenen Dokumente
  - Status-Anzeige (Hochladen, Analysieren, Abgeschlossen, Fehler)
  - Dokumenttyp-Kennzeichnung
  - Upload-Datum
  - Aktionen: Ansehen, Herunterladen, Löschen

## Komponenten-Struktur

### DocumentsPage
Hauptseite für Dokumentenverwaltung mit folgenden Bereichen:
- Header mit Upload-Button
- Dokumenten-Grid mit Cards
- Upload-Dialog
- Analyse-Dialog

### DocumentUploadDialog
Dialog für Datei-Upload mit:
- Drag & Drop Zone
- Dateiauswahl-Button
- Dokumenttyp-Dropdown
- Progress-Bar
- Validierung und Fehlerbehandlung

### DocumentAnalysisView
Detaillierte Analyse-Ansicht mit:
- Risiko-Level Badge
- Extrahierte Daten (falls vorhanden)
- Liste der gefundenen Probleme
- Empfehlungen mit Prioritäten
- Farbcodierung nach Schweregrad

## API-Integration

### Endpunkte

**Upload:**
```typescript
POST /api/documents/upload
Content-Type: multipart/form-data
Body: { file: File, documentType: string }
Response: { success: boolean, data: { documentId: string } }
```

**Analyse:**
```typescript
POST /api/documents/:documentId/analyze
Response: { 
  success: boolean, 
  data: {
    documentType: string,
    issues: Issue[],
    recommendations: Recommendation[],
    riskLevel: 'low' | 'medium' | 'high',
    extractedData?: Record<string, any>
  }
}
```

**Liste abrufen:**
```typescript
GET /api/documents
Response: { success: boolean, data: Document[] }
```

**Download:**
```typescript
GET /api/documents/:documentId/download
Response: Blob (PDF/Image)
```

**Löschen:**
```typescript
DELETE /api/documents/:documentId
Response: { success: boolean }
```

## Datenmodelle

### Document
```typescript
interface Document {
  id: string;
  name: string;
  type: string;
  uploadDate: Date;
  status: 'uploading' | 'analyzing' | 'completed' | 'error';
  analysisResult?: AnalysisResult;
}
```

### AnalysisResult
```typescript
interface AnalysisResult {
  documentType: string;
  extractedData?: Record<string, any>;
  issues: Issue[];
  recommendations: Recommendation[];
  riskLevel: 'low' | 'medium' | 'high';
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
  title: string;
  description: string;
  priority: 'low' | 'medium' | 'high';
}
```

## Verwendung

### Dokument hochladen
1. Klicke auf "Dokument hochladen" Button
2. Wähle Datei per Drag & Drop oder Klick
3. Wähle Dokumenttyp aus
4. Klicke auf "Hochladen"
5. Warte auf automatische Analyse

### Analyse ansehen
1. Klicke auf Ansehen-Icon bei einem Dokument
2. Betrachte Risiko-Level
3. Prüfe gefundene Probleme
4. Lese Empfehlungen

### Dokument herunterladen
1. Klicke auf Download-Icon
2. Datei wird automatisch heruntergeladen

## Validierung

### Datei-Upload
- **Maximale Größe**: 10MB
- **Erlaubte Typen**: PDF, JPG, JPEG, PNG
- **Fehlerbehandlung**: Benutzerfreundliche Fehlermeldungen

### Dokumenttypen
- Mietvertrag (rental_contract)
- Nebenkostenabrechnung (utility_bill)
- Abmahnung (warning_letter)
- Kündigung (termination)
- Sonstiges (other)

## Schweregrad-Kennzeichnung

### Issues
- **Critical** (Kritisch): Rot - Schwerwiegende rechtliche Probleme
- **Warning** (Warnung): Orange - Potenzielle Probleme
- **Info** (Information): Blau - Hinweise und Informationen

### Risiko-Level
- **High** (Hoch): Rot - Sofortiges Handeln erforderlich
- **Medium** (Mittel): Orange - Aufmerksamkeit erforderlich
- **Low** (Niedrig): Grün - Keine kritischen Probleme

### Prioritäten
- **High** (Hoch): Rot - Dringende Empfehlung
- **Medium** (Mittel): Orange - Wichtige Empfehlung
- **Low** (Niedrig): Blau - Optionale Empfehlung

## Mehrsprachigkeit

Vollständige Unterstützung für:
- Deutsch (de)
- Türkisch (tr)
- Arabisch (ar)

Alle UI-Texte, Fehlermeldungen und Analyse-Ergebnisse sind übersetzt.

## Barrierefreiheit

- **ARIA-Labels**: Alle Buttons und Icons haben beschreibende Labels
- **Keyboard-Navigation**: Vollständige Tastaturunterstützung
- **Screenreader**: Optimiert für Screenreader
- **Farbkontraste**: WCAG 2.1 AA konform
- **Fokus-Management**: Klare Fokus-Indikatoren

## Tests

### Unit Tests
- **Datei**: `web-app/src/tests/documents.test.tsx`
- **Abdeckung**:
  - Rendering der Dokumente-Seite
  - Laden von Dokumenten
  - Upload-Dialog öffnen
  - Analyse-Ergebnisse anzeigen
  - Verschiedene Dokumentstatus
  - Issue-Darstellung mit Schweregraden

### E2E Tests
Empfohlene Szenarien:
1. Vollständiger Upload-Flow mit Analyse
2. Dokument ansehen und herunterladen
3. Dokument löschen
4. Mehrere Dokumente gleichzeitig verwalten
5. Fehlerbehandlung bei ungültigen Dateien

## Performance-Optimierungen

1. **Lazy Loading**: Dokumente werden nur bei Bedarf geladen
2. **Progress-Tracking**: Echtzeit-Feedback während Upload
3. **Optimistische Updates**: UI wird sofort aktualisiert
4. **Caching**: Redux State für schnellen Zugriff
5. **Blob-Download**: Effiziente Dateiübertragung

## Fehlerbehandlung

### Upload-Fehler
- Datei zu groß
- Ungültiger Dateityp
- Netzwerkfehler
- Server-Fehler

### Analyse-Fehler
- Dokument konnte nicht analysiert werden
- Timeout bei langer Analyse
- Unbekannter Dokumenttyp

### Download-Fehler
- Dokument nicht gefunden
- Netzwerkfehler
- Keine Berechtigung

## Zukünftige Verbesserungen

1. **Batch-Upload**: Mehrere Dateien gleichzeitig hochladen
2. **OCR-Vorschau**: Extrahierten Text vor Analyse anzeigen
3. **Vergleichsfunktion**: Mehrere Dokumente vergleichen
4. **Export**: Analyse-Ergebnisse als PDF exportieren
5. **Versionierung**: Verschiedene Versionen eines Dokuments verwalten
6. **Kommentare**: Notizen zu Dokumenten hinzufügen
7. **Teilen**: Dokumente mit Anwälten teilen
8. **Templates**: Häufig verwendete Dokumenttypen als Templates

## Bekannte Einschränkungen

1. **Dateigröße**: Maximum 10MB pro Datei
2. **Formate**: Nur PDF und Bilder (JPG, PNG)
3. **Gleichzeitige Uploads**: Ein Upload zur Zeit
4. **Offline-Modus**: Keine Offline-Unterstützung
5. **Browser-Kompatibilität**: Moderne Browser erforderlich

## Fehlerbehebung

### Upload funktioniert nicht
- Prüfen Sie Dateigröße und -typ
- Prüfen Sie Netzwerkverbindung
- Prüfen Sie Browser-Konsole für Fehler

### Analyse dauert zu lange
- Große Dateien können länger dauern
- Komplexe Dokumente benötigen mehr Zeit
- Bei Timeout: Dokument erneut hochladen

### Download schlägt fehl
- Prüfen Sie Browser-Einstellungen für Downloads
- Prüfen Sie verfügbaren Speicherplatz
- Versuchen Sie es mit einem anderen Browser
