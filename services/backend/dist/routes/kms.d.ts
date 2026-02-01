import { RedisClientType } from 'redis';
declare const router: import("express-serve-static-core").Router;
/**
 * Initialisiert die KMS-Services
 * Sollte beim Server-Start aufgerufen werden
 */
export declare function initializeKMSServices(redis: RedisClientType): void;
export default router;
