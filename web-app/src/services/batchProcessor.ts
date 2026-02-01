/**
 * Batch Processor for Integration Performance Optimization
 * 
 * This service provides batch processing capabilities to optimize integration performance
 * by grouping multiple operations into single API calls.
 */

export interface BatchOperation<T> {
  id: string;
  data: T;
  resolve: (value: any) => void;
  reject: (reason?: any) => void;
}

class BatchProcessor<T> {
  private operations: BatchOperation<T>[] = [];
  private batchSize: number;
  private flushTimeout: number;
  private timeoutId: NodeJS.Timeout | null = null;
  private processBatch: (operations: BatchOperation<T>[]) => Promise<void>;

  constructor(
    processBatch: (operations: BatchOperation<T>[]) => Promise<void>,
    batchSize: number = 10,
    flushTimeout: number = 1000
  ) {
    this.processBatch = processBatch;
    this.batchSize = batchSize;
    this.flushTimeout = flushTimeout;
  }

  /**
   * Add an operation to the batch
   */
  add(data: T): Promise<any> {
    return new Promise((resolve, reject) => {
      const operation: BatchOperation<T> = {
        id: Math.random().toString(36).substr(2, 9),
        data,
        resolve,
        reject
      };

      this.operations.push(operation);

      // Flush immediately if we've reached batch size
      if (this.operations.length >= this.batchSize) {
        this.flush();
      } else if (!this.timeoutId) {
        // Set timeout to flush after delay
        this.timeoutId = setTimeout(() => {
          this.flush();
        }, this.flushTimeout);
      }
    });
  }

  /**
   * Flush all pending operations
   */
  async flush(): Promise<void> {
    if (this.timeoutId) {
      clearTimeout(this.timeoutId);
      this.timeoutId = null;
    }

    if (this.operations.length === 0) {
      return;
    }

    // Process in batches
    while (this.operations.length > 0) {
      const batch = this.operations.splice(0, this.batchSize);
      try {
        await this.processBatch(batch);
      } catch (error) {
        // Reject all operations in the batch
        batch.forEach(op => op.reject(error));
      }
    }
  }

  /**
   * Get pending operations count
   */
  getPendingCount(): number {
    return this.operations.length;
  }
}

// Export batch processor factory
export function createBatchProcessor<T>(
  processBatch: (operations: BatchOperation<T>[]) => Promise<void>,
  batchSize: number = 10,
  flushTimeout: number = 1000
): BatchProcessor<T> {
  return new BatchProcessor(processBatch, batchSize, flushTimeout);
}