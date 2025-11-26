declare module 'clamscan' {
  interface ClamScanOptions {
    clamdscan?: {
      host?: string;
      port?: number;
      timeout?: number;
      localFallback?: boolean;
    };
    preference?: string;
  }

  interface ScanResult {
    isInfected: boolean;
    viruses?: string[];
  }

  class NodeClam {
    init(options: ClamScanOptions): Promise<NodeClam>;
    scanStream(buffer: Buffer): Promise<ScanResult>;
    getVersion(): Promise<string>;
  }

  export = NodeClam;
}
