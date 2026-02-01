/**
 * DATEV Connector
 * 
 * This connector handles integration with DATEV accounting software through their API.
 * It provides methods for syncing financial data and retrieving accounting information.
 */

import axios, { AxiosInstance } from 'axios';
import { AccountingEntry } from '../integrations';

// DATEV API configuration
export interface DatevConfig {
  clientId: string;
  clientSecret: string;
  accessToken: string;
  refreshToken: string;
  apiUrl?: string;
}

// DATEV API response types
interface DatevApiResponse {
  success: boolean;
  data?: any;
  error?: string;
}

interface DatevTokenResponse {
  access_token: string;
  refresh_token: string;
  expires_in: number;
}

/**
 * DATEV Connector Class
 */
export class DatevConnector {
  private client: AxiosInstance;
  private config: DatevConfig;

  /**
   * Constructor
   * @param config DATEV API configuration
   */
  constructor(config: DatevConfig) {
    this.config = config;
    this.client = axios.create({
      baseURL: config.apiUrl || 'https://api.datev.de',
      headers: {
        'Authorization': `Bearer ${config.accessToken}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    });

    // Add response interceptor for error handling
    this.client.interceptors.response.use(
      response => response,
      async error => {
        if (error.response?.status === 401) {
          // Token might be expired, try to refresh
          const newToken = await this.refreshAccessToken();
          if (newToken) {
            // Retry the original request with new token
            error.config.headers['Authorization'] = `Bearer ${newToken}`;
            return this.client.request(error.config);
          }
        }
        return Promise.reject(error);
      }
    );
  }

  /**
   * Refresh access token using refresh token
   */
  private async refreshAccessToken(): Promise<string | null> {
    try {
      const response = await this.client.post<DatevTokenResponse>('/oauth/token', {
        grant_type: 'refresh_token',
        refresh_token: this.config.refreshToken,
        client_id: this.config.clientId,
        client_secret: this.config.clientSecret
      });

      const newToken = response.data.access_token;
      this.config.accessToken = newToken;
      
      // Update the authorization header for future requests
      this.client.defaults.headers.common['Authorization'] = `Bearer ${newToken}`;
      
      return newToken;
    } catch (error) {
      console.error('Failed to refresh DATEV access token:', error);
      return null;
    }
  }

  /**
   * Test connection to DATEV API
   */
  async testConnection(): Promise<boolean> {
    try {
      await this.client.get('/api/v1/status');
      return true;
    } catch (error) {
      console.error('DATEV connection test failed:', error);
      return false;
    }
  }

  /**
   * Sync accounting entries to DATEV
   * @param entries Array of accounting entries to sync
   * @returns Boolean indicating success
   */
  async syncAccountingEntries(entries: AccountingEntry[]): Promise<boolean> {
    try {
      // Transform our internal accounting entries to DATEV format
      const datevEntries = entries.map(entry => ({
        document_number: entry.id,
        booking_date: entry.date,
        amount: entry.amount,
        currency: entry.currency,
        account: entry.category,
        cost_center: '', // Not directly available in our schema
        description: entry.description,
        tax_rate: entry.taxRate || 0,
        tax_amount: entry.taxAmount || 0,
        client_id: entry.clientId,
        case_id: entry.caseId
      }));

      const response = await this.client.post<DatevApiResponse>('/api/v1/bookings', {
        bookings: datevEntries
      });

      if (response.data.success) {
        console.log(`Successfully synced ${entries.length} accounting entries to DATEV`);
        return true;
      } else {
        throw new Error(response.data.error || 'Failed to sync accounting entries to DATEV');
      }
    } catch (error) {
      console.error('DATEV accounting entry sync failed:', error);
      throw error;
    }
  }

  /**
   * Get accounting entries from DATEV
   * @param startDate Start date for fetching entries
   * @param endDate End date for fetching entries
   * @returns Array of accounting entries
   */
  async getAccountingEntries(startDate?: string, endDate?: string): Promise<AccountingEntry[]> {
    try {
      const params: Record<string, string> = {};
      if (startDate) params.start_date = startDate;
      if (endDate) params.end_date = endDate;

      const response = await this.client.get<DatevApiResponse>('/api/v1/bookings', { params });

      if (response.data.success && response.data.data) {
        // Transform DATEV format back to our internal format
        const entries: AccountingEntry[] = response.data.data.map((item: any) => ({
          id: item.document_number,
          date: item.booking_date,
          amount: item.amount,
          currency: item.currency,
          description: item.description,
          category: item.account,
          clientId: item.client_id,
          caseId: item.case_id,
          taxRate: item.tax_rate,
          taxAmount: item.tax_amount
        }));

        console.log(`Successfully fetched ${entries.length} accounting entries from DATEV`);
        return entries;
      } else {
        throw new Error(response.data.error || 'Failed to fetch accounting entries from DATEV');
      }
    } catch (error) {
      console.error('DATEV accounting entry fetch failed:', error);
      throw error;
    }
  }
}