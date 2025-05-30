// API Configuration for Unity Voice Frontend
// This file centralizes all API endpoint configurations

// Get the API URL from environment variables
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://unity-voice-api-linux-f2hsapgsh3hcgqc0.israelcentral-01.azurewebsites.net/api';

// Helper function to handle API responses
async function handleResponse(response: Response) {
  const contentType = response.headers.get('content-type');
  
  if (contentType && contentType.includes('application/json')) {
    const data = await response.json();
    
    if (!response.ok) {
      throw {
        status: response.status,
        message: data.message || 'API request failed',
        responseData: data
      };
    }
    
    return data;
  }
  
  // Handle non-JSON responses
  const text = await response.text();
  if (!response.ok) {
    throw {
      status: response.status,
      message: text || 'API request failed',
      responseData: text
    };
  }
  
  return text;
}

// Main API call function
async function apiCall(endpoint: string, options: RequestInit = {}) {
  const token = localStorage.getItem('token');
  
  // Prepare headers
  const headers = {
    'Content-Type': 'application/json',
    ...(token && { 'Authorization': `Bearer ${token}` }),
    ...options.headers
  };

  try {
    const response = await fetch(`${API_URL}${endpoint}`, {
      ...options,
      headers
    });

    return await handleResponse(response);
  } catch (error) {
    console.error(`API call failed for ${endpoint}:`, error);
    throw error;
  }
}

// Authenticated API call function that ensures a token is present
export async function authenticatedApiCall(endpoint: string, options: RequestInit = {}) {
  const token = localStorage.getItem('token');
  if (!token) {
    throw new Error('Authentication required: No token found');
  }
  return apiCall(endpoint, options);
}

// Health check endpoint
export async function healthCheck() {
  return apiCall('/health');
}

// Authentication endpoints
export const authEndpoints = {
  login: async (credentials: { email: string; password: string }) => 
    apiCall('/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    }),
    
  register: async (userData: {
    email: string;
    password: string;
    name?: string;
    [key: string]: unknown;
  }) => 
    apiCall('/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData),
    }),
    
  validate: async (token: string) => 
    apiCall('/auth/validate', {
      method: 'POST',
      body: JSON.stringify({ token }),
    }),
    
  logout: async () => 
    apiCall('/auth/logout', {
      method: 'POST',
    })
};

// User endpoints
export const userEndpoints = {
  getProfile: async () => apiCall('/user/profile'),
  updateProfile: async (data: unknown) => 
    apiCall('/user/profile', {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
};

// Topics endpoints
export const topicsEndpoints = {
  getAll: async () => apiCall('/topics'),
  getById: async (id: string) => apiCall(`/topics/${id}`),
  getUserProgress: async () => apiCall('/topics/progress'),
};

export default {
  apiCall,
  authenticatedApiCall,
  healthCheck,
  auth: authEndpoints,
  user: userEndpoints,
  topics: topicsEndpoints,
}; 