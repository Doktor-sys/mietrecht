import { PrismaClient, PaymentStatus, PaymentMethod } from '@prisma/client';
export interface PaymentIntent {
    id: string;
    amount: number;
    currency: string;
    status: PaymentStatus;
    clientSecret?: string;
    metadata: {
        bookingId: string;
        userId: string;
        lawyerId: string;
    };
}
export interface PaymentDetails {
    id: string;
    bookingId: string;
    userId: string;
    amount: number;
    currency: string;
    status: PaymentStatus;
    paymentMethod: PaymentMethod;
    transactionId?: string;
    invoiceUrl?: string;
    createdAt: Date;
    paidAt?: Date;
}
export interface Invoice {
    id: string;
    paymentId: string;
    invoiceNumber: string;
    amount: number;
    currency: string;
    taxAmount: number;
    totalAmount: number;
    issueDate: Date;
    dueDate: Date;
    pdfUrl?: string;
    items: InvoiceItem[];
}
export interface InvoiceItem {
    description: string;
    quantity: number;
    unitPrice: number;
    totalPrice: number;
    taxRate: number;
}
export interface RefundRequest {
    paymentId: string;
    amount?: number;
    reason: string;
}
export declare class PaymentService {
    private prisma;
    constructor(prisma: PrismaClient);
    /**
     * Erstellt einen Payment Intent für eine Buchung
     */
    createPaymentIntent(bookingId: string, userId: string): Promise<PaymentIntent>;
    /**
     * Bestätigt eine Zahlung
     */
    confirmPayment(paymentId: string, transactionId: string): Promise<PaymentDetails>;
    /**
     * Holt Zahlungsdetails
     */
    getPayment(paymentId: string, userId: string): Promise<PaymentDetails>;
    /**
     * Listet alle Zahlungen eines Nutzers
     */
    getUserPayments(userId: string): Promise<PaymentDetails[]>;
    /**
     * Erstellt eine Rechnung für eine Zahlung
     */
    generateInvoice(paymentId: string): Promise<Invoice>;
    /**
     * Holt Rechnung
     */
    getInvoice(invoiceId: string, userId: string): Promise<Invoice>;
    /**
     * Erstellt eine Rückerstattung
     */
    createRefund(request: RefundRequest, userId: string): Promise<PaymentDetails>;
    /**
     * Holt Zahlungsstatistiken für Anwalt
     */
    getLawyerPaymentStats(lawyerId: string): Promise<{
        totalEarnings: number;
        pendingPayments: number;
        completedPayments: number;
        refundedPayments: number;
    }>;
    private calculateDuration;
    private generateClientSecret;
    private generateInvoiceNumber;
    private mapToPaymentDetails;
    private mapToInvoice;
}
