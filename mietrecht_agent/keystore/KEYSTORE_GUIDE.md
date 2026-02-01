# JurisMind Android Keystore - Anleitung

## Keystore-Generierung

### Schritt 1: Keystore erstellen

Führen Sie folgenden Befehl aus:

```powershell
& "C:\Program Files\Java\jdk-25\bin\keytool.exe" -genkeypair -v `
  -keystore "f:\JurisMind\Mietrecht\mietrecht_agent\keystore\jurismind-release.keystore" `
  -alias jurismind `
  -keyalg RSA `
  -keysize 2048 `
  -validity 10000 `
  -storepass jurismind2024 `
  -keypass jurismind2024 `
  -dname "CN=JurisMind GmbH, OU=Development, O=JurisMind, L=Berlin, ST=Berlin, C=DE"
```

### Schritt 2: SHA-256 Fingerprint extrahieren

Nach erfolgreicher Keystore-Erstellung:

```powershell
& "C:\Program Files\Java\jdk-25\bin\keytool.exe" -list -v `
  -keystore "f:\JurisMind\Mietrecht\mietrecht_agent\keystore\jurismind-release.keystore" `
  -alias jurismind `
  -storepass jurismind2024
```

Suchen Sie in der Ausgabe nach:
```
Certificate fingerprints:
         SHA256: XX:XX:XX:XX:...
```

### Schritt 3: Fingerprint in assetlinks.json eintragen

Kopieren Sie den SHA-256 Fingerprint und tragen Sie ihn in `static/.well-known/assetlinks.json` ein.

## Keystore-Informationen

**WICHTIG: Diese Informationen sicher aufbewahren!**

- **Keystore-Datei:** `f:\JurisMind\Mietrecht\mietrecht_agent\keystore\jurismind-release.keystore`
- **Alias:** `jurismind`
- **Keystore-Passwort:** `jurismind2024`
- **Key-Passwort:** `jurismind2024`
- **Gültigkeit:** 10000 Tage (~27 Jahre)
- **Algorithmus:** RSA 2048-bit

## Sicherheitshinweise

> [!CAUTION]
> - **Niemals** den Keystore in Git committen!
> - Keystore-Passwort sicher speichern (z.B. in Passwort-Manager)
> - Backup des Keystores erstellen
> - Für Produktion: Stärkeres Passwort verwenden!

## Verwendung für Play Store

1. Keystore wird zum Signieren der Android-App (APK/AAB) verwendet
2. SHA-256 Fingerprint wird für App Links (Deep Linking) benötigt
3. Google Play Console benötigt den öffentlichen Schlüssel

## Nächste Schritte

1. Keystore erstellen (siehe oben)
2. SHA-256 Fingerprint extrahieren
3. Fingerprint in assetlinks.json eintragen
4. Keystore sicher speichern und Backup erstellen
