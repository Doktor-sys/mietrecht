import { BulkProcessingService, BulkJobOptions } from '../services/BulkProcessingService';
import { PrismaClient } from '@prisma/client';
import { performance } from 'perf_hooks';

const prisma = new PrismaClient();

describe('BulkProcessingService Performance Tests', () => {
  let bulkProcessingService: BulkProcessingService;
  const testOrganizationId = 'test-org-performance';

  beforeAll(async () => {
    bulkProcessingService = new BulkProcessingService();
    
    // Setup test organization and API key
    await prisma.organization.upsert({
      where: { id: testOrganizationId },
      update: {},
      create: {
        id: testOrganizationId,
        name: 'Performance Test Org',
        contactEmail: 'test@performance.com'
      }
    });

    await prisma.apiKey.upsert({
      where: { organizationId: testOrganizationId },
      update: {},
      create: {
        id: 'perf-test-key',
        organizationId: testOrganizationId,
        name: 'Performance Test Key',
        keyHash: 'test-hash',
        permissions: ['document:analyze', 'chat:query', 'bulk:manage'],
        rateLimit: 1000,
        quotaLimit: 10000,
        quotaUsed: 0
      }
    });
  });

  afterAll(async () => {
    // Cleanup
    await prisma.apiKey.deleteMany({
      where: { organizationId: testOrganizationId }
    });
    await prisma.organization.delete({
      where: { id: testOrganizationId }
    });
    await prisma.$disconnect();
  });

  describe('Document Analysis Performance', () => {
    it('should handle 10 documents in under 30 seconds', async () => {
      const startTime = performance.now();
      
      const documents = Array.from({ length: 10 }, (_, i) => ({
        id: `perf-doc-${i}`,
        filename: `test-document-${i}.pdf`,
        content: Buffer.from(`Test document content ${i}`),
        mimeType: 'application/pdf',
        documentType: 'rental_contract',
        metadata: { testIndex: i }
      }));

      const options: BulkJobOptions = {
        organizationId: testOrganizationId,
        type: 'document_analysis',
        items: documents
      };

      const jobId = await bulkProcessingService.startBulkJob(options);
      expect(jobId).toBeDefined();

      // Wait for completion with timeout
      let status = await bulkProcessingService.getBulkJobStatus(jobId);
      let attempts = 0;
      const maxAttempts = 60; // 60 seconds timeout

      while (status?.status === 'pending' || status?.status === 'processing') {
        if (attempts >= maxAttempts) {
          throw new Error('Job timeout after 60 seconds');
        }
        
        await new Promise(resolve => setTimeout(resolve, 1000));
        status = await bulkProcessingService.getBulkJobStatus(jobId);
        attempts++;
      }

      const endTime = performance.now();
      const executionTime = (endTime - startTime) / 1000;

      expect(status?.status).toBe('completed');
      expect(executionTime).toBeLessThan(30);
      expect(status?.processedItems).toBe(10);
      expect(status?.successfulItems).toBeGreaterThan(0);

      console.log(`Processed 10 documents in ${executionTime.toFixed(2)} seconds`);
      console.log(`Average time per document: ${(executionTime / 10).toFixed(2)} seconds`);
    }, 35000);

    it('should handle 50 documents with acceptable performance', async () => {
      const startTime = performance.now();
      
      const documents = Array.from({ length: 50 }, (_, i) => ({
        id: `perf-doc-large-${i}`,
        filename: `test-document-${i}.pdf`,
        content: Buffer.from(`Test document content ${i}`.repeat(100)), // Larger content
        mimeType: 'application/pdf',
        documentType: 'utility_bill',
        metadata: { testIndex: i, size: 'large' }
      }));

      const options: BulkJobOptions = {
        organizationId: testOrganizationId,
        type: 'document_analysis',
        items: documents
      };

      const jobId = await bulkProcessingService.startBulkJob(options);
      
      // Monitor progress
      let status = await bulkProcessingService.getBulkJobStatus(jobId);
      let lastProgress = 0;
      let attempts = 0;
      const maxAttempts = 180; // 3 minutes timeout

      while (status?.status === 'pending' || status?.status === 'processing') {
        if (attempts >= maxAttempts) {
          throw new Error('Job timeout after 3 minutes');
        }

        if (status && status.progress > lastProgress) {
          console.log(`Progress: ${status.progress}% (${status.processedItems}/${status.totalItems})`);
          lastProgress = status.progress;
        }
        
        await new Promise(resolve => setTimeout(resolve, 1000));
        status = await bulkProcessingService.getBulkJobStatus(jobId);
        attempts++;
      }

      const endTime = performance.now();
      const executionTime = (endTime - startTime) / 1000;

      expect(status?.status).toBe('completed');
      expect(executionTime).toBeLessThan(180); // 3 minutes max
      expect(status?.processedItems).toBe(50);
      expect(status?.successfulItems).toBeGreaterThan(40); // Allow some failures

      console.log(`Processed 50 documents in ${executionTime.toFixed(2)} seconds`);
      console.log(`Average time per document: ${(executionTime / 50).toFixed(2)} seconds`);
      console.log(`Success rate: ${((status?.successfulItems || 0) / 50 * 100).toFixed(1)}%`);
    }, 200000);
  });

  describe('Chat Bulk Processing Performance', () => {
    it('should handle 100 chat queries efficiently', async () => {
      const startTime = performance.now();
      
      const queries = Array.from({ length: 100 }, (_, i) => ({
        id: `perf-chat-${i}`,
        query: `Was sind meine Rechte als Mieter bei Problem ${i}?`,
        context: { testIndex: i },
        sessionId: `perf-session-${Math.floor(i / 10)}`
      }));

      const options: BulkJobOptions = {
        organizationId: testOrganizationId,
        type: 'chat_bulk',
        items: queries
      };

      const jobId = await bulkProcessingService.startBulkJob(options);
      
      let status = await bulkProcessingService.getBulkJobStatus(jobId);
      let attempts = 0;
      const maxAttempts = 120; // 2 minutes timeout

      while (status?.status === 'pending' || status?.status === 'processing') {
        if (attempts >= maxAttempts) {
          throw new Error('Chat bulk job timeout after 2 minutes');
        }
        
        await new Promise(resolve => setTimeout(resolve, 1000));
        status = await bulkProcessingService.getBulkJobStatus(jobId);
        attempts++;
      }

      const endTime = performance.now();
      const executionTime = (endTime - startTime) / 1000;

      expect(status?.status).toBe('completed');
      expect(executionTime).toBeLessThan(120); // 2 minutes max
      expect(status?.processedItems).toBe(100);
      expect(status?.successfulItems).toBeGreaterThan(90); // High success rate expected

      console.log(`Processed 100 chat queries in ${executionTime.toFixed(2)} seconds`);
      console.log(`Average time per query: ${(executionTime / 100).toFixed(3)} seconds`);
    }, 130000);
  });

  describe('Memory and Resource Usage', () => {
    it('should not exceed memory limits during large batch processing', async () => {
      const initialMemory = process.memoryUsage();
      
      // Create a large batch to test memory usage
      const documents = Array.from({ length: 20 }, (_, i) => ({
        id: `memory-test-${i}`,
        filename: `large-document-${i}.pdf`,
        content: Buffer.from('x'.repeat(1024 * 1024)), // 1MB per document
        mimeType: 'application/pdf',
        documentType: 'rental_contract'
      }));

      const options: BulkJobOptions = {
        organizationId: testOrganizationId,
        type: 'document_analysis',
        items: documents
      };

      const jobId = await bulkProcessingService.startBulkJob(options);
      
      // Monitor memory during processing
      let status = await bulkProcessingService.getBulkJobStatus(jobId);
      let maxMemoryUsage = 0;

      while (status?.status === 'pending' || status?.status === 'processing') {
        const currentMemory = process.memoryUsage();
        const memoryUsageMB = currentMemory.heapUsed / 1024 / 1024;
        maxMemoryUsage = Math.max(maxMemoryUsage, memoryUsageMB);
        
        await new Promise(resolve => setTimeout(resolve, 1000));
        status = await bulkProcessingService.getBulkJobStatus(jobId);
      }

      const finalMemory = process.memoryUsage();
      const memoryIncrease = (finalMemory.heapUsed - initialMemory.heapUsed) / 1024 / 1024;

      expect(status?.status).toBe('completed');
      expect(maxMemoryUsage).toBeLessThan(500); // Should not exceed 500MB
      expect(memoryIncrease).toBeLessThan(100); // Should not leak more than 100MB

      console.log(`Max memory usage: ${maxMemoryUsage.toFixed(2)} MB`);
      console.log(`Memory increase: ${memoryIncrease.toFixed(2)} MB`);
    }, 60000);
  });

  describe('Concurrent Job Processing', () => {
    it('should handle multiple concurrent jobs without performance degradation', async () => {
      const startTime = performance.now();
      
      // Create 3 concurrent jobs
      const jobPromises = Array.from({ length: 3 }, async (_, jobIndex) => {
        const documents = Array.from({ length: 10 }, (_, docIndex) => ({
          id: `concurrent-${jobIndex}-${docIndex}`,
          filename: `concurrent-doc-${jobIndex}-${docIndex}.pdf`,
          content: Buffer.from(`Concurrent test document ${jobIndex}-${docIndex}`),
          mimeType: 'application/pdf',
          documentType: 'warning_letter'
        }));

        const options: BulkJobOptions = {
          organizationId: testOrganizationId,
          type: 'document_analysis',
          items: documents
        };

        const jobId = await bulkProcessingService.startBulkJob(options);
        
        // Wait for completion
        let status = await bulkProcessingService.getBulkJobStatus(jobId);
        let attempts = 0;

        while (status?.status === 'pending' || status?.status === 'processing') {
          if (attempts >= 60) {
            throw new Error(`Concurrent job ${jobIndex} timeout`);
          }
          
          await new Promise(resolve => setTimeout(resolve, 1000));
          status = await bulkProcessingService.getBulkJobStatus(jobId);
          attempts++;
        }

        return { jobIndex, status, jobId };
      });

      const results = await Promise.all(jobPromises);
      const endTime = performance.now();
      const executionTime = (endTime - startTime) / 1000;

      // Verify all jobs completed successfully
      results.forEach(result => {
        expect(result.status?.status).toBe('completed');
        expect(result.status?.processedItems).toBe(10);
      });

      expect(executionTime).toBeLessThan(90); // Should complete within 90 seconds
      
      console.log(`Processed 3 concurrent jobs (30 documents total) in ${executionTime.toFixed(2)} seconds`);
    }, 100000);
  });

  describe('Error Handling Performance', () => {
    it('should handle partial failures efficiently', async () => {
      const startTime = performance.now();
      
      // Mix of valid and invalid documents
      const documents = Array.from({ length: 20 }, (_, i) => ({
        id: `error-test-${i}`,
        filename: `test-document-${i}.pdf`,
        content: i % 5 === 0 ? Buffer.from('') : Buffer.from(`Valid content ${i}`), // Every 5th doc is empty
        mimeType: 'application/pdf',
        documentType: 'rental_contract'
      }));

      const options: BulkJobOptions = {
        organizationId: testOrganizationId,
        type: 'document_analysis',
        items: documents
      };

      const jobId = await bulkProcessingService.startBulkJob(options);
      
      let status = await bulkProcessingService.getBulkJobStatus(jobId);
      let attempts = 0;

      while (status?.status === 'pending' || status?.status === 'processing') {
        if (attempts >= 60) {
          throw new Error('Error handling test timeout');
        }
        
        await new Promise(resolve => setTimeout(resolve, 1000));
        status = await bulkProcessingService.getBulkJobStatus(jobId);
        attempts++;
      }

      const endTime = performance.now();
      const executionTime = (endTime - startTime) / 1000;

      expect(status?.status).toBe('completed');
      expect(status?.processedItems).toBe(20);
      expect(status?.failedItems).toBe(4); // 4 empty documents should fail
      expect(status?.successfulItems).toBe(16);
      expect(executionTime).toBeLessThan(45); // Should handle errors quickly

      console.log(`Handled mixed success/failure batch in ${executionTime.toFixed(2)} seconds`);
      console.log(`Success rate: ${(status?.successfulItems || 0) / 20 * 100}%`);
    }, 50000);
  });
});