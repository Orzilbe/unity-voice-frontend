// unity-voice-frontend/src/config/api.ts
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

// ✅ Main API call function - עודכן לשימוש עם cookies
async function apiCall(endpoint: string, options: RequestInit = {}) {
  // ✅ הסרנו את כל הטיפול בטוקנים
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers
  };

  const fullUrl = `${API_URL}${endpoint}`;
  console.log(`Making API call to: ${fullUrl}`);

  try {
    const response = await fetch(fullUrl, {
      ...options,
      headers,
      credentials: 'include' // ✅ הקטע החשוב - כולל cookies אוטומטית!
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

// ✅ פונקציה פשוטה יותר - בלי בדיקות טוקן
export async function authenticatedApiCall(endpoint: string, options: RequestInit = {}) {
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
    
  validate: async () => // ✅ הסרנו את הפרמטר token
    apiCall('/auth/validate', {
      method: 'POST',
      body: JSON.stringify({}),
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
    StartDate?: string;
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

// ✅ Flashcard endpoints - כל הקריאות יכללו cookies אוטומטית
export const flashcardEndpoints = {
  getByTopicAndLevel: async (topic: string, level: number) => {
    try {
      console.log(`🚀 Fetching flashcards: topic="${topic}", level="${level}"`);
      
      const result = await apiCall(`/flashcards/${encodeURIComponent(topic)}/${level}`);
      
      if (result && result.success) {
        console.log(`✅ Received ${result.data.length} unlearned flashcards`);
        return result.data;
      } else if (Array.isArray(result)) {
        console.log(`✅ Received ${result.length} unlearned flashcards (direct array)`);
        return result;
      } else {
        console.error('❌ Unexpected response format:', result);
        throw new Error('Invalid response format from flashcards API');
      }
    } catch (error) {
      console.error('❌ Error fetching flashcards:', error);
      throw error;
    }
  },

  create: async (flashcardData: {
    Word: string;
    Translation: string;
    TopicName: string;
    Level?: number;
    ExampleUsage?: string;
  }) => apiCall('/flashcards', {
    method: 'POST',
    body: JSON.stringify(flashcardData),
  }),

  markAsLearned: async (wordId: string, taskId: string, topicName?: string) => 
    apiCall('/flashcards/mark-learned', {
      method: 'POST',
      body: JSON.stringify({
        WordId: wordId,
        TaskId: taskId,
        TopicName: topicName
      }),
    }),
};

// Words endpoints (לתאימות אחורה ולמקרים מיוחדים)
export const wordsEndpoints = {
  getUnlearned: async (topic: string, level: number, randomLimit: number = 20) => {
    try {
      console.log(`🚀 Fetching unlearned words: topic="${topic}", level="${level}"`);
      
      const result = await apiCall(
        `/words?topic=${encodeURIComponent(topic)}&level=${level}&randomLimit=${randomLimit}&filterLearned=true`
      );
      
      console.log(`✅ Received ${Array.isArray(result) ? result.length : 0} unlearned words`);
      return result;
    } catch (error) {
      console.error('❌ Error fetching unlearned words:', error);
      throw error;
    }
  },

  getLearned: async (topic?: string, level?: number) => {
    const params = new URLSearchParams();
    if (topic) params.append('topic', topic);
    if (level) params.append('level', level.toString());
    
    return apiCall(`/words/learned?${params.toString()}`);
  },

  getInTask: async (taskId: string) => 
    apiCall(`/words/in-task?taskId=${taskId}`),

  addToTask: async (taskId: string, wordIds: string[]) =>
    apiCall('/words/to-task', {
      method: 'POST',
      body: JSON.stringify({
        taskId,
        wordIds
      }),
    }),
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
  words: wordsEndpoints,
};
export const debugEndpoints = {
  cookies: async () => apiCall('/auth/debug/cookies'),
  auth: async () => apiCall('/api/debug/auth')
};