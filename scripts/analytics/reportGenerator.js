/**
 * Report Generation Module
 * This module generates various reports based on analysis data.
 */

const fs = require('fs').promises;
const path = require('path');
const { performComprehensiveAnalysis } = require('./decisionAnalyzer.js');
const { performPerformanceAnalysis } = require('./performanceAnalyzer.js');

/**
 * Generate a decision analysis report
 * @param {Object} analysisData - Analysis data
 * @returns {string} Formatted report
 */
function generateDecisionReport(analysisData) {
  let report = '# Mietrecht-Agent: Entscheidungsanalysebericht\n\n';
  report += `Erstellt am: ${new Date().toLocaleDateString('de-DE')}\n\n`;
  
  // Trends section
  report += '## 1. Entscheidungstrends\n\n';
  
  // Top topics
  report += '### Häufigste Themen:\n';
  if (analysisData.trends.topTopics.length > 0) {
    analysisData.trends.topTopics.slice(0, 5).forEach(([topic, count], index) => {
      report += `${index + 1}. ${topic}: ${count} Entscheidungen\n`;
    });
  } else {
    report += 'Keine Themen gefunden.\n';
  }
  report += '\n';
  
  // Court distribution
  report += '### Verteilung nach Gerichten:\n';
  if (analysisData.trends.courtDistribution.length > 0) {
    analysisData.trends.courtDistribution.slice(0, 5).forEach(([court, count], index) => {
      report += `${index + 1}. ${court}: ${count} Entscheidungen\n`;
    });
  } else {
    report += 'Keine Gerichtsdaten gefunden.\n';
  }
  report += '\n';
  
  // Lawyer specializations
  report += '## 2. Anwaltspezialisierungen\n\n';
  report += `Gesamtanzahl der Anwälte: ${analysisData.specializations.totalLawyers}\n\n`;
  
  if (analysisData.specializations.practiceAreaDistribution.length > 0) {
    report += '### Häufigste Praxisbereiche:\n';
    analysisData.specializations.practiceAreaDistribution.slice(0, 5).forEach(([area, count], index) => {
      report += `${index + 1}. ${area}: ${count} Anwälte\n`;
    });
  } else {
    report += 'Keine Praxisbereichsdaten gefunden.\n';
  }
  report += '\n';
  
  // Impact analysis
  report += '## 3. Einflussfaktoren\n\n';
  
  report += '### Verteilung nach Wichtigkeit:\n';
  Object.entries(analysisData.impact.importanceDistribution).forEach(([importance, count]) => {
    report += `- ${importance}: ${count} Entscheidungen\n`;
  });
  report += '\n';
  
  report += `Durchschnittliche Themen pro Entscheidung: ${analysisData.impact.averageTopicsPerDecision.toFixed(2)}\n`;
  report += `Gesamtanzahl der Entscheidungen: ${analysisData.impact.totalDecisions}\n\n`;
  
  return report;
}

/**
 * Generate a performance report
 * @param {Object} performanceData - Performance data
 * @returns {string} Formatted report
 */
