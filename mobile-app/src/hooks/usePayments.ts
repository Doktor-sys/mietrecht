/**
 * React Hook for Payments
 * 
 * This hook provides easy access to payment functionality in React components
 * with proper state management and error handling.
 */

import { useState, useEffect, useCallback } from 'react';
import { 
  paymentService, 
  PaymentDetails, 
  PaymentResult, 
  PaymentHistoryItem,
  PaymentMethod
} from '../services/paymentService';
import { 
  biometricAuthService, 
  BiometricAuthResult,
  BiometricType
} from '../services/biometricAuthService';

// Type definitions for hook state
interface PaymentState {
  isSupported: boolean;
  isInitialized: boolean;
  isProcessing: boolean;
  error?: string;
  paymentHistory: PaymentHistoryItem[];
  availablePaymentMethods: PaymentMethod[];
  availableBiometricTypes: BiometricType[];
  isBiometricAuthAvailable: boolean;
}

// Initial state
const INITIAL_STATE: PaymentState = {
  isSupported: true, // Mobile apps always support payments
  isInitialized: false,
  isProcessing: false,
  paymentHistory: [],
  availablePaymentMethods: ['apple_pay', 'google_pay', 'bank_transfer'],
  availableBiometricTypes: [],
  isBiometricAuthAvailable: false
};

/**
 * Custom React hook for payment functionality
 */
