import axios, { AxiosInstance } from 'axios';
import { logger } from '../utils/logger';

interface LegalDocument {
  id: string;
  title: string;
  content: string;
  type: 'case_law' | 'statute' | 'regulation' | 'article' | 'commentary';
  jurisdiction: string;
  date: Date;
  citation?: string;
  keywords: string[];
  relatedDocuments: string[]; // IDs of related documents
}

interface SearchResult {
  documents: LegalDocument[];
  totalResults: number;
  currentPage: number;
  totalPages: number;
}

interface Statute {
  id: string;
  title: string;
  section: string;
  content: string;
  effectiveDate: Date;
  repealedDate?: Date;
  amendments: Amendment[];
}

interface Amendment {
  date: Date;
  description: string;
  changedSections: string[];
}

export class LegalDatabaseIntegration {
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
   * Sucht nach juristischen Dokumenten
   */
  async searchDocuments(query: string, filters?: {
    type?: string;
    jurisdiction?: string;
    dateFrom?: Date;
    dateTo?: Date;
    limit?: number;
    offset?: number;
  }): Promise<SearchResult> {
    try {
      const params: any = { q: query };
      
      if (filters) {
        if (filters.type) params.type = filters.type;
        if (filters.jurisdiction) params.jurisdiction = filters.jurisdiction;
        if (filters.dateFrom) params.dateFrom = filters.dateFrom.toISOString();
        if (filters.dateTo) params.dateTo = filters.dateTo.toISOString();
        if (filters.limit) params.limit = filters.limit;
        if (filters.offset) params.offset = filters.offset;
      }
      
      const response = await this.apiClient.get('/documents/search', { params });
      return response.data;
    } catch (error) {
      logger.error('Error searching legal documents:', error);
      throw new Error('Failed to search legal documents');
    }
  }

  /**
   * Holt ein bestimmtes juristisches Dokument anhand seiner ID
   */
  async getDocumentById(documentId: string): Promise<LegalDocument> {
    try {
      const response = await this.apiClient.get(`/documents/${documentId}`);
      return response.data.document;
    } catch (error) {
      logger.error(`Error fetching document ${documentId}:`, error);
      throw new Error('Failed to fetch document');
    }
  }

  /**
   * Holt verwandte Dokumente
   */
  async getRelatedDocuments(documentId: string, limit: number = 10): Promise<LegalDocument[]> {
    try {
      const response = await this.apiClient.get(`/documents/${documentId}/related`, {
        params: { limit }
      });
      return response.data.documents;
    } catch (error) {
      logger.error(`Error fetching related documents for ${documentId}:`, error);
      throw new Error('Failed to fetch related documents');
    }
  }

  /**
   * Holt eine Gesetzesnorm anhand ihrer Kennung
   */
  async getStatuteById(statuteId: string): Promise<Statute> {
    try {
      const response = await this.apiClient.get(`/statutes/${statuteId}`);
      return response.data.statute;
    } catch (error) {
      logger.error(`Error fetching statute ${statuteId}:`, error);
      throw new Error('Failed to fetch statute');
    }
  }

  /**
   * Sucht nach Gesetzesnormen
   */
  async searchStatutes(query: string, jurisdiction?: string): Promise<Statute[]> {
    try {
      const params: any = { q: query };
      if (jurisdiction) params.jurisdiction = jurisdiction;
      
      const response = await this.apiClient.get('/statutes/search', { params });
      return response.data.statutes;
    } catch (error) {
      logger.error('Error searching statutes:', error);
      throw new Error('Failed to search statutes');
    }
  }

  /**
   * Holt aktuelle rechtliche Entwicklungen
   */
  async getRecentLegalDevelopments(limit: number = 20): Promise<LegalDocument[]> {
    try {
      const response = await this.apiClient.get('/developments/recent', {
        params: { limit }
      });
      return response.data.developments;
    } catch (error) {
      logger.error('Error fetching recent legal developments:', error);
      throw new Error('Failed to fetch recent legal developments');
    }
  }

  /**
   * Holt rechtliche Kommentare und Analysen
   */
  async getCommentaries(topic: string, limit: number = 10): Promise<LegalDocument[]> {
    try {
      const response = await this.apiClient.get('/commentaries', {
        params: { topic, limit }
      });
      return response.data.commentaries;
    } catch (error) {
      logger.error('Error fetching commentaries:', error);
      throw new Error('Failed to fetch commentaries');
    }
  }

  /**
   * Holt Zitierhäufigkeiten für ein Dokument
   */
  async getDocumentCitations(documentId: string): Promise<number> {
    try {
      const response = await this.apiClient.get(`/documents/${documentId}/citations`);
      return response.data.citationCount;
    } catch (error) {
      logger.error(`Error fetching citations for document ${documentId}:`, error);
      throw new Error('Failed to fetch document citations');
    }
  }

  /**
   * Holt die rechtliche Historie eines Dokuments
   */
  async getDocumentHistory(documentId: string): Promise<LegalDocument[]> {
    try {
      const response = await this.apiClient.get(`/documents/${documentId}/history`);
      return response.data.history;
    } catch (error) {
      logger.error(`Error fetching history for document ${documentId}:`, error);
      throw new Error('Failed to fetch document history');
    }
  }
}