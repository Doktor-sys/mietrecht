# Booking und Consultation Management System

## Übersicht

Das Booking und Consultation Management System ermöglicht es Nutzern, Termine mit Mietrechtsanwälten zu buchen und Online-Beratungen durchzuführen. Das System unterstützt verschiedene Meeting-Typen (Video, Telefon, persönlich) und bietet sichere Datenübertragung zwischen KI-System und Anwälten.

## Architektur

### Komponenten

1. **BookingService**: Verwaltung von Buchungen und Zeitslots
2. **ConsultationService**: Video-Meeting-Integration und Datenübertragung
3. **BookingController**: REST API-Endpunkte
4. **Prisma Models**: Booking, TimeSlot, LawyerReview

## Features

### 1. Terminbuchung

#### Buchungsprozess

```typescript
// 1. Verfügbare Zeitslots abrufen
GET /api/lawyers/:lawyerId/available-slots?startDate=2025-12-01&endDate=2025-12-31

// 2. Buchung erstellen
POST /api/bookings
{
  "lawyerId": "lawyer-1",
  "timeSlotId": "slot-1",
  "meetingType": "VIDEO",
  "notes": "Mietminderung wegen Schimmel"
}

// 3. Buchung bestätigen (Anwalt)
POST /api/bookings/:id/confirm
```

#### Buchungsstatus

- **PENDING**: Buchung erstellt, wartet auf Bestätigung
- **CONFIRMED**: Von Anwalt bestätigt
- **COMPLETED**: Beratung abgeschlossen
- **CANCELLED**: Storniert

### 2. Video-Meeting-Integration

Das System unterstützt mehrere Video-Meeting-Provider:

#### Jitsi Meet (Standard)

```typescript
{
  "provider": "jitsi",
  "roomId": "booking123-1234567890-abc123",
  "roomUrl": "https://meet.jit.si/smartlaw-booking123-1234567890-abc123",
  "startTime": "2025-12-01T10:00:00Z",
  "endTime": "2025-12-01T11:00:00Z"
}
```

**Vorteile:**
- Keine API-Keys erforderlich
- DSGVO-konform (kann selbst gehostet werden)
- Kostenlos
- Einfache Integration

#### Zoom

```typescript
{
  "provider": "zoom",
  "roomId": "123456789",
  "roomUrl": "https://zoom.us/j/123456789",
  "password": "AbCd1234",
  "startTime": "2025-12-01T10:00:00Z",
  "endTime": "2025-12-01T11:00:00Z"
}
```

**Vorteile:**
- Professionelle Plattform
- Gute Qualität
- Aufzeichnungsfunktion

**Nachteile:**
- API-Keys erforderlich
- Kostenpflichtig für erweiterte Features

#### Microsoft Teams

```typescript
{
  "provider": "teams",
  "roomId": "meeting-id",
  "roomUrl": "https://teams.microsoft.com/l/meetup-join/...",
  "startTime": "2025-12-01T10:00:00Z",
  "endTime": "2025-12-01T11:00:00Z"
}
```

### 3. Sichere Datenübertragung

#### Falldaten übertragen

```typescript
POST /api/bookings/:id/transfer-data
{
  "caseId": "case-1",
  "summary": "Mietminderung wegen Schimmel in der Wohnung"
}
```

Das System überträgt automatisch:
- Fall-Beschreibung und Kategorie
- Letzte 10 Chat-Nachrichten
- Hochgeladene Dokumente (Metadaten)
- Relevante Rechtsbezüge

#### Manuelle Datenübertragung

Wenn kein Fall-ID vorhanden:

```typescript
POST /api/bookings/:id/transfer-data
{
  "summary": "Mietminderung wegen Schimmel",
  "documents": ["doc-1", "doc-2"],
  "legalReferences": [
    {
      "type": "law",
      "reference": "§ 536 BGB",
      "title": "Mietminderung bei Sach- und Rechtsmängeln"
    }
  ]
}
```

### 4. Konsultations-Session

#### Session starten

```typescript
POST /api/bookings/:id/start-consultation

Response:
{
  "bookingId": "booking-1",
  "meetingType": "VIDEO",
  "meetingConfig": {
    "provider": "jitsi",
    "roomUrl": "https://meet.jit.si/smartlaw-..."
  },
  "status": "active",
  "startedAt": "2025-12-01T10:00:00Z"
}
```

**Validierung:**
- Konsultation kann nur 15 Minuten vor/nach geplanter Zeit gestartet werden
- Buchung muss bestätigt sein

#### Session beenden

```typescript
POST /api/bookings/:id/end-consultation
{
  "notes": "Beratung erfolgreich. Empfehlung: Mietminderung von 20%"
}
```

### 5. Zeitslot-Verwaltung

#### Zeitslots erstellen (Anwalt)

```typescript
POST /api/lawyers/:lawyerId/time-slots
{
  "slots": [
    {
      "startTime": "2025-12-01T10:00:00Z",
      "endTime": "2025-12-01T11:00:00Z"
    },
    {
      "startTime": "2025-12-01T14:00:00Z",
      "endTime": "2025-12-01T15:00:00Z"
    }
  ]
}
```

#### Verfügbare Slots abrufen

```typescript
GET /api/lawyers/:lawyerId/available-slots?startDate=2025-12-01&endDate=2025-12-31

Response:
[
  {
    "id": "slot-1",
    "startTime": "2025-12-01T10:00:00Z",
    "endTime": "2025-12-01T11:00:00Z"
  }
]
```

