/**
 * juris API Client
 * 
 * This client handles communication with the juris API for fetching legal documents.
 */

import axios, { AxiosRequestConfig } from 'axios';
import NodeCache from 'node-cache';
import { circuitBreakerService } from '../services/CircuitBreakerService';

// Initialize cache with 10 minute TTL
const cache = new NodeCache({ stdTTL: 600 });

export class JurisApiClient {
  private baseUrl: string;
  private apiKey: string;

  constructor() {
    this.baseUrl = process.env.JURIS_API_BASE_URL || 'https://juris.api.example.com';
    this.apiKey = process.env.JURIS_API_KEY || 'dummy-key';
  }

  /**
   * Fetch recent juris documents
   */
  async getDocuments(limit: number = 10): Promise<any[]> {
    const cacheKey = `juris_documents_${limit}`;
    
    // Check cache first
    const cached = cache.get(cacheKey);
    if (cached) {
      return cached as any[];
    }
    
    try {
      // Create request config
      const requestConfig: AxiosRequestConfig = {
        params: {
          limit,
          category: 'mietrecht'
        },
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        }
      };

      // Execute with circuit breaker
      const response = await circuitBreakerService.executeWithBreaker(
        'juris-api',
        async () => {
          return await axios.get(`${this.baseUrl}/documents`, requestConfig);
        }
      );
      
      // Cache the result
      cache.set(cacheKey, response.data);
      
      return response.data;
    } catch (error) {
      console.error('Error fetching juris documents:', error);
      // Return mock data in case of error
      return this.getMockDocuments(limit);
    }
  }

  /**
   * Get document details by ID
   */
  async getDocumentById(id: string): Promise<any> {
    const cacheKey = `juris_document_${id}`;
    
    // Check cache first
    const cached = cache.get(cacheKey);
    if (cached) {
      return cached as any;
    }
    
    try {
      const response = await axios.get(`${this.baseUrl}/documents/${id}`, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        }
      });
      
      // Cache the result
      cache.set(cacheKey, response.data);
      
      return response.data;
    } catch (error) {
      console.error(`Error fetching juris document ${id}:`, error);
      // Return mock data in case of error
      return this.getMockDocument(id);
    }
  }

  /**
   * Search documents by keyword
   */
  async searchDocuments(keyword: string, limit: number = 10): Promise<any[]> {
    const cacheKey = `juris_search_${keyword}_${limit}`;
    
    // Check cache first
    const cached = cache.get(cacheKey);
    if (cached) {
      return cached as any[];
    }
    
    try {
      const response = await axios.get(`${this.baseUrl}/search`, {
        params: {
          q: keyword,
          limit
        },
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        }
      });
      
      // Cache the result
      cache.set(cacheKey, response.data);
      
      return response.data;
    } catch (error) {
      console.error(`Error searching juris documents for "${keyword}":`, error);
      // Return mock data in case of error
      return this.getMockSearchResults(keyword, limit);
    }
  }

  /**
   * Get list of databases
   */
  async getDatabases(): Promise<string[]> {
    const cacheKey = 'juris_databases';
    
    // Check cache first
    const cached = cache.get(cacheKey);
    if (cached) {
      return cached as string[];
    }
    
    try {
      const response = await axios.get(`${this.baseUrl}/databases`, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        }
      });
      
      // Cache the result
      cache.set(cacheKey, response.data);
      
      return response.data;
    } catch (error) {
      console.error('Error fetching juris databases:', error);
      // Return mock data in case of error
      return this.getMockDatabases();
    }
  }

  /**
   * Generate mock documents for testing
   */
  private getMockDocuments(limit: number): any[] {
    return Array.from({ length: limit }, (_, i) => ({
      id: `juris-${i + 1}`,
      title: `juris Dokument ${i + 1} zum Mietrecht`,
      date: new Date(Date.now() - i * 86400000).toISOString().split('T')[0],
      summary: `Zusammenfassung des juris Dokuments ${i + 1} im Bereich Mietrecht.`,
      url: `https://juris.example.com/dokument/${i + 1}`,
      topics: ['Mietrecht', 'Rechtsprechung', 'Kommentare'],
      database: 'Juris',
      type: 'Dokument'
    }));
  }

  /**
   * Generate mock document for testing
   */
  private getMockDocument(id: string): any {
    return {
      id,
      title: `juris Dokument ${id} zum Mietrecht`,
      date: new Date().toISOString().split('T')[0],
      summary: `Ausführliche Zusammenfassung des juris Dokuments ${id} im Bereich Mietrecht.`,
      content: `Vollständiger Text des juris Dokuments ${id}.`,
      url: `https://juris.example.com/dokument/${id}`,
      topics: ['Mietrecht', 'Rechtsprechung', 'Kommentare'],
      database: 'Juris',
      type: 'Dokument',
      references: []
    };
  }

  /**
   * Generate mock search results for testing
   */
  private getMockSearchResults(keyword: string, limit: number): any[] {
    return Array.from({ length: limit }, (_, i) => ({
      id: `juris-search-${i + 1}`,
      title: `Suchergebnis ${i + 1} für "${keyword}"`,
      date: new Date(Date.now() - i * 86400000).toISOString().split('T')[0],
      summary: `Suchergebnis ${i + 1} für das Stichwort "${keyword}" im Bereich Mietrecht.`,
      url: `https://juris.example.com/suche/${keyword}/${i + 1}`,
      topics: ['Mietrecht', 'Rechtsprechung', 'Kommentare'],
      database: 'Juris',
      type: 'Dokument'
    }));
  }

  /**
   * Generate mock databases for testing
   */
  private getMockDatabases(): string[] {
    return [
      'NJW',
      'NStZ',
      'NZM',
      'MietR',
      'WRP',
      'ZInsO'
    ];
  }
}