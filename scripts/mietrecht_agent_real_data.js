/**
 * Mietrecht Urteilsagent mit echten Datenquellen
 * Erweiterte Version des Mietrecht Agents, der echte Gerichtsdaten abruft
 */

// Erforderliche Module importieren
const { abrufeUndVerarbeiteBghUrteile } = require('./bgh_api_client.js');
const { abrufeUndVerarbeiteLandgerichtsEntscheidungen } = require('./landgerichte_api_client.js');
const { abrufeUndVerarbeiteBeckOnlineArtikel } = require('./beckonline_api_client.js');
const { abrufeUndVerarbeiteJurisDokumente } = require('./juris_api_client.js');
const { abrufeUndVerarbeiteBverfgEntscheidungen } = require('./bverfg_api_client.js');
const { filterUrteileFuerAnwalt, kategorisiereUrteile, generiereNewsletter } = require('./mietrecht_agent_de.js');
const { filterAndRankDecisions } = require('./ai_relevance_scoring.js');
const { contextualFilter } = require('./contextual_filtering.js');
const { getInteractionsByLawyerId } = require('./database/dao/userInteractionDao.js');
const { AdvancedNotificationManager } = require('./notifications/advancedNotificationManager.js');
const nodemailer = require('nodemailer');
const emailConfig = require('./config/email.config.js');

// Configuration management
const { config, getConfigValue } = require('./config_manager.js');

// Database modules
const { initializeDatabase, closeDatabase } = require('./database/connection.js');
const { getAllLawyers } = require('./database/dao/lawyerDao.js');
// Updated to use enhanced logging
const { logger } = require('./monitoring/logService.js');

// Enhanced performance monitoring
const { EnhancedMonitor } = require('./monitoring/enhancedMonitor.js');

// Use the global monitor instance from the web server for dashboard integration
// If not available, create a new instance
let monitor;
try {
  // Try to get the global monitor from the web server
  const webServer = require('./web_config_server.js');
  monitor = webServer.globalMonitor || new EnhancedMonitor();
} catch (error) {
  // If web server is not available, create a new monitor
  monitor = new EnhancedMonitor();
}

// Initialize advanced notification manager
const notificationManager = new AdvancedNotificationManager();

/**
 * Ruft echte Urteilsdaten aus verschiedenen Quellen ab
 * @param {Object} anwalt - Anwalt-Objekt
 * @returns {Promise<Array>} Array mit Urteilsdaten
 */
