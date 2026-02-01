/**
 * Smart Sync Service
 * 
 * This service implements intelligent synchronization algorithms for mobile offline data.
 * It prioritizes synchronization based on user behavior and data importance.
 */

import { mobileOfflineStorageService } from './mobileOfflineStorage';
import { integrationService } from '../services/integrations';

// Sync priority levels
enum SyncPriority {
  HIGH = 'high',
  MEDIUM = 'medium',
  LOW = 'low'
}

// Sync status
enum SyncStatus {
  PENDING = 'pending',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  FAILED = 'failed'
}

// Sync item interface
interface SyncItem {
  id: string;
  type: 'case' | 'accounting' | 'event' | 'document';
  priority: SyncPriority;
  status: SyncStatus;
  retries: number;
  lastAttempt?: Date;
  error?: string;
}

// User behavior tracking
interface UserBehavior {
  frequentlyAccessedCases: string[];
  recentlyCreatedItems: string[];
  favoriteDocuments: string[];
  lastSyncTimestamp?: Date;
}

class SmartSyncService {
  private syncQueue: SyncItem[] = [];
  private userBehavior: UserBehavior = {
    frequentlyAccessedCases: [],
    recentlyCreatedItems: [],
    favoriteDocuments: []
  };
  private maxRetries = 3;
  private batchSize = 10;

  /**
   * Initialize the smart sync service
   */
  async initialize(): Promise<void> {
    // Load user behavior from storage
    const behavior = await mobileOfflineStorageService.getSetting('userBehavior');
    if (behavior) {
      this.userBehavior = behavior;
    }

    // Load any pending sync items
    await this.loadPendingSyncItems();

    console.log('Smart sync service initialized');
  }

  /**
   * Load pending sync items from storage
   */
  private async loadPendingSyncItems(): Promise<void> {
    try {
      // Get unsynced items from all stores
      const unsyncedCases = await mobileOfflineStorageService.getUnsyncedItems('@SmartLaw:lawFirmCases');
      const unsyncedAccounting = await mobileOfflineStorageService.getUnsyncedItems('@SmartLaw:accountingEntries');
      const unsyncedEvents = await mobileOfflineStorageService.getUnsyncedItems('@SmartLaw:calendarEvents');
      const unsyncedDocuments = await mobileOfflineStorageService.getUnsyncedItems('@SmartLaw:documents');

      // Add to sync queue with appropriate priorities
      for (const caseData of unsyncedCases) {
        this.syncQueue.push({
          id: caseData.id,
          type: 'case',
          priority: this.determinePriority(caseData.id, 'case'),
          status: SyncStatus.PENDING,
          retries: 0
        });
      }

      for (const entryData of unsyncedAccounting) {
        this.syncQueue.push({
          id: entryData.id,
          type: 'accounting',
          priority: this.determinePriority(entryData.id, 'accounting'),
          status: SyncStatus.PENDING,
          retries: 0
        });
      }

      for (const eventData of unsyncedEvents) {
        this.syncQueue.push({
          id: eventData.id,
          type: 'event',
          priority: this.determinePriority(eventData.id, 'event'),
          status: SyncStatus.PENDING,
          retries: 0
        });
      }

      for (const docData of unsyncedDocuments) {
        this.syncQueue.push({
          id: docData.id,
          type: 'document',
          priority: this.determinePriority(docData.id, 'document'),
          status: SyncStatus.PENDING,
          retries: 0
        });
      }

      // Sort queue by priority
      this.sortSyncQueue();
    } catch (error) {
      console.error('Failed to load pending sync items:', error);
      throw error;
    }
  }

  /**
   * Determine sync priority for an item
   */
  private determinePriority(id: string, type: string): SyncPriority {
    // High priority for recently created items
    if (this.userBehavior.recentlyCreatedItems.includes(id)) {
      return SyncPriority.HIGH;
    }

    // High priority for frequently accessed cases
    if (type === 'case' && this.userBehavior.frequentlyAccessedCases.includes(id)) {
      return SyncPriority.HIGH;
    }

    // High priority for favorite documents
    if (type === 'document' && this.userBehavior.favoriteDocuments.includes(id)) {
      return SyncPriority.HIGH;
    }

    // Medium priority for items created in the last 24 hours
    const item = this.getItemFromStorage(id, type);
    if (item && Date.now() - item.timestamp < 24 * 60 * 60 * 1000) {
      return SyncPriority.MEDIUM;
    }

    // Low priority for older items
    return SyncPriority.LOW;
  }

