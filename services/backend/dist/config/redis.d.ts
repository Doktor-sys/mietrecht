import { RedisClientType } from 'redis';
declare class RedisService {
    private static instance;
    private client;
    private constructor();
    static getInstance(): RedisService;
    getClient(): RedisClientType;
    connect(): Promise<void>;
    disconnect(): Promise<void>;
    healthCheck(): Promise<boolean>;
    set(key: string, value: any, ttlSeconds?: number): Promise<void>;
    get<T = any>(key: string): Promise<T | null>;
    del(key: string): Promise<void>;
    exists(key: string): Promise<boolean>;
    expire(key: string, ttlSeconds: number): Promise<void>;
    setSession(sessionId: string, sessionData: any, ttlSeconds?: number): Promise<void>;
    getSession<T = any>(sessionId: string): Promise<T | null>;
    deleteSession(sessionId: string): Promise<void>;
    incrementRateLimit(key: string, windowSeconds: number): Promise<number>;
    getOrSet<T>(key: string, fetchFunction: () => Promise<T>, ttlSeconds?: number): Promise<T>;
}
export declare const redis: RedisService;
export declare const connectRedis: () => Promise<RedisClientType>;
export declare const disconnectRedis: () => Promise<void>;
export {};
