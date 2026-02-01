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
  },
  {
    id: 3,
    name: "Thomas Wagner",
    email: "wagner@kanzlei-wagner.de",
    kanzlei: "Kanzlei Wagner",
    schwerpunkte: ["Mietrecht", "Wirtschaftsrecht"],
    regionen: ["Bayern", "Baden-Württemberg"],
    einstellungen: {
      gerichtsarten: ["Landgericht", "Oberlandesgericht"],
      themengebiete: ["Betriebskosten", "Wohnungseigentum"],
      frequenz: "woechentlich"
    }
  },
  {
    id: 4,
    name: "Julia Meier",
    email: "j.meier@ra-meier.de",
    kanzlei: "Rechtsanwälte Meier & Kollegen",
    schwerpunkte: ["Mietrecht", "Baurecht"],
    regionen: ["Nordrhein-Westfalen", "Hessen"],
    einstellungen: {
      gerichtsarten: ["Bundesgerichtshof", "Landgericht", "Oberlandesgericht"],
      themengebiete: ["Modernisierung", "Mietspiegel", "Kündigungsschutz"],
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
 * Generiert HTML-Newsletter für einen Anwalt
 * @param {Object} anwalt - Anwalt-Objekt
 * @param {Array} urteile - Gefilterte Urteile für den Anwalt
 * @returns {String} HTML-Newsletter
 */
function generiereNewsletter(anwalt, urteile) {
  const aktuellesDatum = new Date().toLocaleDateString('de-DE');
  const kalenderwoche = getKalenderwoche(new Date());
  
  let html = `
  <!DOCTYPE html>
  <html lang="de">
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Mietrechts-Update KW ${kalenderwoche}</title>
    <style>
      body {
        font-family: Arial, sans-serif;
        line-height: 1.6;
        color: #333;
        max-width: 800px;
        margin: 0 auto;
        padding: 20px;
      }
      .header {
        background-color: #1a5276;
        color: white;
        padding: 20px;
        text-align: center;
        border-radius: 5px;
        margin-bottom: 20px;
      }
      .urteil {
        border-left: 4px solid #3498db;
        padding: 10px 15px;
        margin: 15px 0;
        background-color: #f8f9fa;
      }
      .gericht {
        font-weight: bold;
        color: #1a5276;
      }
      .az {
        color: #7f8c8d;
        font-style: italic;
      }
      .themen {
        display: flex;
        flex-wrap: wrap;
        gap: 5px;
        margin: 10px 0;
      }
      .thema {
        background-color: #e8f4f8;
        padding: 3px 8px;
        border-radius: 3px;
        font-size: 0.9em;
      }
      .praxishinweis {
        background-color: #e8f8f5;
        border-left: 4px solid #27ae60;
        padding: 10px 15px;
        margin: 15px 0;
      }
      .footer {
        margin-top: 30px;
        padding-top: 20px;
        border-top: 1px solid #ddd;
        font-size: 0.9em;
        color: #7f8c8d;
        text-align: center;
      }
    </style>
  </head>
  <body>
    <div class="header">
      <h1>Mietrechts-Update</h1>
      <p>KW ${kalenderwoche} • ${aktuellesDatum}</p>
      <p>Persönlich für ${anwalt.name}</p>
    </div>`;

  if (urteile.length === 0) {
    html += `
    <div class="keine-urteile">
      <h2>Keine neuen relevanten Urteile gefunden</h2>
      <p>In dieser Woche gibt es keine neuen Urteile, die Ihren Einstellungen entsprechen.</p>
    </div>`;
    return html + '</body></html>';
  }
  
  html += `
    <div class="statistik">
      <p>Es wurden <strong>${urteile.length} Urteile</strong> gefunden, die Ihren Einstellungen entsprechen.</p>
    </div>`;
  
  // Alle Urteile durchgehen und HTML generieren
  const kategorien = kategorisiereUrteile(urteile);
  
  // BGH-Urteile
  if (kategorien.bgh.length > 0) {
    html += `
    <h2>Neue BGH-Urteile</h2>`;
    kategorien.bgh.forEach(urteil => {
      html += `
    <div class="urteil">
      <div class="gericht">${urteil.gericht}, ${urteil.ort}</div>
      <div class="az">Aktenzeichen: ${urteil.az} • ${formatiereDatum(urteil.datum)}</div>
      <div class="themen">
        ${urteil.themen.map(thema => `<span class="thema">${thema}</span>`).join('')}
      </div>
      <p>${urteil.zusammenfassung}</p>
      <div class="praxishinweis">
        <strong>Praxishinweis:</strong> ${urteil.praxishinweise}
      </div>
      <p><a href="${urteil.url}" target="_blank">Zum Volltext</a></p>
    </div>`;
    });
  }
  
  // Landgerichts-Urteile
  if (kategorien.landgerichte.length > 0) {
    html += `
    <h2>Wichtige Landgerichts-Urteile</h2>`;
    kategorien.landgerichte.forEach(urteil => {
      html += `
    <div class="urteil">
      <div class="gericht">${urteil.gericht}, ${urteil.ort}</div>
      <div class="az">Aktenzeichen: ${urteil.az} • ${formatiereDatum(urteil.datum)}</div>
      <div class="themen">
        ${urteil.themen.map(thema => `<span class="thema">${thema}</span>`).join('')}
      </div>
      <p>${urteil.zusammenfassung}</p>
      <div class="praxishinweis">
        <strong>Praxishinweis:</strong> ${urteil.praxishinweise}
      </div>
      <p><a href="${urteil.url}" target="_blank">Zum Volltext</a></p>
    </div>`;
    });
  }
  
  // Verfassungsgerichts-Urteile
  if (kategorien.verfassungsgericht.length > 0) {
    html += `
    <h2>Bundesverfassungsgericht</h2>`;
    kategorien.verfassungsgericht.forEach(urteil => {
      html += `
    <div class="urteil">
      <div class="gericht">${urteil.gericht}, ${urteil.ort}</div>
      <div class="az">Aktenzeichen: ${urteil.az} • ${formatiereDatum(urteil.datum)}</div>
      <div class="themen">
        ${urteil.themen.map(thema => `<span class="thema">${thema}</span>`).join('')}
      </div>
      <p>${urteil.zusammenfassung}</p>
      <div class="praxishinweis">
        <strong>Praxishinweis:</strong> ${urteil.praxishinweise}
      </div>
      <p><a href="${urteil.url}" target="_blank">Zum Volltext</a></p>
    </div>`;
    });
  }
  
  // Footer
  html += `
    <div class="footer">
      <p>Dies ist eine automatisch generierte Nachricht. Bitte antworten Sie nicht auf diese E-Mail.</p>
      <p>© ${new Date().getFullYear()} Mietrecht Urteilsagent. Alle Rechte vorbehalten.</p>
    </div>
  </body>
  </html>`;
  
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
 * Erstellt eine HTML-Datei und simuliert das Versenden
 * @param {Object} anwalt - Anwalt-Objekt
 * @param {String} betreff - Betreff der E-Mail
 * @param {String} htmlInhalt - HTML-Inhalt für den Newsletter
 */
function sendeEmail(anwalt, betreff, htmlInhalt) {
  // Erstelle einen Dateinamen mit Anwaltsname und Datum
  const dateiname = `mietrechts_update_${anwalt.name.toLowerCase().replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.html`;
  const dateipfad = path.join(__dirname, '..', 'reports', dateiname);
  
  // Erstelle den reports-Ordner, falls nicht vorhanden
  if (!fs.existsSync(path.join(__dirname, '..', 'reports'))) {
    fs.mkdirSync(path.join(__dirname, '..', 'reports'));
  }
  
  // HTML-Datei speichern
  fs.writeFileSync(dateipfad, htmlInhalt, 'utf8');
  
  console.log(`\n=== ZUSAMMENFASSUNG FÜR ${anwalt.name.toUpperCase()} ===`);
  console.log(`Betreff: ${betreff}`);
  console.log(`HTML-Report wurde erstellt: ${dateipfad}`);
  console.log(`=== ENDE ZUSAMMENFASSUNG ===\n`);
  
  // In einer echten Implementierung würde hier die E-Mail mit PDF-Anhang versendet werden
  // z.B. mit nodemailer oder einem ähnlichen Paket
  
  // Optional: Hier könnte man auch eine PDF-Konvertierung einfügen
  // z.B. mit puppeteer, pdfkit oder einem anderen PDF-Generator
  
  // Beispiel für PDF-Erstellung (erfordert zusätzliche Abhängigkeiten):
  // const pdf = require('html-pdf');
  // const pdfOptions = { format: 'A4' };
  // pdf.create(htmlInhalt, pdfOptions).toFile(pdfPath, (err, res) => {
  //   if (err) return console.error(err);
  //   console.log('PDF wurde erstellt:', res.filename);
  // });
}

/**
 * Hauptfunktion zum Ausführen des Mietrecht Urteilsagents
 */
async function fuehreMietrechtAgentAus() {
  console.log("Starte Mietrecht Urteilsagent...");
  console.log(`Datum: ${new Date().toLocaleString('de-DE')}`);
  
  // Gesamtzahl der Anwälte ausgeben
  console.log(`Verarbeite Updates für ${anwaelte.length} Anwälte...\n`);
  
  // Jeden Anwalt verarbeiten
  for (const [index, anwalt] of anwaelte.entries()) {
    console.log(`[${index + 1}/${anwaelte.length}] Verarbeite Updates für ${anwalt.name} (${anwalt.kanzlei})...`);
    
    // Urteile für diesen Anwalt filtern
    const gefilterteUrteile = filterUrteileFuerAnwalt(mockUrteile, anwalt);
    
    console.log(`  ${gefilterteUrteile.length} relevante Urteile gefunden`);
    
    // Newsletter-Inhalt generieren
    const newsletterInhalt = generiereNewsletter(anwalt, gefilterteUrteile);
    const emailBetreff = `Mietrechts-Urteile - KW ${getKalenderwoche(new Date())} - ${anwalt.name.split(' ')[0]}`;
    
    // E-Mail senden (simuliert)
    await sendeEmail(anwalt, emailBetreff, newsletterInhalt);
    
    // Kleine Pause zwischen den Anwälten (1 Sekunde)
    await new Promise(resolve => setTimeout(resolve, 1000));
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