## Sicherheit

### Datenschutz

1. **Verschlüsselung**: Alle Daten werden verschlüsselt übertragen (TLS 1.3)
2. **Zugriffskontrolle**: Nur autorisierte Nutzer können Buchungen einsehen
3. **Datenminimierung**: Nur notwendige Daten werden übertragen
4. **DSGVO-Konformität**: Nutzer können Daten jederzeit löschen lassen

### Authentifizierung

Alle Endpunkte erfordern JWT-Authentifizierung:

```typescript
Authorization: Bearer <jwt-token>
```

### Berechtigungen

- **Nutzer**: Kann eigene Buchungen erstellen, einsehen, stornieren
- **Anwalt**: Kann Buchungen bestätigen, abschließen, Falldaten abrufen

## Fehlerbehandlung

### Häufige Fehler

#### 404 - Buchung nicht gefunden

```json
{
  "success": false,
  "error": {
    "code": "NOT_FOUND",
    "message": "Buchung nicht gefunden"
  }
}
```

#### 409 - Zeitslot nicht verfügbar

```json
{
  "success": false,
  "error": {
    "code": "CONFLICT",
    "message": "Zeitslot ist nicht verfügbar"
  }
}
```

#### 400 - Validierungsfehler

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Startzeit muss vor Endzeit liegen"
  }
}
```

## Workflow-Beispiel

### Kompletter Buchungs- und Beratungsablauf

```typescript
// 1. Nutzer sucht Anwalt
GET /api/lawyers?location=Berlin&specialization=Mietrecht

// 2. Nutzer sieht verfügbare Termine
GET /api/lawyers/lawyer-1/available-slots?startDate=2025-12-01&endDate=2025-12-31

// 3. Nutzer bucht Termin
POST /api/bookings
{
  "lawyerId": "lawyer-1",
  "timeSlotId": "slot-1",
  "meetingType": "VIDEO"
}

// 4. Anwalt bestätigt Buchung
POST /api/bookings/booking-1/confirm

// 5. Nutzer überträgt Falldaten
POST /api/bookings/booking-1/transfer-data
{
  "caseId": "case-1",
  "summary": "Mietminderung wegen Schimmel"
}

// 6. Zur vereinbarten Zeit: Konsultation starten
POST /api/bookings/booking-1/start-consultation

// 7. Video-Meeting beitreten
// Nutzer und Anwalt öffnen roomUrl im Browser

// 8. Nach Beratung: Konsultation beenden
POST /api/bookings/booking-1/end-consultation
{
  "notes": "Empfehlung: 20% Mietminderung"
}

// 9. Anwalt schließt Buchung ab
POST /api/bookings/booking-1/complete

// 10. Nutzer bewertet Anwalt
POST /api/lawyers/lawyer-1/reviews
{
  "bookingId": "booking-1",
  "rating": 5,
  "comment": "Sehr kompetente Beratung"
}
```

## Testing

### Unit Tests

```bash
npm test bookingService.test.ts
npm test consultationService.test.ts
```

### Integration Tests

```typescript
describe('Booking Flow', () => {
  it('sollte kompletten Buchungsablauf durchführen', async () => {
    // 1. Zeitslots erstellen
    // 2. Buchung erstellen
    // 3. Buchung bestätigen
    // 4. Daten übertragen
    // 5. Konsultation durchführen
    // 6. Buchung abschließen
  });
});
```

## Performance

### Optimierungen

1. **Caching**: Verfügbare Zeitslots werden für 5 Minuten gecacht
2. **Indexierung**: Datenbank-Indizes auf `lawyerId`, `userId`, `status`
3. **Pagination**: Buchungslisten werden paginiert (max. 50 pro Seite)

### Monitoring

```typescript
// Metriken
- booking_creation_time
- consultation_duration
- video_meeting_quality
- data_transfer_size
```

## Zukünftige Erweiterungen

1. **Kalender-Integration**: iCal/Google Calendar Export
2. **Erinnerungen**: E-Mail/SMS-Benachrichtigungen vor Termin
3. **Aufzeichnung**: Video-Aufzeichnung mit Einwilligung
4. **Transkription**: Automatische Transkription der Beratung
5. **Follow-up**: Automatische Follow-up-Termine vorschlagen
6. **Rechnungsstellung**: Automatische Rechnungserstellung nach Beratung

## Troubleshooting

### Video-Meeting startet nicht

1. Prüfe Browser-Kompatibilität (Chrome, Firefox, Safari)
2. Prüfe Kamera/Mikrofon-Berechtigungen
3. Prüfe Firewall-Einstellungen
4. Verwende alternativen Provider (Jitsi → Zoom)

### Zeitslot nicht verfügbar

1. Prüfe ob Zeitslot bereits gebucht
2. Prüfe ob Zeitslot in der Vergangenheit liegt
3. Aktualisiere verfügbare Slots

### Datenübertragung fehlgeschlagen

1. Prüfe Buchungsstatus (muss CONFIRMED sein)
2. Prüfe Berechtigungen (userId muss übereinstimmen)
3. Prüfe Fall-Existenz und Berechtigung

## Support

Bei Fragen oder Problemen:
- Dokumentation: `/api-docs`
- E-Mail: support@smartlaw.de
- GitHub Issues: https://github.com/smartlaw/backend/issues
