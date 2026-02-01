/**
 * FastBill Connector
 * 
 * This connector handles integration with FastBill accounting software through their API.
 * It provides methods for syncing financial data and retrieving accounting information.
 */

import axios, { AxiosInstance } from 'axios';
import { AccountingEntry } from '../integrations';

// FastBill API configuration
export interface FastBillConfig {
  email: string;
  apiKey: string;
  apiUrl?: string;
}

// FastBill API response types
interface FastBillApiResponse {
  RESPONSE?: {
    STATUS: string;
    CUSTOMERS?: any[];
    INVOICES?: any[];
    ERRORS?: string[];
  };
}

interface FastBillInvoice {
  INVOICE_ID: string;
  CUSTOMER_ID: string;
  INVOICE_NUMBER: string;
  INVOICE_DATE: string;
  DUE_DATE: string;
  TOTAL_AMOUNT: number;
  PAID_DATE?: string;
  STATUS: string;
  ITEMS: FastBillInvoiceItem[];
}

interface FastBillInvoiceItem {
  ARTICLE_NUMBER: string;
  DESCRIPTION: string;
  QUANTITY: number;
  UNIT_PRICE: number;
  VAT_PERCENT: number;
  COMPLETE_NET: number;
  VAT_VALUE: number;
}

/**
 * FastBill Connector Class
 */
export class FastBillConnector {
  private client: AxiosInstance;
  private config: FastBillConfig;

  /**
   * Constructor
   * @param config FastBill API configuration
   */
  constructor(config: FastBillConfig) {
    this.config = config;
    this.client = axios.create({
      baseURL: config.apiUrl || 'https://my.fastbill.com/api/1.0/api.php',
      headers: {
        'Content-Type': 'application/xml',
        'Accept': 'application/xml'
      },
      auth: {
        username: config.email,
        password: config.apiKey
      }
    });
  }

  /**
   * Test connection to FastBill API
   */
  async testConnection(): Promise<boolean> {
    try {
      // Simple customer request to test connection
      const xmlRequest = `
        <?xml version="1.0" encoding="utf-8"?>
        <FBAPI>
          <SERVICE>customer.get</SERVICE>
          <LIMIT>1</LIMIT>
        </FBAPI>
      `;

      const response = await this.client.post<FastBillApiResponse>('', xmlRequest, {
        headers: { 'Content-Type': 'application/xml' }
      });

      return response.data.RESPONSE?.STATUS === 'success';
    } catch (error) {
      console.error('FastBill connection test failed:', error);
      return false;
    }
  }

  /**
   * Convert our internal accounting entry to FastBill invoice item
   */
  private convertToFastBillItem(entry: AccountingEntry): FastBillInvoiceItem {
    return {
      ARTICLE_NUMBER: entry.id,
      DESCRIPTION: entry.description || '',
      QUANTITY: 1,
      UNIT_PRICE: entry.amount,
      VAT_PERCENT: entry.taxRate ? entry.taxRate * 100 : 0,
      COMPLETE_NET: entry.amount,
      VAT_VALUE: entry.taxAmount || 0
    };
  }

  /**
   * Sync accounting entries to FastBill as invoices
   * @param entries Array of accounting entries to sync
   * @returns Boolean indicating success
   */
  async syncAccountingEntries(entries: AccountingEntry[]): Promise<boolean> {
    try {
      let successCount = 0;

      // Process entries in batches to avoid API limits
      const batchSize = 10;
      for (let i = 0; i < entries.length; i += batchSize) {
        const batch = entries.slice(i, i + batchSize);
        
        // For each entry, we'll create an invoice
        for (const entry of batch) {
          // First, check if customer exists or create one
          let customerId = await this.getOrCreateCustomer(entry.clientId || 'unknown');
          
          // Create invoice items from accounting entry
          const items = [this.convertToFastBillItem(entry)];
          
          // Create the invoice
          const invoiceCreated = await this.createInvoice({
            customerId,
            invoiceDate: entry.date,
            dueDate: entry.date, // Using date as dueDate since dueDate isn't in our schema
            items
          });
          
          if (invoiceCreated) {
            successCount++;
          }
        }
      }

      console.log(`Successfully synced ${successCount} out of ${entries.length} accounting entries to FastBill`);
      return successCount > 0;
    } catch (error) {
      console.error('FastBill accounting entry sync failed:', error);
      throw error;
    }
  }

