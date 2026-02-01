import axios, { AxiosInstance } from 'axios';
import { logger } from '../utils/logger';

interface Invoice {
  id: string;
  invoiceNumber: string;
  clientId: string;
  amount: number;
  currency: string;
  dueDate: Date;
  status: 'draft' | 'sent' | 'paid' | 'overdue';
  lineItems: InvoiceLineItem[];
  createdAt: Date;
  updatedAt: Date;
}

interface InvoiceLineItem {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  taxRate: number;
}

interface Payment {
  id: string;
  invoiceId: string;
  amount: number;
  currency: string;
  paymentDate: Date;
  paymentMethod: 'bank_transfer' | 'credit_card' | 'cash' | 'other';
  status: 'pending' | 'completed' | 'failed';
}

interface Client {
  id: string;
  name: string;
  email: string;
  vatNumber?: string;
  address: Address;
}

interface Address {
  street: string;
  city: string;
  postalCode: string;
  country: string;
}

export class AccountingIntegration {
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
   * Holt alle Rechnungen aus dem Buchhaltungssystem
   */
  async getInvoices(): Promise<Invoice[]> {
    try {
      const response = await this.apiClient.get('/invoices');
      return response.data.invoices;
    } catch (error) {
      logger.error('Error fetching invoices from accounting system:', error);
      throw new Error('Failed to fetch invoices');
    }
  }

  /**
   * Holt eine bestimmte Rechnung anhand ihrer ID
   */
  async getInvoiceById(invoiceId: string): Promise<Invoice> {
    try {
      const response = await this.apiClient.get(`/invoices/${invoiceId}`);
      return response.data.invoice;
    } catch (error) {
      logger.error(`Error fetching invoice ${invoiceId} from accounting system:`, error);
      throw new Error('Failed to fetch invoice');
    }
  }

  /**
   * Erstellt eine neue Rechnung im Buchhaltungssystem
   */
  async createInvoice(invoiceData: Omit<Invoice, 'id' | 'createdAt' | 'updatedAt'>): Promise<Invoice> {
    try {
      const response = await this.apiClient.post('/invoices', { invoice: invoiceData });
      return response.data.invoice;
    } catch (error) {
      logger.error('Error creating invoice in accounting system:', error);
      throw new Error('Failed to create invoice');
    }
  }

  /**
   * Aktualisiert eine bestehende Rechnung
   */
  async updateInvoice(invoiceId: string, invoiceData: Partial<Invoice>): Promise<Invoice> {
    try {
      const response = await this.apiClient.patch(`/invoices/${invoiceId}`, { invoice: invoiceData });
      return response.data.invoice;
    } catch (error) {
      logger.error(`Error updating invoice ${invoiceId} in accounting system:`, error);
      throw new Error('Failed to update invoice');
    }
  }

  /**
   * Löscht eine Rechnung
   */
  async deleteInvoice(invoiceId: string): Promise<void> {
    try {
      await this.apiClient.delete(`/invoices/${invoiceId}`);
    } catch (error) {
      logger.error(`Error deleting invoice ${invoiceId} from accounting system:`, error);
      throw new Error('Failed to delete invoice');
    }
  }

  /**
   * Holt alle Zahlungen aus dem Buchhaltungssystem
   */
  async getPayments(): Promise<Payment[]> {
    try {
      const response = await this.apiClient.get('/payments');
      return response.data.payments;
    } catch (error) {
      logger.error('Error fetching payments from accounting system:', error);
      throw new Error('Failed to fetch payments');
    }
  }

  /**
   * Holt eine bestimmte Zahlung anhand ihrer ID
   */
  async getPaymentById(paymentId: string): Promise<Payment> {
    try {
      const response = await this.apiClient.get(`/payments/${paymentId}`);
      return response.data.payment;
    } catch (error) {
      logger.error(`Error fetching payment ${paymentId} from accounting system:`, error);
      throw new Error('Failed to fetch payment');
    }
  }

  /**
   * Erstellt eine neue Zahlung im Buchhaltungssystem
   */
  async createPayment(paymentData: Omit<Payment, 'id'>): Promise<Payment> {
    try {
      const response = await this.apiClient.post('/payments', { payment: paymentData });
      return response.data.payment;
    } catch (error) {
      logger.error('Error creating payment in accounting system:', error);
      throw new Error('Failed to create payment');
    }
  }

  /**
   * Holt alle Mandanten/Kunden aus dem Buchhaltungssystem
   */
  async getClients(): Promise<Client[]> {
    try {
      const response = await this.apiClient.get('/clients');
      return response.data.clients;
    } catch (error) {
      logger.error('Error fetching clients from accounting system:', error);
      throw new Error('Failed to fetch clients');
    }
  }

  /**
   * Holt einen bestimmten Mandanten/Kunden anhand seiner ID
   */
  async getClientById(clientId: string): Promise<Client> {
    try {
      const response = await this.apiClient.get(`/clients/${clientId}`);
      return response.data.client;
    } catch (error) {
      logger.error(`Error fetching client ${clientId} from accounting system:`, error);
      throw new Error('Failed to fetch client');
    }
  }

  /**
   * Erstellt einen neuen Mandanten/Kunden im Buchhaltungssystem
   */
  async createClient(clientData: Omit<Client, 'id'>): Promise<Client> {
    try {
      const response = await this.apiClient.post('/clients', { client: clientData });
      return response.data.client;
    } catch (error) {
      logger.error('Error creating client in accounting system:', error);
      throw new Error('Failed to create client');
    }
  }

  /**
   * Aktualisiert einen bestehenden Mandanten/Kunden
   */
  async updateClient(clientId: string, clientData: Partial<Client>): Promise<Client> {
    try {
      const response = await this.apiClient.patch(`/clients/${clientId}`, { client: clientData });
      return response.data.client;
    } catch (error) {
      logger.error(`Error updating client ${clientId} in accounting system:`, error);
      throw new Error('Failed to update client');
    }
  }

  /**
   * Generiert einen Finanzbericht für einen bestimmten Zeitraum
   */
  async generateFinancialReport(startDate: Date, endDate: Date): Promise<any> {
    try {
      const response = await this.apiClient.get('/reports/financial', {
        params: {
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString()
        }
      });
      return response.data.report;
    } catch (error) {
      logger.error('Error generating financial report from accounting system:', error);
      throw new Error('Failed to generate financial report');
    }
  }

  /**
   * Synchronisiert Rechnungen zwischen SmartLaw und dem Buchhaltungssystem
   */
  async syncInvoices(): Promise<void> {
    try {
      // In einer echten Implementierung würden wir hier die Rechnungen synchronisieren
      logger.info('Invoice synchronization with accounting system initiated');
    } catch (error) {
      logger.error('Error synchronizing invoices with accounting system:', error);
      throw new Error('Failed to synchronize invoices');
    }
  }

  /**
   * Synchronisiert Zahlungen zwischen SmartLaw und dem Buchhaltungssystem
   */
  async syncPayments(): Promise<void> {
    try {
      // In einer echten Implementierung würden wir hier die Zahlungen synchronisieren
      logger.info('Payment synchronization with accounting system initiated');
    } catch (error) {
      logger.error('Error synchronizing payments with accounting system:', error);
      throw new Error('Failed to synchronize payments');
    }
  }
}