async function abrufeEchteUrteile(anwalt) {
  logger.info(`Rufe echte Urteile für ${anwalt.name} ab...`);
  
  try {
    // BGH-Urteile abrufen (mit konfigurierbaren Einstellungen)
    const bghMaxResults = getConfigValue(config, 'dataSources.bgh.maxResults') || 10;
    const bghOptionen = {
      jahr: new Date().getFullYear(),
      limit: bghMaxResults
    };
    
    const startTime = Date.now();
    const bghUrteile = await abrufeUndVerarbeiteBghUrteile(bghOptionen);
    const duration = Date.now() - startTime;
    
    monitor.recordApiCall('bgh', duration, true, { 
      results: bghUrteile.length,
      lawyer: anwalt.name
    });
    
    logger.info(`  ${bghUrteile.length} BGH-Urteile abgerufen für ${anwalt.name}`);
    
    // Landgerichts-Urteile abrufen (mit konfigurierbaren Einstellungen)
    const landgerichtMaxResults = getConfigValue(config, 'dataSources.landgerichte.maxResults') || 15;
    const landgerichtOptionen = {
      jahr: new Date().getFullYear(),
      limit: landgerichtMaxResults,
      bundesland: anwalt.regionen && anwalt.regionen.length > 0 ? anwalt.regionen[0] : null
    };
    
    const lgStartTime = Date.now();
    const landgerichtEntscheidungen = await abrufeUndVerarbeiteLandgerichtsEntscheidungen(landgerichtOptionen);
    const lgDuration = Date.now() - lgStartTime;
    
    monitor.recordApiCall('landgerichte', lgDuration, true, {
      results: landgerichtEntscheidungen.length,
      lawyer: anwalt.name
    });
    
    logger.info(`  ${landgerichtEntscheidungen.length} Landgerichtsentscheidungen abgerufen für ${anwalt.name}`);
    
    // Beck-online-Artikel abrufen (mit konfigurierbaren Einstellungen)
    const beckOnlineMaxResults = getConfigValue(config, 'dataSources.beckOnline.maxResults') || 10;
    const beckOnlineOptionen = {
      suchbegriff: "mietrecht",
      limit: beckOnlineMaxResults,
      jahr: new Date().getFullYear(),
      zeitraum_von: new Date(new Date().setDate(new Date().getDate() - 30)).toISOString().split('T')[0], // Last 30 days
      zeitraum_bis: new Date().toISOString().split('T')[0]
    };
    
    const beckStartTime = Date.now();
    const beckOnlineArtikel = await abrufeUndVerarbeiteBeckOnlineArtikel(beckOnlineOptionen);
    const beckDuration = Date.now() - beckStartTime;
    
    monitor.recordApiCall('beckOnline', beckDuration, true, {
      results: beckOnlineArtikel.length,
      lawyer: anwalt.name
    });
    
    logger.info(`  ${beckOnlineArtikel.length} Beck-online-Artikel abgerufen für ${anwalt.name}`);
    
    // juris-Dokumente abrufen (mit konfigurierbaren Einstellungen)
    const jurisMaxResults = getConfigValue(config, 'dataSources.juris.maxResults') || 10;
    const jurisOptionen = {
      suchbegriff: "mietrecht",
      limit: jurisMaxResults,
      jahr: new Date().getFullYear(),
      zeitraum_von: new Date(new Date().setDate(new Date().getDate() - 30)).toISOString().split('T')[0], // Last 30 days
      zeitraum_bis: new Date().toISOString().split('T')[0]
    };
    
    const jurisStartTime = Date.now();
    const jurisDokumente = await abrufeUndVerarbeiteJurisDokumente(jurisOptionen);
    const jurisDuration = Date.now() - jurisStartTime;
    
    monitor.recordApiCall('juris', jurisDuration, true, {
      results: jurisDokumente.length,
      lawyer: anwalt.name
    });
    
    logger.info(`  ${jurisDokumente.length} juris-Dokumente abgerufen für ${anwalt.name}`);
    
    // BVerfG-Entscheidungen abrufen (mit konfigurierbaren Einstellungen)
    const bverfgMaxResults = getConfigValue(config, 'dataSources.bverfg.maxResults') || 5;
    const bverfgOptionen = {
      jahr: new Date().getFullYear(),
      limit: bverfgMaxResults
    };
    
    const bverfgStartTime = Date.now();
    const bverfgEntscheidungen = await abrufeUndVerarbeiteBverfgEntscheidungen(bverfgOptionen);
    const bverfgDuration = Date.now() - bverfgStartTime;
    
    monitor.recordApiCall('bverfg', bverfgDuration, true, {
      results: bverfgEntscheidungen.length,
      lawyer: anwalt.name
    });
    
    logger.info(`  ${bverfgEntscheidungen.length} BVerfG-Entscheidungen abgerufen für ${anwalt.name}`);
    
    // Kombinierte Liste erstellen
    const alleUrteile = [...bghUrteile, ...landgerichtEntscheidungen, ...beckOnlineArtikel, ...jurisDokumente, ...bverfgEntscheidungen];
    
    return alleUrteile;
  } catch (error) {
    logger.error(`Fehler beim Abrufen der Urteile für ${anwalt.name}: ${error.message}`, {
      stack: error.stack,
      lawyer: anwalt.name
    });
    
    // Record failed API call
    monitor.recordApiCall('unknown', 0, false, {
      error: error.message,
      lawyer: anwalt.name
    });
    
    throw error;
  }
}

/**
 * Filtert Urteile mit KI-basierter Relevanzbewertung, lernenden Präferenzen und kontextbasierter Filterung
 * @param {Array} urteile - Array mit Urteil-Objekten
 * @param {Object} anwalt - Anwalt-Objekt mit Einstellungen
 * @param {Array} interactionHistory - Nutzerinteraktionshistorie
 * @returns {Array} Gefilterte und sortierte Urteile
 */
