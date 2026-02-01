/**
 * Notification Templates
 * This module provides templates for different types of notifications.
 */

/**
 * Generate new court decision notification template
 * @param {Object} decision - Court decision data
 * @param {Object} lawyer - Lawyer data
 * @returns {Object} Notification template with subject and body
 */
function newCourtDecisionTemplate(decision, lawyer) {
  const subject = `Neue Gerichtsentscheidung: ${decision.caseNumber}`;
  
  const body = `
    <h2>Neue Gerichtsentscheidung gefunden</h2>
    <p>Sehr geehrte/r ${lawyer.name},</p>
    
    <p>Der Mietrecht-Agent hat eine neue Gerichtsentscheidung identifiziert, 
    die für Ihre Praxis relevant sein könnte:</p>
    
    <h3>Details der Entscheidung:</h3>
    <ul>
      <li><strong>Gericht:</strong> ${decision.court}</li>
      <li><strong>Datum:</strong> ${decision.date}</li>
      <li><strong>Aktenzeichen:</strong> ${decision.caseNumber}</li>
      <li><strong>Themen:</strong> ${decision.topics.join(', ')}</li>
    </ul>
    
    <h3>Zusammenfassung:</h3>
    <p>${decision.summary}</p>
    
    <h3>Praktische Auswirkungen:</h3>
    <p>${decision.practiceImplications}</p>
    
    <p><a href="${decision.url}">Vollständigen Entscheidungstext anzeigen</a></p>
    
    <p>Mit freundlichen Grüßen,<br>
    Ihr Mietrecht-Agent</p>
  `;
  
  return { subject, body };
}

/**
 * Generate system alert notification template
 * @param {string} alertType - Type of alert
 * @param {string} message - Alert message
 * @param {string} severity - Severity level (info, warning, error)
 * @returns {Object} Notification template with subject and body
 */
function systemAlertTemplate(alertType, message, severity) {
  const severityLabels = {
    info: 'Information',
    warning: 'Warnung',
    error: 'Fehler'
  };
  
  const subject = `[${severityLabels[severity]}] Mietrecht-Agent Systemmeldung`;
  
  const body = `
    <h2>Systemmeldung vom Mietrecht-Agenten</h2>
    <p><strong>Typ:</strong> ${alertType}</p>
    <p><strong>Schweregrad:</strong> ${severityLabels[severity]}</p>
    <p><strong>Nachricht:</strong></p>
    <p>${message}</p>
    
    <p>Bitte überprüfen Sie das System und ergreifen Sie ggf. entsprechende Maßnahmen.</p>
    
    <p>Mit freundlichen Grüßen,<br>
    Ihr Mietrecht-Agent</p>
  `;
  
  return { subject, body };
}

/**
 * Generate performance alert notification template
 * @param {string} metric - Performance metric name
 * @param {number} value - Current value
 * @param {number} threshold - Threshold value
 * @returns {Object} Notification template with subject and body
 */
function performanceAlertTemplate(metric, value, threshold) {
  const subject = `[WARNUNG] Leistungsproblem erkannt: ${metric}`;
  
  const body = `
    <h2>Leistungswarnung vom Mietrecht-Agenten</h2>
    <p>Ein Leistungsproblem wurde im System erkannt:</p>
    
    <ul>
      <li><strong>Metrik:</strong> ${metric}</li>
      <li><strong>Aktueller Wert:</strong> ${value}</li>
      <li><strong>Schwellenwert:</strong> ${threshold}</li>
    </ul>
    
    <p>Bitte überprüfen Sie das System und optimieren Sie ggf. die Konfiguration.</p>
    
    <p>Mit freundlichen Grüßen,<br>
    Ihr Mietrecht-Agent</p>
  `;
  
  return { subject, body };
}

/**
 * Generate daily summary notification template
 * @param {Object} summaryData - Summary data
 * @returns {Object} Notification template with subject and body
 */
function dailySummaryTemplate(summaryData) {
  const subject = `Tägliche Zusammenfassung - Mietrecht-Agent (${new Date().toLocaleDateString('de-DE')})`;
  
  const body = `
    <h2>Tägliche Zusammenfassung vom Mietrecht-Agenten</h2>
    
    <h3>Entscheidungsstatistiken:</h3>
    <ul>
      <li>Neue Entscheidungen gefunden: ${summaryData.newDecisions}</li>
      <li>Bereits verarbeitete Entscheidungen: ${summaryData.processedDecisions}</li>
      <li>Fehler bei der Verarbeitung: ${summaryData.errors}</li>
    </ul>
    
    <h3>Systemleistung:</h3>
    <ul>
      <li>Durchschnittliche Antwortzeit: ${summaryData.avgResponseTime.toFixed(2)} ms</li>
      <li>Cache-Trefferquote: ${(summaryData.cacheHitRate * 100).toFixed(1)}%</li>
    </ul>
    
    <h3>Datenquellen:</h3>
    <ul>
      ${Object.entries(summaryData.dataSourceStatus)
        .map(([source, status]) => `<li>${source}: ${status}</li>`)
        .join('')}
    </ul>
    
    <p>Mit freundlichen Grüßen,<br>
    Ihr Mietrecht-Agent</p>
  `;
  
  return { subject, body };
}

// Export templates
module.exports = {
  newCourtDecisionTemplate,
  systemAlertTemplate,
  performanceAlertTemplate,
  dailySummaryTemplate
};