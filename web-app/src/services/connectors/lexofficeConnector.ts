/**
 * Lexoffice API Connector
 * 
 * This connector implements the integration with Lexoffice accounting system.
 * It handles authentication, data mapping, and API communication.
 */

import axios, { AxiosInstance, AxiosResponse } from 'axios';
import { AccountingEntry } from '../integrations';

// Lexoffice API types
interface LexofficeContact {
  id?: string;
  version?: number;
  roles?: {
    customer?: {
      number?: string;
    };
    vendor?: {
      number?: string;
    };
  };
  company?: string;
  firstName?: string;
  lastName?: string;
  emailAddress?: string;
  phoneNumber?: string;
  address?: {
    street?: string;
    zip?: string;
    city?: string;
    countryCode?: string;
  };
}

interface LexofficeInvoice {
  id?: string;
  version?: number;
  organizationId?: string;
  createdAt?: string;
  updatedAt?: string;
  voucherStatus?: string;
  voucherNumber?: string;
  voucherType?: string;
  date?: string;
  dueDate?: string;
  address?: {
    contactId?: string;
    name?: string;
    street?: string;
    zip?: string;
    city?: string;
    countryCode?: string;
  };
  lineItems?: Array<{
    id?: string;
    productId?: string;
    name?: string;
    description?: string;
    quantity?: number;
    unitName?: string;
    unitPrice?: {
      currency?: string;
      netAmount?: number;
      taxRatePercentage?: number;
    };
    discountPercentage?: number;
  }>;
  totalPrice?: {
    currency?: string;
    totalNetAmount?: number;
    totalGrossAmount?: number;
    totalTaxAmount?: number;
  };
  taxConditions?: {
    taxType?: string;
    taxTypeNote?: string;
  };
  paymentConditions?: {
    paymentTermDuration?: number;
    paymentTermPercentage?: number;
    paymentTermLabel?: string;
  };
  shippingConditions?: {
    shippingDate?: string;
    shippingEndDate?: string;
  };
  title?: string;
  introduction?: string;
  remark?: string;
}

interface LexofficeVoucherList {
  content: LexofficeInvoice[];
  pageable: any;
  totalPages: number;
  totalElements: number;
  last: boolean;
  size: number;
  number: number;
  sort: any;
  numberOfElements: number;
  first: boolean;
  empty: boolean;
}

// Configuration interface
export interface LexofficeConfig {
  baseUrl: string;
  apiKey: string;
}

/**
 * Lexoffice Connector Class
 */
export class LexofficeConnector {
  private client: AxiosInstance;
  private config: LexofficeConfig;

