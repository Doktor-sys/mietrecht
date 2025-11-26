# 🧪 User Acceptance Testing (UAT) Guide

## SmartLaw Mietrecht Agent - UAT Plan

**Version:** 1.0.0  
**Datum:** 2025-11-22  
**Status:** Ready for Testing

---

## 📋 Übersicht

Dieses Dokument beschreibt den User Acceptance Testing Plan für den SmartLaw Mietrecht Agent.

### Testziele
- ✅ Funktionale Vollständigkeit validieren
- ✅ Benutzererfahrung (UX) bewerten
- ✅ Performance unter realen Bedingungen testen
- ✅ Compliance-Anforderungen verifizieren
- ✅ Integration mit externen Services prüfen

### Testumgebung
- **URL:** https://uat.smartlaw.de
- **Test-Accounts:** Siehe Anhang A
- **Zeitraum:** 2 Wochen
- **Tester:** 15-20 Benutzer verschiedener Personas

---

## 👥 Test-Personas

### Persona 1: Mieter - Erste Nutzung (Lisa M., 32)
**Profil:**
- Tech-affin, Studentin
- Erstes Mietrechtsproblem
- Sucht schnelle, kostengünstige Hilfe

**Zu testende Features:**
- Registrierung & Onboarding
- Erste Chat-Interaktion
- Dokument-Upload (Mietvertrag)
- Template-Generierung

### Persona 2: Mieter - Komplexer Fall (Hans K., 58)
**Profil:**
- Weniger tech-affin
- Langanhaltender Rechtsstreit
- Benötigt Anwaltsunterstützung

**Zu testende Features:**
- Multi-Dokument-Analyse
- Eskalation zu Anwalt
- Terminbuchung
- Video-Konsultation

### Persona 3: Vermieter (Sarah P., 45)
**Profil:**
- Verwaltet mehrere Objekte
- Benötigt regelmäßige Rechtsinformationen
- Business-Kunde

**Zu testende Features:**
- B2B-API-Zugang
- Bulk-Dokumentenanalyse
- Analytics & Reporting
- Template-Bibliothek

### Persona 4: Anwalt (Dr. Thomas R., 52)
**Profil:**
- Fachanwalt für Mietrecht
- Partner im SmartLaw-Netzwerk
- Empfängt Vermittlungen

**Zu testende Features:**
- Anwaltsprofil-Verwaltung
- Terminkalender
- Fallübergabe vom KI-System
- Bewertungssystem

---

## 📝 Test-Szenarien

### Szenario 1: Neuer Nutzer - Mietminderung

**Ausgangssituation:**
Lisa hat seit 3 Wochen keine Heizung. Sie möchte ihre Miete mindern.

**Schritte:**
1. ✅ Registrierung (Email + Passwort)
2. ✅ Email-Verifizierung
3. ✅ Erste Chat-Nachricht: "Meine Heizung funktioniert nicht. Kann ich die Miete mindern?"
4. ✅ KI-Antwort mit Rechtsbezug (§ 536 BGB) erhalten
5. ✅ Handlungsempfehlungen lesen
6. ✅ Template für Mietminderungsschreiben generieren
7. ✅ Dokument herunterladen und überprüfen

**Erfolgskriterien:**
- [ ] Registrierung in < 3 Minuten
- [ ] KI-Antwort in < 10 Sekunden
- [ ] Template enthält korrekte Rechtsbezüge
- [ ] Benutzer versteht die Anleitung
- [ ] Gesamtzeit < 15 Minuten

**Bewertung:**
- Funktionalität: ⭐⭐⭐⭐⭐
- Benutzerfreundlichkeit: ⭐⭐⭐⭐⭐
- Performance: ⭐⭐⭐⭐⭐
- Kommentare: _______________

---

### Szenario 2: Dokumenten-Upload & Analyse

**Ausgangssituation:**
Lisa lädt ihren Mietvertrag hoch zur Prüfung.

**Schritte:**
1. ✅ Dokument hochladen (PDF, 2MB)
2. ✅ Upload-Progress beobachten
3. ✅ Analyse-Ergebnis abwarten
4. ✅ Gefundene Probleme durchgehen
5. ✅ Empfehlungen lesen

