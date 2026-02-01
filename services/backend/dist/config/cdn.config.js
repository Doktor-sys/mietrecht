"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CDN_CONFIG = void 0;
// CDN-Konfiguration
exports.CDN_CONFIG = {
    // CDN-Anbieter
    provider: process.env.CDN_PROVIDER || 'cloudflare', // cloudflare, aws-cloudfront, azure-cdn, google-cloud-cdn
    // Basis-URL für das CDN
    baseUrl: process.env.CDN_BASE_URL || 'https://cdn.jurismind.example.com',
    // Asset-Konfiguration
    assets: {
        // JavaScript-Dateien
        javascript: {
            enabled: true,
            path: '/js/',
            maxAge: 31536000, // 1 Jahr
            compress: true,
            cacheBuster: true
        },
        // CSS-Dateien
        css: {
            enabled: true,
            path: '/css/',
            maxAge: 31536000, // 1 Jahr
            compress: true,
            cacheBuster: true
        },
        // Bilder
        images: {
            enabled: true,
            path: '/images/',
            maxAge: 2592000, // 30 Tage
            compress: true,
            cacheBuster: true,
            formats: ['webp', 'avif'] // Moderne Bildformate
        },
        // Fonts
        fonts: {
            enabled: true,
            path: '/fonts/',
            maxAge: 31536000, // 1 Jahr
            compress: false,
            cacheBuster: true
        },
        // Dokumente
        documents: {
            enabled: true,
            path: '/docs/',
            maxAge: 86400, // 1 Tag
            compress: true,
            cacheBuster: true
        }
    },
    // Geografische Verteilung
    geoDistribution: {
        enabled: true,
        regions: [
            'europe',
            'north-america',
            'asia-pacific'
        ],
        // Edge-Locations
        edgeLocations: [
            'fra', // Frankfurt
            'lhr', // London
            'iad', // Washington DC
            'sin', // Singapur
            'nrt' // Tokio
        ]
    },
    // Sicherheit
    security: {
        // SSL/TLS
        ssl: {
            enabled: true,
            protocol: 'TLSv1.3',
            ciphers: 'ECDHE-RSA-AES128-GCM-SHA256:ECDHE-RSA-AES256-GCM-SHA384'
        },
        // DDoS-Schutz
        ddosProtection: {
            enabled: true,
            rateLimit: 1000, // Requests pro Sekunde
            burstLimit: 5000 // Burst-Limit
        },
        // CORS
        cors: {
            enabled: true,
            origins: [
                'https://jurismind.example.com',
                'https://app.jurismind.example.com'
            ]
        }
    },
    // Performance-Optimierungen
    performance: {
        // Kompression
        compression: {
            gzip: true,
            brotli: true,
            minify: true
        },
        // Bild-Optimierung
        imageOptimization: {
            enabled: true,
            resize: true,
            quality: 80,
            formatConversion: true
        },
        // HTTP/2
        http2: {
            enabled: true
        },
        // HTTP/3
        http3: {
            enabled: true
        }
    },
    // Caching-Strategien
    caching: {
        // Browser-Caching
        browser: {
            enabled: true,
            maxAge: 31536000 // 1 Jahr
        },
        // Edge-Caching
        edge: {
            enabled: true,
            ttl: 86400 // 24 Stunden
        },
        // Origin-Caching
        origin: {
            enabled: true,
            ttl: 300 // 5 Minuten
        }
    },
    // Monitoring und Logging
    monitoring: {
        analytics: {
            enabled: true,
            samplingRate: 0.1 // 10% der Requests
        },
        logging: {
            enabled: true,
            level: 'info'
        },
        metrics: {
            enabled: true,
            interval: 60 // Sekunden
        }
    },
    // Failover und Redundanz
    failover: {
        enabled: true,
        backupCdn: process.env.BACKUP_CDN_URL || 'https://backup-cdn.jurismind.example.com',
        healthCheckInterval: 30000, // 30 Sekunden
        failoverTimeout: 5000 // 5 Sekunden
    }
};
