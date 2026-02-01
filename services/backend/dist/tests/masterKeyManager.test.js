"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const MasterKeyManager_1 = require("../services/kms/MasterKeyManager");
const kms_1 = require("../types/kms");
describe('MasterKeyManager', () => {
    let originalEnv;
    beforeEach(() => {
        // Speichere Original-Umgebungsvariablen
        originalEnv = { ...process.env };
    });
    afterEach(() => {
        // Stelle Original-Umgebungsvariablen wieder her
        process.env = originalEnv;
    });
    describe('Initialisierung', () => {
        it('sollte Master Key aus Umgebungsvariable laden', () => {
            // Generiere einen gültigen Master Key
            const validKey = MasterKeyManager_1.MasterKeyManager.generateMasterKey();
            process.env.MASTER_ENCRYPTION_KEY = validKey;
            const manager = new MasterKeyManager_1.MasterKeyManager();
            const masterKey = manager.getMasterKey();
            expect(masterKey).toBeDefined();
            expect(masterKey.length).toBe(32); // 256 bits
        });
        it('sollte Fehler werfen wenn Master Key fehlt', () => {
            delete process.env.MASTER_ENCRYPTION_KEY;
            expect(() => {
                new MasterKeyManager_1.MasterKeyManager();
            }).toThrow(kms_1.KeyManagementError);
        });
        it('sollte Fehler werfen bei ungültigem Hex-Format', () => {
            process.env.MASTER_ENCRYPTION_KEY = 'not-a-hex-string';
            expect(() => {
                new MasterKeyManager_1.MasterKeyManager();
            }).toThrow(kms_1.KeyManagementError);
        });
        it('sollte Fehler werfen bei falscher Länge', () => {
            process.env.MASTER_ENCRYPTION_KEY = 'abcd1234'; // Zu kurz
            expect(() => {
                new MasterKeyManager_1.MasterKeyManager();
            }).toThrow(kms_1.KeyManagementError);
        });
    });
    describe('getMasterKey()', () => {
        it('sollte Master Key zurückgeben', () => {
            const validKey = MasterKeyManager_1.MasterKeyManager.generateMasterKey();
            process.env.MASTER_ENCRYPTION_KEY = validKey;
            const manager = new MasterKeyManager_1.MasterKeyManager();
            const masterKey = manager.getMasterKey();
            expect(masterKey).toBeInstanceOf(Buffer);
            expect(masterKey.length).toBe(32);
        });
        it('sollte denselben Key bei mehrfachen Aufrufen zurückgeben', () => {
            const validKey = MasterKeyManager_1.MasterKeyManager.generateMasterKey();
            process.env.MASTER_ENCRYPTION_KEY = validKey;
            const manager = new MasterKeyManager_1.MasterKeyManager();
            const key1 = manager.getMasterKey();
            const key2 = manager.getMasterKey();
            expect(key1.equals(key2)).toBe(true);
        });
    });
    describe('validateMasterKey()', () => {
        it('sollte true für gültigen Master Key zurückgeben', () => {
            const validKey = MasterKeyManager_1.MasterKeyManager.generateMasterKey();
            process.env.MASTER_ENCRYPTION_KEY = validKey;
            const manager = new MasterKeyManager_1.MasterKeyManager();
            const isValid = manager.validateMasterKey();
            expect(isValid).toBe(true);
        });
        it('sollte false für Key mit nur Nullen zurückgeben', () => {
            // Erstelle einen Key mit nur Nullen (unsicher)
            const zeroKey = '0'.repeat(64);
            process.env.MASTER_ENCRYPTION_KEY = zeroKey;
            const manager = new MasterKeyManager_1.MasterKeyManager();
            const isValid = manager.validateMasterKey();
            expect(isValid).toBe(false);
        });
    });
    describe('rotateMasterKey()', () => {
        it('sollte Master Key erfolgreich rotieren', async () => {
            const oldKey = MasterKeyManager_1.MasterKeyManager.generateMasterKey();
            process.env.MASTER_ENCRYPTION_KEY = oldKey;
            const manager = new MasterKeyManager_1.MasterKeyManager();
            const oldMasterKey = manager.getMasterKey();
            // Generiere neuen Key
            const newKey = MasterKeyManager_1.MasterKeyManager.generateMasterKey();
            await manager.rotateMasterKey(newKey);
            const newMasterKey = manager.getMasterKey();
            expect(newMasterKey).not.toEqual(oldMasterKey);
            expect(newMasterKey.toString('hex')).toBe(newKey);
        });
        it('sollte Fehler werfen bei ungültigem Format', async () => {
            const validKey = MasterKeyManager_1.MasterKeyManager.generateMasterKey();
            process.env.MASTER_ENCRYPTION_KEY = validKey;
            const manager = new MasterKeyManager_1.MasterKeyManager();
            await expect(manager.rotateMasterKey('invalid-format')).rejects.toThrow(kms_1.KeyManagementError);
        });
        it('sollte Fehler werfen bei falscher Länge', async () => {
            const validKey = MasterKeyManager_1.MasterKeyManager.generateMasterKey();
            process.env.MASTER_ENCRYPTION_KEY = validKey;
            const manager = new MasterKeyManager_1.MasterKeyManager();
            await expect(manager.rotateMasterKey('abcd1234')).rejects.toThrow(kms_1.KeyManagementError);
        });
        it('sollte Fehler werfen wenn neuer Key gleich altem Key ist', async () => {
            const validKey = MasterKeyManager_1.MasterKeyManager.generateMasterKey();
            process.env.MASTER_ENCRYPTION_KEY = validKey;
            const manager = new MasterKeyManager_1.MasterKeyManager();
            await expect(manager.rotateMasterKey(validKey)).rejects.toThrow(kms_1.KeyManagementError);
        });
    });
    describe('generateMasterKey()', () => {
        it('sollte einen gültigen Master Key generieren', () => {
            const key = MasterKeyManager_1.MasterKeyManager.generateMasterKey();
            expect(key).toBeDefined();
            expect(key.length).toBe(64); // 32 bytes = 64 hex characters
            expect(/^[0-9a-fA-F]+$/.test(key)).toBe(true);
        });
        it('sollte unterschiedliche Keys bei mehrfachen Aufrufen generieren', () => {
            const key1 = MasterKeyManager_1.MasterKeyManager.generateMasterKey();
            const key2 = MasterKeyManager_1.MasterKeyManager.generateMasterKey();
            expect(key1).not.toBe(key2);
        });
    });
    describe('getMasterKeyInfo()', () => {
        it('sollte Key-Informationen ohne den Key selbst zurückgeben', () => {
            const validKey = MasterKeyManager_1.MasterKeyManager.generateMasterKey();
            process.env.MASTER_ENCRYPTION_KEY = validKey;
            const manager = new MasterKeyManager_1.MasterKeyManager();
            const info = manager.getMasterKeyInfo();
            expect(info).toEqual({
                length: 32,
                algorithm: 'aes-256-gcm',
                isValid: true
            });
        });
        it('sollte isValid=false für ungültigen Key zurückgeben', () => {
            const zeroKey = '0'.repeat(64);
            process.env.MASTER_ENCRYPTION_KEY = zeroKey;
            const manager = new MasterKeyManager_1.MasterKeyManager();
            const info = manager.getMasterKeyInfo();
            expect(info.isValid).toBe(false);
        });
    });
    describe('Sicherheitstests', () => {
        it('sollte Master Key nicht in Logs ausgeben', () => {
            const validKey = MasterKeyManager_1.MasterKeyManager.generateMasterKey();
            process.env.MASTER_ENCRYPTION_KEY = validKey;
            const manager = new MasterKeyManager_1.MasterKeyManager();
            const info = manager.getMasterKeyInfo();
            // Stelle sicher, dass der Key nicht in den Info-Objekten enthalten ist
            expect(JSON.stringify(info)).not.toContain(validKey);
        });
        it('sollte Master Key im Speicher sicher halten', () => {
            const validKey = MasterKeyManager_1.MasterKeyManager.generateMasterKey();
            process.env.MASTER_ENCRYPTION_KEY = validKey;
            const manager = new MasterKeyManager_1.MasterKeyManager();
            const masterKey = manager.getMasterKey();
            // Der Key sollte ein Buffer sein, nicht ein String
            expect(masterKey).toBeInstanceOf(Buffer);
            // Der Key sollte nicht direkt als String verfügbar sein
            expect(typeof masterKey).not.toBe('string');
        });
    });
    describe('Fehlerbehandlung', () => {
        it('sollte spezifische Fehlercodes verwenden', () => {
            delete process.env.MASTER_ENCRYPTION_KEY;
            try {
                new MasterKeyManager_1.MasterKeyManager();
                fail('Should have thrown an error');
            }
            catch (error) {
                expect(error).toBeInstanceOf(kms_1.KeyManagementError);
                expect(error.code).toBe(kms_1.KeyManagementErrorCode.MASTER_KEY_ERROR);
            }
        });
        it('sollte aussagekräftige Fehlermeldungen liefern', () => {
            process.env.MASTER_ENCRYPTION_KEY = 'invalid';
            try {
                new MasterKeyManager_1.MasterKeyManager();
                fail('Should have thrown an error');
            }
            catch (error) {
                expect(error).toBeInstanceOf(kms_1.KeyManagementError);
                expect(error.message).toContain('hexadecimal');
            }
        });
    });
});
