/**
 * Landgerichte API Client
 * 
 * This client handles communication with the Landgerichte API for fetching regional court decisions.
 */

import axios from 'axios';
import NodeCache from 'node-cache';

// Initialize cache with 10 minute TTL
const cache = new NodeCache({ stdTTL: 600 });

export class LandgerichteApiClient {
  private baseUrl: string;
  private apiKey: string;

  constructor() {
    this.baseUrl = process.env.LANDGERICHTE_API_BASE_URL || 'https://landgerichte.api.example.com';
    this.apiKey = process.env.LANDGERICHTE_API_KEY || 'dummy-key';
  }

  /**
   * Fetch recent Landgerichte decisions
   */
  async getDecisions(limit: number = 10, region?: string): Promise<any[]> {
    const cacheKey = `landgerichte_decisions_${limit}_${region || 'all'}`;
    
    // Check cache first
    const cached = cache.get(cacheKey);
    if (cached) {
      return cached as any[];
    }
    
    try {
      const response = await axios.get(`${this.baseUrl}/decisions`, {
        params: {
          limit,
          jurisdiction: 'mietrecht',
          region
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
      console.error('Error fetching Landgerichte decisions:', error);
      // Return mock data in case of error
      return this.getMockDecisions(limit);
    }
  }

  /**
   * Get decision details by ID
   */
  async getDecisionById(id: string): Promise<any> {
    const cacheKey = `landgerichte_decision_${id}`;
    
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
      console.error(`Error fetching Landgerichte decision ${id}:`, error);
      // Return mock data in case of error
      return this.getMockDecision(id);
    }
  }

  /**
   * Get list of regions
   */
  async getRegions(): Promise<string[]> {
    const cacheKey = 'landgerichte_regions';
    
    // Check cache first
    const cached = cache.get(cacheKey);
    if (cached) {
      return cached as string[];
    }
    
    try {
      const response = await axios.get(`${this.baseUrl}/regions`, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        }
      });
      
      // Cache the result
      cache.set(cacheKey, response.data);
      
      return response.data;
    } catch (error) {
      console.error('Error fetching Landgerichte regions:', error);
      // Return mock data in case of error
      return this.getMockRegions();
    }
  }

  /**
   * Generate mock decisions for testing
   */
  private getMockDecisions(limit: number): any[] {
    return Array.from({ length: limit }, (_, i) => ({
      id: `lg-${i + 1}`,
      title: `Landgericht Entscheidung ${i + 1} zum Mietrecht`,
      date: new Date(Date.now() - i * 86400000).toISOString().split('T')[0],
      summary: `Zusammenfassung der Landgericht-Entscheidung ${i + 1} im Bereich Mietrecht.`,
      url: `https://landgericht.example.com/entscheidung/${i + 1}`,
      topics: ['Mietrecht', 'Nebenkosten', 'Modernisierung'],
      court: 'Landgericht',
      type: 'Urteil',
      region: 'Berlin'
    }));
  }

  /**
   * Generate mock decision for testing
   */
  private getMockDecision(id: string): any {
    return {
      id,
      title: `Landgericht Entscheidung ${id} zum Mietrecht`,
      date: new Date().toISOString().split('T')[0],
      summary: `Ausführliche Zusammenfassung der Landgericht-Entscheidung ${id} im Bereich Mietrecht.`,
      content: `Vollständiger Text der Landgericht-Entscheidung ${id}.`,
      url: `https://landgericht.example.com/entscheidung/${id}`,
      topics: ['Mietrecht', 'Nebenkosten', 'Modernisierung'],
      court: 'Landgericht',
      type: 'Urteil',
      region: 'Berlin',
      references: []
    };
  }

  /**
   * Generate mock regions for testing
   */
  private getMockRegions(): string[] {
    return [
      'Baden-Württemberg',
      'Bayern',
      'Berlin',
      'Brandenburg',
      'Bremen',
      'Hamburg',
      'Hessen',
      'Mecklenburg-Vorpommern',
      'Niedersachsen',
      'Nordrhein-Westfalen',
      'Rheinland-Pfalz',
      'Saarland',
      'Sachsen',
      'Sachsen-Anhalt',
      'Schleswig-Holstein',
      'Thüringen'
    ];
  }
}