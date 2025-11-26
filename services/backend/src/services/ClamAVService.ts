import NodeClam = require('clamscan');
import { config } from '../config/config';
import { logger } from '../utils/logger';

export interface VirusScanResult {
    isInfected: boolean;
    viruses?: string[];
}

export class ClamAVService {
    private clamScan: NodeClam | null = null;
    private initialized: boolean = false;
    private initializationError: Error | null = null;

    constructor() {
        this.initialize();
    }

    /**
     * Initialize ClamAV scanner
     */
    private async initialize(): Promise<void> {
        if (!config.clamav.enabled) {
            logger.info('ClamAV scanning is disabled');
            return;
        }

        try {
            logger.info('Initializing ClamAV scanner', {
                host: config.clamav.host,
                port: config.clamav.port
            });

            const clamScanInstance = new NodeClam();
            this.clamScan = await clamScanInstance.init({
                clamdscan: {
                    host: config.clamav.host,
                    port: config.clamav.port,
                    timeout: config.clamav.timeout,
                    localFallback: false, // Don't fall back to local binary
                },
                preference: 'clamdscan', // Always use daemon
            });

            this.initialized = true;
            logger.info('ClamAV scanner initialized successfully');
        } catch (error) {
            this.initializationError = error as Error;
            logger.error('Failed to initialize ClamAV scanner', {
                error,
                host: config.clamav.host,
                port: config.clamav.port
            });
        }
    }

    /**
     * Check if ClamAV is available and ready
     */
    async isAvailable(): Promise<boolean> {
        if (!config.clamav.enabled) {
            return false;
        }

        if (!this.initialized || !this.clamScan) {
            return false;
        }

        try {
            // Try to get version as a health check
            await this.clamScan.getVersion();
            return true;
        } catch (error) {
            logger.warn('ClamAV health check failed', { error });
            return false;
        }
    }

    /**
     * Scan a buffer for viruses
     */
    async scanBuffer(buffer: Buffer): Promise<VirusScanResult> {
        // If ClamAV is disabled, return clean result
        if (!config.clamav.enabled) {
            logger.debug('ClamAV disabled, skipping scan');
            return { isInfected: false };
        }

        // If ClamAV is not available, log warning and return clean (fail-open)
        if (!this.initialized || !this.clamScan) {
            logger.warn('ClamAV not available, skipping virus scan (fail-open)', {
                initialized: this.initialized,
                error: this.initializationError?.message
            });
            return { isInfected: false };
        }

        try {
            logger.debug('Starting virus scan', { bufferSize: buffer.length });

            const result = await this.clamScan.scanStream(buffer);

            if (result.isInfected && result.viruses && result.viruses.length > 0) {
                logger.warn('Virus detected in file', { viruses: result.viruses });
                return {
                    isInfected: true,
                    viruses: result.viruses
                };
            }

            logger.debug('Virus scan completed: clean');
            return { isInfected: false };
        } catch (error) {
            logger.error('Error during virus scan', { error });

            // Fail-open: If scanning fails, allow the upload but log the error
            logger.warn('Virus scan failed, allowing upload (fail-open)');
            return { isInfected: false };
        }
    }

    /**
     * Get ClamAV version information
     */
    async getVersion(): Promise<string | null> {
        if (!this.initialized || !this.clamScan) {
            return null;
        }

        try {
            const version = await this.clamScan.getVersion();
            return version;
        } catch (error) {
            logger.error('Failed to get ClamAV version', { error });
            return null;
        }
    }
}