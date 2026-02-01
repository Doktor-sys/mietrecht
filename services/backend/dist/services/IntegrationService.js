"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.IntegrationService = void 0;
const LawFirmManagementIntegration_1 = require("../integrations/LawFirmManagementIntegration");
const AccountingIntegration_1 = require("../integrations/AccountingIntegration");
const CalendarIntegration_1 = require("../integrations/CalendarIntegration");
const CourtDataExchangeIntegration_1 = require("../integrations/CourtDataExchangeIntegration");
const LegalDatabaseIntegration_1 = require("../integrations/LegalDatabaseIntegration");
const EgovernmentIntegration_1 = require("../integrations/EgovernmentIntegration");
const DocumentManagementIntegration_1 = require("../integrations/DocumentManagementIntegration");
const MessagingIntegration_1 = require("../integrations/MessagingIntegration");
const PaymentIntegration_1 = require("../integrations/PaymentIntegration");
const logger_1 = require("../utils/logger");
class IntegrationService {
    constructor(prisma) {
        this.integrations = new Map();
        this.prisma = prisma;
    }
    /**
     * Initialisiert alle aktiven Integrationen
     */
    async initializeIntegrations() {
        try {
            // Hole alle aktiven Integrationen aus der Datenbank
            // @ts-ignore - Prisma-Client-Probleme
            const configs = await this.prisma.integration.findMany({
                where: { isActive: true }
            });
            // Initialisiere jede Integration
            for (const config of configs) {
                // Konvertiere null-Werte zu undefined
                const convertedConfig = {
                    id: config.id,
                    name: config.name,
                    type: config.type,
                    baseUrl: config.baseUrl,
                    apiKey: config.apiKey ?? undefined,
                    accessToken: config.accessToken ?? undefined,
                    secretKey: config.secretKey ?? undefined,
                    isActive: config.isActive,
                    createdAt: config.createdAt,
                    updatedAt: config.updatedAt
                };
                await this.initializeIntegration(convertedConfig);
            }
            logger_1.logger.info(`Initialized ${configs.length} integrations`);
        }
        catch (error) {
            logger_1.logger.error('Error initializing integrations:', error);
            throw new Error('Failed to initialize integrations');
        }
    }
    /**
     * Initialisiert eine einzelne Integration
     */
    async initializeIntegration(config) {
        try {
            let integration;
            switch (config.type) {
                case 'law_firm_management':
                    integration = new LawFirmManagementIntegration_1.LawFirmManagementIntegration(config.baseUrl, config.apiKey || '');
                    break;
                case 'accounting':
                    integration = new AccountingIntegration_1.AccountingIntegration(config.baseUrl, config.apiKey || '');
                    break;
                case 'calendar':
                    integration = new CalendarIntegration_1.CalendarIntegration(config.baseUrl, config.accessToken || '');
                    break;
                case 'court_data_exchange':
                    integration = new CourtDataExchangeIntegration_1.CourtDataExchangeIntegration(config.baseUrl, config.apiKey || '');
                    break;
                case 'legal_database':
                    integration = new LegalDatabaseIntegration_1.LegalDatabaseIntegration(config.baseUrl, config.apiKey || '');
                    break;
                case 'egovernment':
                    integration = new EgovernmentIntegration_1.EgovernmentIntegration(config.baseUrl, config.accessToken || '');
                    break;
                case 'document_management':
                    integration = new DocumentManagementIntegration_1.DocumentManagementIntegration(config.baseUrl, config.accessToken || '');
                    break;
                case 'messaging':
                    integration = new MessagingIntegration_1.MessagingIntegration(config.baseUrl, config.accessToken || '');
                    break;
                case 'payment':
                    integration = new PaymentIntegration_1.PaymentIntegration(config.baseUrl, config.secretKey || '');
                    break;
                default:
                    logger_1.logger.warn(`Unknown integration type: ${config.type}`);
                    return;
            }
            // Speichere die Integration im Speicher
            this.integrations.set(config.id, integration);
            logger_1.logger.info(`Initialized integration: ${config.name} (${config.type})`);
        }
        catch (error) {
            logger_1.logger.error(`Error initializing integration ${config.name}:`, error);
            throw new Error(`Failed to initialize integration ${config.name}`);
        }
    }
    /**
     * Holt eine Integration anhand ihrer ID
     */
    getIntegration(integrationId) {
        return this.integrations.get(integrationId);
    }
    /**
     * Holt eine Integration anhand ihres Typs
     */
    getIntegrationByType(type) {
        for (const [id, integration] of this.integrations.entries()) {
            // Prüfen Sie den Typ der Integration
            if (this.getIntegrationType(integration) === type) {
                return integration;
            }
        }
        return null;
    }
    /**
     * Bestimmt den Typ einer Integration
     */
    getIntegrationType(integration) {
        if (integration instanceof LawFirmManagementIntegration_1.LawFirmManagementIntegration) {
            return 'law_firm_management';
        }
        else if (integration instanceof AccountingIntegration_1.AccountingIntegration) {
            return 'accounting';
        }
        else if (integration instanceof CalendarIntegration_1.CalendarIntegration) {
            return 'calendar';
        }
        else if (integration instanceof CourtDataExchangeIntegration_1.CourtDataExchangeIntegration) {
            return 'court_data_exchange';
        }
        else if (integration instanceof LegalDatabaseIntegration_1.LegalDatabaseIntegration) {
            return 'legal_database';
        }
        else if (integration instanceof EgovernmentIntegration_1.EgovernmentIntegration) {
            return 'egovernment';
        }
        else if (integration instanceof DocumentManagementIntegration_1.DocumentManagementIntegration) {
            return 'document_management';
        }
        else if (integration instanceof MessagingIntegration_1.MessagingIntegration) {
            return 'messaging';
        }
        else if (integration instanceof PaymentIntegration_1.PaymentIntegration) {
            return 'payment';
        }
        return 'unknown';
    }
    /**
     * Fügt eine neue Integration hinzu
     */
    async addIntegration(config) {
        try {
            // Speichere die Konfiguration in der Datenbank
            // @ts-ignore - Prisma-Client-Probleme
            const newConfig = await this.prisma.integration.create({
                data: {
                    name: config.name,
                    type: config.type,
                    baseUrl: config.baseUrl,
                    apiKey: config.apiKey,
                    accessToken: config.accessToken,
                    secretKey: config.secretKey,
                    isActive: config.isActive
                }
            });
            // Konvertiere null-Werte zu undefined
            const convertedConfig = {
                id: newConfig.id,
                name: newConfig.name,
                type: newConfig.type,
                baseUrl: newConfig.baseUrl,
                apiKey: newConfig.apiKey ?? undefined,
                accessToken: newConfig.accessToken ?? undefined,
                secretKey: newConfig.secretKey ?? undefined,
                isActive: newConfig.isActive,
                createdAt: newConfig.createdAt,
                updatedAt: newConfig.updatedAt
            };
            // Initialisiere die Integration, wenn sie aktiv ist
            if (convertedConfig.isActive) {
                await this.initializeIntegration(convertedConfig);
            }
            return convertedConfig;
        }
        catch (error) {
            logger_1.logger.error('Error adding integration:', error);
            throw new Error('Failed to add integration');
        }
    }
    /**
     * Aktualisiert eine bestehende Integration
     */
    async updateIntegration(integrationId, config) {
        try {
            // Aktualisiere die Konfiguration in der Datenbank
            // @ts-ignore - Prisma-Client-Probleme
            const updatedConfig = await this.prisma.integration.update({
                where: { id: integrationId },
                data: config
            });
            // Konvertiere null-Werte zu undefined
            const convertedConfig = {
                id: updatedConfig.id,
                name: updatedConfig.name,
                type: updatedConfig.type,
                baseUrl: updatedConfig.baseUrl,
                apiKey: updatedConfig.apiKey ?? undefined,
                accessToken: updatedConfig.accessToken ?? undefined,
                secretKey: updatedConfig.secretKey ?? undefined,
                isActive: updatedConfig.isActive,
                createdAt: updatedConfig.createdAt,
                updatedAt: updatedConfig.updatedAt
            };
            // Wenn die Integration aktiviert wurde, initialisiere sie
            if (convertedConfig.isActive && !this.integrations.has(integrationId)) {
                await this.initializeIntegration(convertedConfig);
            }
            // Wenn die Integration deaktiviert wurde, entferne sie
            else if (convertedConfig.isActive === false && this.integrations.has(integrationId)) {
                this.integrations.delete(integrationId);
            }
            // Wenn die Integration aktualisiert wurde, reinitialisiere sie
            else if (convertedConfig.isActive !== false && this.integrations.has(integrationId)) {
                this.integrations.delete(integrationId);
                await this.initializeIntegration(convertedConfig);
            }
            return convertedConfig;
        }
        catch (error) {
            logger_1.logger.error(`Error updating integration ${integrationId}:`, error);
            throw new Error('Failed to update integration');
        }
    }
    /**
     * Löscht eine Integration
     */
    async deleteIntegration(integrationId) {
        try {
            // Entferne die Integration aus dem Speicher
            this.integrations.delete(integrationId);
            // Lösche die Konfiguration aus der Datenbank
            // @ts-ignore - Prisma-Client-Probleme
            await this.prisma.integration.delete({
                where: { id: integrationId }
            });
            logger_1.logger.info(`Deleted integration: ${integrationId}`);
        }
        catch (error) {
            logger_1.logger.error(`Error deleting integration ${integrationId}:`, error);
            throw new Error('Failed to delete integration');
        }
    }
    /**
     * Synchronisiert Daten für alle aktiven Integrationen
     */
    async syncAllIntegrations() {
        try {
            logger_1.logger.info('Starting synchronization for all integrations');
            // Synchronisiere Kanzleimanagement-Integrationen
            const lawFirmIntegration = this.getIntegrationByType('law_firm_management');
            if (lawFirmIntegration) {
                await lawFirmIntegration.syncClients();
                await lawFirmIntegration.syncCases();
            }
            // Synchronisiere Buchhaltungs-Integrationen
            const accountingIntegration = this.getIntegrationByType('accounting');
            if (accountingIntegration) {
                await accountingIntegration.syncInvoices();
                await accountingIntegration.syncPayments();
            }
            // Synchronisiere Kalender-Integrationen
            const calendarIntegration = this.getIntegrationByType('calendar');
            if (calendarIntegration) {
                await calendarIntegration.syncEvents();
            }
            logger_1.logger.info('Completed synchronization for all integrations');
        }
        catch (error) {
            logger_1.logger.error('Error synchronizing all integrations:', error);
            throw new Error('Failed to synchronize integrations');
        }
    }
    /**
     * Holt den Status aller Integrationen
     */
    async getIntegrationStatus() {
        try {
            // @ts-ignore - Prisma-Client-Probleme
            const configs = await this.prisma.integration.findMany();
            return configs.map((config) => ({
                id: config.id,
                name: config.name,
                type: config.type,
                active: config.isActive,
                lastSync: config.updatedAt // In einer echten Implementierung würde dies das tatsächliche letzte Sync-Datum sein
            }));
        }
        catch (error) {
            logger_1.logger.error('Error fetching integration status:', error);
            throw new Error('Failed to fetch integration status');
        }
    }
}
exports.IntegrationService = IntegrationService;
