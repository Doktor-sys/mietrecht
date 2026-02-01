/**
 * Accounting Integration Tests
 * 
 * This file contains comprehensive tests for all accounting system integrations
 * including Lexoffice, DATEV, and FastBill connectors.
 */

import { integrationService } from '../integrations';
import { AccountingEntry } from '../integrations';

// Mock data for testing
const mockAccountingEntries: AccountingEntry[] = [
  {
    id: 'entry-1',
    date: '2025-12-01',
    amount: 1500.00,
    currency: 'EUR',
    description: 'Mietzahlung für Dezember',
    category: 'income',
    clientId: 'client-123',
    caseId: 'case-456',
    paymentMethod: 'bank_transfer',
    invoiceNumber: 'INV-2025-001',
    isTaxRelevant: true,
    taxAmount: 270.00,
    taxRate: 0.19
  },
  {
    id: 'entry-2',
    date: '2025-12-02',
    amount: 89.90,
    currency: 'EUR',
    description: 'Büromaterial',
    category: 'expenses',
    clientId: 'client-124',
    caseId: 'case-457',
    paymentMethod: 'credit_card',
    invoiceNumber: 'INV-2025-002',
    isTaxRelevant: true,
    taxAmount: 14.38,
    taxRate: 0.19
  }
];

describe('Accounting Integration Tests', () => {
  beforeEach(() => {
    // Reset the integration service before each test
    (integrationService as any).isInitialized = false;
    (integrationService as any).config = null;
    (integrationService as any).lexofficeConnector = null;
    (integrationService as any).datevConnector = null;
    (integrationService as any).fastBillConnector = null;
  });

  describe('Lexoffice Integration', () => {
    test('should initialize with Lexoffice configuration', async () => {
      const config = {
        accountingSystem: {
          type: 'lexoffice' as const,
          apiKey: 'test-api-key',
          apiUrl: 'https://api.lexoffice.de/v1'
        }
      };

      await integrationService.initialize(config);
      const status = integrationService.getStatus();
      
      expect(status.isInitialized).toBe(true);
      expect(status.accountingSystemConnected).toBe(true);
    });

    test('should sync accounting entries to Lexoffice', async () => {
      const config = {
        accountingSystem: {
          type: 'lexoffice' as const,
          apiKey: 'test-api-key',
          apiUrl: 'https://api.lexoffice.de/v1'
        }
      };

      await integrationService.initialize(config);
      const result = await integrationService.syncAccountingData(mockAccountingEntries);
      
      expect(result).toBe(true);
    });

    test('should handle Lexoffice API errors gracefully', async () => {
      const config = {
        accountingSystem: {
          type: 'lexoffice' as const,
          apiKey: 'invalid-api-key',
          apiUrl: 'https://api.lexoffice.de/v1'
        }
      };

      await integrationService.initialize(config);
      
      await expect(integrationService.syncAccountingData(mockAccountingEntries))
        .rejects
        .toThrow('Accounting data sync failed');
    });
  });

  describe('DATEV Integration', () => {
    test('should initialize with DATEV configuration', async () => {
      const config = {
        accountingSystem: {
          type: 'datev' as const,
          clientId: 'test-client-id',
          clientSecret: 'test-client-secret',
          apiKey: 'test-access-token',
          refreshToken: 'test-refresh-token'
        }
      };

      await integrationService.initialize(config);
      const status = integrationService.getStatus();
      
      expect(status.isInitialized).toBe(true);
      expect(status.accountingSystemConnected).toBe(true);
    });

    test('should sync accounting entries to DATEV', async () => {
      const config = {
        accountingSystem: {
          type: 'datev' as const,
          clientId: 'test-client-id',
          clientSecret: 'test-client-secret',
          apiKey: 'test-access-token',
          refreshToken: 'test-refresh-token'
        }
      };

      await integrationService.initialize(config);
      const result = await integrationService.syncAccountingData(mockAccountingEntries);
      
      expect(result).toBe(true);
    });
  });

  describe('FastBill Integration', () => {
    test('should initialize with FastBill configuration', async () => {
      const config = {
        accountingSystem: {
          type: 'fastbill' as const,
          email: 'test@example.com',
          apiKey: 'test-api-key'
        }
      };

      await integrationService.initialize(config);
      const status = integrationService.getStatus();
      
      expect(status.isInitialized).toBe(true);
      expect(status.accountingSystemConnected).toBe(true);
    });

    test('should sync accounting entries to FastBill', async () => {
      const config = {
        accountingSystem: {
          type: 'fastbill' as const,
          email: 'test@example.com',
          apiKey: 'test-api-key'
        }
      };

      await integrationService.initialize(config);
      const result = await integrationService.syncAccountingData(mockAccountingEntries);
      
      expect(result).toBe(true);
    });
  });
});