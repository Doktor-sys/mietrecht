/**
 * Reporting System
 * This module generates reports on legal developments.
 */

const fs = require('fs');
const path = require('path');

/**
 * Generate a summary report of court decisions
 * @param {Array} decisions - Array of court decision objects
 * @param {Object} options - Report options
 * @returns {String} Formatted report content
 */
function generateSummaryReport(decisions, options = {}) {
  console.log(`Generating summary report for ${decisions.length} decisions`);
  
  const { 
    period = 'last_week', 
    includeCharts = false,
    outputPath = null
  } = options;
  
  // Generate report header
  let report = `Mietrecht Agent - Zusammenfassender Bericht
====================================

Berichtszeitraum: ${period === 'last_week' ? 'Letzte Woche' : period === 'last_month' ? 'Letzter Monat' : 'Benutzerdefiniert'}
Erstellungsdatum: ${new Date().toLocaleDateString('de-DE')}
Anzahl der analysierten Entscheidungen: ${decisions.length}

`;
  
  // Group decisions by court
  const decisionsByCourt = {};
  decisions.forEach(decision => {
    const court = decision.court || 'Unbekannt';
    if (!decisionsByCourt[court]) {
      decisionsByCourt[court] = [];
    }
    decisionsByCourt[court].push(decision);
  });
  
  // Add court statistics
  report += "Entscheidungen nach Gericht:\n";
  report += "---------------------------\n";
  for (const [court, courtDecisions] of Object.entries(decisionsByCourt)) {
    report += `${court}: ${courtDecisions.length} Entscheidungen\n`;
  }
  
  report += "\n";
  
  // Group decisions by importance
  const decisionsByImportance = { high: [], medium: [], low: [] };
  decisions.forEach(decision => {
    const importance = decision.importance || 'low';
    if (decisionsByImportance[importance]) {
      decisionsByImportance[importance].push(decision);
    } else {
      decisionsByImportance.low.push(decision);
    }
  });
  
  // Add importance statistics
  report += "Entscheidungen nach Wichtigkeit:\n";
  report += "-------------------------------\n";
  report += `Hoch: ${decisionsByImportance.high.length} Entscheidungen\n`;
  report += `Mittel: ${decisionsByImportance.medium.length} Entscheidungen\n`;
  report += `Niedrig: ${decisionsByImportance.low.length} Entscheidungen\n`;
  
  report += "\n";
  
  // Add top topics
  const topicCounts = {};
  decisions.forEach(decision => {
    if (decision.topics && Array.isArray(decision.topics)) {
      decision.topics.forEach(topic => {
        topicCounts[topic] = (topicCounts[topic] || 0) + 1;
      });
    }
  });
  
  // Sort topics by count
  const sortedTopics = Object.entries(topicCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10); // Top 10 topics
  
  report += "Häufigste Themen:\n";
  report += "----------------\n";
  sortedTopics.forEach(([topic, count]) => {
    report += `${topic}: ${count} Entscheidungen\n`;
  });
  
  report += "\n";
  
  // Add important decisions details
  if (decisionsByImportance.high.length > 0) {
    report += "Wichtige Entscheidungen im Detail:\n";
    report += "----------------------------------\n";
    
    decisionsByImportance.high.forEach((decision, index) => {
      report += `${index + 1}. ${decision.court} - ${decision.caseNumber}
   Datum: ${decision.decisionDate}
   Ort: ${decision.location}
   Themen: ${decision.topics.join(', ')}
   
   Zusammenfassung:
   ${decision.summary}
   
   Praktische Auswirkungen:
   ${decision.practiceImplications}
   
   Link zur Entscheidung: ${decision.url}

`;
    });
  }
  
  // Save report to file if outputPath is provided
  if (outputPath) {
    try {
      fs.writeFileSync(outputPath, report, 'utf8');
      console.log(`Report saved to: ${outputPath}`);
    } catch (error) {
      console.error("Error saving report to file:", error.message);
    }
  }
  
  return report;
}

/**
 * Generate a detailed analysis report
 * @param {Array} decisions - Array of court decision objects
 * @param {Object} options - Report options
 * @returns {String} Formatted report content
 */
