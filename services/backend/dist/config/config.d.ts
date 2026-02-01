export declare const config: {
    port: number;
    nodeEnv: string;
    host: string;
    database: {
        url: string;
        pool: {
            min: number;
            max: number;
            acquireTimeout: number;
            createTimeout: number;
            destroyTimeout: number;
            idleTimeout: number;
            evictionRunInterval: number;
            softIdleTimeoutMillis: number;
        };
    };
    redis: {
        url: string;
        pool: {
            min: number;
            max: number;
            acquireTimeout: number;
            idleTimeout: number;
        };
        cache: {
            defaultTTL: number;
            maxMemory: string;
            evictionPolicy: string;
            lazyFree: boolean;
        };
    };
    jwt: {
        secret: string;
        expiresIn: string;
        refreshExpiresIn: string;
    };
    cors: {
        allowedOrigins: string[];
    };
    email: {
        host: string;
        port: number;
        secure: boolean;
        user: string;
        password: string;
        from: string;
    };
    minio: {
        endpoint: string;
        port: number;
        useSSL: boolean;
        accessKey: string;
        secretKey: string;
        bucketName: string;
    };
    elasticsearch: {
        url: string;
        index: string;
    };
    upload: {
        maxFileSize: number;
        allowedMimeTypes: string[];
    };
    rateLimit: {
        windowMs: number;
        max: number;
        authMax: number;
    };
    kms: {
        masterKey: string;
        cacheTTL: number;
        cacheMaxKeys: number;
        autoRotationEnabled: boolean;
        defaultRotationDays: number;
        auditRetentionDays: number;
        auditHmacKey: string;
        hsmEnabled: boolean;
        vaultUrl: string;
        vaultToken: string;
    };
    clamav: {
        host: string;
        port: number;
        timeout: number;
        enabled: boolean;
    };
    tls: {
        enabled: boolean;
        certPath: string;
        keyPath: string;
        caPath: string;
        minVersion: string;
    };
    openai: {
        apiKey: string;
    };
    monitoring: {
        slackWebhookUrl: any;
        slackChannel: any;
        pagerDutyIntegrationKey: any;
        pagerDutyApiKey: any;
        teamsWebhookUrl: any;
        twilioAccountSid: any;
        twilioAuthToken: any;
        twilioFromNumber: any;
        twilioCriticalAlertNumbers: any;
        customWebhookUrls: any;
        emailRecipients: any;
        alertDeduplicationWindowMs: number;
        correlationEnabled: boolean;
        correlationWindowMs: number;
    };
    security: {
        passwordMinLength: number;
        bcryptRounds: number;
    };
};
export declare function validateConfig(): void;
