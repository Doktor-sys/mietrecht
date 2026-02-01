import { PrismaClient } from '@prisma/client';
declare class DatabaseService {
    private static instance;
    private prisma;
    private constructor();
    static getInstance(): DatabaseService;
    getClient(): PrismaClient;
    connect(): Promise<void>;
    disconnect(): Promise<void>;
    healthCheck(): Promise<boolean>;
    transaction<T>(fn: (prisma: Omit<PrismaClient, '$connect' | '$disconnect' | '$on' | '$transaction' | '$use' | '$extends'>) => Promise<T>): Promise<T>;
}
export declare const db: DatabaseService;
export declare const prisma: PrismaClient;
export declare const connectDatabase: () => Promise<void>;
export declare const disconnectDatabase: () => Promise<void>;
export {};