function generateDetailedReport(decisions, options = {}) {
  console.log(`Generating detailed report for ${decisions.length} decisions`);
  
  const { 
    lawyer = null,
    includeNLP = true,
    outputPath = null
  } = options;
  
  // Generate report header
  let report = `Mietrecht Agent - Detaillierter Analysebericht
======================================

Erstellungsdatum: ${new Date().toLocaleDateString('de-DE')}
Anzahl der analysierten Entscheidungen: ${decisions.length}
${lawyer ? `Anwalt: ${lawyer.name}\nKanzlei: ${lawyer.lawFirm}\n` : ''}
`;
  
  // Add decisions analysis
  report += "Detaillierte Analyse der Entscheidungen:\n";
  report += "---------------------------------------\n\n";
  
  decisions.forEach((decision, index) => {
    report += `Entscheidung ${index + 1}:
${'='.repeat(20)}
Gericht: ${decision.court}
Ort: ${decision.location}
Datum: ${decision.decisionDate}
Aktenzeichen: ${decision.caseNumber}
Themen: ${decision.topics.join(', ')}
Wichtigkeit: ${decision.importance}

Zusammenfassung:
${decision.summary}

Volltext:
${decision.fullText.substring(0, 500)}... (gekürzt)

${includeNLP ? `Praktische Auswirkungen:
${decision.practiceImplications}

Erkannte Entitäten:
${decision.entities && decision.entities.length > 0 ? decision.entities.join(', ') : 'Keine'}

` : ''}`;
  });
  
  // Save report to file if outputPath is provided
  if (outputPath) {
    try {
      fs.writeFileSync(outputPath, report, 'utf8');
      console.log(`Detailed report saved to: ${outputPath}`);
    } catch (error) {
      console.error("Error saving detailed report to file:", error.message);
    }
  }
  
  return report;
}

/**
 * Generate a comparative report
 * @param {Array} currentDecisions - Current court decisions
 * @param {Array} previousDecisions - Previous court decisions for comparison
 * @param {Object} options - Report options
 * @returns {String} Formatted report content
 */
function generateComparativeReport(currentDecisions, previousDecisions, options = {}) {
  console.log(`Generating comparative report for ${currentDecisions.length} current and ${previousDecisions.length} previous decisions`);
  
  const { outputPath = null } = options;
  
  // Generate report header
  let report = `Mietrecht Agent - Vergleichsbericht
============================

Erstellungsdatum: ${new Date().toLocaleDateString('de-DE')}
Aktuelle Entscheidungen: ${currentDecisions.length}
Vorherige Entscheidungen: ${previousDecisions.length}

`;
  
  // Calculate statistics
  const currentByImportance = { high: 0, medium: 0, low: 0 };
  const previousByImportance = { high: 0, medium: 0, low: 0 };
  
  currentDecisions.forEach(decision => {
    const importance = decision.importance || 'low';
    if (currentByImportance[importance] !== undefined) {
      currentByImportance[importance]++;
    } else {
      currentByImportance.low++;
    }
  });
  
  previousDecisions.forEach(decision => {
    const importance = decision.importance || 'low';
    if (previousByImportance[importance] !== undefined) {
      previousByImportance[importance]++;
    } else {
      previousByImportance.low++;
    }
  });
  
  // Add comparison statistics
  report += "Vergleich nach Wichtigkeit:\n";
  report += "---------------------------\n";
  report += `Hoch: ${currentByImportance.high} (vorher: ${previousByImportance.high}) - Änderung: ${currentByImportance.high - previousByImportance.high}\n`;
  report += `Mittel: ${currentByImportance.medium} (vorher: ${previousByImportance.medium}) - Änderung: ${currentByImportance.medium - previousByImportance.medium}\n`;
  report += `Niedrig: ${currentByImportance.low} (vorher: ${previousByImportance.low}) - Änderung: ${currentByImportance.low - previousByImportance.low}\n`;
  
  report += "\n";
  
  // Add trend analysis
  const totalCurrent = currentDecisions.length;
  const totalPrevious = previousDecisions.length;
  
  report += "Trendanalyse:\n";
  report += "-------------\n";
  if (totalCurrent > totalPrevious) {
    const increase = ((totalCurrent - totalPrevious) / totalPrevious * 100).toFixed(2);
    report += `Anstieg der Entscheidungen um ${increase}%\n`;
  } else if (totalCurrent < totalPrevious) {
    const decrease = ((totalPrevious - totalCurrent) / totalPrevious * 100).toFixed(2);
    report += `Rückgang der Entscheidungen um ${decrease}%\n`;
  } else {
    report += "Keine Veränderung der Anzahl der Entscheidungen\n";
  }
  
  // Save report to file if outputPath is provided
  if (outputPath) {
    try {
      fs.writeFileSync(outputPath, report, 'utf8');
      console.log(`Comparative report saved to: ${outputPath}`);
    } catch (error) {
      console.error("Error saving comparative report to file:", error.message);
    }
  }
  
  return report;
}

// Export functions
module.exports = {
  generateSummaryReport,
  generateDetailedReport,
  generateComparativeReport
};