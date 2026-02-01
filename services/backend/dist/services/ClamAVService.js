"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ClamAVService = void 0;
const NodeClam = require("clamscan");
const config_1 = require("../config/config");
const logger_1 = require("../utils/logger");
class ClamAVService {
    constructor() {
        this.clamScan = null;
        this.initialized = false;
        this.initializationError = null;
        this.initialize();
    }
    /**
     * Initialize ClamAV scanner
     */
    async initialize() {
        if (!config_1.config.clamav.enabled) {
            logger_1.logger.info('ClamAV scanning is disabled');
            return;
        }
        try {
            logger_1.logger.info('Initializing ClamAV scanner', {
                host: config_1.config.clamav.host,
                port: config_1.config.clamav.port
            });
            const clamScanInstance = new NodeClam();
            this.clamScan = await clamScanInstance.init({
                clamdscan: {
                    host: config_1.config.clamav.host,
                    port: config_1.config.clamav.port,
                    timeout: config_1.config.clamav.timeout,
                    localFallback: false, // Don't fall back to local binary
                },
                preference: 'clamdscan', // Always use daemon
            });
            this.initialized = true;
            logger_1.logger.info('ClamAV scanner initialized successfully');
        }
        catch (error) {
            this.initializationError = error;
            logger_1.logger.error('Failed to initialize ClamAV scanner', {
                error,
                host: config_1.config.clamav.host,
                port: config_1.config.clamav.port
            });
        }
    }
    /**
     * Check if ClamAV is available and ready
     */
    async isAvailable() {
        if (!config_1.config.clamav.enabled) {
            return false;
        }
        if (!this.initialized || !this.clamScan) {
            return false;
        }
        try {
            // Try to get version as a health check
            await this.clamScan.getVersion();
            return true;
        }
        catch (error) {
            logger_1.logger.warn('ClamAV health check failed', { error });
            return false;
        }
    }
    /**
     * Scan a buffer for viruses
     */
    async scanBuffer(buffer) {
        // If ClamAV is disabled, return clean result
        if (!config_1.config.clamav.enabled) {
            logger_1.logger.debug('ClamAV disabled, skipping scan');
            return { isInfected: false };
        }
        // If ClamAV is not available, log warning and return clean (fail-open)
        if (!this.initialized || !this.clamScan) {
            logger_1.logger.warn('ClamAV not available, skipping virus scan (fail-open)', {
                initialized: this.initialized,
                error: this.initializationError?.message
            });
            return { isInfected: false };
        }
        try {
            logger_1.logger.debug('Starting virus scan', { bufferSize: buffer.length });
            const result = await this.clamScan.scanStream(buffer);
            if (result.isInfected && result.viruses && result.viruses.length > 0) {
                logger_1.logger.warn('Virus detected in file', { viruses: result.viruses });
                return {
                    isInfected: true,
                    viruses: result.viruses
                };
            }
            logger_1.logger.debug('Virus scan completed: clean');
            return { isInfected: false };
        }
        catch (error) {
            logger_1.logger.error('Error during virus scan', { error });
            // Fail-open: If scanning fails, allow the upload but log the error
            logger_1.logger.warn('Virus scan failed, allowing upload (fail-open)');
            return { isInfected: false };
        }
    }
    /**
     * Get ClamAV version information
     */
    async getVersion() {
        if (!this.initialized || !this.clamScan) {
            return null;
        }
        try {
            const version = await this.clamScan.getVersion();
            return version;
        }
        catch (error) {
            logger_1.logger.error('Failed to get ClamAV version', { error });
            return null;
        }
    }
}
exports.ClamAVService = ClamAVService;
