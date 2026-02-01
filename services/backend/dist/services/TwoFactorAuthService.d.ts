import { PrismaClient } from '@prisma/client';
export interface TwoFactorSetupResult {
    secret: string;
    qrCodeUrl: string;
    backupCodes: string[];
}
export interface TwoFactorVerificationResult {
    success: boolean;
    message: string;
}
export declare class TwoFactorAuthService {
    private prisma;
    constructor(prisma: PrismaClient);
    /**
     * Initialisiert 2FA für einen Benutzer
     */
    setupTwoFactor(userId: string): Promise<TwoFactorSetupResult>;
    /**
     * Verifiziert den initialen 2FA Code und aktiviert 2FA
     */
    verifyAndEnableTwoFactor(userId: string, token: string): Promise<TwoFactorVerificationResult>;
    /**
     * Verifiziert einen 2FA Code während des Login-Prozesses
     */
    verifyTwoFactorToken(userId: string, token: string): Promise<TwoFactorVerificationResult>;
    /**
     * Verifiziert einen Backup Code
     */
    private verifyBackupCode;
    /**
     * Deaktiviert 2FA für einen Benutzer
     */
    disableTwoFactor(userId: string): Promise<void>;
    /**
     * Generiert QR Code als Data URL (pseudo-Implementierung)
     */
    generateQRCodeDataUrl(qrCodeUrl: string): Promise<string>;
    /**
     * Generiert pseudo TOTP Secret
     */
    private generatePseudoSecret;
    /**
     * Verifiziert pseudo TOTP Token
     */
    private verifyPseudoToken;
    /**
     * Generiert Backup Codes
     */
    private generateBackupCodes;
    /**
     * Prüft ob 2FA für einen Benutzer aktiviert ist
     */
    isTwoFactorEnabled(userId: string): Promise<boolean>;
    /**
     * Fordert 2FA während des Login-Prozesses an
     */
    requireTwoFactorForLogin(userId: string): Promise<boolean>;
}