**Erfolgskriterien:**
- [ ] Upload in < 30 Sekunden
- [ ] Analyse in < 2 Minuten
- [ ] Mindestens 3 relevante Findings
- [ ] Klare Erklärungen für Laien

**Bewertung:**
- Funktionalität: ⭐⭐⭐⭐⭐
- Benutzerfreundlichkeit: ⭐⭐⭐⭐⭐
- Genauigkeit: ⭐⭐⭐⭐⭐
- Kommentare: _______________

---

### Szenario 3: Eskalation & Anwaltsvermittlung

**Ausgangssituation:**
Hans hat eine Räumungsklage erhalten. Der Fall ist komplex.

**Schritte:**
1. ✅ Chat-Anfrage: "Ich habe eine Räumungsklage erhalten"
2. ✅ KI empfiehlt Eskalation zu Fachanwalt
3. ✅ Anwaltssuche mit Filtern (Ort, Spezialisierung, Bewertung)
4. ✅ Anwaltsprofil ansehen
5. ✅ Termin buchen (Datum, Zeit, Video/Telefon)
6. ✅ Buchungsbestätigung erhalten
7. ✅ Falldaten werden automatisch übertragen

**Erfolgskriterien:**
- [ ] Eskalation wird korrekt erkannt
- [ ] Mindestens 5 passende Anwälte gefunden
- [ ] Terminbuchung in < 5 Minuten
- [ ] Bestätigungs-Email erhalten

**Bewertung:**
- Matching-Qualität: ⭐⭐⭐⭐⭐
- Buchungsprozess: ⭐⭐⭐⭐⭐
- Datenübertragung: ⭐⭐⭐⭐⭐
- Kommentare: _______________

---

### Szenario 4: B2B Bulk-Processing

**Ausgangssituation:**
Sarah verwaltet 50 Wohnungen und möchte alle Mietverträge prüfen.

**Schritte:**
1. ✅ B2B-Account erstellen
2. ✅ API-Key generieren
3. ✅ 50 Dokumente hochladen (via API oder Web-Interface)
4. ✅ Bulk-Job-Status überwachen
5. ✅ Ergebnisse herunterladen (CSV/PDF)
6. ✅ Analytics-Dashboard ansehen

**Erfolgskriterien:**
- [ ] Bulk-Upload erfolgreich
- [ ] Verarbeitung in < 30 Minuten
- [ ] Alle Dokumente analysiert
- [ ] Report ist verständlich

**Bewertung:**
- Performance: ⭐⭐⭐⭐⭐
- Reporting: ⭐⭐⭐⭐⭐
- Business-Value: ⭐⭐⭐⭐⭐
- Kommentare: _______________

---

### Szenario 5: Mobile App - Dokument-Scan

**Ausgangssituation:**
Lisa möchte unterwegs eine Nebenkostenabrechnung scannen.

**Schritte:**
1. ✅ Mobile App öffnen
2. ✅ Kamera aktivieren
3. ✅ Dokument scannen
4. ✅ OCR-Vorschau prüfen
5. ✅ Analyse starten
6. ✅ Ergebnis auf Mobile ansehen
7. ✅ Push-Notification bei Fertigstellung

**Erfolgskriterien:**
- [ ] Scan-Qualität ist gut
- [ ] OCR-Genauigkeit > 95%
- [ ] Mobile UX ist intuitiv
- [ ] Push-Notification funktioniert

**Bewertung:**
- Mobile UX: ⭐⭐⭐⭐⭐
- OCR-Qualität: ⭐⭐⭐⭐⭐
- Performance: ⭐⭐⭐⭐⭐
- Kommentare: _______________

---

## 🎯 Acceptance Criteria

### Funktionale Anforderungen
- [ ] Alle 15+ Hauptfunktionen arbeiten fehlerfrei
- [ ] KI-Antworten sind korrekt und verständlich
- [ ] Rechtsbezüge sind aktuell und relevant
- [ ] Dokument-Analyse erkennt min. 90% der Issues

### Performance-Anforderungen
- [ ] Chat-Antwort < 10 Sekunden
- [ ] Dokument-Upload < 30 Sekunden
- [ ] Dokument-Analyse < 3 Minuten
- [ ] Seiten-Ladezeit < 2 Sekunden

