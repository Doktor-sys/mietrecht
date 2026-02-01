export declare const DATABASE_REPLICA_CONFIG: {
    primary: {
        host: any;
        port: number;
        database: any;
        username: any;
        password: any;
        ssl: boolean;
    };
    replicas: {
        id: string;
        host: any;
        port: number;
        database: any;
        username: any;
        password: any;
        ssl: boolean;
        weight: number;
    }[];
    loadBalancing: {
        strategy: string;
        healthCheckInterval: number;
        failoverTimeout: number;
        maxRetries: number;
    };
    connectionPool: {
        minConnections: number;
        maxConnections: number;
        acquireTimeout: number;
        idleTimeout: number;
        maxUses: number;
    };
};
