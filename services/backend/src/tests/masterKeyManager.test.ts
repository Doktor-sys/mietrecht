import { MasterKeyManager } from '../services/kms/MasterKeyManager';
import { KeyManagementError, KeyManagementErrorCode } from '../types/kms';

describe('MasterKeyManager', () => {
  let originalEnv: NodeJS.ProcessEnv;

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
      const validKey = MasterKeyManager.generateMasterKey();
      process.env.MASTER_ENCRYPTION_KEY = validKey;

      const manager = new MasterKeyManager();
      const masterKey = manager.getMasterKey();

      expect(masterKey).toBeDefined();
      expect(masterKey.length).toBe(32); // 256 bits
    });

    it('sollte Fehler werfen wenn Master Key fehlt', () => {
      delete process.env.MASTER_ENCRYPTION_KEY;

      expect(() => {
        new MasterKeyManager();
      }).toThrow(KeyManagementError);
    });

    it('sollte Fehler werfen bei ungültigem Hex-Format', () => {
      process.env.MASTER_ENCRYPTION_KEY = 'not-a-hex-string';

      expect(() => {
        new MasterKeyManager();
      }).toThrow(KeyManagementError);
    });

    it('sollte Fehler werfen bei falscher Länge', () => {
      process.env.MASTER_ENCRYPTION_KEY = 'abcd1234'; // Zu kurz

      expect(() => {
        new MasterKeyManager();
      }).toThrow(KeyManagementError);
    });
  });

  describe('getMasterKey()', () => {
    it('sollte Master Key zurückgeben', () => {
      const validKey = MasterKeyManager.generateMasterKey();
      process.env.MASTER_ENCRYPTION_KEY = validKey;

      const manager = new MasterKeyManager();
      const masterKey = manager.getMasterKey();

      expect(masterKey).toBeInstanceOf(Buffer);
      expect(masterKey.length).toBe(32);
    });

    it('sollte denselben Key bei mehrfachen Aufrufen zurückgeben', () => {
      const validKey = MasterKeyManager.generateMasterKey();
      process.env.MASTER_ENCRYPTION_KEY = validKey;

      const manager = new MasterKeyManager();
      const key1 = manager.getMasterKey();
      const key2 = manager.getMasterKey();

      expect(key1.equals(key2)).toBe(true);
    });
  });

  describe('validateMasterKey()', () => {
    it('sollte true für gültigen Master Key zurückgeben', () => {
      const validKey = MasterKeyManager.generateMasterKey();
      process.env.MASTER_ENCRYPTION_KEY = validKey;

      const manager = new MasterKeyManager();
      const isValid = manager.validateMasterKey();

      expect(isValid).toBe(true);
    });

    it('sollte false für Key mit nur Nullen zurückgeben', () => {
      // Erstelle einen Key mit nur Nullen (unsicher)
      const zeroKey = '0'.repeat(64);
      process.env.MASTER_ENCRYPTION_KEY = zeroKey;

      const manager = new MasterKeyManager();
      const isValid = manager.validateMasterKey();

      expect(isValid).toBe(false);
    });
  });

  describe('rotateMasterKey()', () => {
    it('sollte Master Key erfolgreich rotieren', async () => {
      const oldKey = MasterKeyManager.generateMasterKey();
      process.env.MASTER_ENCRYPTION_KEY = oldKey;

      const manager = new MasterKeyManager();
      const oldMasterKey = manager.getMasterKey();

      // Generiere neuen Key
      const newKey = MasterKeyManager.generateMasterKey();
      await manager.rotateMasterKey(newKey);

      const newMasterKey = manager.getMasterKey();

      expect(newMasterKey).not.toEqual(oldMasterKey);
      expect(newMasterKey.toString('hex')).toBe(newKey);
    });

    it('sollte Fehler werfen bei ungültigem Format', async () => {
      const validKey = MasterKeyManager.generateMasterKey();
      process.env.MASTER_ENCRYPTION_KEY = validKey;

      const manager = new MasterKeyManager();

      await expect(
        manager.rotateMasterKey('invalid-format')
      ).rejects.toThrow(KeyManagementError);
    });

    it('sollte Fehler werfen bei falscher Länge', async () => {
      const validKey = MasterKeyManager.generateMasterKey();
      process.env.MASTER_ENCRYPTION_KEY = validKey;

      const manager = new MasterKeyManager();

      await expect(
        manager.rotateMasterKey('abcd1234')
      ).rejects.toThrow(KeyManagementError);
    });

    it('sollte Fehler werfen wenn neuer Key gleich altem Key ist', async () => {
      const validKey = MasterKeyManager.generateMasterKey();
      process.env.MASTER_ENCRYPTION_KEY = validKey;

      const manager = new MasterKeyManager();

      await expect(
        manager.rotateMasterKey(validKey)
      ).rejects.toThrow(KeyManagementError);
    });
  });

  describe('generateMasterKey()', () => {
    it('sollte einen gültigen Master Key generieren', () => {
      const key = MasterKeyManager.generateMasterKey();

      expect(key).toBeDefined();
      expect(key.length).toBe(64); // 32 bytes = 64 hex characters
      expect(/^[0-9a-fA-F]+$/.test(key)).toBe(true);
    });

    it('sollte unterschiedliche Keys bei mehrfachen Aufrufen generieren', () => {
      const key1 = MasterKeyManager.generateMasterKey();
      const key2 = MasterKeyManager.generateMasterKey();

      expect(key1).not.toBe(key2);
    });
  });

  describe('getMasterKeyInfo()', () => {
    it('sollte Key-Informationen ohne den Key selbst zurückgeben', () => {
      const validKey = MasterKeyManager.generateMasterKey();
      process.env.MASTER_ENCRYPTION_KEY = validKey;

      const manager = new MasterKeyManager();
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

      const manager = new MasterKeyManager();
      const info = manager.getMasterKeyInfo();

      expect(info.isValid).toBe(false);
    });
  });

  describe('Sicherheitstests', () => {
    it('sollte Master Key nicht in Logs ausgeben', () => {
      const validKey = MasterKeyManager.generateMasterKey();
      process.env.MASTER_ENCRYPTION_KEY = validKey;

      const manager = new MasterKeyManager();
      const info = manager.getMasterKeyInfo();

      // Stelle sicher, dass der Key nicht in den Info-Objekten enthalten ist
      expect(JSON.stringify(info)).not.toContain(validKey);
    });

    it('sollte Master Key im Speicher sicher halten', () => {
      const validKey = MasterKeyManager.generateMasterKey();
      process.env.MASTER_ENCRYPTION_KEY = validKey;

      const manager = new MasterKeyManager();
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
        new MasterKeyManager();
        fail('Should have thrown an error');
      } catch (error) {
        expect(error).toBeInstanceOf(KeyManagementError);
        expect((error as KeyManagementError).code).toBe(
          KeyManagementErrorCode.MASTER_KEY_ERROR
        );
      }
    });

    it('sollte aussagekräftige Fehlermeldungen liefern', () => {
      process.env.MASTER_ENCRYPTION_KEY = 'invalid';

      try {
        new MasterKeyManager();
        fail('Should have thrown an error');
      } catch (error) {
        expect(error).toBeInstanceOf(KeyManagementError);
        expect((error as KeyManagementError).message).toContain('hexadecimal');
      }
    });
  });
});
