/**
 * Mietrecht Urteilsagent
 * Diese Anwendung sucht wöchentlich nach aktuellen deutschen Gerichtsurteilen im Mietrecht
 * und sendet personalisierte Newsletter per E-Mail an Anwälte.
 */

// Erforderliche Module importieren
const fs = require('fs');
const path = require('path');

// Mock-Daten für deutsche Gerichtsurteile im Mietrecht
const mockUrteile = [
  {
    id: 1,
    gericht: "Bundesgerichtshof",
    ort: "Karlsruhe",
    datum: "2025-11-15",
    az: "VIII ZR 121/24",
    themen: ["Mietminderung", "Schimmelbefall"],
    zusammenfassung: "Mieter kann bei schwerwiegendem Schimmelbefall die Miete mindern, selbst wenn dieser teilweise auf eigenes Verschulden zurückzuführen ist.",
    volltext: "Der Bundesgerichtshof hat entschieden, dass ein Mieter bei Vorliegen eines schwerwiegenden Schimmelbefalls die Miete mindern kann, auch wenn der Schimmel teilweise auf eigenes Verschulden des Mieters zurückzuführen ist. Die Entscheidung berücksichtigt das Gebot der Verhältnismäßigkeit.",
    url: "https://www.bundesgerichtshof.de/blob/[...]",
    richter: ["Präsident Dr. Müller", "Richter Schmidt", "Richter Weber"],
    praxishinweise: "Diese Entscheidung erweitert den Schutz von Mietern bei Schimmelbefall. Anwälte sollten bei Mietminderungsverlangen nicht mehr automatisch das eigene Verschulden des Mieters als Ausschlussgrund prüfen, sondern eine Einzelfallbetrachtung durchführen.",
    wichtigkeit: "hoch"
  },
  {
    id: 2,
    gericht: "Landgericht",
    ort: "Berlin",
    datum: "2025-11-10",
    az: "34 M 12/25",
    themen: ["Kündigung", "Modernisierung"],
    zusammenfassung: "Eine Kündigung wegen Eigenbedarf ist unzulässig, wenn die Modernisierungsmaßnahmen nicht ordnungsgemäß angekündigt wurden.",
    volltext: "Das Landgericht Berlin hat entschieden, dass eine Kündigung wegen Eigenbedarf unzulässig ist, wenn die erforderlichen Modernisierungsmaßnahmen nicht mindestens drei Monate vorher ordnungsgemäß angekündigt wurden. Die ordnungsgemäße Ankündigung ist Voraussetzung für die Zulässigkeit der Kündigung.",
    url: "https://www.berlin.landgericht.de/[...]",
    richter: ["Richterin Fischer", "Richter Klein"],
    praxishinweise: "Vermieteranwälte müssen bei Eigenbedarfskündigungen unbedingt prüfen, ob die Modernisierungsankündigung fristgerecht erfolgt ist. Mieteranwälte können bei mangelnder Ankündigung die Kündigung angreifen.",
    wichtigkeit: "mittel"
  },
  {
    id: 3,
    gericht: "Bundesgerichtshof",
    ort: "Karlsruhe",
    datum: "2025-11-05",
    az: "VIII ZR 89/24",
    themen: ["Nebenkosten", "Heizkostenabrechnung"],
    zusammenfassung: "Die pauschale Verteilung von Heizkosten nach Quadratmetern ist unzulässig, wenn individuelle Zähler vorliegen.",
    volltext: "Der BGH hat entschieden, dass eine pauschale Verteilung von Heizkosten nach Quadratmetern unzulässig ist, wenn in der Wohnung individuelle Wärmemengenzähler installiert sind. In diesem Fall muss die Abrechnung auf Grundlage der tatsächlichen Verbräuche erfolgen.",
    url: "https://www.bundesgerichtshof.de/blob/[...]",
    richter: ["Präsident Dr. Müller", "Richter Schmidt", "Richter Weber", "Richter Hoffmann"],
    praxishinweise: "Vermieter müssen bei Vorliegen von Wärmemengenzählern die Heizkosten nach tatsächlichem Verbrauch abrechnen. Anwälte sollten bei Nebenkostenabrechnungen prüfen, ob individuelle Zähler vorhanden sind.",
    wichtigkeit: "hoch"
  },
  {
    id: 4,
    gericht: "Landgericht",
    ort: "Hamburg",
    datum: "2025-11-01",
    az: "12 M 45/25",
    themen: ["Mietpreisbremse", "ortsübliche Vergleichsmiete"],
    zusammenfassung: "Bei Anwendung der Mietpreisbremse ist die ortsübliche Vergleichsmiete anhand von mindestens drei vergleichbaren Mietwohnungen zu ermitteln.",
    volltext: "Das Landgericht Hamburg hat entschieden, dass bei Anwendung der Mietpreisbremse die ortsübliche Vergleichsmiete anhand von mindestens drei vergleichbaren Mietwohnungen in der unmittelbaren Nachbarschaft ermittelt werden muss. Die Vergleichswohnungen müssen hinsichtlich Bauart, Ausstattung und Zustand vergleichbar sein.",
    url: "https://www.hamburg.landgericht.de/[...]",
    richter: ["Richterin Becker", "Richter Schulz"],
    praxishinweise: "Anwälte müssen bei Mietpreisbremse-Fällen sicherstellen, dass mindestens drei vergleichbare Wohnungen zur Ermittlung der ortsüblichen Vergleichsmiete herangezogen werden. Die Vergleichbarkeit muss dokumentiert werden.",
    wichtigkeit: "mittel"
  },
  {
    id: 5,
    gericht: "Bundesverfassungsgericht",
    ort: "Karlsruhe",
    datum: "2025-10-28",
    az: "1 BvR 1234/23",
    themen: ["Verfassungsrecht", "Mietvertragsrecht"],
    zusammenfassung: "Die Regelung zur außerordentlichen Kündigung durch den Mieter wegen erheblicher Beeinträchtigung ist mit dem Grundgesetz vereinbar.",
    volltext: "Das Bundesverfassungsgericht hat entschieden, dass die Regelung zur außerordentlichen Kündigung durch den Mieter wegen erheblicher Beeinträchtigung des Gebrauchs der Mietsache mit dem Grundgesetz vereinbar ist. Die Voraussetzungen für eine solche Kündigung sind eng auszulegen.",
    url: "https://www.bundesverfassungsgericht.de/[...]",
    richter: ["Präsident Dr. Weber", "Vizepräsidentin Klein", "Richter Müller"],
    praxishinweise: "Diese Entscheidung bestätigt die Rechtmäßigkeit der außerordentlichen Kündigungsmöglichkeit für Mieter. Anwälte sollten bei erheblichen Mängeln prüfen, ob eine außerordentliche Kündigung möglich ist.",
    wichtigkeit: "hoch"
  }
];

