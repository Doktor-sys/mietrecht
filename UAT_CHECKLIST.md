# User Acceptance Testing (UAT) Checkliste

Diese Liste dient der manuellen Abnahme des SmartLaw Mietrecht Agents.

## 1. Chat & Kommunikation

- [ ] **Start**: Die Chat-Seite lädt schnell und zeigt eine Begrüßung.
- [ ] **Senden**: Nachrichten können gesendet werden (Enter oder Button).
- [ ] **Antwort**: Der Bot antwortet innerhalb von 5 Sekunden.
- [ ] **Typing**: Ein "Schreibt..."-Indikator ist sichtbar, während der Bot denkt.
- [ ] **Formatierung**: Die Antwort ist gut lesbar formatiert (Absätze, Listen).

## 2. Dokumenten-Analyse

- [ ] **Upload-Button**: Der Button zum Anhängen ist sichtbar.
- [ ] **Dateiauswahl**: PDF-Dateien können ausgewählt werden.
- [ ] **Validierung**: Ungültige Dateien (z.B. .exe) werden abgelehnt.
- [ ] **Analyse**: Nach dem Upload erfolgt eine Analyse (Feedback im Chat).
- [ ] **Ergebnis**: Gefundene Probleme (z.B. unwirksame Klauseln) werden verständlich erklärt.

## 3. Rechtliche Beratung (Szenarien)

### Szenario A: Mietminderung
- [ ] **Eingabe**: "Heizung ausgefallen"
- [ ] **Erwartung**: Hinweis auf § 536 BGB, Minderungstabelle, Handlungsempfehlung (Mängelanzeige).

### Szenario B: Kündigung
- [ ] **Eingabe**: "Kündigung wegen Eigenbedarf erhalten"
- [ ] **Erwartung**: Erklärung der Voraussetzungen (§ 573 BGB), Widerspruchsfrist (§ 574 BGB).

### Szenario C: Kaution
- [ ] **Eingabe**: "Wann bekomme ich meine Kaution?"
- [ ] **Erwartung**: Erklärung der Fälligkeit (ca. 3-6 Monate), § 551 BGB.

## 4. Mobile Experience

- [ ] **Responsive**: Layout passt sich dem Smartphone-Bildschirm an.
- [ ] **Tastatur**: Die virtuelle Tastatur verdeckt nicht das Eingabefeld.
- [ ] **Touch**: Buttons sind groß genug und gut bedienbar.

## 5. Performance & Stabilität

- [ ] **Ladezeit**: Initiales Laden < 2 Sekunden.
- [ ] **Fehler**: Keine "Something went wrong" Abstürze bei normaler Nutzung.
- [ ] **Reconnect**: Chat verbindet sich neu, wenn das Internet kurz weg war.
