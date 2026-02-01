# Play Store Grafische Assets - Spezifikationen

Dieses Dokument enthält die Spezifikationen für alle erforderlichen grafischen Assets für den Google Play Store.

## Erforderliche Assets

### 1. App Icon (512x512 PNG)

**Spezifikationen:**
- **Größe:** 512 x 512 Pixel
- **Format:** PNG mit 32-bit Farbtiefe
- **Hintergrund:** Transparent oder weiß
- **Dateiname:** `icon-512x512.png`
- **Speicherort:** `static/images/play_store/`

**Design-Anforderungen:**
- JurisMind Logo/Branding
- Klare Erkennbarkeit auch bei kleinen Größen
- Farbschema: Blau-Gradient (#2563eb → #3b82f6)
- Moderne, professionelle Optik
- Rechtliche Symbolik (Waage, Paragraf, etc.) kombiniert mit Tech-Elementen

**Hinweis:** Da die automatische Bildgenerierung das Quota überschritten hat, muss dieses Asset manuell erstellt werden mit einem Grafikdesign-Tool wie:
- Adobe Illustrator
- Figma
- Canva
- GIMP (kostenlos)

---

### 2. Feature Graphic (1024x500 PNG)

**Spezifikationen:**
- **Größe:** 1024 x 500 Pixel
- **Format:** PNG oder JPEG
- **Dateiname:** `feature-graphic.png`
- **Speicherort:** `static/images/play_store/`

**Design-Anforderungen:**
- JurisMind Branding prominent
- Slogan: "Intelligente Konfliktlösung für Mieter und Vermieter"
- Visuell ansprechend und professionell
- Keine wichtigen Elemente in den äußeren 132px (werden auf manchen Geräten abgeschnitten)
- Farbschema konsistent mit App-Design

**Empfohlener Inhalt:**
- Logo links oder zentriert
- Slogan/Tagline
- Visuelle Darstellung der App-Funktionalität (z.B. Mockup-Screenshots)
- Call-to-Action oder Hauptfeatures

---

### 3. Phone Screenshots (mind. 2-8)

**Spezifikationen:**
- **Größe:** 1080 x 1920 Pixel (oder höher, 16:9 Verhältnis)
- **Format:** PNG oder JPEG
- **Anzahl:** Mindestens 2, maximal 8
- **Dateinamen:** `screenshot-1.png`, `screenshot-2.png`, etc.
- **Speicherort:** `static/images/play_store/screenshots/`

**Empfohlene Screenshots:**

1. **Screenshot 1: Startseite**
   - Zeigt die Hauptfunktion: Fallbeschreibung eingeben
   - Suchfeld und Themen-Grid sichtbar
   - Klare UI, professionell

2. **Screenshot 2: KI-Analyse Ergebnis**
   - Zeigt die KI-Einschätzung mit Risikobewertung
   - Rechtliche Empfehlungen sichtbar
   - Demonstriert den Mehrwert der App

3. **Screenshot 3: Anwalts-Matching** (optional)
   - Zeigt gefundene Anwälte mit Profilen
   - Bewertungen und Spezialisierungen
   - Vertrauenswürdigkeit vermitteln

4. **Screenshot 4: Terminbuchung** (optional)
   - Kalender-Ansicht
   - Buchungsübersicht
   - Zeigt den vollständigen Workflow

**Wichtig:**
- Screenshots sollten echte App-Inhalte zeigen (keine Mockups)
- Keine persönlichen Daten oder echte Kundennamen
- Gute Beleuchtung und klare Lesbarkeit
- Konsistente Statusleiste (Zeit, Akku, etc.)

**Erstellung:**
- App im Browser öffnen (http://localhost:5000)
- Browser-DevTools → Device Toolbar (F12 → Toggle Device Toolbar)
- Gerät auswählen: "Pixel 5" oder ähnlich (1080x1920)
- Screenshots mit Browser-Tools oder Snipping Tool erstellen
- Auf exakte Größe zuschneiden

---

### 4. Tablet Screenshots (optional)

**Spezifikationen:**
- **7-Zoll:** 1200 x 1920 Pixel
- **10-Zoll:** 1600 x 2560 Pixel
- **Format:** PNG oder JPEG
- **Speicherort:** `static/images/play_store/screenshots/tablet/`

**Hinweis:** Tablet-Screenshots sind optional, aber empfohlen wenn die App für Tablets optimiert ist.

---

## Checkliste

- [ ] App Icon (512x512) erstellt
- [ ] Feature Graphic (1024x500) erstellt
- [ ] Screenshot 1 (Startseite) erstellt
- [ ] Screenshot 2 (KI-Analyse) erstellt
- [ ] Screenshot 3 (Anwalts-Matching) erstellt (optional)
- [ ] Screenshot 4 (Terminbuchung) erstellt (optional)
- [ ] Alle Assets in korrekter Größe und Format
- [ ] Alle Assets im Ordner `static/images/play_store/` gespeichert

---

## Tools zur Asset-Erstellung

### Kostenlose Tools:
- **GIMP** - Bildbearbeitung (https://www.gimp.org/)
- **Inkscape** - Vektorgrafik (https://inkscape.org/)
- **Canva** - Online-Design-Tool (https://www.canva.com/)
- **Figma** - UI/UX Design (https://www.figma.com/)

### Screenshot-Tools:
- **Browser DevTools** - Integriert in Chrome/Edge
- **Snipping Tool** - Windows integriert
- **ShareX** - Erweiterte Screenshot-Software (kostenlos)

---

## Nächste Schritte

1. Assets mit den oben genannten Tools erstellen
2. Assets in `static/images/play_store/` speichern
3. Asset-Größen mit PowerShell validieren:
   ```powershell
   Add-Type -AssemblyName System.Drawing
   $img = [System.Drawing.Image]::FromFile("pfad\zum\bild.png")
   Write-Host "Größe: $($img.Width) x $($img.Height)"
   $img.Dispose()
   ```
4. PLAY_STORE_GUIDE.md Checkliste aktualisieren
