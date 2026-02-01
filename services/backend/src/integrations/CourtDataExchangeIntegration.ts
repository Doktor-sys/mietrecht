import axios, { AxiosInstance } from 'axios';
import { logger } from '../utils/logger';

interface CourtCase {
  id: string;
  courtId: string;
  caseNumber: string;
  title: string;
  parties: Party[];
  filingDate: Date;
  status: 'filed' | 'in_progress' | 'closed' | 'dismissed';
  nextHearing?: Date;
  judge?: string;
  documents: CourtDocument[];
}

interface Party {
  id: string;
  name: string;
  type: 'plaintiff' | 'defendant' | 'attorney' | 'judge';
  contact?: ContactInfo;
}

interface ContactInfo {
  email?: string;
  phone?: string;
  address?: string;
}

interface CourtDocument {
  id: string;
  name: string;
  type: 'pleading' | 'evidence' | 'order' | 'judgment';
  filingDate: Date;
  url?: string;
}

interface Court {
  id: string;
  name: string;
  jurisdiction: string;
  address?: string;
  website?: string;
}

export class CourtDataExchangeIntegration {
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
   * Holt alle Gerichte in einer bestimmten Jurisdiktion
   */
  async getCourts(jurisdiction: string): Promise<Court[]> {
    try {
      const response = await this.apiClient.get('/courts', {
        params: { jurisdiction }
      });
      return response.data.courts;
    } catch (error) {
      logger.error('Error fetching courts:', error);
      throw new Error('Failed to fetch courts');
    }
  }

  /**
   * Holt einen bestimmten Fall anhand seiner ID
   */
  async getCaseById(caseId: string): Promise<CourtCase> {
    try {
      const response = await this.apiClient.get(`/cases/${caseId}`);
      return response.data.case;
    } catch (error) {
      logger.error(`Error fetching case ${caseId}:`, error);
      throw new Error('Failed to fetch case');
    }
  }

  /**
   * Sucht nach Fällen basierend auf verschiedenen Kriterien
   */
  async searchCases(criteria: {
    caseNumber?: string;
    partyName?: string;
    courtId?: string;
    dateFrom?: Date;
    dateTo?: Date;
  }): Promise<CourtCase[]> {
    try {
      const params: any = {};
      if (criteria.caseNumber) params.caseNumber = criteria.caseNumber;
      if (criteria.partyName) params.partyName = criteria.partyName;
      if (criteria.courtId) params.courtId = criteria.courtId;
      if (criteria.dateFrom) params.dateFrom = criteria.dateFrom.toISOString();
      if (criteria.dateTo) params.dateTo = criteria.dateTo.toISOString();
      
      const response = await this.apiClient.get('/cases/search', { params });
      return response.data.cases;
    } catch (error) {
      logger.error('Error searching cases:', error);
      throw new Error('Failed to search cases');
    }
  }

  /**
   * Reicht einen neuen Fall beim Gericht ein
   */
  async fileCase(caseData: Omit<CourtCase, 'id' | 'documents'>): Promise<CourtCase> {
    try {
      const response = await this.apiClient.post('/cases', { case: caseData });
      return response.data.case;
    } catch (error) {
      logger.error('Error filing case:', error);
      throw new Error('Failed to file case');
    }
  }

  /**
   * Holt alle Dokumente für einen bestimmten Fall
   */
  async getCaseDocuments(caseId: string): Promise<CourtDocument[]> {
    try {
      const response = await this.apiClient.get(`/cases/${caseId}/documents`);
      return response.data.documents;
    } catch (error) {
      logger.error(`Error fetching documents for case ${caseId}:`, error);
      throw new Error('Failed to fetch case documents');
    }
  }

  /**
   * Reicht ein Dokument bei einem Fall ein
   */
  async fileDocument(caseId: string, documentData: Omit<CourtDocument, 'id'>): Promise<CourtDocument> {
    try {
      const response = await this.apiClient.post(`/cases/${caseId}/documents`, { document: documentData });
      return response.data.document;
    } catch (error) {
      logger.error(`Error filing document for case ${caseId}:`, error);
      throw new Error('Failed to file document');
    }
  }

  /**
   * Holt Informationen über das nächste Verhandlungstermin
   */
  async getNextHearing(caseId: string): Promise<Date | null> {
    try {
      const response = await this.apiClient.get(`/cases/${caseId}/next-hearing`);
      return response.data.nextHearing ? new Date(response.data.nextHearing) : null;
    } catch (error) {
      logger.error(`Error fetching next hearing for case ${caseId}:`, error);
      throw new Error('Failed to fetch next hearing');
    }
  }

  /**
   * Holt den Status eines Falls
   */
  async getCaseStatus(caseId: string): Promise<string> {
    try {
      const response = await this.apiClient.get(`/cases/${caseId}/status`);
      return response.data.status;
    } catch (error) {
      logger.error(`Error fetching status for case ${caseId}:`, error);
      throw new Error('Failed to fetch case status');
    }
  }

  /**
   * Holt aktuelle Gerichtsentscheidungen
   */
  async getRecentDecisions(limit: number = 10): Promise<CourtCase[]> {
    try {
      const response = await this.apiClient.get('/decisions/recent', {
        params: { limit }
      });
      return response.data.decisions;
    } catch (error) {
      logger.error('Error fetching recent decisions:', error);
      throw new Error('Failed to fetch recent decisions');
    }
  }
}