// Mock-Daten für Anwälte
const anwaelte = [
  {
    id: 1,
    name: "Max Mustermann",
    email: "max.mustermann@kanzlei.de",
    kanzlei: "Mustermann & Partner",
    schwerpunkte: ["Mietrecht", "Wohnungsrecht"],
    regionen: ["Berlin", "Brandenburg"],
    einstellungen: {
      gerichtsarten: ["Bundesgerichtshof", "Landgericht"],
      themengebiete: ["Mietminderung", "Kündigung", "Nebenkosten"],
      frequenz: "woechentlich"
    }
  },
  {
    id: 2,
    name: "Anna Schmidt",
    email: "anna.schmidt@rechtsanwaelte.de",
    kanzlei: "Schmidt Rechtsanwälte",
    schwerpunkte: ["Mietrecht", "Verwaltungsrecht"],
    regionen: ["Hamburg", "Schleswig-Holstein"],
    einstellungen: {
      gerichtsarten: ["Bundesgerichtshof", "Bundesverfassungsgericht"],
      themengebiete: ["Mietpreisbremse", "Verfassungsrecht"],
      frequenz: "woechentlich"
    }
  }
];

/**
 * Filtert Urteile basierend auf Anwaltseinstellungen
 * @param {Array} urteile - Array mit Urteil-Objekten
 * @param {Object} anwalt - Anwalt-Objekt mit Einstellungen
 * @returns {Array} Gefilterte Urteile
 */
function filterUrteileFuerAnwalt(urteile, anwalt) {
  return urteile.filter(urteil => {
    // Filtern nach Gerichtsarten
    const gerichtsartTreffer = anwalt.einstellungen.gerichtsarten.includes(urteil.gericht);
    
    // Filtern nach Themengebieten
    const themenTreffer = anwalt.einstellungen.themengebiete.some(thema => 
      urteil.themen.includes(thema)
    );
    
    return gerichtsartTreffer && themenTreffer;
  });
}

