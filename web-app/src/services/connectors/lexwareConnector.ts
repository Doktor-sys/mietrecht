/**
 * Lexware Kanzlei API Connector
 * 
 * This connector implements the integration with Lexware Kanzlei management system.
 * It handles authentication, data mapping, and API communication.
 */

import axios, { AxiosInstance, AxiosResponse } from 'axios';
import { LawFirmCaseData, AccountingEntry, CalendarEvent } from '../integrations';

// Lexware API types
interface LexwareCase {
  id: string;
  mandantId: string;
  sachbearbeiterId: string;
  sachgebiet: string;
  datum: string;
  az: string;
  betreff: string;
  status: string;
  mandantenNr: string;
  firma: string;
  name: string;
  vorname: string;
  strasse: string;
  plz: string;
  ort: string;
  email: string;
  telefon: string;
}

interface LexwareContact {
  id: string;
  mandantenNr: string;
  firma: string;
  name: string;
  vorname: string;
  strasse: string;
  plz: string;
  ort: string;
  email: string;
  telefon: string;
}

interface LexwareDocument {
  id: string;
  fallId: string;
  name: string;
  dateiname: string;
  erstelltAm: string;
  typ: string;
}

// Configuration interface
export interface LexwareConfig {
  baseUrl: string;
  accessToken: string;
  mandantId?: string;
}

/**
 * Lexware Connector Class
 */
export class LexwareConnector {
  private client: AxiosInstance;
  private config: LexwareConfig;

  constructor(config: LexwareConfig) {
    this.config = config;
    
    // Initialize Axios client with base configuration
    this.client = axios.create({
      baseURL: config.baseUrl,
      timeout: 30000,
      headers: {
        'Authorization': `Bearer ${config.accessToken}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    });

    // Add response interceptor for error handling
    this.client.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 401) {
          console.error('Lexware API authentication failed');
        }
        return Promise.reject(error);
      }
    );
  }

  /**
   * Fetch all cases from Lexware
   */
  async getCases(): Promise<LawFirmCaseData[]> {
    try {
      const response: AxiosResponse<LexwareCase[]> = await this.client.get('/faelle');
      
      // Map Lexware cases to our internal format
      return response.data.map(caseData => this.mapLexwareCaseToInternal(caseData));
    } catch (error) {
      console.error('Failed to fetch cases from Lexware:', error);
      throw error;
    }
  }

  /**
   * Create a new case in Lexware
   */
  async createCase(caseData: LawFirmCaseData): Promise<string> {
    try {
      // Map internal case data to Lexware format
      const lexwareCase = this.mapInternalCaseToLexware(caseData);
      
      const response: AxiosResponse<LexwareCase> = await this.client.post('/faelle', lexwareCase);
      
      return response.data.id;
    } catch (error) {
      console.error('Failed to create case in Lexware:', error);
      throw error;
    }
  }

  /**
   * Update an existing case in Lexware
   */
  async updateCase(caseId: string, caseData: Partial<LawFirmCaseData>): Promise<boolean> {
    try {
      // Map partial internal case data to Lexware format
      const lexwareCase = this.mapPartialInternalCaseToLexware(caseData);
      
      await this.client.put(`/faelle/${caseId}`, lexwareCase);
      
      return true;
    } catch (error) {
      console.error('Failed to update case in Lexware:', error);
      throw error;
    }
  }

  /**
   * Fetch contacts (clients) from Lexware
   */
  async getContacts(): Promise<any[]> {
    try {
      const response: AxiosResponse<LexwareContact[]> = await this.client.get('/kontakte');
      return response.data;
    } catch (error) {
      console.error('Failed to fetch contacts from Lexware:', error);
      throw error;
    }
  }

  /**
   * Fetch documents for a specific case
   */
  async getCaseDocuments(caseId: string): Promise<any[]> {
    try {
      const response: AxiosResponse<LexwareDocument[]> = await this.client.get(`/faelle/${caseId}/dokumente`);
      return response.data;
    } catch (error) {
      console.error('Failed to fetch documents from Lexware:', error);
      throw error;
    }
  }

  /**
   * Upload a document to a specific case
   */
  async uploadDocument(caseId: string, documentData: any): Promise<string> {
    try {
      const response: AxiosResponse<LexwareDocument> = await this.client.post(
        `/faelle/${caseId}/dokumente`, 
        documentData,
        {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        }
      );
      
      return response.data.id;
    } catch (error) {
      console.error('Failed to upload document to Lexware:', error);
      throw error;
    }
  }

  /**
   * Map Lexware case data to internal format
   */
  private mapLexwareCaseToInternal(lexwareCase: LexwareCase): LawFirmCaseData {
    return {
      caseId: lexwareCase.id,
      clientId: lexwareCase.mandantId,
      clientName: `${lexwareCase.firma} ${lexwareCase.vorname} ${lexwareCase.name}`.trim(),
      caseType: lexwareCase.sachgebiet,
      startDate: lexwareCase.datum,
      status: lexwareCase.status,
      assignedLawyer: lexwareCase.sachbearbeiterId,
      contactInfo: {
        email: lexwareCase.email,
        phone: lexwareCase.telefon,
        address: `${lexwareCase.strasse}, ${lexwareCase.plz} ${lexwareCase.ort}`
      },
      billingInfo: {
        currency: 'EUR'
      }
    };
  }

  /**
   * Map internal case data to Lexware format
   */
  private mapInternalCaseToLexware(caseData: LawFirmCaseData): any {
    // Parse client name (assuming format: "Company FirstName LastName")
    const nameParts = caseData.clientName.split(' ');
    const lastName = nameParts.pop() || '';
    const firstName = nameParts.pop() || '';
    const company = nameParts.join(' ');

    return {
      mandantId: caseData.clientId,
      sachbearbeiterId: caseData.assignedLawyer,
      sachgebiet: caseData.caseType,
      datum: caseData.startDate,
      az: caseData.caseId,
      betreff: caseData.caseType,
      status: caseData.status,
      firma: company,
      name: lastName,
      vorname: firstName,
      // Address and contact info would need to be parsed from contactInfo
      email: caseData.contactInfo?.email,
      telefon: caseData.contactInfo?.phone
    };
  }

  /**
   * Map partial internal case data to Lexware format
   */
  private mapPartialInternalCaseToLexware(caseData: Partial<LawFirmCaseData>): any {
    const lexwareCase: any = {};

    if (caseData.caseType) lexwareCase.sachgebiet = caseData.caseType;
    if (caseData.startDate) lexwareCase.datum = caseData.startDate;
    if (caseData.status) lexwareCase.status = caseData.status;
    if (caseData.assignedLawyer) lexwareCase.sachbearbeiterId = caseData.assignedLawyer;
    if (caseData.clientName) {
      // Parse client name (assuming format: "Company FirstName LastName")
      const nameParts = caseData.clientName.split(' ');
      const lastName = nameParts.pop() || '';
      const firstName = nameParts.pop() || '';
      const company = nameParts.join(' ');
      
      lexwareCase.firma = company;
      lexwareCase.name = lastName;
      lexwareCase.vorname = firstName;
    }
    if (caseData.contactInfo?.email) lexwareCase.email = caseData.contactInfo.email;
    if (caseData.contactInfo?.phone) lexwareCase.telefon = caseData.contactInfo.phone;

    return lexwareCase;
  }

  /**
   * Test connection to Lexware API
   */
  async testConnection(): Promise<boolean> {
    try {
      await this.client.get('/system/info');
      return true;
    } catch (error) {
      console.error('Lexware connection test failed:', error);
      return false;
    }
  }
}

export default LexwareConnector;