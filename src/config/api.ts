// unity-voice-frontend/src/config/api.ts - חלק מעודכן
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

console.log('🔧 API Configuration:', {
  NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
  API_URL: API_URL,
  NODE_ENV: process.env.NODE_ENV
});

// Helper function to handle API responses
async function handleResponse(response: Response) {
  const contentType = response.headers.get('content-type');
  
  console.log(`📡 Response: ${response.status} ${response.statusText}, Content-Type: ${contentType}`);
  
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
        console.error('❌ API Error (JSON):', errorObj);
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
        console.error('❌ API Error (JSON Parse Failed):', errorObj);
        throw errorObj;
      }
      throw jsonError;
    }
  }
  
  try {
    const text = await response.text();
    console.log(`📄 Response text (first 200 chars): ${text.substring(0, 200)}`);
    
    if (!response.ok) {
      const errorObj = {
        status: response.status,
        statusText: response.statusText,
        message: text || 'API request failed',
        responseData: text,
        url: response.url
      };
      console.error('❌ API Error (Text):', errorObj);
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
    console.error('❌ API Error (Text Read Failed):', errorObj);
    throw errorObj;
  }
}

// ✅ פונקציה לקבלת טוקן
function getAuthToken(): string | null {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('token');
  }
  return null;
}

// ✅ פונקציה לשמירת טוקן גם בcookie
function setTokenCookie(token: string) {
  if (typeof document !== 'undefined') {
    // בדיקה אם אנחנו בproduction (HTTPS) או development (HTTP)
    const isProduction = window.location.protocol === 'https:';
    
    const cookieOptions = [
      `authToken=${token}`,
      'path=/',
      // רק בproduction נשתמש בSecure ו-SameSite=None
      ...(isProduction ? ['SameSite=None', 'Secure'] : ['SameSite=Lax']),
      // תוקף של 24 שעות
      `max-age=${24 * 60 * 60}`
    ];
    
    document.cookie = cookieOptions.join('; ');
    console.log('🍪 Token set in cookie:', {
      isProduction,
      cookieString: cookieOptions.join('; ')
    });
  }
}

// ✅ Main API call function - עודכן לתמיכה בcookies
async function apiCall(endpoint: string, options: RequestInit = {}) {
  if (!endpoint.startsWith('/')) {
    endpoint = '/' + endpoint;
  }
  
  // ✅ הכן headers
  const token = getAuthToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...options.headers as Record<string, string>
  };

  // ✅ הוסף Authorization header אם יש טוקן
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const fullUrl = `${API_URL}${endpoint}`;
  console.log(`🚀 Making API call to: ${fullUrl}`, {
    hasToken: !!token,
    environment: process.env.NODE_ENV
  });

  try {
    const response = await fetch(fullUrl, {
      ...options,
      headers,
      credentials: 'include' // שליחת cookies
    });

    return await handleResponse(response);
  } catch (error) {
    console.error(`💥 API call failed for ${endpoint}:`, {
      url: fullUrl,
      error: error,
      errorMessage: error instanceof Error ? error.message : 'Unknown error',
      headers: headers
    });
    
    if (error && typeof error === 'object') {
      (error as any).endpoint = endpoint;
      (error as any).fullUrl = fullUrl;
    }
    
    throw error;
  }
}

export async function authenticatedApiCall(endpoint: string, options: RequestInit = {}) {
  return apiCall(endpoint, options);
}

export async function healthCheck() {
  return apiCall('/health');
}

// Authentication endpoints
export const authEndpoints = {
  login: async (credentials: { email: string; password: string }) => {
    const result = await apiCall('/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });
    
    // ✅ אם קיבלנו טוקן, נשמור אותו גם בcookie
    if (result.success && result.token) {
      localStorage.setItem('token', result.token);
      setTokenCookie(result.token);
      console.log('💾 Token saved to localStorage and cookie');
    }
    
    return result;
  },
    
  register: async (userData: {
    email: string;
    password: string;
    firstName?: string;
    lastName?: string;
    phoneNumber?: string;
    englishLevel?: string;
    ageRange?: string;
    [key: string]: unknown;
  }) => 
    apiCall('/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData),
    }),
    
  validate: async () =>
    apiCall('/auth/validate', {
      method: 'POST',
      body: JSON.stringify({}),
    }),
    
  logout: async () => {
    // מחיקת הcookie לפני הlogout
    if (typeof document !== 'undefined') {
      const isProduction = window.location.protocol === 'https:';
      const cookieOptions = [
        'authToken=',
        'path=/',
        'expires=Thu, 01 Jan 1970 00:00:00 GMT',
        ...(isProduction ? ['SameSite=None', 'Secure'] : ['SameSite=Lax'])
      ];
      
      document.cookie = cookieOptions.join('; ');
      console.log('🍪 Token cookie cleared');
    }
    
    return apiCall('/auth/logout', {
      method: 'POST',
    });
  }
};

// המשך הקובץ נשאר כמו שהיה...
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

// ✅ Flashcard endpoints
export const flashcardEndpoints = {
  getByTopicAndLevel: async (topic: string, level: number) => {
    try {
      console.log(`🚀 Fetching flashcards: topic="${topic}", level="${level}"`);
      
      const result = await apiCall(`/flashcards/${encodeURIComponent(topic)}/${level}`);
      
      if (result && result.success) {
        console.log(`✅ Received ${result.data.length} flashcards`);
        return result.data;
      } else if (Array.isArray(result)) {
        console.log(`✅ Received ${result.length} flashcards (direct array)`);
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

// Words endpoints
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
