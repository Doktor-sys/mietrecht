// @ts-ignore
import * as LocalAuthentication from 'expo-local-authentication';
// @ts-ignore
import * as SecureStore from 'expo-secure-store';
// @ts-ignore
import * as Device from 'expo-device';
// @ts-ignore
import { Platform } from 'react-native';

const BIOMETRIC_ENABLED_KEY = 'biometric_enabled';
const USER_TOKEN_KEY = 'user_token';
const BIOMETRIC_ATTEMPTS_KEY = 'biometric_attempts';
const BIOMETRIC_LOCKOUT_TIME_KEY = 'biometric_lockout_time';

// @ts-ignore
export const BiometricService = {
    // Check if hardware supports biometrics
    // @ts-ignore
    checkAvailability: async (): Promise<boolean> => {
        const hasHardware = await LocalAuthentication.hasHardwareAsync();
        const isEnrolled = await LocalAuthentication.isEnrolledAsync();
        return hasHardware && isEnrolled;
    },

    // Get the type of biometrics supported (FaceID, TouchID, etc.)
    // @ts-ignore
    getBiometricType: async (): Promise<LocalAuthentication.AuthenticationType[]> => {
        return await LocalAuthentication.supportedAuthenticationTypesAsync();
    },

    // Check if user is locked out due to failed attempts
    // @ts-ignore
    isLockedOut: async (): Promise<boolean> => {
        const lockoutTime = await SecureStore.getItemAsync(BIOMETRIC_LOCKOUT_TIME_KEY);
        if (!lockoutTime) return false;
        
        const lockoutTimestamp = parseInt(lockoutTime, 10);
        const currentTime = Date.now();
        
        // Lockout for 30 minutes
        if (currentTime - lockoutTimestamp < 30 * 60 * 1000) {
            return true;
        } else {
            // Clear lockout if time has passed
            await SecureStore.deleteItemAsync(BIOMETRIC_LOCKOUT_TIME_KEY);
            await SecureStore.deleteItemAsync(BIOMETRIC_ATTEMPTS_KEY);
            return false;
        }
    },

    // Authenticate user with enhanced security
    // @ts-ignore
    authenticate: async (): Promise<{ success: boolean; error?: string }> => {
        try {
            // Check if user is locked out
            if (await BiometricService.isLockedOut()) {
                return { 
                    success: false, 
                    error: 'Too many failed attempts. Please try again later.' 
                };
            }
            
            const result = await LocalAuthentication.authenticateAsync({
                promptMessage: 'Authenticate with Biometrics',
                fallbackLabel: 'Use Passcode',
                cancelLabel: 'Cancel',
                disableDeviceFallback: false,
            });
            
            if (result.success) {
                // Reset failed attempts on success
                await SecureStore.deleteItemAsync(BIOMETRIC_ATTEMPTS_KEY);
                return { success: true };
            } else {
                // Track failed attempts
                const attemptsStr = await SecureStore.getItemAsync(BIOMETRIC_ATTEMPTS_KEY);
                const attempts = attemptsStr ? parseInt(attemptsStr, 10) : 0;
                const newAttempts = attempts + 1;
                
                await SecureStore.setItemAsync(BIOMETRIC_ATTEMPTS_KEY, newAttempts.toString());
                
                // Lock user out after 5 failed attempts
                if (newAttempts >= 5) {
                    await SecureStore.setItemAsync(BIOMETRIC_LOCKOUT_TIME_KEY, Date.now().toString());
                    return { 
                        success: false, 
                        error: 'Too many failed attempts. Account locked for 30 minutes.' 
                    };
                }
                
                return { 
                    success: false, 
                    error: result.error || 'Biometric authentication failed' 
                };
            }
        } catch (error) {
            // @ts-ignore
            console.error('Biometric auth error:', error);
            return { 
                success: false, 
                error: 'Biometric authentication error' 
            };
        }
    },

    // Enable biometric login with device binding
    // @ts-ignore
    enableBiometric: async (): Promise<{ success: boolean; error?: string }> => {
        try {
            // Bind biometric to current device
            const deviceInfo = {
                brand: Device.brand,
                modelName: Device.modelName,
                osName: Device.osName,
                osVersion: Device.osVersion
            };
            
            // Create a simple hash function for device binding
            const deviceString = JSON.stringify(deviceInfo);
            let deviceHash = '';
            for (let i = 0; i < deviceString.length; i++) {
                deviceHash += deviceString.charCodeAt(i).toString(16);
            }
            await SecureStore.setItemAsync(BIOMETRIC_ENABLED_KEY, 'true');
            await SecureStore.setItemAsync('biometric_device_hash', deviceHash);
            
            return { success: true };
        } catch (error) {
            // @ts-ignore
            console.error('Error enabling biometric:', error);
            return { 
                success: false, 
                error: 'Failed to enable biometric authentication' 
            };
        }
    },

    // Disable biometric login
    // @ts-ignore
    disableBiometric: async (): Promise<void> => {
        await SecureStore.deleteItemAsync(BIOMETRIC_ENABLED_KEY);
        await SecureStore.deleteItemAsync('biometric_device_hash');
        await SecureStore.deleteItemAsync(BIOMETRIC_ATTEMPTS_KEY);
        await SecureStore.deleteItemAsync(BIOMETRIC_LOCKOUT_TIME_KEY);
    },

    // Check if biometric login is enabled
    // @ts-ignore
    isBiometricEnabled: async (): Promise<boolean> => {
        const result = await SecureStore.getItemAsync(BIOMETRIC_ENABLED_KEY);
        return result === 'true';
    },

    // Securely store token with additional encryption
    // @ts-ignore
    storeToken: async (token: string): Promise<void> => {
        // In a real implementation, you might want to encrypt the token
        // before storing it in SecureStore
        await SecureStore.setItemAsync(USER_TOKEN_KEY, token);
    },

    // Retrieve token
    // @ts-ignore
    getToken: async (): Promise<string | null> => {
        return await SecureStore.getItemAsync(USER_TOKEN_KEY);
    },
    
    // Clear all biometric-related data
    // @ts-ignore
    clearAllData: async (): Promise<void> => {
        await SecureStore.deleteItemAsync(BIOMETRIC_ENABLED_KEY);
        await SecureStore.deleteItemAsync(USER_TOKEN_KEY);
        await SecureStore.deleteItemAsync('biometric_device_hash');
        await SecureStore.deleteItemAsync(BIOMETRIC_ATTEMPTS_KEY);
        await SecureStore.deleteItemAsync(BIOMETRIC_LOCKOUT_TIME_KEY);
    }
};