  /**
   * Get or create a customer in FastBill
   */
  private async getOrCreateCustomer(clientId: string): Promise<string> {
    try {
      // Try to find existing customer
      const xmlRequest = `
        <?xml version="1.0" encoding="utf-8"?>
        <FBAPI>
          <SERVICE>customer.get</SERVICE>
          <FILTER>
            <CUSTOMER_NUMBER>${clientId}</CUSTOMER_NUMBER>
          </FILTER>
        </FBAPI>
      `;

      const response = await this.client.post<FastBillApiResponse>('', xmlRequest);

      if (response.data.RESPONSE?.CUSTOMERS && response.data.RESPONSE.CUSTOMERS.length > 0) {
        // Customer exists, return ID
        return response.data.RESPONSE.CUSTOMERS[0].CUSTOMER_ID;
      } else {
        // Create new customer
        const createRequest = `
          <?xml version="1.0" encoding="utf-8"?>
          <FBAPI>
            <SERVICE>customer.create</SERVICE>
            <DATA>
              <CUSTOMER_NUMBER>${clientId}</CUSTOMER_NUMBER>
              <CUSTOMER_TYPE>business</CUSTOMER_TYPE>
              <ORGANIZATION>${clientId}</ORGANIZATION>
            </DATA>
          </FBAPI>
        `;

        const createResponse = await this.client.post<FastBillApiResponse>('', createRequest);
        if (createResponse.data.RESPONSE?.STATUS === 'success') {
          return createResponse.data.RESPONSE.CUSTOMERS[0].CUSTOMER_ID;
        } else {
          throw new Error('Failed to create customer in FastBill');
        }
      }
    } catch (error) {
      console.error('FastBill customer lookup/creation failed:', error);
      // Return a default customer ID if we can't create one
      return '0';
    }
  }

  /**
   * Create an invoice in FastBill
   */
  private async createInvoice(data: {
    customerId: string;
    invoiceDate: string;
    dueDate: string;
    items: FastBillInvoiceItem[];
  }): Promise<boolean> {
    try {
      const xmlRequest = `
        <?xml version="1.0" encoding="utf-8"?>
        <FBAPI>
          <SERVICE>invoice.create</SERVICE>
          <DATA>
            <CUSTOMER_ID>${data.customerId}</CUSTOMER_ID>
            <INVOICE_DATE>${data.invoiceDate}</INVOICE_DATE>
            <DUE_DATE>${data.dueDate}</DUE_DATE>
            <ITEMS>
              ${data.items.map(item => `
                <ITEM>
                  <ARTICLE_NUMBER>${item.ARTICLE_NUMBER}</ARTICLE_NUMBER>
                  <DESCRIPTION>${item.DESCRIPTION}</DESCRIPTION>
                  <QUANTITY>${item.QUANTITY}</QUANTITY>
                  <UNIT_PRICE>${item.UNIT_PRICE}</UNIT_PRICE>
                  <VAT_PERCENT>${item.VAT_PERCENT}</VAT_PERCENT>
                </ITEM>
              `).join('')}
            </ITEMS>
          </DATA>
        </FBAPI>
      `;

      const response = await this.client.post<FastBillApiResponse>('', xmlRequest);
      
      if (response.data.RESPONSE?.STATUS === 'success') {
        console.log(`Successfully created invoice ${response.data.RESPONSE.INVOICES[0].INVOICE_ID}`);
        return true;
      } else {
        console.error('FastBill invoice creation failed:', response.data.RESPONSE?.ERRORS);
        return false;
      }
    } catch (error) {
      console.error('FastBill invoice creation failed:', error);
      return false;
    }
  }

  /**
   * Get invoices from FastBill
   * @param startDate Start date for fetching invoices
   * @param endDate End date for fetching invoices
   * @returns Array of accounting entries
   */
  async getAccountingEntries(startDate?: string, endDate?: string): Promise<AccountingEntry[]> {
    try {
      const filter: string[] = [];
      if (startDate) filter.push(`<START_DATE>${startDate}</START_DATE>`);
      if (endDate) filter.push(`<END_DATE>${endDate}</END_DATE>`);

      const xmlRequest = `
        <?xml version="1.0" encoding="utf-8"?>
        <FBAPI>
          <SERVICE>invoice.get</SERVICE>
          ${filter.length > 0 ? `<FILTER>${filter.join('')}</FILTER>` : ''}
        </FBAPI>
      `;

      const response = await this.client.post<FastBillApiResponse>('', xmlRequest);

      if (response.data.RESPONSE?.STATUS === 'success' && response.data.RESPONSE?.INVOICES) {
        // Transform FastBill invoices to our internal format
        const entries: AccountingEntry[] = response.data.RESPONSE.INVOICES.map((invoice: FastBillInvoice) => {
          // Calculate total amount and tax from invoice items
          const totalAmount = invoice.ITEMS.reduce((sum, item) => sum + item.COMPLETE_NET, 0);
          const totalTax = invoice.ITEMS.reduce((sum, item) => sum + item.VAT_VALUE, 0);
          
          return {
            id: invoice.INVOICE_ID,
            date: invoice.INVOICE_DATE,
            amount: totalAmount,
            currency: 'EUR', // FastBill uses EUR by default
            description: `Invoice ${invoice.INVOICE_NUMBER}`,
            category: 'revenue',
            clientId: invoice.CUSTOMER_ID,
            caseId: undefined,
            taxRate: totalAmount > 0 ? totalTax / totalAmount : 0,
            taxAmount: totalTax
          };
        });

        console.log(`Successfully fetched ${entries.length} accounting entries from FastBill`);
        return entries;
      } else {
        throw new Error(response.data.RESPONSE?.ERRORS?.join(', ') || 'Failed to fetch invoices from FastBill');
      }
    } catch (error) {
      console.error('FastBill invoice fetch failed:', error);
      throw error;
    }
  }
}