async function filterUrteileMitKIUndLernenUndKontext(urteile, anwalt, interactionHistory) {
  logger.info(`Filtere ${urteile.length} Urteile mit KI-basierter Relevanzbewertung, lernenden Präferenzen und kontextbasierter Filterung für ${anwalt.name}...`);
  
  try {
    // Verwende die KI-basierte Filterfunktion mit Interaktionshistorie
    let gefilterteUrteile = filterAndRankDecisions(urteile, anwalt, interactionHistory, 0.6);
    
    logger.info(`  ${gefilterteUrteile.length} relevante Urteile nach KI-Filterung für ${anwalt.name}`);
    
    // Anwenden der kontextbasierten Filterung
    const contextOptions = {
      // In einer echten Implementierung könnten hier aktuelle Fallinformationen übergeben werden
      currentCase: null,
      userBehavior: interactionHistory
    };
    
    gefilterteUrteile = contextualFilter(gefilterteUrteile, anwalt, interactionHistory, contextOptions);
    
    logger.info(`  ${gefilterteUrteile.length} relevante Urteile nach kontextbasierter Filterung für ${anwalt.name}`);
    
    return gefilterteUrteile;
  } catch (error) {
    logger.error(`Fehler bei der erweiterten Filterung für ${anwalt.name}: ${error.message}`, {
      stack: error.stack,
      lawyer: anwalt.name
    });
    
    // Fallback auf die traditionelle Filtermethode
    logger.info(`  Fallback auf traditionelle Filtermethode für ${anwalt.name}`);
    return filterUrteileFuerAnwalt(urteile, anwalt);
  }
}

/**
 * Sendet den Newsletter per E-Mail
 * @param {Object} anwalt - Anwalt-Objekt
 * @param {String} newsletterInhalt - HTML-Inhalt des Newsletters
 */
async function sendeNewsletter(anwalt, newsletterInhalt) {
  // Prüfen, ob E-Mail-Benachrichtigungen aktiviert sind
  const emailEnabled = getConfigValue(config, 'notifications.email.enabled');
  if (!emailEnabled) {
    logger.info(`E-Mail-Benachrichtigungen sind deaktiviert. Newsletter für ${anwalt.name} wird nicht gesendet.`);
    return { success: true, message: 'E-Mail-Benachrichtigungen deaktiviert' };
  }
  
  try {
    logger.info(`Sende Newsletter an ${anwalt.name} (${anwalt.email})...`);
    
    // Konfiguration des E-Mail-Transports aus der Konfiguration laden
    const smtpConfig = getConfigValue(config, 'notifications.email.smtp');
    const transporterConfig = {
      host: smtpConfig.host,
      port: smtpConfig.port,
      secure: smtpConfig.secure,
      auth: {
        user: smtpConfig.user,
        pass: smtpConfig.pass
      }
    };
    
    // Konfiguration des E-Mail-Transports
    const transporter = nodemailer.createTransporter(transporterConfig);
    
    // E-Mail-Optionen
    const mailOptions = {
      from: smtpConfig.user || emailConfig.from,
      to: anwalt.email,
      subject: `${emailConfig.templates.subjectPrefix} - Kalenderwoche ${getKalenderwoche(new Date())}`,
      html: newsletterInhalt + emailConfig.templates.footer
    };
    
    // E-Mail senden
    const startTime = Date.now();
    const info = await transporter.sendMail(mailOptions);
    const duration = Date.now() - startTime;
    
    monitor.recordEmailSend(true, duration, {
      lawyer: anwalt.name,
      messageId: info.messageId
    });
    
    logger.info(`E-Mail erfolgreich gesendet an ${anwalt.name}: ${info.messageId}`);
    
    return { success: true, messageId: info.messageId };
  } catch (error) {
    logger.error(`Fehler beim Senden der E-Mail an ${anwalt.name}: ${error.message}`, {
      stack: error.stack,
      lawyer: anwalt.name
    });
    
    // Record failed email send
    monitor.recordEmailSend(false, 0, {
      error: error.message,
      lawyer: anwalt.name
    });
    
    return { success: false, error: error.message };
  }
}

/**
 * Sendet erweiterte Benachrichtigungen für neue Urteile
 * @param {Object} decision - Urteilsobjekt
 * @param {Object} lawyer - Anwalt-Objekt
 */