  /**
   * Get item from storage
   */
  private getItemFromStorage(id: string, type: string): any {
    // This is a simplified implementation
    // In a real app, you would retrieve the actual item from storage
    return {
      id,
      timestamp: Date.now() - Math.floor(Math.random() * 7 * 24 * 60 * 60 * 1000) // Random timestamp within last week
    };
  }

  /**
   * Sort sync queue by priority
   */
  private sortSyncQueue(): void {
    this.syncQueue.sort((a, b) => {
      // High priority first
      if (a.priority === SyncPriority.HIGH && b.priority !== SyncPriority.HIGH) return -1;
      if (a.priority !== SyncPriority.HIGH && b.priority === SyncPriority.HIGH) return 1;
      
      // Medium priority next
      if (a.priority === SyncPriority.MEDIUM && b.priority === SyncPriority.LOW) return -1;
      if (a.priority === SyncPriority.LOW && b.priority === SyncPriority.MEDIUM) return 1;
      
      // For same priority, sort by timestamp (newer first)
      return 0;
    });
  }

  /**
   * Start the synchronization process
   */
  async startSync(): Promise<boolean> {
    try {
      console.log(`Starting smart sync with ${this.syncQueue.length} items in queue`);

      // Process items in batches
      while (this.syncQueue.filter(item => item.status === SyncStatus.PENDING).length > 0) {
        const batch = this.getNextBatch();
        if (batch.length === 0) break;

        await this.processBatch(batch);
      }

      // Check if all items were synced successfully
      const failedItems = this.syncQueue.filter(item => item.status === SyncStatus.FAILED);
      if (failedItems.length > 0) {
        console.warn(`${failedItems.length} items failed to sync`);
        return false;
      }

      console.log('Smart sync completed successfully');
      return true;
    } catch (error) {
      console.error('Smart sync failed:', error);
      throw error;
    }
  }

  /**
   * Get next batch of items to sync
   */
  private getNextBatch(): SyncItem[] {
    const pendingItems = this.syncQueue
      .filter(item => item.status === SyncStatus.PENDING)
      .slice(0, this.batchSize);

    return pendingItems;
  }

  /**
   * Process a batch of sync items
   */
  private async processBatch(batch: SyncItem[]): Promise<void> {
    console.log(`Processing batch of ${batch.length} items`);

    // Update status to in progress
    batch.forEach(item => {
      item.status = SyncStatus.IN_PROGRESS;
      item.lastAttempt = new Date();
    });

    // Process each item
    for (const item of batch) {
      try {
        await this.syncItem(item);
        item.status = SyncStatus.COMPLETED;
        console.log(`Successfully synced ${item.type} ${item.id}`);
      } catch (error) {
        item.status = SyncStatus.FAILED;
        item.error = error instanceof Error ? error.message : 'Unknown error';
        item.retries++;

        console.error(`Failed to sync ${item.type} ${item.id}:`, error);

        // Retry if under max retries
        if (item.retries < this.maxRetries) {
          item.status = SyncStatus.PENDING; // Reset to pending for retry
          console.log(`Will retry ${item.type} ${item.id} (attempt ${item.retries + 1})`);
        }
      }
    }
  }

  /**
   * Sync a single item
   */
  private async syncItem(item: SyncItem): Promise<void> {
    switch (item.type) {
      case 'case':
        await this.syncLawFirmCase(item.id);
        break;
      case 'accounting':
        await this.syncAccountingEntry(item.id);
        break;
      case 'event':
        await this.syncCalendarEvent(item.id);
        break;
      case 'document':
        await this.syncDocument(item.id);
        break;
      default:
        throw new Error(`Unknown item type: ${item.type}`);
    }

    // Mark as synced in storage
    const storeKey = this.getStoreKeyForItemType(item.type);
    await mobileOfflineStorageService.markAsSynced(storeKey, item.id);
  }

  /**
   * Sync a law firm case
   */
  private async syncLawFirmCase(id: string): Promise<void> {
    const caseData = await mobileOfflineStorageService.getLawFirmCase(id);
    if (!caseData) {
      throw new Error(`Law firm case ${id} not found`);
    }

    // In a real implementation, this would sync with the actual service
    await integrationService.createLawFirmCase(caseData.data);
  }

  /**
   * Sync an accounting entry
   */
  private async syncAccountingEntry(id: string): Promise<void> {
    // For accounting entries, we would typically batch them
    // This is a simplified implementation
    console.log(`Would sync accounting entry ${id}`);
  }

