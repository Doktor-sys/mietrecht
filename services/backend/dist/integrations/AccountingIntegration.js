"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AccountingIntegration = void 0;
const axios_1 = __importDefault(require("axios"));
const logger_1 = require("../utils/logger");
class AccountingIntegration {
    constructor(baseUrl, apiKey) {
        this.baseUrl = baseUrl;
        this.apiKey = apiKey;
        this.apiClient = axios_1.default.create({
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
    async getInvoices() {
        try {
            const response = await this.apiClient.get('/invoices');
            return response.data.invoices;
        }
        catch (error) {
            logger_1.logger.error('Error fetching invoices from accounting system:', error);
            throw new Error('Failed to fetch invoices');
        }
    }
    /**
     * Holt eine bestimmte Rechnung anhand ihrer ID
     */
    async getInvoiceById(invoiceId) {
        try {
            const response = await this.apiClient.get(`/invoices/${invoiceId}`);
            return response.data.invoice;
        }
        catch (error) {
            logger_1.logger.error(`Error fetching invoice ${invoiceId} from accounting system:`, error);
            throw new Error('Failed to fetch invoice');
        }
    }
    /**
     * Erstellt eine neue Rechnung im Buchhaltungssystem
     */
    async createInvoice(invoiceData) {
        try {
            const response = await this.apiClient.post('/invoices', { invoice: invoiceData });
            return response.data.invoice;
        }
        catch (error) {
            logger_1.logger.error('Error creating invoice in accounting system:', error);
            throw new Error('Failed to create invoice');
        }
    }
    /**
     * Aktualisiert eine bestehende Rechnung
     */
    async updateInvoice(invoiceId, invoiceData) {
        try {
            const response = await this.apiClient.patch(`/invoices/${invoiceId}`, { invoice: invoiceData });
            return response.data.invoice;
        }
        catch (error) {
            logger_1.logger.error(`Error updating invoice ${invoiceId} in accounting system:`, error);
            throw new Error('Failed to update invoice');
        }
    }
    /**
     * Löscht eine Rechnung
     */
    async deleteInvoice(invoiceId) {
        try {
            await this.apiClient.delete(`/invoices/${invoiceId}`);
        }
        catch (error) {
            logger_1.logger.error(`Error deleting invoice ${invoiceId} from accounting system:`, error);
            throw new Error('Failed to delete invoice');
        }
    }
    /**
     * Holt alle Zahlungen aus dem Buchhaltungssystem
     */
    async getPayments() {
        try {
            const response = await this.apiClient.get('/payments');
            return response.data.payments;
        }
        catch (error) {
            logger_1.logger.error('Error fetching payments from accounting system:', error);
            throw new Error('Failed to fetch payments');
        }
    }
    /**
     * Holt eine bestimmte Zahlung anhand ihrer ID
     */
    async getPaymentById(paymentId) {
        try {
            const response = await this.apiClient.get(`/payments/${paymentId}`);
            return response.data.payment;
        }
        catch (error) {
            logger_1.logger.error(`Error fetching payment ${paymentId} from accounting system:`, error);
            throw new Error('Failed to fetch payment');
        }
    }
    /**
     * Erstellt eine neue Zahlung im Buchhaltungssystem
     */
    async createPayment(paymentData) {
        try {
            const response = await this.apiClient.post('/payments', { payment: paymentData });
            return response.data.payment;
        }
        catch (error) {
            logger_1.logger.error('Error creating payment in accounting system:', error);
            throw new Error('Failed to create payment');
        }
    }
    /**
     * Holt alle Mandanten/Kunden aus dem Buchhaltungssystem
     */
    async getClients() {
        try {
            const response = await this.apiClient.get('/clients');
            return response.data.clients;
        }
        catch (error) {
            logger_1.logger.error('Error fetching clients from accounting system:', error);
            throw new Error('Failed to fetch clients');
        }
    }
    /**
     * Holt einen bestimmten Mandanten/Kunden anhand seiner ID
     */
    async getClientById(clientId) {
        try {
            const response = await this.apiClient.get(`/clients/${clientId}`);
            return response.data.client;
        }
        catch (error) {
            logger_1.logger.error(`Error fetching client ${clientId} from accounting system:`, error);
            throw new Error('Failed to fetch client');
        }
    }
    /**
     * Erstellt einen neuen Mandanten/Kunden im Buchhaltungssystem
     */
    async createClient(clientData) {
        try {
            const response = await this.apiClient.post('/clients', { client: clientData });
            return response.data.client;
        }
        catch (error) {
            logger_1.logger.error('Error creating client in accounting system:', error);
            throw new Error('Failed to create client');
        }
    }
    /**
     * Aktualisiert einen bestehenden Mandanten/Kunden
     */
    async updateClient(clientId, clientData) {
        try {
            const response = await this.apiClient.patch(`/clients/${clientId}`, { client: clientData });
            return response.data.client;
        }
        catch (error) {
            logger_1.logger.error(`Error updating client ${clientId} in accounting system:`, error);
            throw new Error('Failed to update client');
        }
    }
    /**
     * Generiert einen Finanzbericht für einen bestimmten Zeitraum
     */
    async generateFinancialReport(startDate, endDate) {
        try {
            const response = await this.apiClient.get('/reports/financial', {
                params: {
                    startDate: startDate.toISOString(),
                    endDate: endDate.toISOString()
                }
            });
            return response.data.report;
        }
        catch (error) {
            logger_1.logger.error('Error generating financial report from accounting system:', error);
            throw new Error('Failed to generate financial report');
        }
    }
    /**
     * Synchronisiert Rechnungen zwischen SmartLaw und dem Buchhaltungssystem
     */
    async syncInvoices() {
        try {
            // In einer echten Implementierung würden wir hier die Rechnungen synchronisieren
            logger_1.logger.info('Invoice synchronization with accounting system initiated');
        }
        catch (error) {
            logger_1.logger.error('Error synchronizing invoices with accounting system:', error);
            throw new Error('Failed to synchronize invoices');
        }
    }
    /**
     * Synchronisiert Zahlungen zwischen SmartLaw und dem Buchhaltungssystem
     */
    async syncPayments() {
        try {
            // In einer echten Implementierung würden wir hier die Zahlungen synchronisieren
            logger_1.logger.info('Payment synchronization with accounting system initiated');
        }
        catch (error) {
            logger_1.logger.error('Error synchronizing payments with accounting system:', error);
            throw new Error('Failed to synchronize payments');
        }
    }
}
exports.AccountingIntegration = AccountingIntegration;