function generatePerformanceReport(performanceData) {
  let report = '# Mietrecht-Agent: Leistungsbericht\n\n';
  report += `Erstellt am: ${new Date().toLocaleDateString('de-DE')}\n\n`;
  
  // System performance
  report += '## 1. Systemleistung\n\n';
  report += `Durchschnittliche Antwortzeit: ${performanceData.performance.avgResponseTime.toFixed(2)} ms\n`;
  report += `Durchschnittliche Cache-Trefferquote: ${(performanceData.performance.avgCacheHitRate * 100).toFixed(2)}%\n`;
  report += `Maximale aktive Anfragen: ${performanceData.performance.maxActiveRequests}\n\n`;
  
  // Log analysis
  report += '## 2. Systemprotokollanalyse\n\n';
  report += `Gesamtanzahl der Protokolleinträge: ${performanceData.logs.totalLogs}\n`;
  report += `Fehlerquote: ${(performanceData.logs.errorRate * 100).toFixed(2)}%\n\n`;
  
  report += '### Protokollstatistik:\n';
  Object.entries(performanceData.logs.logStatistics).forEach(([level, count]) => {
    report += `- ${level}: ${count} Einträge\n`;
  });
  report += '\n';
  
  // Bottlenecks
  report += '## 3. Engpässe\n\n';
  if (performanceData.bottlenecks.length > 0) {
    performanceData.bottlenecks.forEach((bottleneck, index) => {
      report += `${index + 1}. [${bottleneck.severity.toUpperCase()}] ${bottleneck.description}\n`;
      report += `   Wert: ${bottleneck.value}, Schwellenwert: ${bottleneck.threshold}\n\n`;
    });
  } else {
    report += 'Keine Engpässe identifiziert.\n\n';
  }
  
  // Recommendations
  report += '## 4. Empfehlungen\n\n';
  if (performanceData.recommendations.length > 0) {
    performanceData.recommendations.forEach((recommendation, index) => {
      const priority = recommendation.priority === 'high' ? 'HOCH' : 
                      recommendation.priority === 'medium' ? 'MITTEL' : 'NIEDRIG';
      report += `${index + 1}. [${priority}] ${recommendation.description}\n\n`;
    });
  } else {
    report += 'Keine spezifischen Empfehlungen.\n\n';
  }
  
  return report;
}

/**
 * Generate a combined report
 * @param {Object} decisionAnalysis - Decision analysis data
 * @param {Object} performanceAnalysis - Performance analysis data
 * @returns {string} Combined report
 */
function generateCombinedReport(decisionAnalysis, performanceAnalysis) {
  let report = '# Mietrecht-Agent: Kombinierter Analysebericht\n\n';
  report += `Erstellt am: ${new Date().toLocaleDateString('de-DE')}\n\n`;
  
  report += '## Entscheidungsanalyse\n\n';
  report += generateDecisionReport(decisionAnalysis);
  
  report += '## Leistungsanalyse\n\n';
  report += generatePerformanceReport(performanceAnalysis);
  
  return report;
}

/**
 * Save report to file
 * @param {string} report - Report content
 * @param {string} filename - Filename for the report
 * @returns {Promise<string>} Path to saved report
 */
async function saveReport(report, filename) {
  try {
    // Ensure reports directory exists
    const reportsDir = path.join(__dirname, '..', 'reports');
    await fs.mkdir(reportsDir, { recursive: true });
    
    // Save report
    const reportPath = path.join(reportsDir, filename);
    await fs.writeFile(reportPath, report, 'utf8');
    
    console.log(`Bericht gespeichert unter: ${reportPath}`);
    return reportPath;
  } catch (error) {
    console.error('Fehler beim Speichern des Berichts:', error);
    throw error;
  }
}

/**
 * Generate and save all reports
 * @returns {Promise<Object>} Paths to generated reports
 */
async function generateAllReports() {
  try {
    console.log('Generiere alle Berichte...');
    
    // Perform analyses
    const [decisionAnalysis, performanceAnalysis] = await Promise.all([
      performComprehensiveAnalysis(),
      performPerformanceAnalysis()
    ]);
    
    // Generate reports
    const decisionReport = generateDecisionReport(decisionAnalysis);
    const performanceReport = generatePerformanceReport(performanceAnalysis);
    const combinedReport = generateCombinedReport(decisionAnalysis, performanceAnalysis);
    
    // Save reports
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    
    const decisionReportPath = await saveReport(
      decisionReport, 
      `decision_analysis_${timestamp}.txt`
    );
    
    const performanceReportPath = await saveReport(
      performanceReport, 
      `performance_report_${timestamp}.txt`
    );
    
    const combinedReportPath = await saveReport(
      combinedReport, 
      `combined_report_${timestamp}.txt`
    );
    
    console.log('Alle Berichte erfolgreich generiert');
    
    return {
      decisionReport: decisionReportPath,
      performanceReport: performanceReportPath,
      combinedReport: combinedReportPath
    };
  } catch (error) {
    console.error('Fehler beim Generieren der Berichte:', error);
    throw error;
  }
}

// Export functions
module.exports = {
  generateDecisionReport,
  generatePerformanceReport,
  generateCombinedReport,
  saveReport,
  generateAllReports
};