  /**
   * Sync a calendar event
   */
  private async syncCalendarEvent(id: string): Promise<void> {
    const eventData = await mobileOfflineStorageService.getCalendarEvent(id);
    if (!eventData) {
      throw new Error(`Calendar event ${id} not found`);
    }

    // In a real implementation, this would sync with the actual service
    await integrationService.createCalendarEvent(eventData.data);
  }

  /**
   * Sync a document
   */
  private async syncDocument(id: string): Promise<void> {
    const docData = await mobileOfflineStorageService.getDocument(id);
    if (!docData.metadata) {
      throw new Error(`Document ${id} not found`);
    }

    // In a real implementation, this would sync with the actual service
    console.log(`Would sync document ${id}`);
  }

  /**
   * Get store key for item type
   */
  private getStoreKeyForItemType(type: string): string {
    switch (type) {
      case 'case': return '@SmartLaw:lawFirmCases';
      case 'accounting': return '@SmartLaw:accountingEntries';
      case 'event': return '@SmartLaw:calendarEvents';
      case 'document': return '@SmartLaw:documents';
      default: throw new Error(`Unknown item type: ${type}`);
    }
  }

  /**
   * Track user behavior
   */
  async trackUserBehavior(
    accessedCaseId?: string,
    createdItemId?: string,
    favoritedDocumentId?: string
  ): Promise<void> {
    try {
      if (accessedCaseId) {
        // Add to frequently accessed cases (limit to 50)
        if (!this.userBehavior.frequentlyAccessedCases.includes(accessedCaseId)) {
          this.userBehavior.frequentlyAccessedCases.push(accessedCaseId);
          if (this.userBehavior.frequentlyAccessedCases.length > 50) {
            this.userBehavior.frequentlyAccessedCases.shift();
          }
        }
      }

      if (createdItemId) {
        // Add to recently created items (limit to 20)
        if (!this.userBehavior.recentlyCreatedItems.includes(createdItemId)) {
          this.userBehavior.recentlyCreatedItems.push(createdItemId);
          if (this.userBehavior.recentlyCreatedItems.length > 20) {
            this.userBehavior.recentlyCreatedItems.shift();
          }
        }
      }

      if (favoritedDocumentId) {
        // Add to favorite documents (no limit)
        if (!this.userBehavior.favoriteDocuments.includes(favoritedDocumentId)) {
          this.userBehavior.favoriteDocuments.push(favoritedDocumentId);
        }
      }

      // Update last sync timestamp
      this.userBehavior.lastSyncTimestamp = new Date();

      // Save user behavior to storage
      await mobileOfflineStorageService.saveSetting('userBehavior', this.userBehavior);

      // Reprioritize sync queue based on new behavior
      this.reprioritizeSyncQueue();
    } catch (error) {
      console.error('Failed to track user behavior:', error);
      throw error;
    }
  }

  /**
   * Reprioritize sync queue based on updated user behavior
   */
  private reprioritizeSyncQueue(): void {
    this.syncQueue.forEach(item => {
      item.priority = this.determinePriority(item.id, item.type);
    });

    // Re-sort the queue
    this.sortSyncQueue();
  }

  /**
   * Get sync status
   */
  getSyncStatus(): {
    totalItems: number;
    pendingItems: number;
    completedItems: number;
    failedItems: number;
    inProgressItems: number;
  } {
    return {
      totalItems: this.syncQueue.length,
      pendingItems: this.syncQueue.filter(item => item.status === SyncStatus.PENDING).length,
      completedItems: this.syncQueue.filter(item => item.status === SyncStatus.COMPLETED).length,
      failedItems: this.syncQueue.filter(item => item.status === SyncStatus.FAILED).length,
      inProgressItems: this.syncQueue.filter(item => item.status === SyncStatus.IN_PROGRESS).length
    };
  }

  /**
   * Clear completed items from sync queue
   */
  async clearCompletedItems(): Promise<void> {
    this.syncQueue = this.syncQueue.filter(item => item.status !== SyncStatus.COMPLETED);
    console.log('Cleared completed items from sync queue');
  }

  /**
   * Retry failed items
   */
  async retryFailedItems(): Promise<void> {
    const failedItems = this.syncQueue.filter(item => item.status === SyncStatus.FAILED);
    console.log(`Retrying ${failedItems.length} failed items`);

    failedItems.forEach(item => {
      if (item.retries < this.maxRetries) {
        item.status = SyncStatus.PENDING;
        item.error = undefined;
      }
    });

    // Re-sort the queue
    this.sortSyncQueue();
  }
}

// Export singleton instance
export const smartSyncService = new SmartSyncService();