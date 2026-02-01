import { PrismaClient, UserType } from '@prisma/client';
export interface AdvancedRegisterData {
    email: string;
    password: string;
    userType: UserType;
    acceptedTerms: boolean;
    location?: string;
    firstName?: string;
    lastName?: string;
    language?: string;
    captchaToken?: string;
    ipAddress?: string;
    userAgent?: string;
}
export interface AdvancedLoginCredentials {
    email: string;
    password: string;
    captchaToken?: string;
    ipAddress?: string;
    userAgent?: string;
    deviceId?: string;
}
export interface AdvancedAuthResult {
    user: {
        id: string;
        email: string;
        userType: UserType;
        isVerified: boolean;
        profile?: {
            firstName?: string;
            lastName?: string;
            location?: string;
            language: string;
        };
    };
    tokens: {
        accessToken: string;
        refreshToken: string;
    };
    requires2FA?: boolean;
    tempToken?: string;
    securityFlags?: {
        passwordStrength: 'weak' | 'medium' | 'strong';
        requiresPasswordChange?: boolean;
        lastLoginFromNewDevice?: boolean;
    };
}
export interface TokenPayload {
    userId: string;
    email: string;
    userType: UserType;
    sessionId: string;
    type: 'access' | 'refresh';
    deviceId?: string;
    ipHash?: string;
    scopes?: string[];
}
export interface DeviceInfo {
    id: string;
    userId: string;
    deviceId: string;
    userAgent: string;
    ipAddress: string;
    lastSeen: Date;
    isTrusted: boolean;
    location?: string;
}
export interface SecurityEvent {
    id: string;
    userId: string;
    eventType: string;
    ipAddress: string;
    userAgent: string;
    timestamp: Date;
    metadata?: any;
    riskLevel: 'low' | 'medium' | 'high' | 'critical';
}
export declare class AdvancedAuthService {
    private prisma;
    private emailService;
    private twoFactorService;
    constructor(prisma: PrismaClient);
    /**
     * Advanced user registration with enhanced security features
     */
    register(data: AdvancedRegisterData): Promise<AdvancedAuthResult>;
    /**
     * Advanced login with enhanced security features
     */
    login(credentials: AdvancedLoginCredentials): Promise<AdvancedAuthResult>;
    /**
     * Verify 2FA token
     */
    verifyTwoFactorToken(userId: string, token: string, tempToken?: string): Promise<AdvancedAuthResult>;
    /**
     * Refresh access token with enhanced security
     */
    refreshAdvancedToken(refreshToken: string, deviceId?: string, ipAddress?: string): Promise<{
        accessToken: string;
    }>;
    /**
     * Enhanced token verification with device and IP validation
     */
    verifyAdvancedToken(token: string, deviceId?: string, ipAddress?: string): Promise<TokenPayload>;
    /**
     * Enhanced logout with session invalidation
     */
    logout(userId: string, sessionId: string, allDevices?: boolean): Promise<void>;
    /**
     * Track device for user
     */
    private trackDevice;
    /**
     * Check if device is recognized
     */
    private checkDeviceRecognition;
    /**
     * Generate advanced tokens with device and IP tracking
     */
    private generateAdvancedTokens;
    /**
     * Generate advanced access token
     */
    private generateAdvancedAccessToken;
    /**
     * Generate advanced refresh token
     */
    private generateAdvancedRefreshToken;
    /**
     * Generate session ID
     */
    private generateSessionId;
    /**
     * Enhanced registration data validation
     */
    private validateAdvancedRegistrationData;
    /**
     * Analyze password strength
     */
    private analyzePasswordStrength;
    /**
     * Get password strength from hash (approximation)
     */
    private getPasswordStrengthFromHash;
    /**
     * Advanced rate limiting with device tracking
     */
    private checkAdvancedRateLimit;
    /**
     * Validate CAPTCHA token
     */
    private validateCaptcha;
    /**
     * Hash IP address for privacy
     */
    private hashIP;
    /**
     * Send advanced verification email
     */
    private sendAdvancedVerificationEmail;
}
