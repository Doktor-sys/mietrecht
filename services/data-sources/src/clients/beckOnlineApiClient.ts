/**
 * Beck Online API Client
 * 
 * This client handles communication with the Beck Online API for fetching legal articles.
 */

import axios from 'axios';
import NodeCache from 'node-cache';

// Initialize cache with 10 minute TTL
const cache = new NodeCache({ stdTTL: 600 });

export class BeckOnlineApiClient {
  private baseUrl: string;
  private apiKey: string;

  constructor() {
    this.baseUrl = process.env.BECK_ONLINE_API_BASE_URL || 'https://beck-online.api.example.com';
    this.apiKey = process.env.BECK_ONLINE_API_KEY || 'dummy-key';
  }

  /**
   * Fetch recent Beck Online articles
   */
  async getArticles(limit: number = 10): Promise<any[]> {
    const cacheKey = `beck_online_articles_${limit}`;
    
    // Check cache first
    const cached = cache.get(cacheKey);
    if (cached) {
      return cached as any[];
    }
    
    try {
      const response = await axios.get(`${this.baseUrl}/articles`, {
        params: {
          limit,
          category: 'mietrecht'
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
      console.error('Error fetching Beck Online articles:', error);
      // Return mock data in case of error
      return this.getMockArticles(limit);
    }
  }

  /**
   * Get article details by ID
   */
  async getArticleById(id: string): Promise<any> {
    const cacheKey = `beck_online_article_${id}`;
    
    // Check cache first
    const cached = cache.get(cacheKey);
    if (cached) {
      return cached as any;
    }
    
    try {
      const response = await axios.get(`${this.baseUrl}/articles/${id}`, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        }
      });
      
      // Cache the result
      cache.set(cacheKey, response.data);
      
      return response.data;
    } catch (error) {
      console.error(`Error fetching Beck Online article ${id}:`, error);
      // Return mock data in case of error
      return this.getMockArticle(id);
    }
  }

  /**
   * Search articles by keyword
   */
  async searchArticles(keyword: string, limit: number = 10): Promise<any[]> {
    const cacheKey = `beck_online_search_${keyword}_${limit}`;
    
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
      console.error(`Error searching Beck Online articles for "${keyword}":`, error);
      // Return mock data in case of error
      return this.getMockSearchResults(keyword, limit);
    }
  }

  /**
   * Generate mock articles for testing
   */
  private getMockArticles(limit: number): any[] {
    return Array.from({ length: limit }, (_, i) => ({
      id: `beck-${i + 1}`,
      title: `Beck Online Artikel ${i + 1} zum Mietrecht`,
      date: new Date(Date.now() - i * 86400000).toISOString().split('T')[0],
      summary: `Zusammenfassung des Beck Online Artikels ${i + 1} im Bereich Mietrecht.`,
      url: `https://beck-online.example.com/artikel/${i + 1}`,
      topics: ['Mietrecht', 'Rechtsprechung', 'Praxis'],
      journal: 'NJW',
      type: 'Artikel'
    }));
  }

  /**
   * Generate mock article for testing
   */
  private getMockArticle(id: string): any {
    return {
      id,
      title: `Beck Online Artikel ${id} zum Mietrecht`,
      date: new Date().toISOString().split('T')[0],
      summary: `Ausführliche Zusammenfassung des Beck Online Artikels ${id} im Bereich Mietrecht.`,
      content: `Vollständiger Text des Beck Online Artikels ${id}.`,
      url: `https://beck-online.example.com/artikel/${id}`,
      topics: ['Mietrecht', 'Rechtsprechung', 'Praxis'],
      journal: 'NJW',
      type: 'Artikel',
      references: []
    };
  }

  /**
   * Generate mock search results for testing
   */
  private getMockSearchResults(keyword: string, limit: number): any[] {
    return Array.from({ length: limit }, (_, i) => ({
      id: `beck-search-${i + 1}`,
      title: `Suchergebnis ${i + 1} für "${keyword}"`,
      date: new Date(Date.now() - i * 86400000).toISOString().split('T')[0],
      summary: `Suchergebnis ${i + 1} für das Stichwort "${keyword}" im Bereich Mietrecht.`,
      url: `https://beck-online.example.com/suche/${keyword}/${i + 1}`,
      topics: ['Mietrecht', 'Rechtsprechung', 'Praxis'],
      journal: 'NJW',
      type: 'Artikel'
    }));
  }
}