/**
 * Kategorisiert Urteile nach Gerichtsart
 * @param {Array} urteile - Array mit Urteil-Objekten
 * @returns {Object} Kategorisierte Urteile
 */
function kategorisiereUrteile(urteile) {
  const kategorisiert = {
    bgh: [],
    landgerichte: [],
    verfassungsgericht: [],
    andere: []
  };
  
  urteile.forEach(urteil => {
    if (urteil.gericht === "Bundesgerichtshof") {
      kategorisiert.bgh.push(urteil);
    } else if (urteil.gericht === "Landgericht") {
      kategorisiert.landgerichte.push(urteil);
    } else if (urteil.gericht === "Bundesverfassungsgericht") {
      kategorisiert.verfassungsgericht.push(urteil);
    } else {
      kategorisiert.andere.push(urteil);
    }
  });
  
  return kategorisiert;
}

/**
 * Generiert HTML-Newsletter-Inhalt für einen Anwalt
 * @param {Object} anwalt - Anwalt-Objekt
 * @param {Array} urteile - Gefilterte Urteile für den Anwalt
 * @returns {String} HTML-E-Mail-Inhalt
 */
function generiereNewsletter(anwalt, urteile) {
  const aktuellesDatum = new Date().toLocaleDateString('de-DE', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
  
  const kalenderwoche = getKalenderwoche(new Date());
  
  const kategorisierteUrteile = kategorisiereUrteile(urteile);
  
  let html = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Mietrechts-Urteile</title>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 800px; margin: 0 auto; padding: 20px; }
        .kopf { background-color: #2c3e50; color: white; padding: 20px; text-align: center; border-radius: 5px; }
        .abschnitt { margin: 25px 0; padding: 15px; border-left: 4px solid #3498db; background-color: #f8f9fa; border-radius: 0 5px 5px 0; }
        .urteil { 
            border: 1px solid #ddd; 
            margin: 15px 0; 
            padding: 15px; 
            border-radius: 5px;
            background-color: white;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        .themen-tag { 
            display: inline-block; 
            background-color: #3498db; 
            color: white; 
            padding: 3px 8px; 
            border-radius: 3px; 
            font-size: 0.8em; 
            margin-right: 5px;
            margin-bottom: 5px;
        }
        .gericht-name { color: #2c3e50; font-weight: bold; }
        .datum { color: #7f8c8d; }
        .aktenzeichen { color: #95a5a6; font-size: 0.9em; }
        .wichtig-hoch { border-left-color: #e74c3c; }
        .wichtig-mittel { border-left-color: #f39c12; }
        .wichtig-niedrig { border-left-color: #2ecc71; }
        .fussbereich { 
            margin-top: 30px; 
            padding-top: 15px; 
            border-top: 1px solid #eee; 
            font-size: 0.9em; 
            color: #777;
            text-align: center;
        }
        .praxishinweise { 
            background-color: #fff8e1; 
            border-left: 4px solid #ffc107; 
            padding: 15px; 
            border-radius: 0 5px 5px 0;
            margin: 15px 0;
        }
        h1, h2, h3 { color: #2c3e50; }
        a { color: #3498db; text-decoration: none; }
        a:hover { text-decoration: underline; }
    </style>
</head>
<body>
    <div class="kopf">
        <h1>Mietrechts-Urteile der Woche</h1>
        <p>Kalenderwoche ${kalenderwoche}, ${aktuellesDatum}</p>
        <p>Guten Tag ${anwalt.name},</p>
        <p>hier sind die relevanten Mietrechts-Urteile für Ihre Praxis:</p>
    </div>
  `;
  
  // BGH-Urteile Abschnitt
  if (kategorisierteUrteile.bgh.length > 0) {
    html += `
    <div class="abschnitt">
        <h2>📌 Neue BGH-Urteile (${kategorisierteUrteile.bgh.length})</h2>
    `;
    
    kategorisierteUrteile.bgh.forEach(urteil => {
      const wichtigkeitKlasse = `wichtig-${urteil.wichtigkeit}`;
      html += `
        <div class="urteil ${wichtigkeitKlasse}">
            <div class="gericht-name">${urteil.gericht}, ${urteil.ort}</div>
            <div class="datum">${formatiereDatum(urteil.datum)} | <span class="aktenzeichen">${urteil.az}</span></div>
            <h3>${urteil.themen.map(thema => `<span class="themen-tag">${thema}</span>`).join('')}</h3>
            <p><strong>Zusammenfassung:</strong> ${urteil.zusammenfassung}</p>
            <p><strong>Praxishinweise:</strong> ${urteil.praxishinweise}</p>
            <p><a href="${urteil.url}" target="_blank">Vollständigen Urtext anzeigen</a></p>
        </div>
      `;
    });
    
    html += `</div>`;
  }
  
  // Landgerichts-Urteile Abschnitt
  if (kategorisierteUrteile.landgerichte.length > 0) {
    html += `
    <div class="abschnitt">
        <h2>🏛️ Wichtige Landgerichts-Urteile (${kategorisierteUrteile.landgerichte.length})</h2>
    `;
    
    kategorisierteUrteile.landgerichte.forEach(urteil => {
      const wichtigkeitKlasse = `wichtig-${urteil.wichtigkeit}`;
      html += `
        <div class="urteil ${wichtigkeitKlasse}">
            <div class="gericht-name">${urteil.gericht}, ${urteil.ort}</div>
            <div class="datum">${formatiereDatum(urteil.datum)} | <span class="aktenzeichen">${urteil.az}</span></div>
            <h3>${urteil.themen.map(thema => `<span class="themen-tag">${thema}</span>`).join('')}</h3>
            <p><strong>Zusammenfassung:</strong> ${urteil.zusammenfassung}</p>
            <p><strong>Praxishinweise:</strong> ${urteil.praxishinweise}</p>
            <p><a href="${urteil.url}" target="_blank">Vollständigen Urtext anzeigen</a></p>
        </div>
      `;
    });
    
    html += `</div>`;
  }
  
  // Verfassungsgerichts-Urteile Abschnitt
  if (kategorisierteUrteile.verfassungsgericht.length > 0) {
    html += `
    <div class="abschnitt">
        <h2>⚖️ Bundesverfassungsgericht (${kategorisierteUrteile.verfassungsgericht.length})</h2>
    `;
    
    kategorisierteUrteile.verfassungsgericht.forEach(urteil => {
      const wichtigkeitKlasse = `wichtig-${urteil.wichtigkeit}`;
      html += `
        <div class="urteil ${wichtigkeitKlasse}">
            <div class="gericht-name">${urteil.gericht}, ${urteil.ort}</div>
            <div class="datum">${formatiereDatum(urteil.datum)} | <span class="aktenzeichen">${urteil.az}</span></div>
            <h3>${urteil.themen.map(thema => `<span class="themen-tag">${thema}</span>`).join('')}</h3>
            <p><strong>Zusammenfassung:</strong> ${urteil.zusammenfassung}</p>
            <p><strong>Praxishinweise:</strong> ${urteil.praxishinweise}</p>
            <p><a href="${urteil.url}" target="_blank">Vollständigen Urtext anzeigen</a></p>
        </div>
      `;
    });
    
    html += `</div>`;
  }
  
  // Praxishinweise Zusammenfassung
  const alleHinweise = urteile.map(u => u.praxishinweise).join(' ');
  if (alleHinweise) {
    html += `
    <div class="praxishinweise">
        <h2>💼 Praxishinweise für Ihre Kanzlei</h2>
        <p>${generierePraxisZusammenfassung(urteile)}</p>
    </div>
    `;
  }
  
  html += `
    <div class="fussbereich">
        <p>Dieser Newsletter wird Ihnen vom SmartLaw Mietrecht Agent gesendet.</p>
        <p><a href="https://jurismind.de/einstellungen">Einstellungen ändern</a> | <a href="https://jurismind.de/abmelden">Abmelden</a></p>
        <p><small>Diese E-Mail wurde automatisch generiert. Antworten Sie nicht auf diese Nachricht.</small></p>
    </div>
</body>
</html>
  `;
  
  return html;
}

/**
 * Formatiert Datum für die Anzeige
 * @param {String} datumsStr - Datumsstring im Format YYYY-MM-DD
 * @returns {String} Formatierter Datumsstring
 */
function formatiereDatum(datumsStr) {
  const datum = new Date(datumsStr);
  return datum.toLocaleDateString('de-DE', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
}

/**
 * Berechnet die Kalenderwoche für ein Datum
 * @param {Date} datum - Datumsobjekt
 * @returns {Number} Kalenderwoche
 */
function getKalenderwoche(datum) {
  const jahresBeginn = new Date(datum.getFullYear(), 0, 1);
  const vergangeneTageImJahr = (datum - jahresBeginn) / 86400000;
  return Math.ceil((vergangeneTageImJahr + jahresBeginn.getDay() + 1) / 7);
}

/**
 * Generiert eine Praxiszusammenfassung aus Urteilen
 * @param {Array} urteile - Array mit Urteil-Objekten
 * @returns {String} Praxiszusammenfassung
 */
function generierePraxisZusammenfassung(urteile) {
  // In einer echten Implementierung würde hier NLP verwendet werden
  // Für diesen Prototyp erstellen wir eine einfache Zusammenfassung
  
  const themen = [...new Set(urteile.flatMap(u => u.themen))];
  const hinweise = urteile.map(u => u.praxishinweise);
  
  return `Diese Woche gab es wichtige Urteile zu den Themen: ${themen.join(', ')}. ` +
         `Die wichtigsten Änderungen betreffen: ${hinweise.slice(0, 2).join(' ')}. ` +
         "Überprüfen Sie die einzelnen Urteile für detaillierte Informationen.";
}

/**
 * Simuliert das Senden einer E-Mail
 * @param {Object} anwalt - Anwalt-Objekt
 * @param {String} betreff - E-Mail-Betreff
 * @param {String} inhalt - E-Mail-Inhalt
 */
function sendeEmail(anwalt, betreff, inhalt) {
  console.log(`\n=== E-MAIL SIMULATION ===`);
  console.log(`An: ${anwalt.name} <${anwalt.email}>`);
  console.log(`Betreff: ${betreff}`);
  console.log(`Inhaltsvorschau: ${inhalt.substring(0, 200)}...`);
  console.log(`=== ENDE E-MAIL SIMULATION ===\n`);
  
  // In einer echten Implementierung würde dies einen E-Mail-Service verwenden:
  // await transporter.sendMail({ to: anwalt.email, subject: betreff, html: inhalt });
}

/**
 * Hauptfunktion zum Ausführen des Mietrecht Urteilsagents
 */
async function fuehreMietrechtAgentAus() {
  console.log("Starte Mietrecht Urteilsagent...");
  console.log(`Datum: ${new Date().toLocaleString('de-DE')}`);
  
  // Jeden Anwalt verarbeiten
  for (const anwalt of anwaelte) {
    console.log(`\nVerarbeite Updates für ${anwalt.name}...`);
    
    // Urteile für diesen Anwalt filtern
    const gefilterteUrteile = filterUrteileFuerAnwalt(mockUrteile, anwalt);
    
    console.log(`  ${gefilterteUrteile.length} relevante Urteile gefunden`);
    
    // Newsletter-Inhalt generieren
    const newsletterInhalt = generiereNewsletter(anwalt, gefilterteUrteile);
    const emailBetreff = `Mietrechts-Urteile - Kalenderwoche ${getKalenderwoche(new Date())}`;
    
    // E-Mail senden (simuliert)
    sendeEmail(anwalt, emailBetreff, newsletterInhalt);
    
    // Aktivität protokollieren
    console.log(`  Newsletter an ${anwalt.email} gesendet`);
  }
  
  console.log("\nMietrecht Urteilsagent erfolgreich abgeschlossen.");
}

/**
 * Planungsfunktion zum wöchentlichen Ausführen des Agents
 */
function planeWoechentlichenAgent() {
  console.log("Mietrecht Urteilsagent Planung gestartet.");
  console.log("Nächste Ausführung: Jeden Montag um 8:00 Uhr");
  
  // Für die Demonstration führen wir ihn sofort aus
  fuehreMietrechtAgentAus();
  
  // In einer echten Implementierung würde dies einen Planer verwenden:
  // cron.schedule('0 8 * * 1', fuehreMietrechtAgentAus); // Jeden Montag um 8:00 Uhr
}

// Den Planer ausführen, wenn dieses Skript direkt gestartet wird
if (require.main === module) {
  planeWoechentlichenAgent();
}

// Funktionen für Tests exportieren
module.exports = {
  filterUrteileFuerAnwalt,
  kategorisiereUrteile,
  generiereNewsletter,
  sendeEmail,
  fuehreMietrechtAgentAus,
  planeWoechentlichenAgent,
  anwaelte,
  mockUrteile
};