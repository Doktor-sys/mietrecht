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
export declare class PaymentIntegration {
    private apiClient;
    private baseUrl;
    private secretKey;
    constructor(baseUrl: string, secretKey: string);
    /**
     * Erstellt eine neue Zahlung
     */
    createPayment(paymentData: Omit<Payment, 'id' | 'createdAt' | 'status'>): Promise<Payment>;
    /**
     * Holt eine Zahlung anhand ihrer ID
     */
    getPaymentById(paymentId: string): Promise<Payment>;
    /**
     * Aktualisiert den Status einer Zahlung
     */
    updatePaymentStatus(paymentId: string, status: Payment['status']): Promise<Payment>;
    /**
     * Erstellt eine Rückerstattung
     */
    createRefund(refundData: Omit<Refund, 'id' | 'createdAt' | 'status'>): Promise<Refund>;
    /**
     * Holt eine Rückerstattung anhand ihrer ID
     */
    getRefundById(refundId: string): Promise<Refund>;
    /**
     * Fügt eine Zahlungsmethode hinzu
     */
    addPaymentMethod(methodData: Omit<PaymentMethod, 'id' | 'createdAt' | 'updatedAt'>): Promise<PaymentMethod>;
    /**
     * Holt alle Zahlungsmethoden eines Kunden
     */
    getCustomerPaymentMethods(customerId: string): Promise<PaymentMethod[]>;
    /**
     * Erstellt ein Abonnement
     */
    createSubscription(subscriptionData: Omit<Subscription, 'id' | 'startDate' | 'currentPeriodStart' | 'currentPeriodEnd'>): Promise<Subscription>;
    /**
     * Holt ein Abonnement anhand seiner ID
     */
    getSubscriptionById(subscriptionId: string): Promise<Subscription>;
    /**
     * Kündigt ein Abonnement
     */
    cancelSubscription(subscriptionId: string): Promise<Subscription>;
    /**
     * Holt Zahlungen mit Filtern
     */
    getPayments(filters?: {
        customerId?: string;
        status?: Payment['status'];
        dateFrom?: Date;
        dateTo?: Date;
        limit?: number;
    }): Promise<Payment[]>;
    /**
     * Erstellt eine Rechnung
     */
    createInvoice(invoiceData: {
        customerId: string;
        items: Array<{
            description: string;
            amount: number;
            quantity: number;
        }>;
        dueDate: Date;
    }): Promise<any>;
}
export {};
