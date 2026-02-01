import { PrismaClient, User } from '@prisma/client';
interface UserWithProfile extends User {
    profile?: any;
    preferences?: any;
}
export interface UpdateProfileData {
    firstName?: string;
    lastName?: string;
    location?: string;
    language?: string;
    accessibilityNeeds?: any;
}
export interface UpdatePreferencesData {
    language?: string;
    notifications?: {
        email?: boolean;
        push?: boolean;
        sms?: boolean;
    };
    privacy?: {
        dataSharing?: boolean;
        analytics?: boolean;
        marketing?: boolean;
    };
    accessibility?: any;
    legalTopics?: string[];
    frequentDocuments?: string[];
    alerts?: any;
}
export interface UserStats {
    totalUsers: number;
    activeUsers: number;
    verifiedUsers: number;
    usersByType: {
        tenant: number;
        landlord: number;
        business: number;
    };
    usersByLocation: Record<string, number>;
}
export declare class UserService {
    private prisma;
    private cacheService;
    constructor(prisma: PrismaClient);
    /**
     * Holt einen Benutzer anhand seiner ID (mit Caching)
     */
    getUserById(id: string): Promise<UserWithProfile | null>;
    /**
     * Holt einen Benutzer anhand seiner E-Mail (mit Caching)
     */
    getUserByEmail(email: string): Promise<UserWithProfile | null>;
    /**
     * Erstellt einen neuen Benutzer
     */
    createUser(userData: {
        email: string;
        password: string;
        userType: string;
    }): Promise<User>;
    /**
     * Aktualisiert einen Benutzer
     */
    updateUser(id: string, updates: Partial<User>): Promise<User>;
    /**
     * Löscht einen Benutzer
     */
    deleteUser(id: string): Promise<void>;
    /**
     * Holt alle Benutzer mit Pagination
     */
    getAllUsers(page?: number, pageSize?: number): Promise<{
        users: User[];
        totalCount: number;
    }>;
    /**
     * Prüft das Passwort eines Benutzers
     */
    validatePassword(email: string, password: string): Promise<boolean>;
    /**
     * Löscht den Cache für einen Benutzer
     */
    clearUserCache(id: string, email?: string): void;
    /**
     * Aktualisiert das Profil eines Benutzers
     */
    updateProfile(userId: string, data: UpdateProfileData): Promise<any>;
    /**
     * Aktualisiert die Präferenzen eines Benutzers
     */
    updatePreferences(userId: string, data: UpdatePreferencesData): Promise<any>;
    /**
     * Holt die Präferenzen
     */
    getPreferences(userId: string): Promise<any | null>;
    /**
     * Deaktiviert einen Benutzer
     */
    deactivateUser(userId: string, reason?: string): Promise<void>;
    /**
     * Reaktiviert einen Benutzer
     */
    reactivateUser(userId: string): Promise<void>;
    /**
     * Verifiziert E-Mail
     */
    verifyEmail(userId: string): Promise<void>;
    /**
     * Sucht Benutzer (Admin/Business)
     */
    searchUsers(filters: any, page: number, limit: number, requestorType: string): Promise<any>;
    /**
     * Benutzer-Statistiken
     */
    getUserStats(requestorType: string): Promise<UserStats>;
    /**
     * Exportiert User Daten
     */
    exportUserData(userId: string): Promise<any>;
    /**
     * Löscht User Daten (DSGVO)
     */
    deleteUserData(userId: string): Promise<void>;
    /**
     * Holt Cache-Statistiken
     */
    getCacheStats(): any;
}
export {};
