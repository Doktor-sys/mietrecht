# Google Play Store Readiness Guide

Dieses Dokument beschreibt die notwendigen Schritte, um JurisMind für den Google Play Store (Internal Testing & Live-Release) vorzubereiten.

## 1. Administrative Vorbereitung

| Status | Aufgabe | Details |
| :--- | :--- | :--- |
| [ ] | **Google Play Console Account** | Erstellung unter [play.google.com/console](https://play.google.com/console). Einmalige Gebühr: $25. |
| [ ] | **D-U-N-S Nummer** | Erforderlich für Firmenkonten (JurisMind GmbH). Verifizierung kann bis zu 30 Tage dauern. |
| [x] | **Datenschutzerklärung** | URL zur Webseite (z.B. `/privacy`) muss in der App und in der Console hinterlegt sein. |

## 2. Technische Vorbereitung (Android Build)

Da JurisMind als moderne Web-App konzipiert ist, nutzen wir den **Trusted Web Activity (TWA)** Ansatz. Dies erfordert:

- [x] **Web App Manifest**: `manifest.json` vollständig konfiguriert mit Icons, Farben und Start-URL.
- [x] **Service Worker**: `sw.js` implementiert mit Offline-Caching und Push-Benachrichtigungen.
- [x] **Icons**: Alle erforderlichen Icon-Größen generiert (16x16 bis 512x512, inkl. maskable icons).
- [x] **Asset Links**: `.well-known/assetlinks.json` konfiguriert für `de.jurismind.app`.
- [x] **Offline-Fallbacks**: `offline.html` und `offline.png` für Offline-Nutzung erstellt.
- [x] **Manifest-Integration**: `index.html` enthält Manifest-Link und Service Worker Registrierung.

### ✅ Technische Vorbereitung abgeschlossen
Alle erforderlichen Dateien sind vorhanden und korrekt konfiguriert.

## 3. Grafische Assets (Checkliste)

| Asset | Spezifikation | Status |
| :--- | :--- | :--- |
| **App Icon** | 512 x 512px, PNG (Transparent) | ✅ Erledigt (Clean "JM" Design) |
| **Feature Graphic** | 1024 x 500px, PNG | ✅ Erledigt (Passendes Design) |
| **Phone Screenshots** | Mind. 2 (1080 x 1920px oder höher) | [ ] Manuell erstellen |
| **Tablet Screenshots** | 7-Zoll & 10-Zoll (Quer- oder Hochformat) | [ ] Optional |

> [!NOTE]
> **Asset-Spezifikationen:** Detaillierte Anforderungen finden Sie in [ASSET_SPECIFICATIONS.md](file:///f:/JurisMind/Mietrecht/mietrecht_agent/static/images/play_store/ASSET_SPECIFICATIONS.md)

---

## 3.1 SHA-256 Fingerprint (Produktions-Keystore)

✅ **Keystore Fingerprint:**
```
9D:61:8B:A0:FC:CD:41:D1:79:10:0C:83:CD:52:8A:5F:96:86:1B:3D:E9:ED:C2:8B:0A:6C:A5:36:34:F6:A4:18
```

Dieser Fingerprint wurde in [assetlinks.json](file:///f:/JurisMind/Mietrecht/mietrecht_agent/static/.well-known/assetlinks.json) hinterlegt.

> [!IMPORTANT]
> **Wichtig:** Dieser Fingerprint stammt aus dem `jurismind-release.keystore`. Sichern Sie diesen Keystore gut! Wenn Sie den Keystore verlieren, können Sie keine Updates mehr im Play Store veröffentlichen.

## 4. Google "20 Tester" Regel (Wichtig!)

Google erfordert für neue private Entwicklerkonten seit 2024:
- **Geschlossener Test**: Mindestens **20 Tester** müssen eingeladen werden.
- **Dauer**: Die Tester müssen die App für mindestens **14 Tage am Stück** installiert haben.
- **Feedback**: Nachweis über aktives Testen vor der Freigabe für die Produktion.

## 5. Vorbereitung für den Review

- **Demo-Zugang**: Wir müssen Google einen Test-User (z.B. `google-reviewer@jurismind.de`) mit Passwort bereitstellen.
- **Inhaltliche Einstufung**: Fragebogen zu Gewalt, Sexualität und sensiblen Daten (Finanztransaktionen via Stripe).
- **Datensicherheit (Data Safety Section)**: Erklärung, dass E-Mails und Dokumente verschlüsselt übertragen werden.

---

> [!IMPORTANT]
> Der nächste Schritt wäre die Generierung des **SHA-256 Fingerprints** Ihres Web-Servers, um die PWA-Verknüpfung zu finalisieren.
