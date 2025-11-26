// @ts-ignore
import axios from 'axios';
// @ts-ignore
import * as SecureStore from 'expo-secure-store';
// @ts-ignore
import * as Device from 'expo-device';

const API_BASE_URL = 'http://localhost:3001/api';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000, // 30 second timeout
});

// Request interceptor for security enhancements
apiClient.interceptors.request.use(
  function(config: any) {
    // Add device information for security tracking
    const deviceInfo = {
      brand: Device.brand,
      modelName: Device.modelName,
      osName: Device.osName,
      osVersion: Device.osVersion,
      platform: Device.platform,
      isDevice: Device.isDevice
    };
    
    // Add security headers
    if (config.headers) {
      config.headers['X-Device-Info'] = JSON.stringify(deviceInfo);
      config.headers['X-Content-Type-Options'] = 'nosniff';
      config.headers['X-Frame-Options'] = 'DENY';
      config.headers['X-XSS-Protection'] = '1; mode=block';
      
      // Add auth token
      return SecureStore.getItemAsync('token').then(function(token: string | null) {
        if (token) {
          config.headers.Authorization = 'Bearer ' + token;
        }
        return config;
      });
    }
    
    return config;
  },
  function(error: any) {
    // @ts-ignore
    return Promise.reject(error);
  }
);

// Response interceptor for security and error handling
apiClient.interceptors.response.use(
  function(response: any) {
    return response;
  },
  function(error: any) {
    // Handle common security-related errors
    if (error.response) {
      switch (error.response.status) {
        case 401:
          // Unauthorized - clear tokens and potentially redirect to login
          SecureStore.deleteItemAsync('token');
          // In a real app, you might want to navigate to login screen
          // @ts-ignore
          console.warn('Unauthorized access - token cleared');
          break;
        case 403:
          // Forbidden - show access denied message
          // @ts-ignore
          console.warn('Access denied - insufficient permissions');
          break;
        case 429:
          // Rate limited - show rate limit message
          // @ts-ignore
          console.warn('Rate limit exceeded - please try again later');
          break;
        default:
          break;
      }
    }
    // @ts-ignore
    return Promise.reject(error);
  }
);

export const authAPI = {
  login: function(credentials: any) {
    // Add client-side validation
    if (!credentials.email || !credentials.password) {
      throw new Error('Email and password are required');
    }
    
    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(credentials.email)) {
      throw new Error('Invalid email format');
    }
    
    // Add device fingerprint for security tracking
    const deviceInfo = {
      brand: Device.brand,
      modelName: Device.modelName,
      osName: Device.osName,
      osVersion: Device.osVersion,
      platform: Device.platform,
      isDevice: Device.isDevice,
      timestamp: new Date().toISOString()
    };
    
    const loginData = {
      email: credentials.email,
      password: credentials.password,
      deviceInfo: deviceInfo
    };
    
    return apiClient.post('/auth/login', loginData).then(function(response: any) {
      // Store tokens securely
      if (response.data.token) {
        SecureStore.setItemAsync('token', response.data.token);
      }
      
      // Store CSRF token if provided
      if (response.data.csrfToken) {
        SecureStore.setItemAsync('csrfToken', response.data.csrfToken);
      }
      
      return response.data;
    });
  },
  register: function(userData: any) {
    // Add client-side validation
    if (!userData.email || !userData.password || !userData.userType) {
      throw new Error('Email, password, and user type are required');
    }
    
    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(userData.email)) {
      throw new Error('Invalid email format');
    }
    
    // Validate password strength
    if (userData.password.length < 8) {
      throw new Error('Password must be at least 8 characters long');
    }
    
    // Add device fingerprint for security tracking
    const deviceInfo = {
      brand: Device.brand,
      modelName: Device.modelName,
      osName: Device.osName,
      osVersion: Device.osVersion,
      platform: Device.platform,
      isDevice: Device.isDevice,
      timestamp: new Date().toISOString()
    };
    
    const registerData = {
      email: userData.email,
      password: userData.password,
      userType: userData.userType,
      deviceInfo: deviceInfo
    };
    
    return apiClient.post('/auth/register', registerData).then(function(response: any) {
      // Store tokens securely
      if (response.data.token) {
        SecureStore.setItemAsync('token', response.data.token);
      }
      
      // Store CSRF token if provided
      if (response.data.csrfToken) {
        SecureStore.setItemAsync('csrfToken', response.data.csrfToken);
      }
      
      return response.data;
    });
  },
  logout: function() {
    // Clear local tokens first
    SecureStore.deleteItemAsync('token');
    SecureStore.deleteItemAsync('csrfToken');
    
    return apiClient.post('/auth/logout').then(function(response: any) {
      return response.data;
    });
  },
};

export const chatAPI = {
  startConversation: function(initialQuery: string) {
    return apiClient.post('/chat/start', { query: initialQuery }).then(function(response: any) {
      return response.data;
    });
  },
  sendMessage: function(conversationId: string, message: string) {
    return apiClient.post('/chat/' + conversationId + '/message', { message: message }).then(function(response: any) {
      return response.data;
    });
  },
};

export const documentAPI = {
  upload: function(file: any, documentType: string) {
    // Validate file (basic validation for mobile)
    if (!file) {
      throw new Error('File is required');
    }
    
    // @ts-ignore
    const formData = new FormData();
    formData.append('file', file);
    formData.append('documentType', documentType);
    
    // Add file metadata for security validation
    if (file.name) {
      formData.append('fileName', file.name);
    }
    if (file.size) {
      formData.append('fileSize', file.size.toString());
    }
    if (file.type) {
      formData.append('fileType', file.type);
    }
    
    return apiClient.post('/documents/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }).then(function(response: any) {
      return response.data;
    });
  },
  analyze: function(documentId: string) {
    return apiClient.post('/documents/' + documentId + '/analyze').then(function(response: any) {
      return response.data;
    });
  },
  getAll: function(): Promise<any> {
    return apiClient.get('/documents').then(function(response: any) {
      return response.data;
    });
  },
};

export const lawyerAPI = {
  search: function(criteria: any) {
    return apiClient.get('/lawyers/search', { params: criteria }).then(function(response: any) {
      return response.data;
    });
  },
  getById: function(lawyerId: string) {
    return apiClient.get('/lawyers/' + lawyerId).then(function(response: any) {
      return response.data;
    });
  },
  bookConsultation: function(lawyerId: string, timeSlot: string) {
    return apiClient.post('/lawyers/' + lawyerId + '/book', { timeSlot: timeSlot }).then(function(response: any) {
      return response.data;
    });
  },
};

// Security utility functions
export const securityUtils = {
  clearAuthTokens: function() {
    SecureStore.deleteItemAsync('token');
    SecureStore.deleteItemAsync('csrfToken');
  },
  
  getAuthToken: function() {
    return SecureStore.getItemAsync('token');
  },
  
  setAuthToken: function(token: string) {
    SecureStore.setItemAsync('token', token);
  },
  
  getCSRFToken: function() {
    return SecureStore.getItemAsync('csrfToken');
  },
  
  setCSRFToken: function(token: string) {
    SecureStore.setItemAsync('csrfToken', token);
  }
};

export default apiClient;
