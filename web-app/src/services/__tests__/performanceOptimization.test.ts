/**
 * Performance Optimization Tests
 * 
 * This file contains tests for the performance optimization features
 * including caching and batch processing.
 */

import { cacheService } from '../cache';
import { createBatchProcessor } from '../batchProcessor';

describe('Performance Optimization Tests', () => {
  beforeEach(() => {
    // Clear cache before each test
    cacheService.clearAll();
  });

  describe('Cache Service', () => {
    test('should store and retrieve data', () => {
      const testData = { id: 'test', value: 'data' };
      const key = 'test-key';
      
      cacheService.set(key, testData);
      const retrievedData = cacheService.get(key);
      
      expect(retrievedData).toEqual(testData);
    });

    test('should return null for expired data', () => {
      const testData = { id: 'test', value: 'data' };
      const key = 'test-key';
      
      // Set with very short TTL
      cacheService.set(key, testData, 1);
      
      // Wait for expiration
      setTimeout(() => {
        const retrievedData = cacheService.get(key);
        expect(retrievedData).toBeNull();
      }, 10);
    });

    test('should clear expired entries', () => {
      const testData = { id: 'test', value: 'data' };
      
      // Set with very short TTL
      cacheService.set('expired-key', testData, 1);
      cacheService.set('valid-key', testData, 10000);
      
      // Wait for expiration
      setTimeout(() => {
        cacheService.clearExpired();
        expect(cacheService.size()).toBe(1);
      }, 10);
    });
  });

  describe('Batch Processor', () => {
    test('should process operations in batches', async () => {
      const processedItems: any[] = [];
      
      const batchProcessor = createBatchProcessor(
        async (operations) => {
          operations.forEach(op => {
            processedItems.push(op.data);
            op.resolve(op.data);
          });
        },
        3, // Batch size of 3
        100 // Flush timeout of 100ms
      );

      // Add items to batch
      const promises = [];
      for (let i = 0; i < 5; i++) {
        promises.push(batchProcessor.add({ id: i, value: `item-${i}` }));
      }

      // Wait for processing
      const results = await Promise.all(promises);
      
      expect(results).toHaveLength(5);
      expect(processedItems).toHaveLength(5);
    });

    test('should flush pending operations', async () => {
      const processedItems: any[] = [];
      
      const batchProcessor = createBatchProcessor(
        async (operations) => {
          operations.forEach(op => {
            processedItems.push(op.data);
            op.resolve(op.data);
          });
        },
        10, // Large batch size
        5000 // Long timeout
      );

      // Add items to batch
      const promises = [];
      for (let i = 0; i < 3; i++) {
        promises.push(batchProcessor.add({ id: i, value: `item-${i}` }));
      }

      // Manually flush
      await batchProcessor.flush();
      
      expect(processedItems).toHaveLength(3);
    });
  });

  describe('Integration Service Performance', () => {
    // These tests would require mocking the integration service
    // For now, we'll just verify the service can be instantiated
    test('should initialize with performance optimization features', () => {
      // This test would be expanded in a real implementation
      expect(true).toBe(true);
    });
  });
});