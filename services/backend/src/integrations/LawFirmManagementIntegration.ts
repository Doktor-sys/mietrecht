import axios, { AxiosInstance } from 'axios';
import { logger } from '../utils/logger';

interface Client {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  address: string;
  cases: Case[];
}

interface Case {
  id: string;
  clientId: string;
  title: string;
  description: string;
  status: 'open' | 'in_progress' | 'closed';
  createdAt: Date;
  updatedAt: Date;
}

interface Matter {
  id: string;
  caseId: string;
  billingMethod: 'hourly' | 'fixed' | 'contingency';
  hourlyRate?: number;
  fixedFee?: number;
  contingencyPercentage?: number;
  billedHours: number;
  totalBilled: number;
}

export class LawFirmManagementIntegration {
  private apiClient: AxiosInstance;
  private baseUrl: string;
  private apiKey: string;

  constructor(baseUrl: string, apiKey: string) {
    this.baseUrl = baseUrl;
    this.apiKey = apiKey;
    
    this.apiClient = axios.create({
      baseURL: this.baseUrl,
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json'
      }
    });
  }

  /**
   * Holt alle Mandanten aus dem Kanzleimanagementsystem
   */
  async getClients(): Promise<Client[]> {
    try {
      const response = await this.apiClient.get('/clients');
      return response.data.clients;
    } catch (error) {
      logger.error('Error fetching clients from law firm management system:', error);
      throw new Error('Failed to fetch clients');
    }
  }

  /**
   * Holt einen bestimmten Mandanten anhand seiner ID
   */
  async getClientById(clientId: string): Promise<Client> {
    try {
      const response = await this.apiClient.get(`/clients/${clientId}`);
      return response.data.client;
    } catch (error) {
      logger.error(`Error fetching client ${clientId} from law firm management system:`, error);
      throw new Error('Failed to fetch client');
    }
  }

  /**
   * Holt alle Fälle eines Mandanten
   */
  async getCasesForClient(clientId: string): Promise<Case[]> {
    try {
      const response = await this.apiClient.get(`/clients/${clientId}/cases`);
      return response.data.cases;
    } catch (error) {
      logger.error(`Error fetching cases for client ${clientId} from law firm management system:`, error);
      throw new Error('Failed to fetch cases');
    }
  }

  /**
   * Holt alle Fälle aus dem Kanzleimanagementsystem
   */
  async getAllCases(): Promise<Case[]> {
    try {
      const response = await this.apiClient.get('/cases');
      return response.data.cases;
    } catch (error) {
      logger.error('Error fetching cases from law firm management system:', error);
      throw new Error('Failed to fetch cases');
    }
  }

  /**
   * Holt einen bestimmten Fall anhand seiner ID
   */
  async getCaseById(caseId: string): Promise<Case> {
    try {
      const response = await this.apiClient.get(`/cases/${caseId}`);
      return response.data.case;
    } catch (error) {
      logger.error(`Error fetching case ${caseId} from law firm management system:`, error);
      throw new Error('Failed to fetch case');
    }
  }

  /**
   * Erstellt einen neuen Fall im Kanzleimanagementsystem
   */
  async createCase(caseData: Omit<Case, 'id' | 'createdAt' | 'updatedAt'>): Promise<Case> {
    try {
      const response = await this.apiClient.post('/cases', { case: caseData });
      return response.data.case;
    } catch (error) {
      logger.error('Error creating case in law firm management system:', error);
      throw new Error('Failed to create case');
    }
  }

  /**
   * Aktualisiert einen bestehenden Fall
   */
  async updateCase(caseId: string, caseData: Partial<Case>): Promise<Case> {
    try {
      const response = await this.apiClient.patch(`/cases/${caseId}`, { case: caseData });
      return response.data.case;
    } catch (error) {
      logger.error(`Error updating case ${caseId} in law firm management system:`, error);
      throw new Error('Failed to update case');
    }
  }

  /**
   * Holt die Abrechnungsinformationen für einen Fall
   */
  async getMatterForCase(caseId: string): Promise<Matter> {
    try {
      const response = await this.apiClient.get(`/cases/${caseId}/matter`);
      return response.data.matter;
    } catch (error) {
      logger.error(`Error fetching matter for case ${caseId} from law firm management system:`, error);
      throw new Error('Failed to fetch matter');
    }
  }

  /**
   * Aktualisiert die Abrechnungsinformationen für einen Fall
   */
  async updateMatter(caseId: string, matterData: Partial<Matter>): Promise<Matter> {
    try {
      const response = await this.apiClient.patch(`/cases/${caseId}/matter`, { matter: matterData });
      return response.data.matter;
    } catch (error) {
      logger.error(`Error updating matter for case ${caseId} in law firm management system:`, error);
      throw new Error('Failed to update matter');
    }
  }

  /**
   * Synchronisiert Mandanten zwischen SmartLaw und dem Kanzleimanagementsystem
   */
  async syncClients(): Promise<void> {
    try {
      // In einer echten Implementierung würden wir hier die Mandanten synchronisieren
      logger.info('Client synchronization with law firm management system initiated');
    } catch (error) {
      logger.error('Error synchronizing clients with law firm management system:', error);
      throw new Error('Failed to synchronize clients');
    }
  }

  /**
   * Synchronisiert Fälle zwischen SmartLaw und dem Kanzleimanagementsystem
   */
  async syncCases(): Promise<void> {
    try {
      // In einer echten Implementierung würden wir hier die Fälle synchronisieren
      logger.info('Case synchronization with law firm management system initiated');
    } catch (error) {
      logger.error('Error synchronizing cases with law firm management system:', error);
      throw new Error('Failed to synchronize cases');
    }
  }
}