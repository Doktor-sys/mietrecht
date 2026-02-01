"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GDPRComplianceService = void 0;
const logger_1 = require("../utils/logger");
class GDPRComplianceService {
    constructor(prisma, encryptionService) {
        this.prisma = prisma;
        this.encryptionService = encryptionService;
    }
    /**
     * Fordert Datenexport gemäß Art. 20 DSGVO an
     */
    async requestDataExport(request) {
        try {
            const { userId, format } = request;
            // Log the export request
            const requestId = `export-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
            await this.logDataExport(userId, requestId);
            // Collect user data
            const userData = await this.collectUserData(request);
            // Format data according to requested format
            const formattedData = await this.formatExportData(userData, format);
            logger_1.logger.info('Data export completed', { userId, requestId, format });
            return formattedData;
        }
        catch (error) {
            logger_1.logger.error('Data export failed:', error);
            throw new Error('Data export failed');
        }
    }
    /**
     * Fordert Datenlöschung gemäß Art. 17 DSGVO an
     */
    async requestDataDeletion(request) {
        try {
            const { userId, reason, immediate = false } = request;
            // Log the deletion request
            const requestId = `deletion-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
            await this.logDataDeletion(userId, requestId, reason);
            if (immediate) {
                // Immediate deletion (only for non-critical data)
                await this.performImmediateDeletion(userId);
            }
            else {
                // Mark for deletion and schedule
                await this.scheduleDeletion(userId, reason);
            }
            logger_1.logger.info('Data deletion requested', { userId, requestId, immediate });
        }
        catch (error) {
            logger_1.logger.error('Data deletion failed:', error);
            throw new Error('Data deletion failed');
        }
    }
    /**
     * Verwaltet Einwilligungen gemäß Art. 7 DSGVO
     */
    async manageConsent(userId, consent) {
        try {
            // Update user preferences
            const updatedPreferences = await this.prisma.userPreferences.update({
                where: { userId },
                data: {
                    privacy: {
                        dataProcessing: consent.dataProcessing,
                        analytics: consent.analytics,
                        marketing: consent.marketing,
                        thirdPartySharing: consent.thirdPartySharing
                    }
                }
            });
            // Create consent object with current timestamp
            const consentRecord = {
                userId,
                dataProcessing: consent.dataProcessing,
                analytics: consent.analytics,
                marketing: consent.marketing,
                thirdPartySharing: consent.thirdPartySharing,
                updatedAt: new Date()
            };
            // Log consent change
            await this.logConsentChange(consentRecord);
            logger_1.logger.info('Consent updated', { userId });
            return consentRecord;
        }
        catch (error) {
            logger_1.logger.error('Failed to manage consent:', error);
            throw new Error('Failed to update consent');
        }
    }
    /**
     * Ruft aktuelle Einwilligungen ab
     */
    async getConsent(userId) {
        try {
            const preferences = await this.prisma.userPreferences.findUnique({
                where: { userId }
            });
            if (!preferences) {
                return null;
            }
            const privacy = preferences.privacy;
            return {
                userId,
                dataProcessing: privacy.dataProcessing || false,
                analytics: privacy.analytics || false,
                marketing: privacy.marketing || false,
                thirdPartySharing: privacy.thirdPartySharing || false,
                updatedAt: new Date() // Use current time since there's no updatedAt field in UserPreferences
            };
        }
        catch (error) {
            logger_1.logger.error('Failed to get consent:', error);
            throw new Error('Failed to retrieve consent');
        }
    }
    /**
     * Prüft ob Nutzer Einwilligung für bestimmte Verarbeitung gegeben hat
     */
    async hasConsent(userId, type) {
        try {
            const consent = await this.getConsent(userId);
            return consent ? consent[type] : false;
        }
        catch (error) {
            logger_1.logger.error('Failed to check consent:', error);
            return false;
        }
    }
    /**
     * Private Hilfsmethoden
     */
    async collectUserData(request) {
        const { userId, includeDocuments, includeMessages, includeAnalytics } = request;
        const data = {
            user: await this.prisma.user.findUnique({
                where: { id: userId },
                include: {
                    profile: true,
                    preferences: true
                }
            }),
            cases: await this.prisma.case.findMany({
                where: { userId },
                include: {
                    messages: includeMessages !== false,
                    documents: includeDocuments !== false
                }
            })
        };
        if (includeDocuments !== false) {
            data.documents = await this.prisma.document.findMany({
                where: { userId },
                include: {
                    analysis: true
                }
            });
        }
        if (includeAnalytics !== false) {
            // Basic analytics data collection
            data.analytics = {
                totalCases: data.cases.length,
                totalDocuments: data.documents?.length || 0,
                lastActive: data.user?.updatedAt
            };
        }
        return data;
    }
    async formatExportData(data, format) {
        switch (format) {
            case 'json':
                return JSON.stringify(data, null, 2);
            case 'csv':
                return this.convertToCSV(data);
            case 'pdf':
                return this.generatePDFReport(data);
            default:
                return data;
        }
    }
    convertToCSV(data) {
        const lines = [];
        // User-Daten
        if (data.user) {
            lines.push('User Data');
            lines.push(`ID,Email,Type,Created,Active`);
            lines.push(`${data.user.id},${data.user.email},${data.user.userType},${data.user.createdAt},${data.user.isActive}`);
            lines.push('');
        }
        // Cases
        if (data.cases && data.cases.length > 0) {
            lines.push('Cases');
            lines.push(`ID,Title,Category,Status,Created,Messages Count`);
            data.cases.forEach((c) => {
                lines.push(`${c.id},"${c.title}",${c.category},${c.status},${c.createdAt},${c.messages?.length || 0}`);
            });
            lines.push('');
        }
        // Documents
        if (data.documents && data.documents.length > 0) {
            lines.push('Documents');
            lines.push(`ID,Filename,Type,Size,Uploaded,Encrypted`);
            data.documents.forEach((d) => {
                lines.push(`${d.id},"${d.originalName}",${d.documentType},${d.size},${d.uploadedAt},${!!d.encryptionKeyId}`);
            });
        }
        return lines.join('\n');
    }
    async generatePDFReport(data) {
        // Placeholder for PDF generation
        // In a real implementation, we would use pdfkit or similar
        return `GDPR Data Export Report
    
User: ${data.user?.email}
Date: ${new Date().toISOString()}

This is a text representation of the requested data.
PDF generation is currently not available in this environment.

Summary:
- Cases: ${data.cases?.length || 0}
- Documents: ${data.documents?.length || 0}

${this.convertToCSV(data)}
`;
    }
    async performImmediateDeletion(userId) {
        // Delete non-critical data immediately
        // Critical data like legal cases are retained for compliance
        // Delete user profile
        await this.prisma.userProfile.deleteMany({
            where: { userId }
        });
        // Delete user preferences
        await this.prisma.userPreferences.deleteMany({
            where: { userId }
        });
        // Anonymize user data
        await this.anonymizeUserData(userId);
        logger_1.logger.info('Immediate data deletion completed', { userId });
    }
    async scheduleDeletion(userId, reason) {
        // Mark user for deletion (soft delete pattern)
        await this.prisma.user.update({
            where: { id: userId },
            data: {
                isActive: false,
                // Store deletion request metadata
                email: `scheduled-for-deletion-${userId}@deleted.local`
            }
        });
        logger_1.logger.info('Data deletion scheduled', { userId, reason });
    }
    async anonymizeUserData(userId) {
        // Anonymisiere persönliche Daten, behalte aber statistische Daten
        await this.prisma.user.update({
            where: { id: userId },
            data: {
                email: `anonymized-${userId}@deleted.local`,
                isActive: false
            }
        });
        await this.prisma.userProfile.updateMany({
            where: { userId },
            data: {
                firstName: 'Anonymized',
                lastName: 'User',
                location: null
            }
        });
        logger_1.logger.info('User data anonymized', { userId });
    }
    async logDataExport(userId, requestId) {
        try {
            await this.prisma.auditLog.create({
                data: {
                    userId,
                    eventType: 'DATA_EXPORT',
                    action: 'export_data',
                    result: 'success',
                    metadata: { requestId },
                    timestamp: new Date(),
                    hmacSignature: this.generateHmacSignature(JSON.stringify({
                        userId,
                        eventType: 'DATA_EXPORT',
                        action: 'export_data',
                        result: 'success',
                        metadata: { requestId },
                        timestamp: new Date()
                    }))
                }
            });
        }
        catch (error) {
            logger_1.logger.warn('Failed to log data export:', error);
        }
    }
    async logDataDeletion(userId, requestId, reason) {
        try {
            await this.prisma.auditLog.create({
                data: {
                    userId,
                    eventType: 'DATA_DELETION',
                    action: 'delete_data',
                    result: 'success',
                    metadata: { requestId, reason },
                    timestamp: new Date(),
                    hmacSignature: this.generateHmacSignature(JSON.stringify({
                        userId,
                        eventType: 'DATA_DELETION',
                        action: 'delete_data',
                        result: 'success',
                        metadata: { requestId, reason },
                        timestamp: new Date()
                    }))
                }
            });
        }
        catch (error) {
            logger_1.logger.warn('Failed to log data deletion:', error);
        }
    }
    async logConsentChange(consent) {
        try {
            await this.prisma.auditLog.create({
                data: {
                    userId: consent.userId,
                    eventType: 'CONSENT_UPDATED',
                    action: 'update_consent',
                    result: 'success',
                    metadata: {
                        dataProcessing: consent.dataProcessing,
                        analytics: consent.analytics,
                        marketing: consent.marketing,
                        thirdPartySharing: consent.thirdPartySharing
                    },
                    timestamp: new Date(),
                    hmacSignature: this.generateHmacSignature(JSON.stringify({
                        userId: consent.userId,
                        eventType: 'CONSENT_UPDATED',
                        action: 'update_consent',
                        result: 'success',
                        metadata: {
                            dataProcessing: consent.dataProcessing,
                            analytics: consent.analytics,
                            marketing: consent.marketing,
                            thirdPartySharing: consent.thirdPartySharing
                        },
                        timestamp: new Date()
                    }))
                }
            });
        }
        catch (error) {
            logger_1.logger.warn('Failed to log consent change:', error);
        }
    }
    generateHmacSignature(data) {
        // Simple placeholder implementation
        // In a real implementation, this would use crypto to generate a proper HMAC
        return 'placeholder-hmac-signature';
    }
    /**
     * Berechnet die Consent-Rate (Prozentsatz der Nutzer mit aktiver Einwilligung)
     */
    async calculateConsentRate() {
        try {
            const totalUsers = await this.prisma.user.count({ where: { isActive: true } });
            if (totalUsers === 0)
                return 0;
            const usersWithConsent = await this.prisma.userPreferences.count({
                where: {
                    user: { isActive: true },
                    privacy: {
                        path: ['dataProcessing'],
                        equals: true
                    }
                }
            });
            return Math.round((usersWithConsent / totalUsers) * 100);
        }
        catch (error) {
            logger_1.logger.warn('Failed to calculate consent rate:', error);
            return 0;
        }
    }
    /**
     * Generiert GDPR-Compliance-Report
     */
    async generateComplianceReport(organizationId) {
        try {
            const report = {
                generatedAt: new Date(),
                organizationId,
                summary: {
                    totalUsers: await this.prisma.user.count(),
                    activeUsers: await this.prisma.user.count({ where: { isActive: true } }),
                    dataExportRequests: await this.prisma.auditLog.count({ where: { eventType: 'DATA_EXPORT' } }),
                    dataDeletionRequests: await this.prisma.auditLog.count({ where: { eventType: 'DATA_DELETION' } }),
                    consentRate: await this.calculateConsentRate()
                },
                dataRetention: {
                    documentsStored: await this.prisma.document.count(),
                    oldestDocument: await this.prisma.document.findFirst({
                        orderBy: { uploadedAt: 'asc' },
                        select: { uploadedAt: true }
                    }),
                    retentionPolicy: '7 years as per German law'
                },
                security: {
                    encryptionEnabled: !!this.encryptionService,
                    auditLogsEnabled: true
                }
            };
            return report;
        }
        catch (error) {
            logger_1.logger.error('Failed to generate compliance report:', error);
            throw new Error('Compliance report generation failed');
        }
    }
}
exports.GDPRComplianceService = GDPRComplianceService;
