/**
 * BGH API Client
 * 
 * This client handles communication with the BGH API for fetching court decisions.
 */

import axios from 'axios';
import NodeCache from 'node-cache';

// Initialize cache with 10 minute TTL
const cache = new NodeCache({ stdTTL: 600 });

export class BGHApiClient {
  private baseUrl: string;
  private apiKey: string;

  constructor() {
    this.baseUrl = process.env.BGH_API_BASE_URL || 'https://bgh.api.example.com';
    this.apiKey = process.env.BGH_API_KEY || 'dummy-key';
  }

  /**
   * Fetch recent BGH decisions
   */
  async getDecisions(limit: number = 10): Promise<any[]> {
    const cacheKey = `bgh_decisions_${limit}`;
    
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
      console.error('Error fetching BGH decisions:', error);
      // Return mock data in case of error
      return this.getMockDecisions(limit);
    }
  }

  /**
   * Get decision details by ID
   */
  async getDecisionById(id: string): Promise<any> {
    const cacheKey = `bgh_decision_${id}`;
    
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
      console.error(`Error fetching BGH decision ${id}:`, error);
      // Return mock data in case of error
      return this.getMockDecision(id);
    }
  }

  /**
   * Generate mock decisions for testing
   */
  private getMockDecisions(limit: number): any[] {
    return Array.from({ length: limit }, (_, i) => ({
      id: `bgh-${i + 1}`,
      title: `BGH Entscheidung ${i + 1} zum Mietrecht`,
      date: new Date(Date.now() - i * 86400000).toISOString().split('T')[0],
      summary: `Zusammenfassung der BGH-Entscheidung ${i + 1} im Bereich Mietrecht.`,
      url: `https://bgh.example.com/entscheidung/${i + 1}`,
      topics: ['Mietrecht', 'Kündigung', 'Mietminderung'],
      court: 'Bundesgerichtshof',
      type: 'Urteil'
    }));
  }

  /**
   * Generate mock decision for testing
   */
  private getMockDecision(id: string): any {
    return {
      id,
      title: `BGH Entscheidung ${id} zum Mietrecht`,
      date: new Date().toISOString().split('T')[0],
      summary: `Ausführliche Zusammenfassung der BGH-Entscheidung ${id} im Bereich Mietrecht.`,
      content: `Vollständiger Text der BGH-Entscheidung ${id}.`,
      url: `https://bgh.example.com/entscheidung/${id}`,
      topics: ['Mietrecht', 'Kündigung', 'Mietminderung'],
      court: 'Bundesgerichtshof',
      type: 'Urteil',
      references: []
    };
  }
}