async function sendeErweiterteBenachrichtigung(decision, lawyer) {
  try {
    logger.info(`Sende erweiterte Benachrichtigung für Urteil ${decision.id} an ${lawyer.name}...`);
    
    // Bestimme Benachrichtigungskanäle basierend auf Anwaltseinstellungen
    const channels = lawyer.notificationChannels || ['email'];
    
    // Sende Multi-Channel-Benachrichtigung
    const results = await notificationManager.sendMultiChannelNotification(decision, lawyer, channels);
    
    // Logge Ergebnisse
    results.forEach(result => {
      if (result.success) {
        logger.info(`  ${result.channel.toUpperCase()} Benachrichtigung erfolgreich gesendet an ${lawyer.name}`);
      } else {
        logger.error(`  Fehler beim Senden der ${result.channel.toUpperCase()} Benachrichtigung an ${lawyer.name}: ${result.error}`);
      }
    });
    
    return results;
  } catch (error) {
    logger.error(`Fehler beim Senden der erweiterten Benachrichtigung an ${lawyer.name}: ${error.message}`, {
      stack: error.stack,
      lawyer: lawyer.name
    });
    
    return [{ channel: 'error', success: false, error: error.message }];
  }
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
 * Hauptfunktion des erweiterten Mietrecht Agents
 */
async function starteErweitertenMietrechtAgent() {
  logger.info("Starte erweiterten Mietrecht Urteilsagent...");
  logger.info(`Datum: ${new Date().toLocaleString('de-DE')}`);
  
  // Start performance monitoring
  monitor.start();
  
  try {
    // Initialize database
    await initializeDatabase();
    logger.info("Datenbank erfolgreich initialisiert");
    
    // Load lawyers from database
    const anwaelte = await getAllLawyers();
    logger.info(`Geladene Anwälte aus der Datenbank: ${anwaelte.length}`);
    
    // Wenn keine Anwälte gefunden wurden, brechen wir ab
    if (anwaelte.length === 0) {
      logger.warn("Keine Anwälte in der Datenbank gefunden. Beende Agent.");
      await closeDatabase();
      
      // End performance monitoring
      const report = monitor.end({ 
        lawyersProcessed: 0, 
        successful: 0, 
        failed: 0 
      });
      
      monitor.printReport(report);
      
      return;
    }
    
    let erfolgreicheVerarbeitungen = 0;
    let fehlerhafteVerarbeitungen = 0;
    
    // Jeden Anwalt verarbeiten
    for (const anwalt of anwaelte) {
      logger.info(`Verarbeite Updates für ${anwalt.name}...`);
      
      try {
        // Echte Urteile abrufen
        const startTime = Date.now();
        const echteUrteile = await abrufeEchteUrteile(anwalt);
        const duration = Date.now() - startTime;
        
        monitor.recordExecutionTime('abrufeEchteUrteile', duration, {
          lawyer: anwalt.name,
          results: echteUrteile.length
        });
        
        if (echteUrteile.length === 0) {
          logger.info(`  Keine neuen Urteile für ${anwalt.name} gefunden`);
          erfolgreicheVerarbeitungen++;
          continue;
        }
        
        logger.info(`  ${echteUrteile.length} echte Urteile gefunden für ${anwalt.name}`);
        
        // Nutzerinteraktionshistorie abrufen
        const interactionHistory = await getInteractionsByLawyerId(anwalt.id, { limit: 50 });
        logger.info(`  ${interactionHistory.length} Interaktionen aus der Historie für ${anwalt.name} geladen`);
        
        // Urteile mit KI-basierter Relevanzbewertung, lernenden Präferenzen und kontextbasierter Filterung filtern
        const filterStartTime = Date.now();
        const gefilterteUrteile = await filterUrteileMitKIUndLernenUndKontext(echteUrteile, anwalt, interactionHistory);
        const filterDuration = Date.now() - filterStartTime;
        
        monitor.recordExecutionTime('filterUrteileMitKIUndLernenUndKontext', filterDuration, {
          lawyer: anwalt.name,
          results: gefilterteUrteile.length
        });
        
        logger.info(`  ${gefilterteUrteile.length} relevante Urteile nach erweiterter Filterung für ${anwalt.name}`);
        
        if (gefilterteUrteile.length === 0) {
          logger.info(`  Keine relevanten Urteile für ${anwalt.name} nach erweiterter Filterung`);
          erfolgreicheVerarbeitungen++;
          continue;
        }
        
        // Für jedes relevante Urteil erweiterte Benachrichtigungen senden
        for (const urteil of gefilterteUrteile) {
          await sendeErweiterteBenachrichtigung(urteil, anwalt);
        }
        
        // Newsletter generieren
        const newsletterStartTime = Date.now();
        const newsletterInhalt = generiereNewsletter(anwalt, gefilterteUrteile);
        const newsletterDuration = Date.now() - newsletterStartTime;
        
        monitor.recordExecutionTime('generiereNewsletter', newsletterDuration, {
          lawyer: anwalt.name
        });
        
        logger.info(`Newsletter generiert für ${anwalt.name}`);
        
        // Newsletter senden
        const sendResult = await sendeNewsletter(anwalt, newsletterInhalt);
        
        if (sendResult.success) {
          logger.info(`  Newsletter erfolgreich für ${anwalt.name} generiert und versendet`);
          erfolgreicheVerarbeitungen++;
        } else {
          logger.error(`  Fehler beim Senden des Newsletters an ${anwalt.name}: ${sendResult.error}`);
          fehlerhafteVerarbeitungen++;
        }
      } catch (error) {
        logger.error(`  Fehler bei der Verarbeitung für ${anwalt.name}: ${error.message}`, {
          stack: error.stack,
          lawyer: anwalt.name
        });
        monitor.recordError(error, `Verarbeitung für ${anwalt.name}`);
        fehlerhafteVerarbeitungen++;
      }
    }
    
    // Statistiken protokollieren
    logger.info(`Verarbeitung abgeschlossen: ${erfolgreicheVerarbeitungen} erfolgreich, ${fehlerhafteVerarbeitungen} fehlerhaft`);
    
    // Close database connection
    await closeDatabase();
    logger.info("Datenbankverbindung geschlossen");
    
    logger.info("Erweiterter Mietrecht Urteilsagent erfolgreich abgeschlossen.");
    
    // End performance monitoring
    const report = monitor.end({ 
      lawyersProcessed: anwaelte.length, 
      successful: erfolgreicheVerarbeitungen, 
      failed: fehlerhafteVerarbeitungen 
    });
    
    monitor.printReport(report);
    
    // Send to external monitoring if configured
    await monitor.sendToExternalMonitoring(report);
    
    return report;
  } catch (error) {
    logger.error("Fehler beim Starten des Mietrecht Agents:", error.message, {
      stack: error.stack
    });
    monitor.recordError(error, "Mietrecht Agent Hauptfunktion");
    
    // Try to close database if it was opened
    try {
      await closeDatabase();
      logger.info("Datenbankverbindung geschlossen nach Fehler");
    } catch (closeError) {
      logger.error("Fehler beim Schließen der Datenbank:", closeError.message, {
        stack: closeError.stack
      });
    }
    
    // End performance monitoring with error
    const report = monitor.end({ 
      lawyersProcessed: 0, 
      successful: 0, 
      failed: 1,
      error: error.message
    });
    
    monitor.printReport(report);
    
    throw error;
  }
}

/**
 * Planungsfunktion für wöchentliche Ausführung
 */
async function planeWoechentlicheAusfuehrung() {
  logger.info("Erweiterter Mietrecht Urteilsagent geplant.");
  logger.info("Nächste Ausführung: Jeden Montag um 8:00 Uhr");
  
  // Für die Demonstration führen wir ihn sofort aus
  await starteErweitertenMietrechtAgent();
  
  // In einer echten Implementierung würde dies einen Planer verwenden:
  // cron.schedule('0 8 * * 1', starteErweitertenMietrechtAgent);
}

// Den Agent ausführen, wenn dieses Skript direkt gestartet wird
if (require.main === module) {
  planeWoechentlicheAusfuehrung().catch(async (error) => {
    logger.error("Kritischer Fehler im Mietrecht Agent:", error.message, {
      stack: error.stack
    });
    process.exit(1);
  });
}

// Funktionen für Tests exportieren
module.exports = {
  abrufeEchteUrteile,
  filterUrteileMitKIUndLernenUndKontext,
  sendeNewsletter,
  sendeErweiterteBenachrichtigung,
  starteErweitertenMietrechtAgent,
  planeWoechentlicheAusfuehrung
};