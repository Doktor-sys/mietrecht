import { PrismaClient } from '@prisma/client';
import { LawFirmManagementIntegration } from '../integrations/LawFirmManagementIntegration';
import { AccountingIntegration } from '../integrations/AccountingIntegration';
import { CalendarIntegration } from '../integrations/CalendarIntegration';
import { CourtDataExchangeIntegration } from '../integrations/CourtDataExchangeIntegration';
import { LegalDatabaseIntegration } from '../integrations/LegalDatabaseIntegration';
import { EgovernmentIntegration } from '../integrations/EgovernmentIntegration';
import { DocumentManagementIntegration } from '../integrations/DocumentManagementIntegration';
import { MessagingIntegration } from '../integrations/MessagingIntegration';
import { PaymentIntegration } from '../integrations/PaymentIntegration';
import { logger } from '../utils/logger';

interface IntegrationConfig {
  id: string;
  name: string;
  type: string;
  baseUrl: string;
  apiKey?: string;
  accessToken?: string;
  secretKey?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export class IntegrationService {
  private prisma: PrismaClient;
  private integrations: Map<string, any> = new Map();

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
  }

  /**
   * Initialisiert alle aktiven Integrationen
   */
  async initializeIntegrations(): Promise<void> {
    try {
      // Hole alle aktiven Integrationen aus der Datenbank
      // @ts-ignore - Prisma-Client-Probleme
      const configs = await this.prisma.integration.findMany({
        where: { isActive: true }
      });

      // Initialisiere jede Integration
      for (const config of configs) {
        // Konvertiere null-Werte zu undefined
        const convertedConfig: IntegrationConfig = {
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

      logger.info(`Initialized ${configs.length} integrations`);
    } catch (error) {
      logger.error('Error initializing integrations:', error);
      throw new Error('Failed to initialize integrations');
    }
  }

  /**
   * Initialisiert eine einzelne Integration
   */
  private async initializeIntegration(config: IntegrationConfig): Promise<void> {
    try {
      let integration: any;

      switch (config.type) {
        case 'law_firm_management':
          integration = new LawFirmManagementIntegration(config.baseUrl, config.apiKey || '');
          break;
        case 'accounting':
          integration = new AccountingIntegration(config.baseUrl, config.apiKey || '');
          break;
        case 'calendar':
          integration = new CalendarIntegration(config.baseUrl, config.accessToken || '');
          break;
        case 'court_data_exchange':
          integration = new CourtDataExchangeIntegration(config.baseUrl, config.apiKey || '');
          break;
        case 'legal_database':
          integration = new LegalDatabaseIntegration(config.baseUrl, config.apiKey || '');
          break;
        case 'egovernment':
          integration = new EgovernmentIntegration(config.baseUrl, config.accessToken || '');
          break;
        case 'document_management':
          integration = new DocumentManagementIntegration(config.baseUrl, config.accessToken || '');
          break;
        case 'messaging':
          integration = new MessagingIntegration(config.baseUrl, config.accessToken || '');
          break;
        case 'payment':
          integration = new PaymentIntegration(config.baseUrl, config.secretKey || '');
          break;
        default:
          logger.warn(`Unknown integration type: ${config.type}`);
          return;
      }

      // Speichere die Integration im Speicher
      this.integrations.set(config.id, integration);
      logger.info(`Initialized integration: ${config.name} (${config.type})`);
    } catch (error) {
      logger.error(`Error initializing integration ${config.name}:`, error);
      throw new Error(`Failed to initialize integration ${config.name}`);
    }
  }

  /**
   * Holt eine Integration anhand ihrer ID
   */
  getIntegration(integrationId: string): any {
    return this.integrations.get(integrationId);
  }

  /**
   * Holt eine Integration anhand ihres Typs
   */
  getIntegrationByType(type: string): any {
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
  private getIntegrationType(integration: any): string {
    if (integration instanceof LawFirmManagementIntegration) {
      return 'law_firm_management';
    } else if (integration instanceof AccountingIntegration) {
      return 'accounting';
    } else if (integration instanceof CalendarIntegration) {
      return 'calendar';
    } else if (integration instanceof CourtDataExchangeIntegration) {
      return 'court_data_exchange';
    } else if (integration instanceof LegalDatabaseIntegration) {
      return 'legal_database';
    } else if (integration instanceof EgovernmentIntegration) {
      return 'egovernment';
    } else if (integration instanceof DocumentManagementIntegration) {
      return 'document_management';
    } else if (integration instanceof MessagingIntegration) {
      return 'messaging';
    } else if (integration instanceof PaymentIntegration) {
      return 'payment';
    }
    return 'unknown';
  }

  /**
   * Fügt eine neue Integration hinzu
   */
  async addIntegration(config: Omit<IntegrationConfig, 'id' | 'createdAt' | 'updatedAt'>): Promise<IntegrationConfig> {
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
      const convertedConfig: IntegrationConfig = {
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
    } catch (error) {
      logger.error('Error adding integration:', error);
      throw new Error('Failed to add integration');
    }
  }

  /**
   * Aktualisiert eine bestehende Integration
   */
  async updateIntegration(integrationId: string, config: Partial<Omit<IntegrationConfig, 'id' | 'createdAt' | 'updatedAt'>>): Promise<IntegrationConfig> {
    try {
      // Aktualisiere die Konfiguration in der Datenbank
      // @ts-ignore - Prisma-Client-Probleme
      const updatedConfig = await this.prisma.integration.update({
        where: { id: integrationId },
        data: config
      });

      // Konvertiere null-Werte zu undefined
      const convertedConfig: IntegrationConfig = {
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
    } catch (error) {
      logger.error(`Error updating integration ${integrationId}:`, error);
      throw new Error('Failed to update integration');
    }
  }

  /**
   * Löscht eine Integration
   */
  async deleteIntegration(integrationId: string): Promise<void> {
    try {
      // Entferne die Integration aus dem Speicher
      this.integrations.delete(integrationId);

      // Lösche die Konfiguration aus der Datenbank
      // @ts-ignore - Prisma-Client-Probleme
      await this.prisma.integration.delete({
        where: { id: integrationId }
      });

      logger.info(`Deleted integration: ${integrationId}`);
    } catch (error) {
      logger.error(`Error deleting integration ${integrationId}:`, error);
      throw new Error('Failed to delete integration');
    }
  }

  /**
   * Synchronisiert Daten für alle aktiven Integrationen
   */
  async syncAllIntegrations(): Promise<void> {
    try {
      logger.info('Starting synchronization for all integrations');

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

      logger.info('Completed synchronization for all integrations');
    } catch (error) {
      logger.error('Error synchronizing all integrations:', error);
      throw new Error('Failed to synchronize integrations');
    }
  }

  /**
   * Holt den Status aller Integrationen
   */
  async getIntegrationStatus(): Promise<Array<{ id: string; name: string; type: string; active: boolean; lastSync?: Date }>> {
    try {
      // @ts-ignore - Prisma-Client-Probleme
      const configs = await this.prisma.integration.findMany();
      return configs.map((config: any) => ({
        id: config.id,
        name: config.name,
        type: config.type,
        active: config.isActive,
        lastSync: config.updatedAt // In einer echten Implementierung würde dies das tatsächliche letzte Sync-Datum sein
      }));
    } catch (error) {
      logger.error('Error fetching integration status:', error);
      throw new Error('Failed to fetch integration status');
    }
  }
}