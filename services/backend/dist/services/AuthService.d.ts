import { PrismaClient, UserType } from '@prisma/client';
export interface RegisterData {
    email: string;
    password: string;
    userType: UserType;
    acceptedTerms: boolean;
    city?: string;
    firstName?: string;
    lastName?: string;
    language?: string;
}
export interface LoginCredentials {
    email: string;
    password: string;
}
export interface AuthResult {
    user: {
        id: string;
        email: string;
        userType: UserType;
        isVerified: boolean;
        profile?: {
            firstName?: string;
            lastName?: string;
            city?: string;
            language: string;
        };
    };
    tokens: {
        accessToken: string;
        refreshToken: string;
    };
    requires2FA?: boolean;
}
export interface TokenPayload {
    userId: string;
    email: string;
    userType: UserType;
    sessionId: string;
    type: 'access' | 'refresh';
}
export declare class AuthService {
    private prisma;
    private emailService;
    private twoFactorService;
    constructor(prisma: PrismaClient);
    /**
     * Registriert einen neuen Benutzer
     */
    register(data: RegisterData): Promise<AuthResult>;
    /**
     * Meldet einen Benutzer an
     */
    login(credentials: LoginCredentials, ip?: string): Promise<AuthResult>;
    /**
     * Erneuert Access Token mit Refresh Token
     */
    refreshToken(refreshToken: string): Promise<{
        accessToken: string;
    }>;
    /**
     * Meldet einen Benutzer ab
     */
    logout(userId: string, sessionId?: string): Promise<void>;
    /**
     * Verifiziert einen Access Token
     */
    verifyToken(token: string): Promise<TokenPayload>;
    /**
     * Generiert Access und Refresh Tokens
     */
    private generateTokens;
    /**
     * Generiert Access Token
     */
    private generateAccessToken;
    /**
     * Generiert Refresh Token
     */
    private generateRefreshToken;
    /**
     * Generiert eine eindeutige Session-ID
     */
    private generateSessionId;
    /**
     * Validiert Registrierungsdaten
     */
    private validateRegistrationData;
    /**
     * Prüft Rate Limiting für Login-Versuche
     */
    private checkRateLimit;
    /**
     * Passwort zurücksetzen (E-Mail senden)
     */
    requestPasswordReset(email: string): Promise<void>;
    /**
     * Passwort zurücksetzen (mit Token)
     */
    resetPassword(token: string, newPassword: string): Promise<void>;
    /**
     * Sendet Verifizierungs-E-Mail
     */
    sendVerificationEmail(user: any): Promise<void>;
    /**
     * Verifiziert E-Mail-Adresse mit Token
     */
    verifyEmailWithToken(token: string): Promise<void>;
    /**
     * Sendet Verifizierungs-E-Mail erneut
     */
    resendVerificationEmail(userId: string): Promise<void>;
    /**
     * Ändert E-Mail-Adresse (mit Verifizierung)
     */
    changeEmail(userId: string, newEmail: string, password: string): Promise<void>;
    /**
     * Bestätigt E-Mail-Änderung
     */
    confirmEmailChange(token: string): Promise<void>;
    /**
     * Hilfsmethoden
     */
    private getUserTypeDisplayName;
    private getLoginUrl;
    private getBaseUrl;
}
