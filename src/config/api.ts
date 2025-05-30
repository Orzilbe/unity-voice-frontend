// API Configuration for Unity Voice Frontend
// This file centralizes all API endpoint configurations

// Get the API URL from environment variables
const API_URL = process.env.NEXT_PUBLIC_API_URL;

// Helper function to handle API responses
async function handleResponse(response: Response) {
  const contentType = response.headers.get('content-type');
  
  console.log(`Response status: ${response.status}, Content-Type: ${contentType}`);
  
  if (contentType && contentType.includes('application/json')) {
    try {
      const data = await response.json();
      
      if (!response.ok) {
        const errorObj = {
          status: response.status,
          statusText: response.statusText,
          message: data.message || data.error || 'API request failed',
          responseData: data,
          url: response.url
        };
        console.error('API Error (JSON):', errorObj);
        throw errorObj;
      }
      
      return data;
    } catch (jsonError) {
      if (!response.ok) {
        const errorObj = {
          status: response.status,
          statusText: response.statusText,
          message: `Failed to parse JSON response: ${jsonError}`,
          responseData: null,
          url: response.url
        };
        console.error('API Error (JSON Parse Failed):', errorObj);
        throw errorObj;
      }
      throw jsonError;
    }
  }
  
  // Handle non-JSON responses
  try {
    const text = await response.text();
    console.log(`Response text (first 200 chars): ${text.substring(0, 200)}`);
    
    if (!response.ok) {
      const errorObj = {
        status: response.status,
        statusText: response.statusText,
        message: text || 'API request failed',
        responseData: text,
        url: response.url
      };
      console.error('API Error (Text):', errorObj);
      throw errorObj;
    }
    
    return text;
  } catch (textError) {
    const errorObj = {
      status: response.status,
      statusText: response.statusText,
      message: `Failed to read response: ${textError}`,
      responseData: null,
      url: response.url
    };
    console.error('API Error (Text Read Failed):', errorObj);
    throw errorObj;
  }
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

  const fullUrl = `${API_URL}${endpoint}`;
  console.log(`Making API call to: ${fullUrl}`);

  try {
    const response = await fetch(fullUrl, {
      ...options,
      headers
    });

    return await handleResponse(response);
  } catch (error) {
    console.error(`API call failed for ${endpoint}:`, {
      url: fullUrl,
      error: error,
      errorMessage: error instanceof Error ? error.message : 'Unknown error',
      errorStack: error instanceof Error ? error.stack : undefined,
      headers: headers
    });
    
    // Enhance the error object with more context
    if (error && typeof error === 'object') {
      (error as any).endpoint = endpoint;
      (error as any).fullUrl = fullUrl;
    }
    
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
  getData: async () => apiCall('/user/data'),
};

// Topics endpoints
export const topicsEndpoints = {
  getAll: async () => apiCall('/topics'),
  getById: async (id: string) => apiCall(`/topics/${id}`),
  getUserProgress: async () => apiCall('/topics/progress'),
};

// Task endpoints  
export const taskEndpoints = {
  create: async (taskData: {
    UserId: string;
    TopicName: string;
    Level: number;
    TaskType: string;
  }) => apiCall('/tasks', {
    method: 'POST',
    body: JSON.stringify(taskData),
  }),
  getById: async (taskId: string) => apiCall(`/tasks/${taskId}`),
  update: async (taskId: string, updateData: unknown) => 
    apiCall(`/tasks/${taskId}`, {
      method: 'PUT',
      body: JSON.stringify(updateData),
    }),
  getUserTasks: async (userId: string) => apiCall(`/tasks/user/${userId}`),
};

// Flashcard endpoints
export const flashcardEndpoints = {
  getByTopicAndLevel: async (topic: string, level: number) => 
    apiCall(`/flashcards/${encodeURIComponent(topic)}/${level}`),
};

export default {
  apiCall,
  authenticatedApiCall,
  healthCheck,
  auth: authEndpoints,
  user: userEndpoints,
  topics: topicsEndpoints,
  tasks: taskEndpoints,
  flashcards: flashcardEndpoints,
}; 