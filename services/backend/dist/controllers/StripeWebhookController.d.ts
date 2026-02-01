import { Request, Response, NextFunction } from 'express';
export declare class StripeWebhookController {
    /**
     * POST /api/webhooks/stripe
     * Verarbeitet Stripe Webhook Events
     */
    static handleWebhook(req: Request, res: Response, next: NextFunction): Promise<void>;
}
