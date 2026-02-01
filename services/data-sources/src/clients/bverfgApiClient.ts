/**
 * BVerfG API Client
 * 
 * This client handles communication with the BVerfG API for fetching constitutional court decisions.
 */

import axios from 'axios';
import NodeCache from 'node-cache';

// Initialize cache with 10 minute TTL
const cache = new NodeCache({ stdTTL: 600 });

export class BVerfGApiClient {
  private baseUrl: string;
  private apiKey: string;

  constructor() {
    this.baseUrl = process.env.BVERFG_API_BASE_URL || 'https://bverfg.api.example.com';
    this.apiKey = process.env.BVERFG_API_KEY || 'dummy-key';
  }

  /**
   * Fetch recent BVerfG decisions
   */
  async getDecisions(limit: number = 10): Promise<any[]> {
    const cacheKey = `bverfg_decisions_${limit}`;
    
    // Check cache first
    const cached = cache.get(cacheKey);
    if (cached) {
      return cached as any[];
    }
    
    try {
      const response = await axios.get(`${this.baseUrl}/decisions`, {
        params: {
          limit,
          jurisdiction: 'mietrecht'
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
      console.error('Error fetching BVerfG decisions:', error);
      // Return mock data in case of error
      return this.getMockDecisions(limit);
    }
  }

  /**
   * Get decision details by ID
   */
  async getDecisionById(id: string): Promise<any> {
    const cacheKey = `bverfg_decision_${id}`;
    
    // Check cache first
    const cached = cache.get(cacheKey);
    if (cached) {
      return cached as any;
    }
    
    try {
      const response = await axios.get(`${this.baseUrl}/decisions/${id}`, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        }
      });
      
      // Cache the result
      cache.set(cacheKey, response.data);
      
      return response.data;
    } catch (error) {
      console.error(`Error fetching BVerfG decision ${id}:`, error);
      // Return mock data in case of error
      return this.getMockDecision(id);
    }
  }

  /**
   * Search decisions by keyword
   */
  async searchDecisions(keyword: string, limit: number = 10): Promise<any[]> {
    const cacheKey = `bverfg_search_${keyword}_${limit}`;
    
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
      console.error(`Error searching BVerfG decisions for "${keyword}":`, error);
      // Return mock data in case of error
      return this.getMockSearchResults(keyword, limit);
    }
  }

  /**
   * Get list of court divisions
   */
  async getCourtDivisions(): Promise<string[]> {
    const cacheKey = 'bverfg_court_divisions';
    
    // Check cache first
    const cached = cache.get(cacheKey);
    if (cached) {
      return cached as string[];
    }
    
    try {
      const response = await axios.get(`${this.baseUrl}/divisions`, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        }
      });
      
      // Cache the result
      cache.set(cacheKey, response.data);
      
      return response.data;
    } catch (error) {
      console.error('Error fetching BVerfG court divisions:', error);
      // Return mock data in case of error
      return this.getMockCourtDivisions();
    }
  }

  /**
   * Generate mock decisions for testing
   */
  private getMockDecisions(limit: number): any[] {
    return Array.from({ length: limit }, (_, i) => ({
      id: `bverfg-${i + 1}`,
      title: `BVerfG Entscheidung ${i + 1} zum Mietrecht`,
      date: new Date(Date.now() - i * 86400000).toISOString().split('T')[0],
      summary: `Zusammenfassung der BVerfG-Entscheidung ${i + 1} im Bereich Mietrecht.`,
      url: `https://bverfg.example.com/entscheidung/${i + 1}`,
      topics: ['Mietrecht', 'Verfassungsrecht', 'Grundgesetz'],
      court: 'Bundesverfassungsgericht',
      type: 'Urteil',
      division: 'Erster Senat'
    }));
  }

  /**
   * Generate mock decision for testing
   */
  private getMockDecision(id: string): any {
    return {
      id,
      title: `BVerfG Entscheidung ${id} zum Mietrecht`,
      date: new Date().toISOString().split('T')[0],
      summary: `Ausführliche Zusammenfassung der BVerfG-Entscheidung ${id} im Bereich Mietrecht.`,
      content: `Vollständiger Text der BVerfG-Entscheidung ${id}.`,
      url: `https://bverfg.example.com/entscheidung/${id}`,
      topics: ['Mietrecht', 'Verfassungsrecht', 'Grundgesetz'],
      court: 'Bundesverfassungsgericht',
      type: 'Urteil',
      division: 'Erster Senat',
      references: []
    };
  }

  /**
   * Generate mock search results for testing
   */
  private getMockSearchResults(keyword: string, limit: number): any[] {
    return Array.from({ length: limit }, (_, i) => ({
      id: `bverfg-search-${i + 1}`,
      title: `Suchergebnis ${i + 1} für "${keyword}"`,
      date: new Date(Date.now() - i * 86400000).toISOString().split('T')[0],
      summary: `Suchergebnis ${i + 1} für das Stichwort "${keyword}" im Bereich Mietrecht.`,
      url: `https://bverfg.example.com/suche/${keyword}/${i + 1}`,
      topics: ['Mietrecht', 'Verfassungsrecht', 'Grundgesetz'],
      court: 'Bundesverfassungsgericht',
      type: 'Urteil',
      division: 'Erster Senat'
    }));
  }

  /**
   * Generate mock court divisions for testing
   */
  private getMockCourtDivisions(): string[] {
    return [
      'Erster Senat',
      'Zweiter Senat',
      'Dritter Senat',
      'Vierter Senat',
      'Fünfter Senat',
      'Sechster Senat',
      'Siebenter Senat',
      'Achter Senat'
    ];
  }
}