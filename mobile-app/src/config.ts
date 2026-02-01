import { Platform } from 'react-native';

const DEV_API_URL = Platform.select({
    ios: 'http://localhost:3000',
    android: 'http://10.0.2.2:3000', // Std Android Emulator localhost
    default: 'http://localhost:3000',
});

// TODO: Replace with real production URL via env var or build config
export const API_URL = __DEV__ ? DEV_API_URL : 'https://api.smartlaw.de';
