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
export declare class AccountingIntegration {
    private apiClient;
    private baseUrl;
    private apiKey;
    constructor(baseUrl: string, apiKey: string);
    /**
     * Holt alle Rechnungen aus dem Buchhaltungssystem
     */
    getInvoices(): Promise<Invoice[]>;
    /**
     * Holt eine bestimmte Rechnung anhand ihrer ID
     */
    getInvoiceById(invoiceId: string): Promise<Invoice>;
    /**
     * Erstellt eine neue Rechnung im Buchhaltungssystem
     */
    createInvoice(invoiceData: Omit<Invoice, 'id' | 'createdAt' | 'updatedAt'>): Promise<Invoice>;
    /**
     * Aktualisiert eine bestehende Rechnung
     */
    updateInvoice(invoiceId: string, invoiceData: Partial<Invoice>): Promise<Invoice>;
    /**
     * Löscht eine Rechnung
     */
    deleteInvoice(invoiceId: string): Promise<void>;
    /**
     * Holt alle Zahlungen aus dem Buchhaltungssystem
     */
    getPayments(): Promise<Payment[]>;
    /**
     * Holt eine bestimmte Zahlung anhand ihrer ID
     */
    getPaymentById(paymentId: string): Promise<Payment>;
    /**
     * Erstellt eine neue Zahlung im Buchhaltungssystem
     */
    createPayment(paymentData: Omit<Payment, 'id'>): Promise<Payment>;
    /**
     * Holt alle Mandanten/Kunden aus dem Buchhaltungssystem
     */
    getClients(): Promise<Client[]>;
    /**
     * Holt einen bestimmten Mandanten/Kunden anhand seiner ID
     */
    getClientById(clientId: string): Promise<Client>;
    /**
     * Erstellt einen neuen Mandanten/Kunden im Buchhaltungssystem
     */
    createClient(clientData: Omit<Client, 'id'>): Promise<Client>;
    /**
     * Aktualisiert einen bestehenden Mandanten/Kunden
     */
    updateClient(clientId: string, clientData: Partial<Client>): Promise<Client>;
    /**
     * Generiert einen Finanzbericht für einen bestimmten Zeitraum
     */
    generateFinancialReport(startDate: Date, endDate: Date): Promise<any>;
    /**
     * Synchronisiert Rechnungen zwischen SmartLaw und dem Buchhaltungssystem
     */
    syncInvoices(): Promise<void>;
    /**
     * Synchronisiert Zahlungen zwischen SmartLaw und dem Buchhaltungssystem
     */
    syncPayments(): Promise<void>;
}
export {};
