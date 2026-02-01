export interface VirusScanResult {
    isInfected: boolean;
    viruses?: string[];
}
export declare class ClamAVService {
    private clamScan;
    private initialized;
    private initializationError;
    constructor();
    /**
     * Initialize ClamAV scanner
     */
    private initialize;
    /**
     * Check if ClamAV is available and ready
     */
    isAvailable(): Promise<boolean>;
    /**
     * Scan a buffer for viruses
     */
    scanBuffer(buffer: Buffer): Promise<VirusScanResult>;
    /**
     * Get ClamAV version information
     */
    getVersion(): Promise<string | null>;
}
