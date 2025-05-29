// API Configuration for Unity Voice Frontend
// This file centralizes all API endpoint configurations

// The main API base URL - should point to Azure backend
// Next.js will automatically inject NEXT_PUBLIC_ environment variables at build time
export const API_BASE_URL = 'https://unity-voice-api-linux-f2hsapgsh3hcgqc0.israelcentral-01.azurewebsites.net/api';

// Environment validation (only in browser for debugging)
if (typeof window !== 'undefined') {
  const isDev = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
  
  if (isDev) {
    console.log('API Configuration:');
    console.log('Final API_BASE_URL:', API_BASE_URL);
    console.log('✅ All API calls will go to Azure backend');
  }
}

// Helper function for making API calls
export const apiCall = async (endpoint: string, options?: RequestInit) => {
  const url = `${API_BASE_URL}${endpoint}`;
  
  // Debug logging in development
  if (typeof window !== 'undefined') {
    const isDev = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
    if (isDev) {
      console.log('🔗 API Call to:', url);
    }
  }
  
  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
  });
  
  if (!response.ok) {
    const errorText = await response.text();
    console.error(`❌ API call failed: ${response.status} - ${errorText}`);
    throw new Error(`API call failed: ${response.status} ${response.statusText}`);
  }
  
  return response.json();
};

// Helper function for authenticated API calls
export const authenticatedApiCall = async (endpoint: string, options?: RequestInit) => {
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  
  if (!token) {
    throw new Error('No authentication token found');
  }
  
  return apiCall(endpoint, {
    ...options,
    headers: {
      'Authorization': `Bearer ${token}`,
      ...options?.headers,
    },
  });
};

// Specific API endpoint helpers
export const authEndpoints = {
  login: (credentials: any) => 
    apiCall('/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    }),
    
  register: (userData: any) => 
    apiCall('/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData),
    }),
    
  validate: (token: string) => 
    apiCall('/auth/validate', {
      method: 'POST',
      body: JSON.stringify({ token }),
    }),
};

export const healthCheck = () => apiCall('/health');

// Export the configured API base URL for direct use where needed
export { API_BASE_URL as default }; 