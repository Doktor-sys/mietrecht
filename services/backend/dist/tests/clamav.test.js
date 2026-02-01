"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const ClamAVService_1 = require("../services/ClamAVService");
const config_1 = require("../config/config");
// Mock dependencies
jest.mock('../config/config');
jest.mock('../utils/logger');
jest.mock('clamscan');
describe('ClamAVService', () => {
    let service;
    let mockClamScan;
    beforeEach(() => {
        // Reset mocks
        jest.clearAllMocks();
        // Mock config
        config_1.config.clamav = {
            host: 'localhost',
            port: 3310,
            timeout: 60000,
            enabled: true,
        };
        // Mock clamscan
        mockClamScan = {
            scanStream: jest.fn(),
            getVersion: jest.fn(),
        };
        const NodeClam = require('clamscan');
        NodeClam.mockImplementation(() => ({
            init: jest.fn().mockResolvedValue(mockClamScan),
        }));
    });
    describe('isAvailable', () => {
        it('should return false when ClamAV is disabled', async () => {
            config_1.config.clamav.enabled = false;
            service = new ClamAVService_1.ClamAVService();
            // Wait for initialization
            await new Promise(resolve => setTimeout(resolve, 100));
            const available = await service.isAvailable();
            expect(available).toBe(false);
        });
        it('should return true when ClamAV is available', async () => {
            mockClamScan.getVersion.mockResolvedValue('ClamAV 1.0.0');
            service = new ClamAVService_1.ClamAVService();
            // Wait for initialization
            await new Promise(resolve => setTimeout(resolve, 100));
            const available = await service.isAvailable();
            expect(available).toBe(true);
        });
        it('should return false when ClamAV health check fails', async () => {
            mockClamScan.getVersion.mockRejectedValue(new Error('Connection refused'));
            service = new ClamAVService_1.ClamAVService();
            // Wait for initialization
            await new Promise(resolve => setTimeout(resolve, 100));
            const available = await service.isAvailable();
            expect(available).toBe(false);
        });
    });
    describe('scanBuffer', () => {
        it('should return clean result when ClamAV is disabled', async () => {
            config_1.config.clamav.enabled = false;
            service = new ClamAVService_1.ClamAVService();
            const buffer = Buffer.from('test content');
            const result = await service.scanBuffer(buffer);
            expect(result.isInfected).toBe(false);
            expect(mockClamScan.scanStream).not.toHaveBeenCalled();
        });
        it('should return clean result for clean file', async () => {
            mockClamScan.scanStream.mockResolvedValue({
                isInfected: false,
                viruses: [],
            });
            service = new ClamAVService_1.ClamAVService();
            await new Promise(resolve => setTimeout(resolve, 100));
            const buffer = Buffer.from('clean file content');
            const result = await service.scanBuffer(buffer);
            expect(result.isInfected).toBe(false);
            expect(mockClamScan.scanStream).toHaveBeenCalledWith(buffer);
        });
        it('should detect virus in infected file', async () => {
            mockClamScan.scanStream.mockResolvedValue({
                isInfected: true,
                viruses: ['Eicar-Test-Signature'],
            });
            service = new ClamAVService_1.ClamAVService();
            await new Promise(resolve => setTimeout(resolve, 100));
            const buffer = Buffer.from('X5O!P%@AP[4\\PZX54(P^)7CC)7}$EICAR-STANDARD-ANTIVIRUS-TEST-FILE!$H+H*');
            const result = await service.scanBuffer(buffer);
            expect(result.isInfected).toBe(true);
            expect(result.viruses).toContain('Eicar-Test-Signature');
        });
        it('should fail-open when scan fails', async () => {
            mockClamScan.scanStream.mockRejectedValue(new Error('Scan timeout'));
            service = new ClamAVService_1.ClamAVService();
            await new Promise(resolve => setTimeout(resolve, 100));
            const buffer = Buffer.from('test content');
            const result = await service.scanBuffer(buffer);
            // Should return clean (fail-open) when scan fails
            expect(result.isInfected).toBe(false);
        });
        it('should fail-open when ClamAV is not initialized', async () => {
            const NodeClam = require('clamscan');
            NodeClam.mockImplementation(() => ({
                init: jest.fn().mockRejectedValue(new Error('Connection refused')),
            }));
            service = new ClamAVService_1.ClamAVService();
            await new Promise(resolve => setTimeout(resolve, 100));
            const buffer = Buffer.from('test content');
            const result = await service.scanBuffer(buffer);
            // Should return clean (fail-open) when not initialized
            expect(result.isInfected).toBe(false);
        });
    });
    describe('getVersion', () => {
        it('should return version when available', async () => {
            mockClamScan.getVersion.mockResolvedValue('ClamAV 1.0.0');
            service = new ClamAVService_1.ClamAVService();
            await new Promise(resolve => setTimeout(resolve, 100));
            const version = await service.getVersion();
            expect(version).toBe('ClamAV 1.0.0');
        });
        it('should return null when not initialized', async () => {
            const NodeClam = require('clamscan');
            NodeClam.mockImplementation(() => ({
                init: jest.fn().mockRejectedValue(new Error('Connection refused')),
            }));
            service = new ClamAVService_1.ClamAVService();
            await new Promise(resolve => setTimeout(resolve, 100));
            const version = await service.getVersion();
            expect(version).toBeNull();
        });
        it('should return null when getVersion fails', async () => {
            mockClamScan.getVersion.mockRejectedValue(new Error('Connection error'));
            service = new ClamAVService_1.ClamAVService();
            await new Promise(resolve => setTimeout(resolve, 100));
            const version = await service.getVersion();
            expect(version).toBeNull();
        });
    });
});
