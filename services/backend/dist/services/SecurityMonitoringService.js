"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SecurityMonitoringService = void 0;
const logger_1 = require("../utils/logger");
const AuditService_1 = require("./AuditService");
class SecurityMonitoringService {
    constructor(prisma, auditService, alertManager) {
        this.alerts = [];
        this.prisma = prisma;
        this.auditService = auditService;
        this.alertManager = alertManager;
    }
    /**
     * Startet kontinuierliches Security-Monitoring
     */
    async startMonitoring(intervalMinutes = 5) {
        logger_1.logger.info(`Starting security monitoring with ${intervalMinutes} minute interval`);
        // Initiales Monitoring
        await this.performSecurityCheck();
        // Periodisches Monitoring
        setInterval(async () => {
            try {
                await this.performSecurityCheck();
            }
            catch (error) {
                logger_1.logger.error('Security monitoring check failed:', error);
            }
        }, intervalMinutes * 60 * 1000);
    }
    /**
     * Führt eine Security-Überprüfung durch
     */
    async performSecurityCheck() {
        const newAlerts = [];
        try {
            // 1. Prüfe auf fehlgeschlagene Login-Versuche
            const failedLogins = await this.detectFailedLogins();
            newAlerts.push(...failedLogins);
            this.alerts.push(...failedLogins);
            // 2. Prüfe auf verdächtige Login-Muster
            const suspiciousLogins = await this.detectSuspiciousLogins();
            newAlerts.push(...suspiciousLogins);
            this.alerts.push(...suspiciousLogins);
            // 3. Prüfe auf ungewöhnliche Datenzugriffe
            const unusualAccess = await this.detectUnusualDataAccess();
            newAlerts.push(...unusualAccess);
            this.alerts.push(...unusualAccess);
            // 4. Prüfe auf Rate-Limit-Überschreitungen
            const rateLimitViolations = await this.detectRateLimitViolations();
            newAlerts.push(...rateLimitViolations);
            this.alerts.push(...rateLimitViolations);
            // Sende Alerts an den AlertManager
            for (const securityAlert of newAlerts) {
                // Konvertiere SecurityAlert zu einem vom AlertManager verarbeitbaren Format
                this.alertManager.createAlertFromSecurityAlert(securityAlert);
            }
            // Logge neue Alerts
            if (newAlerts.length > 0) {
                logger_1.logger.warn(`Security monitoring detected ${newAlerts.length} new alerts`);
                // Logge kritische Alerts sofort
                const criticalAlerts = newAlerts.filter(a => a.severity === 'critical');
                if (criticalAlerts.length > 0) {
                    logger_1.logger.error(`CRITICAL: ${criticalAlerts.length} critical security alerts detected!`);
                }
            }
            return newAlerts;
        }
        catch (error) {
            logger_1.logger.error('Failed to perform security check:', error);
            return [];
        }
    }
    /**
     * Erkennt fehlgeschlagene Login-Versuche
     */
    async detectFailedLogins() {
        const alerts = [];
        const since = new Date(Date.now() - 60 * 60 * 1000); // Letzte Stunde
        try {
            // Finde Nutzer mit vielen fehlgeschlagenen Logins
            const failedLogins = await this.prisma.auditLog.groupBy({
                by: ['userId'],
                where: {
                    eventType: AuditService_1.AuditEventType.FAILED_LOGIN,
                    timestamp: { gte: since }
                },
                _count: true,
                having: {
                    userId: {
                        _count: {
                            gte: 5
                        }
                    }
                }
            });
            for (const group of failedLogins) {
                if (group.userId) {
                    alerts.push({
                        id: `alert-${Date.now()}-${group.userId}`,
                        timestamp: new Date(),
                        severity: 'high',
                        type: 'multiple_failed_logins',
                        description: `Nutzer ${group.userId} hatte ${group._count} fehlgeschlagene Login-Versuche in der letzten Stunde`,
                        affectedUserId: group.userId,
                        recommendations: [
                            'Überprüfen Sie, ob es sich um einen Brute-Force-Angriff handelt',
                            'Erwägen Sie, das Konto temporär zu sperren',
                            'Kontaktieren Sie den Nutzer zur Verifizierung'
                        ],
                        acknowledged: false
                    });
                }
            }
            // Erkenne Brute-Force-Muster (viele Versuche in kurzer Zeit)
            const bruteForceWindow = new Date(Date.now() - 15 * 60 * 1000); // Letzte 15 Minuten
            const bruteForceAttempts = await this.prisma.auditLog.groupBy({
                by: ['ipAddress'],
                where: {
                    eventType: AuditService_1.AuditEventType.FAILED_LOGIN,
                    timestamp: { gte: bruteForceWindow }
                },
                _count: true,
                having: {
                    ipAddress: {
                        _count: {
                            gte: 10
                        }
                    }
                }
            });
            for (const group of bruteForceAttempts) {
                if (group.ipAddress) {
                    alerts.push({
                        id: `alert-${Date.now()}-${group.ipAddress}-bruteforce`,
                        timestamp: new Date(),
                        severity: 'critical',
                        type: 'brute_force_attack',
                        description: `IP-Adresse ${group.ipAddress} hatte ${group._count} fehlgeschlagene Login-Versuche in den letzten 15 Minuten`,
                        recommendations: [
                            'Blockieren Sie die IP-Adresse temporär',
                            'Implementieren Sie CAPTCHA für Login-Versuche',
                            'Überprüfen Sie die Logs auf verdächtige Aktivitäten'
                        ],
                        acknowledged: false
                    });
                }
            }
        }
        catch (error) {
            logger_1.logger.error('Failed to detect suspicious logins:', error);
        }
        return alerts;
    }
    /**
     * Erkennt verdächtige Login-Muster
     */
    async detectSuspiciousLogins() {
        const alerts = [];
        const since = new Date(Date.now() - 24 * 60 * 60 * 1000); // Letzte 24 Stunden
        try {
            // Erkenne ungewöhnliche geografische Login-Muster
            const userLogins = await this.prisma.auditLog.findMany({
                where: {
                    eventType: AuditService_1.AuditEventType.FAILED_LOGIN,
                    timestamp: { gte: since }
                },
                select: {
                    userId: true,
                    ipAddress: true,
                    metadata: true,
                    timestamp: true
                }
            });
            // Gruppiere Logins nach Benutzer
            const loginsByUser = {};
            for (const login of userLogins) {
                const userId = login.userId || 'anonymous';
                if (!loginsByUser[userId]) {
                    loginsByUser[userId] = [];
                }
                loginsByUser[userId].push(login);
            }
            // Analysiere jedes Benutzerprofil auf verdächtige Muster
            for (const [userId, userLogins] of Object.entries(loginsByUser)) {
                if (userId === 'anonymous')
                    continue;
                // Erkenne Logins von verschiedenen Ländern innerhalb kurzer Zeit
                const countries = {};
                for (const login of userLogins) {
                    if (login.metadata && login.metadata.country) {
                        const country = login.metadata.country;
                        if (!countries[country]) {
                            countries[country] = [];
                        }
                        countries[country].push(login.timestamp);
                    }
                }
                // Wenn Logins aus mehr als 3 Ländern innerhalb von 1 Stunde
                if (Object.keys(countries).length > 3) {
                    const firstLogin = userLogins[0].timestamp;
                    const lastLogin = userLogins[userLogins.length - 1].timestamp;
                    const timeDiff = lastLogin.getTime() - firstLogin.getTime();
                    if (timeDiff < 60 * 60 * 1000) { // 1 Stunde
                        alerts.push({
                            id: `alert-${Date.now()}-${userId}-geo`,
                            timestamp: new Date(),
                            severity: 'high',
                            type: 'suspicious_geo_login',
                            description: `Nutzer ${userId} hat sich aus ${Object.keys(countries).length} verschiedenen Ländern innerhalb einer Stunde angemeldet`,
                            affectedUserId: userId,
                            recommendations: [
                                'Überprüfen Sie die geografischen Login-Muster',
                                'Erwägen Sie zusätzliche Authentifizierung',
                                'Kontaktieren Sie den Nutzer zur Verifizierung'
                            ],
                            acknowledged: false
                        });
                    }
                }
            }
            // Erkenne mögliche Credential Stuffing Angriffe
            const credentialStuffingWindow = new Date(Date.now() - 5 * 60 * 1000); // Letzte 5 Minuten
            const credentialStuffingAttempts = await this.prisma.auditLog.groupBy({
                by: ['ipAddress'],
                where: {
                    eventType: AuditService_1.AuditEventType.FAILED_LOGIN,
                    timestamp: { gte: credentialStuffingWindow }
                },
                _count: true,
                having: {
                    ipAddress: {
                        _count: {
                            gte: 50
                        }
                    }
                }
            });
            for (const group of credentialStuffingAttempts) {
                if (group.ipAddress) {
                    alerts.push({
                        id: `alert-${Date.now()}-${group.ipAddress}-credential-stuffing`,
                        timestamp: new Date(),
                        severity: 'critical',
                        type: 'credential_stuffing',
                        description: `IP-Adresse ${group.ipAddress} hatte ${group._count} fehlgeschlagene Login-Versuche in den letzten 5 Minuten`,
                        recommendations: [
                            'Blockieren Sie die IP-Adresse temporär',
                            'Implementieren Sie CAPTCHA für Login-Versuche',
                            'Überprüfen Sie die Logs auf verdächtige Aktivitäten'
                        ],
                        acknowledged: false
                    });
                }
            }
        }
        catch (error) {
            logger_1.logger.error('Failed to detect suspicious logins:', error);
        }
        return alerts;
    }
    /**
     * Erkennt ungewöhnliche Datenzugriffe
     */
    async detectUnusualDataAccess() {
        const alerts = [];
        const since = new Date(Date.now() - 60 * 60 * 1000);
        try {
            // Finde Nutzer mit ungewöhnlich vielen Datenzugriffen
            const dataAccesses = await this.prisma.auditLog.groupBy({
                by: ['userId'],
                where: {
                    eventType: {
                        in: [AuditService_1.AuditEventType.DATA_READ, AuditService_1.AuditEventType.DATA_EXPORT]
                    },
                    timestamp: { gte: since }
                },
                _count: true,
                having: {
                    userId: {
                        _count: {
                            gte: 100
                        }
                    }
                }
            });
            for (const group of dataAccesses) {
                if (group.userId) {
                    alerts.push({
                        id: `alert-${Date.now()}-${group.userId}`,
                        timestamp: new Date(),
                        severity: 'medium',
                        type: 'excessive_data_access',
                        description: `Nutzer ${group.userId} hatte ${group._count} Datenzugriffe in der letzten Stunde`,
                        affectedUserId: group.userId,
                        recommendations: [
                            'Überprüfen Sie die Zugriffsmuster des Nutzers',
                            'Prüfen Sie, ob es sich um legitime Aktivitäten handelt',
                            'Erwägen Sie Rate-Limiting für diesen Nutzer'
                        ],
                        acknowledged: false
                    });
                }
            }
            // Erkenne mögliche Datenexfiltration
            const exportWindow = new Date(Date.now() - 30 * 60 * 1000); // Letzte 30 Minuten
            const dataExports = await this.prisma.auditLog.groupBy({
                by: ['userId'],
                where: {
                    eventType: AuditService_1.AuditEventType.DATA_EXPORT,
                    timestamp: { gte: exportWindow }
                },
                _count: true,
                having: {
                    userId: {
                        _count: {
                            gte: 10
                        }
                    }
                }
            });
            for (const group of dataExports) {
                if (group.userId) {
                    alerts.push({
                        id: `alert-${Date.now()}-${group.userId}-exfiltration`,
                        timestamp: new Date(),
                        severity: 'high',
                        type: 'potential_data_exfiltration',
                        description: `Nutzer ${group.userId} führte ${group._count} Datenexporte in den letzten 30 Minuten durch`,
                        affectedUserId: group.userId,
                        recommendations: [
                            'Überprüfen Sie die exportierten Daten',
                            'Prüfen Sie auf Datenlecks',
                            'Kontaktieren Sie den Nutzer sofort'
                        ],
                        acknowledged: false
                    });
                }
            }
            // Erkenne Zugriffe auf sensible Dokumente
            const sensitiveDocuments = await this.prisma.auditLog.findMany({
                where: {
                    eventType: AuditService_1.AuditEventType.DATA_READ,
                    timestamp: { gte: since },
                    resourceId: {
                        in: [
                            'confidential_contract',
                            'personal_data',
                            'financial_records',
                            'legal_strategy'
                        ]
                    }
                },
                select: {
                    userId: true,
                    resourceId: true,
                    ipAddress: true
                }
            });
            // Gruppiere Zugriffe nach Benutzer
            const accessesByUser = {};
            for (const access of sensitiveDocuments) {
                const userId = access.userId || 'anonymous';
                if (!accessesByUser[userId]) {
                    accessesByUser[userId] = [];
                }
                accessesByUser[userId].push(access);
            }
            // Erkenne ungewöhnliche Zugriffe auf sensible Dokumente
            for (const [userId, accesses] of Object.entries(accessesByUser)) {
                if (accesses.length > 5) {
                    alerts.push({
                        id: `alert-${Date.now()}-${userId}-sensitive`,
                        timestamp: new Date(),
                        severity: 'high',
                        type: 'sensitive_document_access',
                        description: `Nutzer ${userId} hat auf ${accesses.length} sensible Dokumente zugegriffen`,
                        affectedUserId: userId,
                        recommendations: [
                            'Überprüfen Sie die Zugriffe auf sensible Dokumente',
                            'Prüfen Sie, ob der Zugriff berechtigt ist',
                            'Erwägen Sie zusätzliche Zugriffskontrollen'
                        ],
                        acknowledged: false
                    });
                }
            }
        }
        catch (error) {
            logger_1.logger.error('Failed to detect unusual data access:', error);
        }
        return alerts;
    }
    /**
     * Erkennt Rate-Limit-Überschreitungen
     */
    async detectRateLimitViolations() {
        const alerts = [];
        const since = new Date(Date.now() - 15 * 60 * 1000); // Letzte 15 Minuten
        try {
            const violations = await this.prisma.auditLog.findMany({
                where: {
                    eventType: AuditService_1.AuditEventType.RATE_LIMIT_EXCEEDED,
                    timestamp: { gte: since }
                },
                distinct: ['userId', 'ipAddress']
            });
            for (const violation of violations) {
                alerts.push({
                    id: `alert-${Date.now()}-${violation.userId || violation.ipAddress}`,
                    timestamp: new Date(),
                    severity: 'low',
                    type: 'rate_limit_exceeded',
                    description: `Rate-Limit überschritten für ${violation.userId ? `Nutzer ${violation.userId}` : `IP ${violation.ipAddress}`}`,
                    affectedUserId: violation.userId || undefined,
                    recommendations: [
                        'Überprüfen Sie, ob es sich um legitimen Traffic handelt',
                        'Erwägen Sie, die Rate-Limits anzupassen',
                        'Blockieren Sie die IP-Adresse bei wiederholten Verstößen'
                    ],
                    acknowledged: false
                });
            }
            // Erkenne mögliche DDoS-Angriffe
            const ddosWindow = new Date(Date.now() - 5 * 60 * 1000); // Letzte 5 Minuten
            const ddosViolations = await this.prisma.auditLog.groupBy({
                by: ['ipAddress'],
                where: {
                    eventType: AuditService_1.AuditEventType.RATE_LIMIT_EXCEEDED,
                    timestamp: { gte: ddosWindow }
                },
                _count: true,
                having: {
                    ipAddress: {
                        _count: {
                            gte: 100
                        }
                    }
                }
            });
            for (const group of ddosViolations) {
                if (group.ipAddress) {
                    alerts.push({
                        id: `alert-${Date.now()}-${group.ipAddress}-ddos`,
                        timestamp: new Date(),
                        severity: 'critical',
                        type: 'potential_ddos',
                        description: `IP-Adresse ${group.ipAddress} überschritt Rate-Limit ${group._count} Mal in den letzten 5 Minuten`,
                        recommendations: [
                            'Blockieren Sie die IP-Adresse sofort',
                            'Implementieren Sie zusätzliche DDoS-Schutzmaßnahmen',
                            'Überprüfen Sie die Netzwerkinfrastruktur'
                        ],
                        acknowledged: false
                    });
                }
            }
        }
        catch (error) {
            logger_1.logger.error('Failed to detect rate limit violations:', error);
        }
        return alerts;
    }
    /**
     * Erstellt einen Alert aus einer Anomalie
     */
    createAlertFromAnomaly(anomaly) {
        return {
            id: `alert-${Date.now()}-${anomaly.anomalyType}`,
            timestamp: new Date(),
            severity: anomaly.severity,
            type: anomaly.anomalyType || 'unknown',
            description: anomaly.description,
            affectedUserId: anomaly.affectedUserId,
            affectedTenantId: anomaly.affectedTenantId,
            recommendations: this.getRecommendationsForAnomalyType(anomaly.anomalyType || ''),
            acknowledged: false
        };
    }
    /**
     * Gibt Empfehlungen für einen Anomalie-Typ zurück
     */
    getRecommendationsForAnomalyType(anomalyType) {
        const recommendations = {
            multiple_failed_logins: [
                'Überprüfen Sie die Login-Versuche',
                'Erwägen Sie eine temporäre Kontosperre',
                'Kontaktieren Sie den Nutzer'
            ],
            excessive_data_access: [
                'Überprüfen Sie die Zugriffsmuster',
                'Prüfen Sie auf Datenexfiltration',
                'Implementieren Sie zusätzliche Zugriffskontrollen'
            ],
            multiple_ip_addresses: [
                'Überprüfen Sie die IP-Adressen',
                'Prüfen Sie auf Account-Sharing',
                'Erwägen Sie zusätzliche Authentifizierung'
            ],
            off_hours_activity: [
                'Überprüfen Sie die Aktivitäten',
                'Kontaktieren Sie den Nutzer zur Verifizierung',
                'Prüfen Sie auf kompromittierte Accounts'
            ],
            multiple_data_exports: [
                'Überprüfen Sie die exportierten Daten',
                'Prüfen Sie auf Datenlecks',
                'Kontaktieren Sie den Nutzer sofort'
            ]
        };
        return recommendations[anomalyType] || ['Überprüfen Sie die Aktivität manuell'];
    }
    /**
     * Gibt alle aktiven Alerts zurück
     */
    getActiveAlerts(severity) {
        let alerts = this.alerts.filter(a => !a.acknowledged);
        if (severity) {
            alerts = alerts.filter(a => a.severity === severity);
        }
        return alerts.sort((a, b) => {
            const severityOrder = { critical: 4, high: 3, medium: 2, low: 1 };
            return severityOrder[b.severity] - severityOrder[a.severity];
        });
    }
    /**
     * Bestätigt einen Alert
     */
    acknowledgeAlert(alertId) {
        const alert = this.alerts.find(a => a.id === alertId);
        if (alert) {
            alert.acknowledged = true;
            logger_1.logger.info(`Alert ${alertId} acknowledged`);
            return true;
        }
        return false;
    }
    /**
     * Generiert Security-Metriken
     */
    async generateSecurityMetrics(startDate, endDate) {
        try {
            const where = {
                timestamp: {
                    gte: startDate,
                    lte: endDate
                }
            };
            // Gesamtanzahl Events
            const totalEvents = await this.prisma.auditLog.count({ where });
            // Fehlgeschlagene Logins
            const failedLogins = await this.prisma.auditLog.count({
                where: {
                    ...where,
                    eventType: AuditService_1.AuditEventType.FAILED_LOGIN
                }
            });
            // Unberechtigte Zugriffe
            const unauthorizedAccess = await this.prisma.auditLog.count({
                where: {
                    ...where,
                    eventType: AuditService_1.AuditEventType.UNAUTHORIZED_ACCESS
                }
            });
            // Verdächtige Aktivitäten
            const suspiciousActivity = await this.prisma.auditLog.count({
                where: {
                    ...where,
                    eventType: AuditService_1.AuditEventType.SUSPICIOUS_ACTIVITY
                }
            });
            // Datenexporte
            const dataExports = await this.prisma.auditLog.count({
                where: {
                    ...where,
                    eventType: {
                        in: [AuditService_1.AuditEventType.DATA_EXPORT, AuditService_1.AuditEventType.GDPR_DATA_EXPORT]
                    }
                }
            });
            // DSGVO-Anfragen
            const gdprRequests = await this.prisma.auditLog.count({
                where: {
                    ...where,
                    eventType: {
                        in: [
                            AuditService_1.AuditEventType.GDPR_DATA_EXPORT,
                            AuditService_1.AuditEventType.GDPR_DATA_DELETION,
                            AuditService_1.AuditEventType.GDPR_DATA_CORRECTION
                        ]
                    }
                }
            });
            // Top-Nutzer nach Event-Anzahl
            const topUsersRaw = await this.prisma.auditLog.groupBy({
                by: ['userId'],
                where: {
                    ...where,
                    userId: { not: null }
                },
                _count: true,
                orderBy: {
                    _count: {
                        userId: 'desc'
                    }
                },
                take: 10
            });
            const topUsers = await Promise.all(topUsersRaw.map(async (user) => {
                if (!user.userId)
                    return null;
                const totalCount = user._count;
                const failureCount = await this.prisma.auditLog.count({
                    where: {
                        ...where,
                        userId: user.userId,
                        result: 'failure'
                    }
                });
                return {
                    userId: user.userId,
                    eventCount: totalCount,
                    failureRate: totalCount > 0 ? failureCount / totalCount : 0
                };
            })).then(results => results.filter(r => r !== null));
            // Top-Ressourcen nach Zugriffszahl
            const topResourcesRaw = await this.prisma.auditLog.groupBy({
                by: ['resourceType', 'resourceId'],
                where: {
                    ...where,
                    resourceType: { not: null },
                    resourceId: { not: null }
                },
                _count: true,
                orderBy: {
                    _count: {
                        resourceType: 'desc'
                    }
                },
                take: 10
            });
            const topResources = topResourcesRaw
                .filter(r => r.resourceType && r.resourceId)
                .map(r => ({
                resourceType: r.resourceType,
                resourceId: r.resourceId,
                accessCount: r._count
            }));
            // Anzahl erkannter Anomalien
            const anomaliesDetected = this.alerts.filter(a => a.timestamp >= startDate && a.timestamp <= endDate).length;
            return {
                timestamp: new Date(),
                period: { startDate, endDate },
                metrics: {
                    totalEvents,
                    failedLogins,
                    unauthorizedAccess,
                    suspiciousActivity,
                    dataExports,
                    gdprRequests,
                    anomaliesDetected
                },
                topUsers,
                topResources
            };
        }
        catch (error) {
            logger_1.logger.error('Failed to generate security metrics:', error);
            throw new Error('Failed to generate security metrics');
        }
    }
    /**
     * Bereinigt alte Alerts
     */
    cleanupOldAlerts(retentionDays = 30) {
        const cutoffDate = new Date(Date.now() - retentionDays * 24 * 60 * 60 * 1000);
        const initialCount = this.alerts.length;
        this.alerts = this.alerts.filter(a => a.timestamp >= cutoffDate);
        const removedCount = initialCount - this.alerts.length;
        if (removedCount > 0) {
            logger_1.logger.info(`Cleaned up ${removedCount} old security alerts`);
        }
        return removedCount;
    }
}
exports.SecurityMonitoringService = SecurityMonitoringService;
