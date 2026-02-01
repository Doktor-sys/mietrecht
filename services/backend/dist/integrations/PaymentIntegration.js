"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PaymentIntegration = void 0;
const axios_1 = __importDefault(require("axios"));
const logger_1 = require("../utils/logger");
class PaymentIntegration {
    constructor(baseUrl, secretKey) {
        this.baseUrl = baseUrl;
        this.secretKey = secretKey;
        this.apiClient = axios_1.default.create({
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
    async createPayment(paymentData) {
        try {
            const response = await this.apiClient.post('/payments', { payment: paymentData });
            return response.data.payment;
        }
        catch (error) {
            logger_1.logger.error('Error creating payment:', error);
            throw new Error('Failed to create payment');
        }
    }
    /**
     * Holt eine Zahlung anhand ihrer ID
     */
    async getPaymentById(paymentId) {
        try {
            const response = await this.apiClient.get(`/payments/${paymentId}`);
            return response.data.payment;
        }
        catch (error) {
            logger_1.logger.error(`Error fetching payment ${paymentId}:`, error);
            throw new Error('Failed to fetch payment');
        }
    }
    /**
     * Aktualisiert den Status einer Zahlung
     */
    async updatePaymentStatus(paymentId, status) {
        try {
            const response = await this.apiClient.patch(`/payments/${paymentId}`, {
                payment: { status }
            });
            return response.data.payment;
        }
        catch (error) {
            logger_1.logger.error(`Error updating payment ${paymentId} status:`, error);
            throw new Error('Failed to update payment status');
        }
    }
    /**
     * Erstellt eine Rückerstattung
     */
    async createRefund(refundData) {
        try {
            const response = await this.apiClient.post('/refunds', { refund: refundData });
            return response.data.refund;
        }
        catch (error) {
            logger_1.logger.error('Error creating refund:', error);
            throw new Error('Failed to create refund');
        }
    }
    /**
     * Holt eine Rückerstattung anhand ihrer ID
     */
    async getRefundById(refundId) {
        try {
            const response = await this.apiClient.get(`/refunds/${refundId}`);
            return response.data.refund;
        }
        catch (error) {
            logger_1.logger.error(`Error fetching refund ${refundId}:`, error);
            throw new Error('Failed to fetch refund');
        }
    }
    /**
     * Fügt eine Zahlungsmethode hinzu
     */
    async addPaymentMethod(methodData) {
        try {
            const response = await this.apiClient.post('/payment-methods', { method: methodData });
            return response.data.method;
        }
        catch (error) {
            logger_1.logger.error('Error adding payment method:', error);
            throw new Error('Failed to add payment method');
        }
    }
    /**
     * Holt alle Zahlungsmethoden eines Kunden
     */
    async getCustomerPaymentMethods(customerId) {
        try {
            const response = await this.apiClient.get(`/customers/${customerId}/payment-methods`);
            return response.data.methods;
        }
        catch (error) {
            logger_1.logger.error(`Error fetching payment methods for customer ${customerId}:`, error);
            throw new Error('Failed to fetch payment methods');
        }
    }
    /**
     * Erstellt ein Abonnement
     */
    async createSubscription(subscriptionData) {
        try {
            const response = await this.apiClient.post('/subscriptions', { subscription: subscriptionData });
            return response.data.subscription;
        }
        catch (error) {
            logger_1.logger.error('Error creating subscription:', error);
            throw new Error('Failed to create subscription');
        }
    }
    /**
     * Holt ein Abonnement anhand seiner ID
     */
    async getSubscriptionById(subscriptionId) {
        try {
            const response = await this.apiClient.get(`/subscriptions/${subscriptionId}`);
            return response.data.subscription;
        }
        catch (error) {
            logger_1.logger.error(`Error fetching subscription ${subscriptionId}:`, error);
            throw new Error('Failed to fetch subscription');
        }
    }
    /**
     * Kündigt ein Abonnement
     */
    async cancelSubscription(subscriptionId) {
        try {
            const response = await this.apiClient.post(`/subscriptions/${subscriptionId}/cancel`);
            return response.data.subscription;
        }
        catch (error) {
            logger_1.logger.error(`Error cancelling subscription ${subscriptionId}:`, error);
            throw new Error('Failed to cancel subscription');
        }
    }
    /**
     * Holt Zahlungen mit Filtern
     */
    async getPayments(filters) {
        try {
            const params = {};
            if (filters) {
                if (filters.customerId)
                    params.customerId = filters.customerId;
                if (filters.status)
                    params.status = filters.status;
                if (filters.dateFrom)
                    params.dateFrom = filters.dateFrom.toISOString();
                if (filters.dateTo)
                    params.dateTo = filters.dateTo.toISOString();
                if (filters.limit)
                    params.limit = filters.limit;
            }
            const response = await this.apiClient.get('/payments', { params });
            return response.data.payments;
        }
        catch (error) {
            logger_1.logger.error('Error fetching payments:', error);
            throw new Error('Failed to fetch payments');
        }
    }
    /**
     * Erstellt eine Rechnung
     */
    async createInvoice(invoiceData) {
        try {
            const response = await this.apiClient.post('/invoices', { invoice: invoiceData });
            return response.data.invoice;
        }
        catch (error) {
            logger_1.logger.error('Error creating invoice:', error);
            throw new Error('Failed to create invoice');
        }
    }
}
exports.PaymentIntegration = PaymentIntegration;
