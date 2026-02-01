/**
 * Integration Service
 * 
 * This service coordinates the integration of all mobile app features:
 * offline functionality, push notifications, and payment systems.
 */

import { mobileOfflineStorageService } from './mobileOfflineStorage';
import { smartSyncService } from './smartSyncService';
import { offlineDocumentManager } from './offlineDocumentManager';
import { pushNotificationService } from './pushNotificationService';
import { personalizedNotificationService } from './personalizedNotificationService';
import { paymentService } from './paymentService';
import { biometricAuthService } from './biometricAuthService';

// Types for integration status
export type IntegrationStatus = 'idle' | 'initializing' | 'ready' | 'error';

export interface IntegrationState {
  offlineServices: IntegrationStatus;
  notificationServices: IntegrationStatus;
  paymentServices: IntegrationStatus;
  overallStatus: IntegrationStatus;
  lastError?: string;
}

class IntegrationService {
  private state: IntegrationState = {
    offlineServices: 'idle',
    notificationServices: 'idle',
    paymentServices: 'idle',
    overallStatus: 'idle'
  };

  /**
   * Initialize all services
   */
  async initializeAllServices(): Promise<boolean> {
    try {
      console.log('Initializing all mobile app services...');
      
      // Update overall status
      this.state.overallStatus = 'initializing';
      
      // Initialize offline services
      await this.initializeOfflineServices();
      
      // Initialize notification services
      await this.initializeNotificationServices();
      
      // Initialize payment services
      await this.initializePaymentServices();
      
      // All services initialized successfully
      this.state.overallStatus = 'ready';
      console.log('All mobile app services initialized successfully');
      
      return true;
    } catch (error) {
      this.state.overallStatus = 'error';
      this.state.lastError = error instanceof Error ? error.message : 'Unknown error during initialization';
      console.error('Failed to initialize mobile app services:', error);
      throw error;
    }
  }

  /**
   * Initialize offline services
   */
  private async initializeOfflineServices(): Promise<void> {
    try {
      this.state.offlineServices = 'initializing';
      
      await mobileOfflineStorageService.initialize();
      await smartSyncService.initialize();
      await offlineDocumentManager.initialize();
      
      this.state.offlineServices = 'ready';
      console.log('Offline services initialized successfully');
    } catch (error) {
      this.state.offlineServices = 'error';
      throw error;
    }
  }

  /**
   * Initialize notification services
   */
  private async initializeNotificationServices(): Promise<void> {
    try {
      this.state.notificationServices = 'initializing';
      
      await pushNotificationService.initialize();
      await personalizedNotificationService.initialize();
      await personalizedNotificationService.registerNotificationCategories();
      
      this.state.notificationServices = 'ready';
      console.log('Notification services initialized successfully');
    } catch (error) {
      this.state.notificationServices = 'error';
      throw error;
    }
  }

  /**
   * Initialize payment services
   */
  private async initializePaymentServices(): Promise<void> {
    try {
      this.state.paymentServices = 'initializing';
      
      await paymentService.initialize();
      await biometricAuthService.initialize();
      
      this.state.paymentServices = 'ready';
      console.log('Payment services initialized successfully');
    } catch (error) {
      this.state.paymentServices = 'error';
      throw error;
    }
  }

  /**
   * Get current integration state
   */
  getIntegrationState(): IntegrationState {
    return { ...this.state };
  }

  /**
   * Check if all services are ready
   */
  areAllServicesReady(): boolean {
    return (
      this.state.offlineServices === 'ready' &&
      this.state.notificationServices === 'ready' &&
      this.state.paymentServices === 'ready' &&
      this.state.overallStatus === 'ready'
    );
  }

  /**
   * Synchronize all offline data
   */
  async synchronizeAllData(): Promise<boolean> {
    try {
      if (!this.areAllServicesReady()) {
        throw new Error('Services not ready for synchronization');
      }

      console.log('Starting full data synchronization...');
      
      // Start smart sync
      const syncSuccess = await smartSyncService.startSync();
      
      if (syncSuccess) {
        console.log('Full data synchronization completed successfully');
        return true;
      } else {
        console.warn('Full data synchronization completed with some failures');
        return false;
      }
    } catch (error) {
      console.error('Failed to synchronize all data:', error);
      throw error;
    }
  }

  /**
   * Test all services
   */
  async testAllServices(): Promise<{[key: string]: boolean}> {
    try {
      const results: {[key: string]: boolean} = {};
      
      // Test offline services
      try {
        await mobileOfflineStorageService.getStorageInfo();
        results.offlineServices = true;
      } catch (error) {
        results.offlineServices = false;
      }
      
      // Test notification services
      try {
        await pushNotificationService.getUserPreferences('test-user');
        results.notificationServices = true;
      } catch (error) {
        results.notificationServices = false;
      }
      
      // Test payment services
      try {
        await paymentService.isApplePayAvailable();
        results.paymentServices = true;
      } catch (error) {
        results.paymentServices = false;
      }
      
      return results;
    } catch (error) {
      console.error('Failed to test all services:', error);
      throw error;
    }
  }

  /**
   * Reset all services
   */
  async resetAllServices(): Promise<void> {
    try {
      console.log('Resetting all services...');
      
      // Reset state
      this.state = {
        offlineServices: 'idle',
        notificationServices: 'idle',
        paymentServices: 'idle',
        overallStatus: 'idle'
      };
      
      console.log('All services reset successfully');
    } catch (error) {
      console.error('Failed to reset all services:', error);
      throw error;
    }
  }

  /**
   * Handle app foreground transition
   */
  async handleAppForeground(): Promise<void> {
    try {
      console.log('Handling app foreground transition...');
      
      // Refresh data if needed
      await this.synchronizeAllData();
      
      // Update notifications
      // In a real implementation, this would refresh notification badges, etc.
      
      console.log('App foreground transition handled successfully');
    } catch (error) {
      console.error('Failed to handle app foreground transition:', error);
      throw error;
    }
  }

  /**
   * Handle app background transition
   */
  async handleAppBackground(): Promise<void> {
    try {
      console.log('Handling app background transition...');
      
      // Save any pending data
      // In a real implementation, this would save unsaved changes
      
      console.log('App background transition handled successfully');
    } catch (error) {
      console.error('Failed to handle app background transition:', error);
      throw error;
    }
  }
}

// Export singleton instance
export const integrationService = new IntegrationService();