  constructor(config: LexofficeConfig) {
    this.config = config;
    
    // Initialize Axios client with base configuration
    this.client = axios.create({
      baseURL: config.baseUrl,
      timeout: 30000,
      headers: {
        'Authorization': `Bearer ${config.apiKey}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    });

    // Add response interceptor for error handling
    this.client.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 401) {
          console.error('Lexoffice API authentication failed');
        }
        return Promise.reject(error);
      }
    );
  }

  /**
   * Fetch all contacts from Lexoffice
   */
  async getContacts(): Promise<LexofficeContact[]> {
    try {
      const response: AxiosResponse<LexofficeContact[]> = await this.client.get('/contacts');
      return response.data;
    } catch (error) {
      console.error('Failed to fetch contacts from Lexoffice:', error);
      throw error;
    }
  }

  /**
   * Create a new contact in Lexoffice
   */
  async createContact(contactData: LexofficeContact): Promise<string> {
    try {
      const response: AxiosResponse<LexofficeContact> = await this.client.post('/contacts', contactData);
      return response.data.id || '';
    } catch (error) {
      console.error('Failed to create contact in Lexoffice:', error);
      throw error;
    }
  }

  /**
   * Fetch invoices from Lexoffice
   */
  async getInvoices(page: number = 0, size: number = 100): Promise<LexofficeVoucherList> {
    try {
      const response: AxiosResponse<LexofficeVoucherList> = await this.client.get('/vouchers', {
        params: {
          voucherType: 'INVOICE',
          page: page,
          size: size
        }
      });
      return response.data;
    } catch (error) {
      console.error('Failed to fetch invoices from Lexoffice:', error);
      throw error;
    }
  }

  /**
   * Create a new invoice in Lexoffice
   */
  async createInvoice(invoiceData: LexofficeInvoice): Promise<string> {
    try {
      const response: AxiosResponse<LexofficeInvoice> = await this.client.post('/vouchers', invoiceData);
      return response.data.id || '';
    } catch (error) {
      console.error('Failed to create invoice in Lexoffice:', error);
      throw error;
    }
  }

  /**
   * Fetch credit notes from Lexoffice
   */
  async getCreditNotes(page: number = 0, size: number = 100): Promise<LexofficeVoucherList> {
    try {
      const response: AxiosResponse<LexofficeVoucherList> = await this.client.get('/vouchers', {
        params: {
          voucherType: 'CREDIT_NOTE',
          page: page,
          size: size
        }
      });
      return response.data;
    } catch (error) {
      console.error('Failed to fetch credit notes from Lexoffice:', error);
      throw error;
    }
  }

  /**
   * Create a new credit note in Lexoffice
   */
  async createCreditNote(creditNoteData: LexofficeInvoice): Promise<string> {
    try {
      const response: AxiosResponse<LexofficeInvoice> = await this.client.post('/vouchers', creditNoteData);
      return response.data.id || '';
    } catch (error) {
      console.error('Failed to create credit note in Lexoffice:', error);
      throw error;
    }
  }

  /**
   * Map internal accounting entry to Lexoffice invoice format
   */
  mapAccountingEntryToInvoice(entry: AccountingEntry, contactId?: string): LexofficeInvoice {
    return {
      voucherType: 'INVOICE',
      date: entry.date,
      address: contactId ? {
        contactId: contactId
      } : undefined,
      lineItems: [{
        name: entry.description,
        quantity: 1,
        unitPrice: {
          currency: entry.currency,
          netAmount: entry.amount,
          taxRatePercentage: entry.taxRate || 0
        }
      }],
      totalPrice: {
        currency: entry.currency,
        totalNetAmount: entry.amount,
        totalTaxAmount: entry.taxAmount || 0
      }
    };
  }

  /**
   * Map Lexoffice invoice to internal accounting entry
   */
  mapInvoiceToAccountingEntry(invoice: LexofficeInvoice): AccountingEntry {
    return {
      id: invoice.id || '',
      date: invoice.date || '',
      amount: invoice.totalPrice?.totalNetAmount || 0,
      currency: invoice.totalPrice?.currency || 'EUR',
      description: invoice.lineItems?.[0]?.name || '',
      category: 'invoice',
      invoiceNumber: invoice.voucherNumber,
      isTaxRelevant: true,
      taxAmount: invoice.totalPrice?.totalTaxAmount || 0,
      taxRate: invoice.lineItems?.[0]?.unitPrice?.taxRatePercentage || 0
    };
  }

  /**
   * Sync accounting entries to Lexoffice
   */
  async syncAccountingEntries(entries: AccountingEntry[]): Promise<boolean> {
    try {
      // Get existing contacts to match client IDs
      const contacts = await this.getContacts();
      
      for (const entry of entries) {
        // Find matching contact if clientId is provided
        let contactId: string | undefined;
        if (entry.clientId) {
          const matchingContact = contacts.find(c => 
            c.roles?.customer?.number === entry.clientId || 
            c.roles?.vendor?.number === entry.clientId
          );
          contactId = matchingContact?.id;
        }
        
        // Map entry to invoice format
        const invoiceData = this.mapAccountingEntryToInvoice(entry, contactId);
        
        // Create invoice in Lexoffice
        await this.createInvoice(invoiceData);
      }
      
      return true;
    } catch (error) {
      console.error('Failed to sync accounting entries to Lexoffice:', error);
      throw error;
    }
  }

  /**
   * Fetch and convert invoices to internal accounting entries
   */
  async getAccountingEntries(): Promise<AccountingEntry[]> {
    try {
      const invoiceList = await this.getInvoices();
      return invoiceList.content.map(invoice => this.mapInvoiceToAccountingEntry(invoice));
    } catch (error) {
      console.error('Failed to fetch accounting entries from Lexoffice:', error);
      throw error;
    }
  }

  /**
   * Test connection to Lexoffice API
   */
  async testConnection(): Promise<boolean> {
    try {
      await this.client.get('/organization');
      return true;
    } catch (error) {
      console.error('Lexoffice connection test failed:', error);
      return false;
    }
  }
}

export default LexofficeConnector;