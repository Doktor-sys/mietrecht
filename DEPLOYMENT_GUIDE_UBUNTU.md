# JurisMind Deployment Guide (Ubuntu VPS)

Dieser Guide beschreibt die Installation des JurisMind SmartLaw Agents auf einem Ubuntu Server (z.B. Hetzner, DigitalOcean) für den privaten Test mit Freunden.

## Voraussetzungen

1.  **Server:** Ein VPS mit **Ubuntu 22.04 oder 24.04**.
    *   Empfehlung: 2 vCPUs, 4GB RAM (Minimum: 2GB RAM).
2.  **Domain:** Eine Domain (z.B. `jurismind-test.de`) oder Subdomain (`app.meinedomain.de`).
    *   Der **DNS A-Record** muss auf die IP-Adresse des Servers zeigen.
3.  **SSH-Zugang:** Sie müssen sich als `root` auf dem Server einloggen können.

---

## Schnellinstallation (Empfohlen)

Ich habe ein Installations-Skript vorbereitet, das die Einrichtung automatisiert.

1.  **Deployment-Paket hochladen**
    Laden Sie die Datei `deployment.zip` auf Ihren Server hoch (z.B. nach `/opt/jurismind`).

2.  **Installation starten**
    Verbinden Sie sich per SSH mit Ihrem Server und führen Sie folgende Befehle aus:

    ```bash
    cd /opt/jurismind
    unzip deployment.zip
    chmod +x install.sh
    sudo ./install.sh
    ```

    Das Skript wird:
    *   Docker installieren (falls nötig)
    *   Nach Ihrer Domain und E-Mail fragen
    *   Die Konfiguration automatisch anpassen
    *   Die Anwendung starten

3.  **API-Keys nachtragen**
    Nach der Installation öffnen Sie die `.env` Datei, um Ihre echten API-Keys einzutragen:
    ```bash
    nano .env
    # Ändern Sie die Keys, speichern Sie mit STRG+O, beenden mit STRG+X
    # Starten Sie den Container neu:
    docker compose -f docker-compose.prod.yml restart app
    ```

## Manuelle Installation (Alternative)

Falls Sie die manuelle Einrichtung bevorzugen:

### Schritt 1: Server vorbereiten

Verbinden Sie sich mit Ihrem Server:
```bash
ssh root@<ihre-ip-adresse>
```

Aktualisieren Sie das System und installieren Sie Docker:

```bash
# System Update
apt update && apt upgrade -y

# Docker installieren
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh

# Docker Compose Plugin prüfen
docker compose version
```

---

## Schritt 2: Projekt übertragen

Am einfachsten ist es, wenn Sie Ihr Projekt in ein privates GitHub-Repo pushen und es auf dem Server klonen. Alternativ per SCP hochladen.

Wir erstellen einen Ordner auf dem Server:
```bash
mkdir -p /opt/jurismind
cd /opt/jurismind
```

*Laden Sie Ihre Projektdateien hier hoch.*

---

## Schritt 3: Production Docker Compose erstellen

Wir benötigen eine spezielle Konfiguration für den Server, die **automatisch HTTPS (SSL)** aktiviert. Dafür nutzen wir **Caddy** als Webserver.

Erstellen Sie die Datei `docker-compose.prod.yml` auf dem Server:

```bash
nano docker-compose.prod.yml
```

Fügen Sie folgenden Inhalt ein (**Ersetzen Sie `ihre-domain.de` und `ihre-email@beispiel.de`!**):

```yaml
version: '3.8'

services:
  # Die JurisMind App
  app:
    build: .
    container_name: jurismind-app
    restart: always
    environment:
      - FLASK_APP=mietrecht_full.py
      - FLASK_ENV=production
    expose:
      - "5000"

  # Caddy Webserver (für HTTPS)
  caddy:
    image: caddy:latest
    container_name: caddy
    restart: always
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - caddy_data:/data
      - caddy_config:/config
    command: caddy reverse-proxy --from https://ihre-domain.de --to app:5000 --email ihre-email@beispiel.de

volumes:
  caddy_data:
  caddy_config:
```

Drücken Sie bei nano `CTRL+O` (Speichern) und `CTRL+X` (Beenden).

---

## Schritt 4: App starten

Starten Sie die App im Hintergrund:

```bash
docker compose -f docker-compose.prod.yml up -d --build
```

**Prüfung:**
1.  Rufen Sie `https://ihre-domain.de` im Browser auf.
2.  Das Schloss-Symbol 🔒 sollte erscheinen (sicheres HTTPS).
3.  Die App sollte laden.

---

## Schritt 5: App Links verifizieren (WICHTIG!)

Damit die Android-App die Links öffnet ("Deep Linking"), muss die Datei `assetlinks.json` korrekt konfiguriert und erreichbar sein.

1.  **Fingerprint ermitteln:**
    Sie müssen den SHA256-Fingerprint Ihres App-Signing-Keys (aus dem Google Play Store oder Ihrem Keystore) in die Datei `static/.well-known/assetlinks.json` eintragen.
    *   Öffnen Sie `static/.well-known/assetlinks.json`.
    *   Ersetzen Sie `HIER_IHREN_SHA256_FINGERPRINT_EINFÜGEN` durch Ihren echten SHA256-Wert.
    *   **Tipp:** Wenn Sie Expo/EAS nutzen, finden Sie den Fingerprint mit dem Befehl `eas credentials` (unter "SHA256 Fingerprint").

2.  **Verfügbarkeit prüfen:**
    Nach dem Deployment muss die Datei unter folgender URL erreichbar sein:
    `https://ihre-domain.de/.well-known/assetlinks.json`

Prüfen Sie dies im Browser. Wenn Sie den JSON-Code mit Ihrem Fingerprint sehen, ist alles korrekt.

---

## Updates einspielen

Wenn Sie Änderungen am Code haben:

1.  Neue Dateien auf den Server laden.
2.  Neu bauen und starten:
    ```bash
    docker compose -f docker-compose.prod.yml up -d --build
    ```

---

## Roadmap zur Google Cloud (Später)

Nach Ihrem 3-monatigen Test können Sie einfach zu Google Cloud wechseln:
1.  Google Cloud Account (Firma) erstellen.
2.  Container in "Google Artifact Registry" hochladen.
3.  Service in **Google Cloud Run** erstellen (Serverless).
4.  Domain dort verknüpfen.

Das Docker-Setup bleibt gleich, nur das Hosting ändert sich.
