export interface EmailTemplate {
    subject: string;
    html: string;
    text: string;
}
export interface EmailOptions {
    to: string;
    subject: string;
    html?: string;
    text?: string;
    template?: string;
    templateData?: Record<string, any>;
}
export interface VerificationEmailData {
    firstName?: string;
    verificationUrl: string;
    expiresIn: string;
}
export interface PasswordResetEmailData {
    firstName?: string;
    resetUrl: string;
    expiresIn: string;
}
export interface WelcomeEmailData {
    firstName?: string;
    userType: string;
    loginUrl: string;
}
export interface ReportNotificationData {
    organizationName: string;
    reportType: string;
    period: string;
    summary: {
        totalApiCalls: number;
        totalDocuments: number;
        successRate: number;
        totalCost: number;
    };
    reportUrl: string;
    generatedAt: Date;
}
export declare class EmailService {
    private transporter;
    private templates;
    constructor();
    /**
     * Sendet eine E-Mail-Verifizierung
     */
    sendVerificationEmail(email: string, verificationToken: string, userData: VerificationEmailData): Promise<void>;
    /**
     * Sendet eine Passwort-Reset-E-Mail
     */
    sendPasswordResetEmail(email: string, resetToken: string, userData: PasswordResetEmailData): Promise<void>;
    /**
     * Sendet eine Willkommens-E-Mail
     */
    sendWelcomeEmail(email: string, userData: WelcomeEmailData): Promise<void>;
    /**
     * Sendet eine Report-Benachrichtigung
     */
    sendReportNotification(email: string, reportData: ReportNotificationData): Promise<void>;
    /**
     * Sendet eine E-Mail mit Template
     */
    sendTemplatedEmail(to: string, templateName: string, templateData: Record<string, any>): Promise<void>;
    /**
     * Sendet eine einfache E-Mail
     */
    sendEmail(options: EmailOptions): Promise<void>;
    /**
     * Verifiziert die E-Mail-Konfiguration
     */
    verifyConnection(): Promise<boolean>;
    /**
     * Initialisiert E-Mail-Templates
     */
    private initializeTemplates;
    /**
     * Simple Mustache-like renderer
     */
    private renderTemplate;
    /**
     * Prüft Rate Limiting für E-Mail-Versand
     */
    private checkEmailRateLimit;
    /**
     * Maskiert E-Mail-Adresse für Logging
     */
    private maskEmail;
    /**
     * Gibt die Basis-URL der Anwendung zurück
     */
    private getBaseUrl;
}
