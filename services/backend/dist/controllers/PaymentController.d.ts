import { Request, Response, NextFunction } from 'express';
export declare class PaymentController {
    /**
     * POST /api/payments/intent
     * Erstellt einen Payment Intent für eine Buchung
     */
    static createPaymentIntent(req: Request, res: Response, next: NextFunction): Promise<void>;
    /**
     * POST /api/payments/:paymentId/confirm
     * Bestätigt eine Zahlung
     */
    static confirmPayment(req: Request, res: Response, next: NextFunction): Promise<void>;
    /**
     * GET /api/payments/:paymentId
     * Holt Zahlungsdetails
     */
    static getPayment(req: Request, res: Response, next: NextFunction): Promise<void>;
    /**
     * GET /api/payments
     * Listet alle Zahlungen des Nutzers
     */
    static getUserPayments(req: Request, res: Response, next: NextFunction): Promise<void>;
    /**
     * POST /api/payments/:paymentId/invoice
     * Generiert eine Rechnung
     */
    static generateInvoice(req: Request, res: Response, next: NextFunction): Promise<void>;
    /**
     * GET /api/invoices/:invoiceId
     * Holt Rechnungsdetails
     */
    static getInvoice(req: Request, res: Response, next: NextFunction): Promise<void>;
    /**
     * POST /api/payments/:paymentId/refund
     * Erstellt eine Rückerstattung
     */
    static createRefund(req: Request, res: Response, next: NextFunction): Promise<void>;
    /**
     * GET /api/lawyers/:lawyerId/payment-stats
     * Holt Zahlungsstatistiken für Anwalt
     */
    static getLawyerPaymentStats(req: Request, res: Response, next: NextFunction): Promise<void>;
}
