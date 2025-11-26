# Chat-Interface Implementierung

## Übersicht

Das Chat-Interface wurde mit Real-time Updates über WebSocket implementiert. Es ermöglicht Nutzern, mietrechtliche Fragen zu stellen und sofortige KI-gestützte Antworten zu erhalten.

## Implementierte Features

### 1. Chat-UI mit WebSocket-Verbindung
- **Komponente**: `ChatPage.tsx`
- **Funktionalität**:
  - Automatische WebSocket-Verbindung beim Laden der Seite
  - Authentifizierung über JWT-Token
  - Automatische Wiederverbindung bei Verbindungsabbruch
  - Echtzeit-Nachrichtenübertragung

### 2. Message-Komponenten mit Typing-Indikatoren
- **Komponente**: `ChatMessage.tsx`
- **Funktionalität**:
  - Unterschiedliche Darstellung für User- und AI-Nachrichten
  - Avatar-Icons für visuelle Unterscheidung
  - Anzeige von rechtlichen Referenzen als Chips
  - Zeitstempel für jede Nachricht
  - Typing-Indikator während AI-Antwort

### 3. File-Upload für Dokumente im Chat
- **Komponente**: `FileUploadDialog.tsx`
- **Funktionalität**:
  - Drag & Drop Unterstützung
  - Dateivalidierung (Typ und Größe)
  - Dokumenttyp-Auswahl (Mietvertrag, Nebenkostenabrechnung, etc.)
  - Progress-Anzeige während Upload
  - Unterstützte Formate: PDF, JPG, PNG (max. 10MB)

### 4. Mehrsprachigkeit
- **Sprachen**: Deutsch, Türkisch, Arabisch
- **Übersetzungen**: Alle Chat-Texte sind vollständig übersetzt
- **RTL-Unterstützung**: Automatische Anpassung für Arabisch

## Backend-Integration

### WebSocket Service
- **Datei**: `services/backend/src/services/WebSocketService.ts`
- **Features**:
  - JWT-basierte Authentifizierung
  - Heartbeat-Mechanismus (30s Intervall)
  - Multi-Client-Unterstützung pro User
  - Typing-Indikatoren
  - Nachrichtenübertragung in Echtzeit

### Chat-Routen
- **Datei**: `services/backend/src/routes/chat.ts`
- **Endpunkte**:
  - `POST /api/chat/start` - Neue Konversation starten
  - `POST /api/chat/:conversationId/message` - Nachricht senden
  - `GET /api/chat/history` - Konversationsverlauf abrufen
  - `GET /api/chat/:conversationId/messages` - Nachrichten einer Konversation
  - `POST /api/chat/:conversationId/escalate` - An Anwalt eskalieren

## Verwendung

### Neue Konversation starten
```typescript
const response = await chatAPI.startConversation("Meine Heizung ist kaputt");
// WebSocket sendet automatisch die AI-Antwort
```

### Nachricht senden
```typescript
const response = await chatAPI.sendMessage(conversationId, "Wie lange darf ich die Miete mindern?");
// WebSocket sendet automatisch die AI-Antwort
```

### Dokument hochladen
```typescript
const response = await documentAPI.upload(file, 'rental_contract');
// Automatische Analyse wird gestartet
```

## WebSocket-Nachrichten

### Client → Server
```json
{
  "type": "ping"
}
```

### Server → Client

**Verbindungsbestätigung:**
```json
{
  "type": "connected",
  "message": "WebSocket verbunden"
}
```

**Typing-Indikator:**
```json
{
  "type": "typing",
  "isTyping": true
}
```

**Neue Nachricht:**
```json
{
  "type": "message",
  "id": "123456",
  "content": "Das ist die AI-Antwort...",
  "timestamp": "2024-01-01T12:00:00Z",
  "legalReferences": [
    {
      "reference": "§ 536 BGB",
      "title": "Mietminderung bei Sachmängeln"
    }
  ]
}
```

**Konversations-ID:**
```json
{
  "type": "conversationId",
  "conversationId": "uuid-here"
}
```

## Barrierefreiheit

- **ARIA-Labels**: Alle interaktiven Elemente haben beschreibende Labels
- **Keyboard-Navigation**: Vollständige Tastaturunterstützung
- **Screenreader**: Optimiert für Screenreader-Nutzung
- **Farbkontraste**: WCAG 2.1 AA konform

## Tests

### Unit Tests
- **Datei**: `web-app/src/tests/chat.test.tsx`
- **Abdeckung**:
  - Rendering der Chat-Seite
  - Nachrichteneingabe und -versand
  - Typing-Indikator
  - File-Upload-Dialog

### E2E Tests
E2E-Tests sollten folgende Szenarien abdecken:
1. Vollständiger Chat-Flow von Frage bis Antwort
2. Dokumenten-Upload und Analyse
3. WebSocket-Verbindung und Wiederverbindung
4. Mehrere gleichzeitige Konversationen

## Umgebungsvariablen

### Frontend (.env)
```
REACT_APP_API_URL=http://localhost:3001/api
REACT_APP_WS_URL=ws://localhost:3001
```

### Backend (.env)
```
JWT_SECRET=your-secret-key
PORT=3001
```

## Bekannte Einschränkungen

1. **WebSocket-Verbindung**: Erfordert aktive Authentifizierung
2. **Datei-Upload**: Maximale Größe 10MB
3. **Nachrichtenlänge**: Keine explizite Begrenzung (sollte hinzugefügt werden)
4. **Offline-Modus**: Keine Offline-Unterstützung implementiert

## Zukünftige Verbesserungen

1. **Nachrichtenpersistenz**: Lokales Caching von Nachrichten
2. **Offline-Queue**: Nachrichten in Queue speichern bei Verbindungsabbruch
3. **Datei-Vorschau**: Vorschau hochgeladener Dokumente im Chat
4. **Voice-Input**: Spracherkennung für Nachrichteneingabe
5. **Rich-Text**: Formatierung in Nachrichten (fett, kursiv, Listen)
6. **Emoji-Support**: Emoji-Picker für Nachrichten
7. **Nachrichtensuche**: Volltextsuche in Konversationen
8. **Export**: Export von Konversationen als PDF

## Fehlerbehebung

### WebSocket verbindet nicht
- Prüfen Sie, ob das Backend läuft
- Prüfen Sie die WebSocket-URL in der .env
- Prüfen Sie, ob ein gültiges JWT-Token vorhanden ist

### Nachrichten werden nicht angezeigt
- Prüfen Sie die Browser-Konsole auf Fehler
- Prüfen Sie die Redux DevTools für State-Updates
- Prüfen Sie die Netzwerk-Tab für WebSocket-Nachrichten

### Datei-Upload schlägt fehl
- Prüfen Sie Dateigröße (max. 10MB)
- Prüfen Sie Dateityp (PDF, JPG, PNG)
- Prüfen Sie Backend-Logs für Fehler