### Usability-Anforderungen
- [ ] SUS-Score (System Usability Scale) > 70
- [ ] 80% der Nutzer können Kernfunktionen ohne Hilfe nutzen
- [ ] Durchschnittliche Bewertung ≥ 4/5 Sterne
- [ ] Mobile App funktioniert auf iOS & Android

### Compliance-Anforderungen
- [ ] DSGVO-Compliance vollständig
- [ ] Datenschutzerklärung vorhanden
- [ ] Cookie-Banner funktioniert
- [ ] Datenexport funktioniert
- [ ] Datenlöschung funktioniert

---

## 📊 Feedback-Sammlung

### Feedback-Methoden

**1. Umfragen:**
- Post-Task Questionnaires
- SUS (System Usability Scale)
- NPS (Net Promoter Score)

**2. Interviews:**
- 30-minütige Einzelgespräche
- Fokusgruppen (5-7 Personen)

**3. Technisch:**
- Session Recordings (Hotjar)
- Heatmaps
- Analytics (Google Analytics)
- Error Tracking (Sentry)

### Feedback-Template

**Was hat gut funktioniert?**
- _______________
- _______________
- _______________

**Was war verwirrend oder frustrierend?**
- _______________
- _______________
- _______________

**Was fehlt?**
- _______________
- _______________
- _______________

**Würden Sie SmartLaw weiterempfehlen?**
- ☐ Ja, definitiv (Promoter)
- ☐ Vielleicht (Passive)
- ☐ Eher nicht (Detractor)

**Zusätzliche Kommentare:**
_______________________________________________

---

## 🐛 Bug-Reporting

### Bug-Report-Template

```markdown
**Titel:** [Kurze Beschreibung]

**Schweregrad:**
- ☐ Critical (System nicht nutzbar)
- ☐ High (Wichtige Funktion defekt)
- ☐ Medium (Feature teilweise defekt)
- ☐ Low (Kosmetischer Fehler)

**Schritte zur Reproduktion:**
1. 
2. 
3. 

**Erwartetes Verhalten:**

**Tatsächliches Verhalten:**

**Screenshots/Videos:**

**Browser/Device:**

**Zusätzliche Informationen:**
```

### Bug-Tracking
- **Tool:** GitHub Issues / Jira
- **Labels:** `uat-bug`, `severity:high`, `ux-issue`
- **Response Time:** < 24h für Critical Bugs

---

## 📅 Zeitplan

### Woche 1: Vorbereitung
- [x] Test-Accounts erstellen
- [x] Test-Dokumentation bereitstellen
- [x] Tester einladen
- [x] Kickoff-Meeting

### Woche 2-3: Testing
- [ ] Tester führen Szenarien durch
- [ ] Daily Standup für Bug-Besprechung
- [ ] Hotfixes deployen (wenn nötig)

### Woche 4: Auswertung
- [ ] Feedback aggregieren
- [ ] Bugs priorisieren
- [ ] Abschlussbericht erstellen
- [ ] Go/No-Go Entscheidung

---

## ✅ Go/No-Go Kriterien

### Go-Live genehmigt, wenn:
- ✅ Alle Critical & High Bugs behoben
- ✅ 90% der Acceptance Criteria erfüllt
- ✅ SUS-Score > 70
- ✅ NPS > 30
- ✅ Performance-Ziele erreicht
- ✅ Keine sicherheitskritischen Issues

### Go-Live verzögert, wenn:
- ⚠️ > 5 High-Priority Bugs offen
- ⚠️ SUS-Score < 60
- ⚠️ Kritische Usability-Probleme
- ⚠️ DSGVO-Compliance nicht gegeben

---

## 📞 Kontakt

**UAT-Koordinator:** Max Mustermann  
**Email:** uat@smartlaw.de  
**Slack:** #smartlaw-uat  
**Hotline:** +49 xxx xxx xxxx

---

## 📎 Anhang A: Test-Accounts

```
Mieter-Account:
Email: lisa.test@smartlaw.de
Password: TestPass2024!

Vermieter-Account:
Email: sarah.business@smartlaw.de
Password: TestPass2024!

Anwalt-Account:
Email: dr.rechts@smartlaw.de
Password: TestPass2024!
```

---

**Viel Erfolg beim Testing!** 🚀
