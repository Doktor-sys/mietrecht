export declare class RedisCacheService {
    private static instance;
    private client;
    private isConnected;
    private constructor();
    static getInstance(): RedisCacheService;
    /**
     * Holt einen Wert aus dem Cache
     */
    get<T>(key: string): Promise<T | null>;
    /**
     * Speichert einen Wert im Cache
     */
    set<T>(key: string, value: T, ttlSeconds?: number): Promise<boolean>;
    /**
     * Löscht einen Wert aus dem Cache
     */
    del(key: string): Promise<number>;
    /**
     * Prüft, ob ein Schlüssel im Cache existiert
     */
    has(key: string): Promise<boolean>;
    /**
     * Holt mehrere Werte aus dem Cache
     */
    mget<T>(keys: string[]): Promise<Array<T | null>>;
    /**
     * Speichert mehrere Werte im Cache
     */
    mset<T>(entries: Array<{
        key: string;
        value: T;
        ttl?: number;
    }>): Promise<boolean>;
    /**
     * Prüft die Verbindung zum Redis-Server
     */
    ping(): Promise<boolean>;
}