export const usePayments = (userId: string) => {
  const [state, setState] = useState<PaymentState>(INITIAL_STATE);

  /**
   * Initialize payment functionality
   */
  const initialize = useCallback(async () => {
    try {
      setState(prev => ({ ...prev, error: undefined }));
      
      // Initialize payment service
      await paymentService.initialize();
      
      // Initialize biometric auth service
      await biometricAuthService.initialize();
      
      // Get available biometric types
      const availableBiometricTypes = await biometricAuthService.getAvailableBiometricTypes();
      
      // Check if biometric auth is available
      const isBiometricAuthAvailable = await biometricAuthService.isBiometricAuthAvailable();
      
      // Get payment history
      const paymentHistory = await paymentService.getPaymentHistory(10);
      
      setState({
        isSupported: true,
        isInitialized: true,
        isProcessing: false,
        paymentHistory,
        availablePaymentMethods: ['apple_pay', 'google_pay', 'bank_transfer'],
        availableBiometricTypes,
        isBiometricAuthAvailable
      });
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Payment initialization failed'
      }));
      throw error;
    }
  }, []);

  /**
   * Process a payment
   */
  const processPayment = useCallback(async (
    paymentMethod: PaymentMethod,
    details: PaymentDetails,
    requireBiometricAuth: boolean = true
  ): Promise<PaymentResult> => {
    if (!state.isInitialized) {
      throw new Error('Payment functionality not initialized');
    }

    try {
      setState(prev => ({ ...prev, isProcessing: true, error: undefined }));
      
      // Check if biometric authentication is required and available
      if (requireBiometricAuth && state.isBiometricAuthAvailable) {
        const biometricResult = await biometricAuthService.authenticate();
        if (!biometricResult.success) {
          throw new Error(biometricResult.errorMessage || 'Biometric authentication failed');
        }
      }
      
      let result: PaymentResult;
      
      // Process payment based on method
      switch (paymentMethod) {
        case 'apple_pay':
          result = await paymentService.processApplePayPayment(details);
          break;
        case 'google_pay':
          result = await paymentService.processGooglePayPayment(details);
          break;
        case 'bank_transfer':
          result = await paymentService.processBankTransferPayment(details);
          break;
        default:
          throw new Error(`Unsupported payment method: ${paymentMethod}`);
      }
      
      // Update payment history if successful
      if (result.success) {
        const updatedHistory = await paymentService.getPaymentHistory(10);
        setState(prev => ({ ...prev, paymentHistory: updatedHistory }));
      }
      
      return result;
    } catch (error) {
      setState(prev => ({
        ...prev,
        isProcessing: false,
        error: error instanceof Error ? error.message : 'Payment processing failed'
      }));
      throw error;
    } finally {
      setState(prev => ({ ...prev, isProcessing: false }));
    }
  }, [state.isInitialized, state.isBiometricAuthAvailable]);

  /**
   * Process Apple Pay payment
   */
  const processApplePayPayment = useCallback(async (
    details: PaymentDetails,
    requireBiometricAuth: boolean = true
  ): Promise<PaymentResult> => {
    return await processPayment('apple_pay', details, requireBiometricAuth);
  }, [processPayment]);

  /**
   * Process Google Pay payment
   */
  const processGooglePayPayment = useCallback(async (
    details: PaymentDetails,
    requireBiometricAuth: boolean = true
  ): Promise<PaymentResult> => {
    return await processPayment('google_pay', details, requireBiometricAuth);
  }, [processPayment]);

  /**
   * Process bank transfer payment
   */
  const processBankTransferPayment = useCallback(async (
    details: PaymentDetails,
    requireBiometricAuth: boolean = true
  ): Promise<PaymentResult> => {
    return await processPayment('bank_transfer', details, requireBiometricAuth);
  }, [processPayment]);

  /**
   * Get payment history
   */
  const getPaymentHistory = useCallback(async (limit?: number): Promise<PaymentHistoryItem[]> => {
    if (!state.isInitialized) {
      throw new Error('Payment functionality not initialized');
    }

    try {
      const history = await paymentService.getPaymentHistory(limit);
      setState(prev => ({ ...prev, paymentHistory: history }));
      return history;
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Failed to get payment history'
      }));
      throw error;
    }
  }, [state.isInitialized]);

  /**
   * Get payment by ID
   */
  const getPaymentById = useCallback(async (id: string): Promise<PaymentHistoryItem | null> => {
    if (!state.isInitialized) {
      throw new Error('Payment functionality not initialized');
    }

    try {
      return await paymentService.getPaymentById(id);
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Failed to get payment'
      }));
      throw error;
    }
  }, [state.isInitialized]);

  /**
   * Refund a payment
   */
  const refundPayment = useCallback(async (transactionId: string): Promise<boolean> => {
    if (!state.isInitialized) {
      throw new Error('Payment functionality not initialized');
    }

    try {
      setState(prev => ({ ...prev, isProcessing: true, error: undefined }));
      
      const success = await paymentService.refundPayment(transactionId);
      
      if (success) {
        // Update payment history
        const updatedHistory = await paymentService.getPaymentHistory(10);
        setState(prev => ({ ...prev, paymentHistory: updatedHistory }));
      }
      
      return success;
    } catch (error) {
      setState(prev => ({
        ...prev,
        isProcessing: false,
        error: error instanceof Error ? error.message : 'Failed to refund payment'
      }));
      throw error;
    } finally {
      setState(prev => ({ ...prev, isProcessing: false }));
    }
  }, [state.isInitialized]);

  /**
   * Authenticate with biometrics
   */
  const authenticateWithBiometrics = useCallback(async (): Promise<BiometricAuthResult> => {
    try {
      if (!state.isBiometricAuthAvailable) {
        return {
          success: false,
          errorMessage: 'Biometric authentication is not available'
        };
      }
      
      return await biometricAuthService.authenticate();
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Biometric authentication failed'
      }));
      throw error;
    }
  }, [state.isBiometricAuthAvailable]);

  /**
   * Check if Apple Pay is available
   */
  const isApplePayAvailable = useCallback(async (): Promise<boolean> => {
    if (!state.isInitialized) {
      throw new Error('Payment functionality not initialized');
    }

    try {
      return await paymentService.isApplePayAvailable();
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Failed to check Apple Pay availability'
      }));
      throw error;
    }
  }, [state.isInitialized]);

  /**
   * Check if Google Pay is available
   */
  const isGooglePayAvailable = useCallback(async (): Promise<boolean> => {
    if (!state.isInitialized) {
      throw new Error('Payment functionality not initialized');
    }

    try {
      return await paymentService.isGooglePayAvailable();
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Failed to check Google Pay availability'
      }));
      throw error;
    }
  }, [state.isInitialized]);

  /**
   * Format amount for display
   */
  const formatAmount = useCallback((amount: number, currency: string): string => {
    return paymentService.formatAmount(amount, currency);
  }, []);

  // Effect to initialize on mount
  useEffect(() => {
    initialize();
  }, [initialize]);

  return {
    // State
    ...state,
    
    // Functions
    initialize,
    processPayment,
    processApplePayPayment,
    processGooglePayPayment,
    processBankTransferPayment,
    getPaymentHistory,
    getPaymentById,
    refundPayment,
    authenticateWithBiometrics,
    isApplePayAvailable,
    isGooglePayAvailable,
    formatAmount
  };
};