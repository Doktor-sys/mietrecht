export declare const CDN_CONFIG: {
    provider: any;
    baseUrl: any;
    assets: {
        javascript: {
            enabled: boolean;
            path: string;
            maxAge: number;
            compress: boolean;
            cacheBuster: boolean;
        };
        css: {
            enabled: boolean;
            path: string;
            maxAge: number;
            compress: boolean;
            cacheBuster: boolean;
        };
        images: {
            enabled: boolean;
            path: string;
            maxAge: number;
            compress: boolean;
            cacheBuster: boolean;
            formats: string[];
        };
        fonts: {
            enabled: boolean;
            path: string;
            maxAge: number;
            compress: boolean;
            cacheBuster: boolean;
        };
        documents: {
            enabled: boolean;
            path: string;
            maxAge: number;
            compress: boolean;
            cacheBuster: boolean;
        };
    };
    geoDistribution: {
        enabled: boolean;
        regions: string[];
        edgeLocations: string[];
    };
    security: {
        ssl: {
            enabled: boolean;
            protocol: string;
            ciphers: string;
        };
        ddosProtection: {
            enabled: boolean;
            rateLimit: number;
            burstLimit: number;
        };
        cors: {
            enabled: boolean;
            origins: string[];
        };
    };
    performance: {
        compression: {
            gzip: boolean;
            brotli: boolean;
            minify: boolean;
        };
        imageOptimization: {
            enabled: boolean;
            resize: boolean;
            quality: number;
            formatConversion: boolean;
        };
        http2: {
            enabled: boolean;
        };
        http3: {
            enabled: boolean;
        };
    };
    caching: {
        browser: {
            enabled: boolean;
            maxAge: number;
        };
        edge: {
            enabled: boolean;
            ttl: number;
        };
        origin: {
            enabled: boolean;
            ttl: number;
        };
    };
    monitoring: {
        analytics: {
            enabled: boolean;
            samplingRate: number;
        };
        logging: {
            enabled: boolean;
            level: string;
        };
        metrics: {
            enabled: boolean;
            interval: number;
        };
    };
    failover: {
        enabled: boolean;
        backupCdn: any;
        healthCheckInterval: number;
        failoverTimeout: number;
    };
};
