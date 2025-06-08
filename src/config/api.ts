// unity-voice-frontend/src/config/api.ts - גרסה מתוקנת עם טוכן אחיד
const API_URL = process.env.NEXT_PUBLIC_API_URL;

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
      console.log('✅ JSON parsed successfully:', data);
      
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
      
      console.warn('⚠️ JSON parse failed on successful response:', jsonError);
      
      try {
        const text = await response.text();
        console.log('📄 Response as text:', text);
        return JSON.parse(text);
      } catch (secondAttempt) {
        console.error('❌ Second parse attempt failed:', secondAttempt);
        throw new Error(`Could not parse response as JSON: ${jsonError}`);
      }
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

// 🔧 פונקציה מאוחדת לקבלת טוכן
function getAuthToken(): string | null {
  if (typeof window !== 'undefined') {
    // 🔑 קודם כל נסה localStorage עם 'token'
    let token = localStorage.getItem('token');
    if (token) {
      console.log('🔍 Getting auth token: Found in localStorage (token)');
      return token;
    }
    
    // אם לא מצאנו, נסה גם עם 'auth_token' (לתאימות אחורה)
    token = localStorage.getItem('auth_token');
    if (token) {
      console.log('🔍 Getting auth token: Found in localStorage (auth_token)');
      // העבר לשם החדש
      localStorage.setItem('token', token);
      localStorage.removeItem('auth_token');
      return token;
    }
    
    console.log('🔍 Getting auth token: Not found');
    return null;
  }
  return null;
}

function setTokenCookie(token: string) {
  if (typeof document !== 'undefined') {
    const isProduction = window.location.protocol === 'https:';
    
    const cookieOptions = [
      `authToken=${token}`,
      'path=/',
      ...(isProduction ? ['SameSite=None', 'Secure'] : ['SameSite=Lax']),
      `max-age=${24 * 60 * 60}`
    ];
    
    document.cookie = cookieOptions.join('; ');
    console.log('🍪 Token set in cookie:', {
      isProduction,
      cookieString: cookieOptions.join('; ')
    });
  }
}

async function apiCall(endpoint: string, options: RequestInit = {}) {
  if (!endpoint.startsWith('/')) {
    endpoint = '/' + endpoint;
  }
  
  const token = getAuthToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...options.headers as Record<string, string>
  };

  // 🔑 הוסף את הטוכן לheader אם קיים
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
    console.log('🔑 Added Authorization header to request');
  } else {
    console.log('⚠️ No token found - sending request without authentication');
  }

  const fullUrl = `${API_URL}${endpoint}`;
  console.log(`🚀 Making API call to: ${fullUrl}`, {
    hasToken: !!token,
    environment: process.env.NODE_ENV,
    method: options.method || 'GET',
    headers: headers
  });

  try {
    const response = await fetch(fullUrl, {
      ...options,
      headers,
      credentials: 'include'
    });

    const result = await handleResponse(response);
    console.log(`✅ API call completed for ${endpoint}:`, result);
    return result;
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
    console.log('🔑 Starting login process...', { email: credentials.email });
    
    try {
      const result = await apiCall('/auth/login', {
        method: 'POST',
        body: JSON.stringify(credentials),
      });
      
      console.log('🔍 Raw login result:', result);
      console.log('🔍 Result type:', typeof result);
      console.log('🔍 Has token?', !!result?.token);
      console.log('🔍 Has user?', !!result?.user);
      console.log('🔍 Token preview:', result?.token ? result.token.substring(0, 20) + '...' : 'No token');
      
      // בדוק אם יש טוקן
      if (result && result.token) {
        console.log('💾 Saving token to localStorage...');
        localStorage.setItem('token', result.token); // 🔑 שמור תחת 'token'
        
        console.log('🍪 Saving token to cookie...');
        setTokenCookie(result.token);
        
        // בדוק שהטוכן נשמר
        const savedToken = localStorage.getItem('token');
        console.log('✅ Token verification after save:', savedToken ? 'SUCCESS' : 'FAILED');
        
        // החזר תוצאה עם success: true
        const loginResponse = {
          success: true,
          token: result.token,
          user: result.user || { email: credentials.email },
          message: 'Login successful'
        };
        
        console.log('🎉 Login response:', loginResponse);
        return loginResponse;
      } else {
        console.log('❌ No token found in result');
        return {
          success: false,
          message: 'No token received from server',
          responseData: result
        };
      }
    } catch (error) {
      console.error('💥 Login error:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Login failed',
        error: error
      };
    }
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
    
  validate: async () => {
    console.log('🔍 Validating token...');
    const token = getAuthToken();
    
    if (!token) {
      console.log('❌ No token found for validation');
      return { success: false, message: 'No token found' };
    }
    
    // 🔧 נסה לבדוק עם הbackend אם הטוכן תקין
    try {
      const result = await apiCall('/auth/validate', {
        method: 'POST',
        body: JSON.stringify({ token }),
      });
      
      console.log('✅ Token validation successful:', result);
      return result;
    } catch (error) {
      console.error('❌ Token validation failed:', error);
      return { 
        success: false, 
        message: 'Token validation failed',
        error: error
      };
    }
  },
    
  logout: async () => {
    console.log('👋 Starting logout process...');
    
    // מחיקת localStorage
    localStorage.removeItem('token');
    localStorage.removeItem('auth_token'); // גם הישן
    localStorage.removeItem('user');
    console.log('🗑️ Cleared localStorage');
    
    // מחיקת cookie
    if (typeof document !== 'undefined') {
      const isProduction = window.location.protocol === 'https:';
      const cookieOptions = [
        'authToken=',
        'path=/',
        'expires=Thu, 01 Jan 1970 00:00:00 GMT',
        ...(isProduction ? ['SameSite=None', 'Secure'] : ['SameSite=Lax'])
      ];
      
      document.cookie = cookieOptions.join('; ');
      console.log('🍪 Cleared cookie');
    }
    
    try {
      return await apiCall('/auth/logout', {
        method: 'POST',
      });
    } catch (error) {
      console.log('⚠️ Logout API call failed, but local cleanup completed');
      return { success: true, message: 'Logged out locally' };
    }
  }
};

// שאר הendpoints נשארים אותו דבר...
export const userEndpoints = {
  getProfile: async () => apiCall('/user/profile'),
  updateProfile: async (data: unknown) => 
    apiCall('/user/profile', {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  getData: async () => apiCall('/user/data'),
};

export const topicsEndpoints = {
  getAll: async () => apiCall('/topics'),
  getById: async (id: string) => apiCall(`/topics/${id}`),
  getUserProgress: async () => apiCall('/topics/progress'),
};

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
