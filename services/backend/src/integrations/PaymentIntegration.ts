import axios, { AxiosInstance } from 'axios';
import { logger } from '../utils/logger';

interface Payment {
  id: string;
  amount: number;
  currency: string;
  status: 'pending' | 'completed' | 'failed' | 'refunded';
  method: 'credit_card' | 'bank_transfer' | 'paypal' | 'sepa';
  createdAt: Date;
  completedAt?: Date;
  refundedAt?: Date;
  reference: string;
  description: string;
  metadata?: Record<string, any>;
}

interface PaymentMethod {
  id: string;
  type: 'credit_card' | 'bank_account' | 'paypal';
  details: Record<string, any>;
  isDefault: boolean;
  createdAt: Date;
  updatedAt: Date;
}

interface Refund {
  id: string;
  paymentId: string;
  amount: number;
  reason: string;
  status: 'pending' | 'completed' | 'failed';
  createdAt: Date;
  completedAt?: Date;
}

interface Subscription {
  id: string;
  customerId: string;
  planId: string;
  status: 'active' | 'cancelled' | 'past_due' | 'paused';
  startDate: Date;
  endDate?: Date;
  currentPeriodStart: Date;
  currentPeriodEnd: Date;
  cancelAtPeriodEnd: boolean;
}

export class PaymentIntegration {
  private apiClient: AxiosInstance;
  private baseUrl: string;
  private secretKey: string;

  constructor(baseUrl: string, secretKey: string) {
    this.baseUrl = baseUrl;
    this.secretKey = secretKey;
    
    this.apiClient = axios.create({
      baseURL: this.baseUrl,
      headers: {
        'Authorization': `Bearer ${this.secretKey}`,
        'Content-Type': 'application/json'
      }
    });
  }

  /**
   * Erstellt eine neue Zahlung
   */
  async createPayment(paymentData: Omit<Payment, 'id' | 'createdAt' | 'status'>): Promise<Payment> {
    try {
      const response = await this.apiClient.post('/payments', { payment: paymentData });
      return response.data.payment;
    } catch (error) {
      logger.error('Error creating payment:', error);
      throw new Error('Failed to create payment');
    }
  }

  /**
   * Holt eine Zahlung anhand ihrer ID
   */
  async getPaymentById(paymentId: string): Promise<Payment> {
    try {
      const response = await this.apiClient.get(`/payments/${paymentId}`);
      return response.data.payment;
    } catch (error) {
      logger.error(`Error fetching payment ${paymentId}:`, error);
      throw new Error('Failed to fetch payment');
    }
  }

  /**
   * Aktualisiert den Status einer Zahlung
   */
  async updatePaymentStatus(paymentId: string, status: Payment['status']): Promise<Payment> {
    try {
      const response = await this.apiClient.patch(`/payments/${paymentId}`, { 
        payment: { status } 
      });
      return response.data.payment;
    } catch (error) {
      logger.error(`Error updating payment ${paymentId} status:`, error);
      throw new Error('Failed to update payment status');
    }
  }

  /**
   * Erstellt eine Rückerstattung
   */
  async createRefund(refundData: Omit<Refund, 'id' | 'createdAt' | 'status'>): Promise<Refund> {
    try {
      const response = await this.apiClient.post('/refunds', { refund: refundData });
      return response.data.refund;
    } catch (error) {
      logger.error('Error creating refund:', error);
      throw new Error('Failed to create refund');
    }
  }

  /**
   * Holt eine Rückerstattung anhand ihrer ID
   */
  async getRefundById(refundId: string): Promise<Refund> {
    try {
      const response = await this.apiClient.get(`/refunds/${refundId}`);
      return response.data.refund;
    } catch (error) {
      logger.error(`Error fetching refund ${refundId}:`, error);
      throw new Error('Failed to fetch refund');
    }
  }

  /**
   * Fügt eine Zahlungsmethode hinzu
   */
  async addPaymentMethod(methodData: Omit<PaymentMethod, 'id' | 'createdAt' | 'updatedAt'>): Promise<PaymentMethod> {
    try {
      const response = await this.apiClient.post('/payment-methods', { method: methodData });
      return response.data.method;
    } catch (error) {
      logger.error('Error adding payment method:', error);
      throw new Error('Failed to add payment method');
    }
  }

  /**
   * Holt alle Zahlungsmethoden eines Kunden
   */
  async getCustomerPaymentMethods(customerId: string): Promise<PaymentMethod[]> {
    try {
      const response = await this.apiClient.get(`/customers/${customerId}/payment-methods`);
      return response.data.methods;
    } catch (error) {
      logger.error(`Error fetching payment methods for customer ${customerId}:`, error);
      throw new Error('Failed to fetch payment methods');
    }
  }

  /**
   * Erstellt ein Abonnement
   */
  async createSubscription(subscriptionData: Omit<Subscription, 'id' | 'startDate' | 'currentPeriodStart' | 'currentPeriodEnd'>): Promise<Subscription> {
    try {
      const response = await this.apiClient.post('/subscriptions', { subscription: subscriptionData });
      return response.data.subscription;
    } catch (error) {
      logger.error('Error creating subscription:', error);
      throw new Error('Failed to create subscription');
    }
  }

  /**
   * Holt ein Abonnement anhand seiner ID
   */
  async getSubscriptionById(subscriptionId: string): Promise<Subscription> {
    try {
      const response = await this.apiClient.get(`/subscriptions/${subscriptionId}`);
      return response.data.subscription;
    } catch (error) {
      logger.error(`Error fetching subscription ${subscriptionId}:`, error);
      throw new Error('Failed to fetch subscription');
    }
  }

  /**
   * Kündigt ein Abonnement
   */
  async cancelSubscription(subscriptionId: string): Promise<Subscription> {
    try {
      const response = await this.apiClient.post(`/subscriptions/${subscriptionId}/cancel`);
      return response.data.subscription;
    } catch (error) {
      logger.error(`Error cancelling subscription ${subscriptionId}:`, error);
      throw new Error('Failed to cancel subscription');
    }
  }

  /**
   * Holt Zahlungen mit Filtern
   */
  async getPayments(filters?: {
    customerId?: string;
    status?: Payment['status'];
    dateFrom?: Date;
    dateTo?: Date;
    limit?: number;
  }): Promise<Payment[]> {
    try {
      const params: any = {};
      
      if (filters) {
        if (filters.customerId) params.customerId = filters.customerId;
        if (filters.status) params.status = filters.status;
        if (filters.dateFrom) params.dateFrom = filters.dateFrom.toISOString();
        if (filters.dateTo) params.dateTo = filters.dateTo.toISOString();
        if (filters.limit) params.limit = filters.limit;
      }
      
      const response = await this.apiClient.get('/payments', { params });
      return response.data.payments;
    } catch (error) {
      logger.error('Error fetching payments:', error);
      throw new Error('Failed to fetch payments');
    }
  }

  /**
   * Erstellt eine Rechnung
   */
  async createInvoice(invoiceData: {
    customerId: string;
    items: Array<{ description: string; amount: number; quantity: number }>;
    dueDate: Date;
  }): Promise<any> {
    try {
      const response = await this.apiClient.post('/invoices', { invoice: invoiceData });
      return response.data.invoice;
    } catch (error) {
      logger.error('Error creating invoice:', error);
      throw new Error('Failed to create invoice');
    }
  }
}