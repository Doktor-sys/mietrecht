export declare const PERFORMANCE_CONFIG: {
    DATABASE_CACHE: {
        ENABLED: boolean;
        TTL_SECONDS: number;
        MAX_ITEMS: number;
    };
    RATE_LIMITING: {
        WINDOW_MS: number;
        MAX_REQUESTS: number;
    };
    PAGINATION: {
        DEFAULT_PAGE_SIZE: number;
        MAX_PAGE_SIZE: number;
    };
    TIMEOUTS: {
        DATABASE_QUERY: number;
        API_CALL: number;
        FILE_PROCESSING: number;
    };
    MEMORY_OPTIMIZATION: {
        ENABLED: boolean;
        GC_INTERVAL: number;
    };
    CONNECTION_POOL: {
        MIN_CONNECTIONS: number;
        MAX_CONNECTIONS: number;
        ACQUIRE_TIMEOUT: number;
        IDLE_TIMEOUT: number;
    };
};
