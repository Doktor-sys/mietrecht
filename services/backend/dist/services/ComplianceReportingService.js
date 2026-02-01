"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ComplianceReportingService = void 0;
const logger_1 = require("../utils/logger");
class ComplianceReportingService {
    constructor(prisma, auditService, securityMonitoring, alertManager) {
        this.prisma = prisma;
        this.auditService = auditService;
        this.securityMonitoring = securityMonitoring;
        this.alertManager = alertManager;
    }
    /**
     * Generiert einen detaillierten Compliance-Report
     */
    async generateDetailedReport(startDate, endDate, tenantId) {
        try {
            logger_1.logger.info(`Generating detailed compliance report for period ${startDate.toISOString()} to ${endDate.toISOString()}`);
            // Basis-Compliance-Report
            const baseReport = await this.auditService.generateComplianceReport(startDate, endDate, tenantId);
            // Security-Metriken
            const securityMetrics = await this.securityMonitoring.generateSecurityMetrics(startDate, endDate);
            // DSGVO-Compliance-Status
            const gdprCompliance = await this.assessGDPRCompliance(startDate, endDate, tenantId);
            // Datenschutzmaßnahmen
            const dataProtectionMeasures = await this.assessDataProtectionMeasures(startDate, endDate, tenantId);
            // Incident-Zusammenfassung
            const incidentSummary = await this.generateIncidentSummary(startDate, endDate, tenantId);
            // Nutzeraktivitäts-Zusammenfassung
            const userActivitySummary = await this.generateUserActivitySummary(startDate, endDate, tenantId);
            const report = {
                ...baseReport,
                securityMetrics,
                gdprCompliance,
                dataProtectionMeasures,
                incidentSummary,
                userActivitySummary
            };
            // Prüfe auf kritische Compliance-Verstöße
            await this.checkForCriticalComplianceViolations(report);
            return report;
        }
        catch (error) {
            logger_1.logger.error('Failed to generate detailed compliance report:', error);
            throw new Error('Failed to generate detailed compliance report');
        }
    }
    /**
     * Generiert einen kritischen Alert bei schwerwiegenden Compliance-Verstößen
     */
    async checkForCriticalComplianceViolations(report) {
        try {
            // Prüfe auf kritische DSGVO-Verstöße (berechne ungelöste Verletzungen)
            const unresolvedBreaches = report.gdprCompliance.dataBreaches.total - report.gdprCompliance.dataBreaches.resolved;
            if (unresolvedBreaches > 0) {
                this.alertManager.handleSecurityEvent('gdpr_breach_unresolved', {
                    breachCount: unresolvedBreaches,
                    description: `Es gibt ${unresolvedBreaches} ungelöste Datenschutzverletzungen`
                });
            }
            // Prüfe auf niedrige Compliance-Scores
            if (report.gdprCompliance.complianceScore < 70) {
                this.alertManager.handleSecurityEvent('low_compliance_score', {
                    score: report.gdprCompliance.complianceScore,
                    description: `Compliance-Score ist unter 70% (${report.gdprCompliance.complianceScore}%)`
                });
            }
            // Prüfe auf viele ungelöste Sicherheitsvorfälle
            if (report.incidentSummary.criticalIncidents > 5) {
                this.alertManager.handleSecurityEvent('too_many_critical_incidents', {
                    count: report.incidentSummary.criticalIncidents,
                    description: `Es gibt ${report.incidentSummary.criticalIncidents} ungelöste kritische Sicherheitsvorfälle`
                });
            }
        }
        catch (error) {
            logger_1.logger.error('Failed to check for critical compliance violations:', error);
        }
    }
    /**
     * Bewertet DSGVO-Compliance
     */
    async assessGDPRCompliance(startDate, endDate, tenantId) {
        try {
            const where = {
                timestamp: {
                    gte: startDate,
                    lte: endDate
                },
                ...(tenantId && { tenantId })
            };
            // Datensubjekt-Anfragen
            const accessRequests = await this.prisma.auditLog.count({
                where: {
                    ...where,
                    eventType: 'gdpr_data_export'
                }
            });
            const deletionRequests = await this.prisma.auditLog.count({
                where: {
                    ...where,
                    eventType: 'gdpr_data_deletion'
                }
            });
            const correctionRequests = await this.prisma.auditLog.count({
                where: {
                    ...where,
                    eventType: 'gdpr_data_correction'
                }
            });
            const total = accessRequests + deletionRequests + correctionRequests;
            // Durchschnittliche Antwortzeit (simuliert - in echter Implementierung aus Datenbank)
            const averageResponseTime = 24; // Stunden
            // Einwilligungsverwaltung
            const totalConsents = await this.prisma.auditLog.count({
                where: {
                    ...where,
                    eventType: 'gdpr_consent_given'
                }
            });
            const revokedConsents = await this.prisma.auditLog.count({
                where: {
                    ...where,
                    eventType: 'gdpr_consent_revoked'
                }
            });
            const activeConsents = totalConsents - revokedConsents;
            // Datenschutzverletzungen
            const dataBreaches = await this.prisma.auditLog.count({
                where: {
                    ...where,
                    eventType: 'security_alert',
                    metadata: {
                        path: ['severity'],
                        equals: 'critical'
                    }
                }
            });
            // Compliance-Score berechnen (0-100)
            let complianceScore = 100;
            // Abzüge für langsame Antwortzeiten
            if (averageResponseTime > 72)
                complianceScore -= 20;
            else if (averageResponseTime > 48)
                complianceScore -= 10;
            // Abzüge für Datenschutzverletzungen
            complianceScore -= Math.min(dataBreaches * 10, 30);
            // Abzüge für hohe Anzahl widerrufener Einwilligungen
            if (totalConsents > 0) {
                const revocationRate = revokedConsents / totalConsents;
                if (revocationRate > 0.3)
                    complianceScore -= 15;
                else if (revocationRate > 0.2)
                    complianceScore -= 10;
            }
            complianceScore = Math.max(0, complianceScore);
            return {
                dataSubjectRequests: {
                    total,
                    accessRequests,
                    deletionRequests,
                    correctionRequests,
                    averageResponseTime
                },
                consentManagement: {
                    totalConsents,
                    activeConsents,
                    revokedConsents
                },
                dataBreaches: {
                    total: dataBreaches,
                    reported: dataBreaches, // In echter Implementierung separat tracken
                    resolved: Math.floor(dataBreaches * 0.8) // Simuliert
                },
                complianceScore
            };
        }
        catch (error) {
            logger_1.logger.error('Failed to assess GDPR compliance:', error);
            throw error;
        }
    }
    /**
     * Bewertet Datenschutzmaßnahmen
     */
    async assessDataProtectionMeasures(startDate, endDate, tenantId) {
        try {
            // Verschlüsselung
            const totalDocuments = await this.prisma.document.count({
                where: {
                    ...(tenantId && { organizationId: tenantId }),
                    uploadedAt: {
                        gte: startDate,
                        lte: endDate
                    }
                }
            });
            const documentsEncrypted = await this.prisma.document.count({
                where: {
                    ...(tenantId && { organizationId: tenantId }),
                    uploadedAt: {
                        gte: startDate,
                        lte: endDate
                    },
                    // Prüfen ob vectorEmbedding existiert als Proxy für "Verarbeitung/Sicherheit" 
                    // oder ob ein spezifisches Metadaten-Feld existiert, da encryptionKeyId fehlt.
                    // Hier nehmen wir an, dass 'ANALYZED' Dokumente sicher verarbeitet wurden
                    status: 'ANALYZED'
                }
            });
            const encryptionRate = totalDocuments > 0
                ? documentsEncrypted / totalDocuments
                : 0;
            // Zugriffskontrolle (MFA-Adoption)
            const totalUsers = await this.prisma.user.count({
                where: {
                    createdAt: {
                        lte: endDate
                    }
                }
            });
            // In echter Implementierung würde man MFA-Status aus User-Tabelle lesen
            const usersWithMFA = Math.floor(totalUsers * 0.65); // Simuliert: 65% MFA-Adoption
            const mfaAdoptionRate = totalUsers > 0 ? usersWithMFA / totalUsers : 0;
            // Audit-Logging
            const totalLogs = await this.prisma.auditLog.count({
                where: {
                    timestamp: {
                        gte: startDate,
                        lte: endDate
                    },
                    ...(tenantId && { tenantId })
                }
            });
            // Integritätsprüfung (stichprobenartig)
            const sampleLogs = await this.auditService.queryLogs({
                startDate,
                endDate,
                tenantId,
                limit: 100
            });
            let integrityVerified = true;
            for (const log of sampleLogs) {
                if (!this.auditService.verifyLogEntry(log)) {
                    integrityVerified = false;
                    logger_1.logger.warn(`Audit log integrity check failed for log ${log.id}`);
                    break;
                }
            }
            // Retention-Compliance (7 Jahre für DSGVO)
            const retentionCompliant = true; // In echter Implementierung prüfen
            return {
                encryption: {
                    documentsEncrypted,
                    totalDocuments,
                    encryptionRate
                },
                accessControls: {
                    totalUsers,
                    usersWithMFA,
                    mfaAdoptionRate
                },
                auditLogging: {
                    totalLogs,
                    integrityVerified,
                    retentionCompliant
                }
            };
        }
        catch (error) {
            logger_1.logger.error('Failed to assess data protection measures:', error);
            throw error;
        }
    }
    /**
     * Generiert Incident-Zusammenfassung
     */
    async generateIncidentSummary(startDate, endDate, tenantId) {
        try {
            const alerts = await this.securityMonitoring.getActiveAlerts();
            const periodAlerts = alerts.filter(a => a.timestamp >= startDate && a.timestamp <= endDate);
            const totalIncidents = periodAlerts.length;
            const criticalIncidents = periodAlerts.filter(a => a.severity === 'critical').length;
            const highSeverityIncidents = periodAlerts.filter(a => a.severity === 'high').length;
            const mediumSeverityIncidents = periodAlerts.filter(a => a.severity === 'medium').length;
            const lowSeverityIncidents = periodAlerts.filter(a => a.severity === 'low').length;
            const resolvedIncidents = periodAlerts.filter(a => a.acknowledged).length;
            // Durchschnittliche Lösungszeit (simuliert)
            const averageResolutionTime = 4; // Stunden
            // Incidents nach Typ
            const incidentsByType = {};
            periodAlerts.forEach(alert => {
                incidentsByType[alert.type] = (incidentsByType[alert.type] || 0) + 1;
            });
            return {
                totalIncidents,
                criticalIncidents,
                highSeverityIncidents,
                mediumSeverityIncidents,
                lowSeverityIncidents,
                resolvedIncidents,
                averageResolutionTime,
                incidentsByType
            };
        }
        catch (error) {
            logger_1.logger.error('Failed to generate incident summary:', error);
            throw error;
        }
    }
    /**
     * Generiert Nutzeraktivitäts-Zusammenfassung
     */
    async generateUserActivitySummary(startDate, endDate, tenantId) {
        try {
            // Gesamtnutzer
            const totalUsers = await this.prisma.user.count({
                where: {
                    createdAt: {
                        lte: endDate
                    }
                }
            });
            // Aktive Nutzer (mit mindestens einem Login im Zeitraum)
            const activeUserIds = await this.prisma.auditLog.findMany({
                where: {
                    eventType: 'user_login',
                    result: 'success',
                    timestamp: {
                        gte: startDate,
                        lte: endDate
                    },
                    ...(tenantId && { tenantId })
                },
                select: {
                    userId: true
                },
                distinct: ['userId']
            });
            const activeUsers = activeUserIds.filter(u => u.userId).length;
            // Neue Nutzer
            const newUsers = await this.prisma.user.count({
                where: {
                    createdAt: {
                        gte: startDate,
                        lte: endDate
                    }
                }
            });
            // Gelöschte Nutzer
            const deletedUsers = await this.prisma.auditLog.count({
                where: {
                    eventType: 'gdpr_data_deletion',
                    timestamp: {
                        gte: startDate,
                        lte: endDate
                    },
                    ...(tenantId && { tenantId })
                }
            });
            // Durchschnittliche Session-Dauer (simuliert)
            const averageSessionDuration = 25; // Minuten
            // Top-Aktivitäten
            const topActivitiesRaw = await this.prisma.auditLog.groupBy({
                by: ['eventType'],
                where: {
                    timestamp: {
                        gte: startDate,
                        lte: endDate
                    },
                    ...(tenantId && { tenantId })
                },
                _count: true,
                orderBy: {
                    _count: {
                        eventType: 'desc'
                    }
                },
                take: 10
            });
            const topActivities = topActivitiesRaw.map(item => ({
                activity: item.eventType,
                count: item._count
            }));
            return {
                totalUsers,
                activeUsers,
                newUsers,
                deletedUsers,
                averageSessionDuration,
                topActivities
            };
        }
        catch (error) {
            logger_1.logger.error('Failed to generate user activity summary:', error);
            throw error;
        }
    }
    /**
     * Exportiert Report als PDF (Platzhalter für PDF-Generierung)
     */
    async exportReportAsPDF(report) {
        // In echter Implementierung würde man hier eine PDF-Bibliothek wie pdfkit verwenden
        logger_1.logger.info('Exporting compliance report as PDF');
        const reportText = JSON.stringify(report, null, 2);
        return Buffer.from(reportText, 'utf-8');
    }
    /**
     * Exportiert Report als CSV
     */
    async exportReportAsCSV(report) {
        const lines = [];
        // Header
        lines.push('Compliance Report');
        lines.push(`Generated: ${report.generatedAt.toISOString()}`);
        lines.push(`Period: ${report.period.startDate.toISOString()} - ${report.period.endDate.toISOString()}`);
        lines.push('');
        // Statistics
        lines.push('Statistics');
        lines.push('Metric,Value');
        lines.push(`Total Events,${report.statistics.totalEvents}`);
        lines.push(`Failed Operations,${report.statistics.failedOperations}`);
        lines.push(`Security Incidents,${report.statistics.securityIncidents}`);
        lines.push(`GDPR Requests,${report.statistics.gdprRequests}`);
        lines.push('');
        // GDPR Compliance
        lines.push('GDPR Compliance');
        lines.push('Metric,Value');
        lines.push(`Compliance Score,${report.gdprCompliance.complianceScore}`);
        lines.push(`Access Requests,${report.gdprCompliance.dataSubjectRequests.accessRequests}`);
        lines.push(`Deletion Requests,${report.gdprCompliance.dataSubjectRequests.deletionRequests}`);
        lines.push(`Average Response Time (hours),${report.gdprCompliance.dataSubjectRequests.averageResponseTime}`);
        lines.push('');
        // Security Metrics
        lines.push('Security Metrics');
        lines.push('Metric,Value');
        lines.push(`Failed Logins,${report.securityMetrics.metrics.failedLogins}`);
        lines.push(`Unauthorized Access,${report.securityMetrics.metrics.unauthorizedAccess}`);
        lines.push(`Suspicious Activity,${report.securityMetrics.metrics.suspiciousActivity}`);
        lines.push(`Anomalies Detected,${report.securityMetrics.metrics.anomaliesDetected}`);
        return lines.join('\n');
    }
    /**
     * Sendet Report per E-Mail (Platzhalter)
     */
    async sendReportByEmail(report, recipients) {
        logger_1.logger.info(`Sending compliance report to ${recipients.join(', ')}`);
        // In echter Implementierung würde man hier den EmailService verwenden
    }
}
exports.ComplianceReportingService = ComplianceReportingService;
