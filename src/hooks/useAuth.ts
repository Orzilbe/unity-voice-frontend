// unity-voice-frontend/src/hooks/useAuth.ts
import { useState, useEffect, useCallback } from 'react';
import { authEndpoints } from '../config/api';

interface User {
  id?: string;
  userId?: string;
  UserId?: string;
  email?: string;
  name?: string;
  role?: string;
  UserRole?: string;
  [key: string]: unknown;
}

interface AuthState {
  isAuthenticated: boolean;
  isLoading: boolean;
  user: User | null;
  error: string | null;
  isInitialized: boolean;
}

// Create a singleton instance to share state across components
let authStateListeners: ((state: AuthState) => void)[] = [];
let currentAuthState: AuthState = {
  isAuthenticated: false,
  isLoading: true,
  user: null,
  error: null,
  isInitialized: false
};

const notifyListeners = (newState: AuthState) => {
  currentAuthState = newState;
  authStateListeners.forEach(listener => listener(newState));
};

export const useAuth = () => {
  const [authState, setAuthState] = useState<AuthState>(currentAuthState);

  // Subscribe to auth state changes
  useEffect(() => {
    const updateState = (newState: AuthState) => {
      setAuthState(newState);
    };
    
    authStateListeners.push(updateState);
    
    return () => {
      authStateListeners = authStateListeners.filter(listener => listener !== updateState);
    };
  }, []);

  const updateAuthState = useCallback((newState: AuthState) => {
    setAuthState(newState);
    notifyListeners(newState);
  }, []);

  // ✅ Token validation - בדיקה ראשונה אם יש טוקן ב-localStorage
  const validateAuth = useCallback(async () => {
    console.log('🔍 Starting auth validation...');
    
    try {
      // ✅ בדיקה ראשונה - האם יש טוקן ב-localStorage
      const localToken = localStorage.getItem('token');
      console.log('🔍 Local token check:', localToken ? 'Found' : 'Missing');
      
      // אם אין טוקן בכלל, לא צריך לעשות קריאה לשרת
      if (!localToken) {
        console.log('❌ No token found in localStorage, setting as unauthenticated');
        localStorage.removeItem('user');
        updateAuthState({
          isAuthenticated: false,
          isLoading: false,
          user: null,
          error: null,
          isInitialized: true
        });
        return false;
      }

      // אם יש טוקן, נבדוק אותו מול השרת
      const data = await authEndpoints.validate();
      console.log('📡 Validation response:', data);

      if (data.valid || data.success) {
        let userData = data.user;
        
        // ✅ ננסה לקבל נתונים מ-localStorage כגיבוי
        if (!userData || (!userData.role && !userData.UserRole)) {
          const storedUser = localStorage.getItem('user');
          if (storedUser) {
            try {
              userData = {
                ...JSON.parse(storedUser),
                ...userData
              };
            } catch (e) {
              console.error('Error parsing stored user data:', e);
            }
          }
        }

        // Normalize user data
        if (userData) {
          userData = {
            ...userData,
            role: userData.role || userData.UserRole || 'user',
            UserRole: userData.UserRole || userData.role || 'user'
          };
        }

        updateAuthState({
          isAuthenticated: true,
          isLoading: false,
          user: userData,
          error: null,
          isInitialized: true
        });
        return true;
      } else {
        // ✅ טוקן לא תקף - נמחק הכל
        localStorage.removeItem('user');
        localStorage.removeItem('token');
        updateAuthState({
          isAuthenticated: false,
          isLoading: false,
          user: null,
          error: data.message || 'Authentication failed',
          isInitialized: true
        });
        return false;
      }
    } catch (error) {
      console.error('Auth validation error:', error);
      
      // ✅ ננסה localStorage fallback רק אם יש טוקן
      const localToken = localStorage.getItem('token');
      const storedUser = localStorage.getItem('user');
      
      if (localToken && storedUser) {
        try {
          const userData = JSON.parse(storedUser);
          console.log('🔄 Using localStorage fallback for auth');
          updateAuthState({
            isAuthenticated: true,
            isLoading: false,
            user: userData,
            error: null,
            isInitialized: true
          });
          return true;
        } catch (e) {
          console.error('Error parsing stored user data:', e);
        }
      }
      
      // Clear auth if all fails
      localStorage.removeItem('user');
      localStorage.removeItem('token');
      updateAuthState({
        isAuthenticated: false,
        isLoading: false,
        user: null,
        error: error instanceof Error ? error.message : 'Authentication error',
        isInitialized: true
      });
      return false;
    }
  }, [updateAuthState]);

  // Initialize auth state
  useEffect(() => {
    validateAuth();
  }, [validateAuth]);

  // ✅ Login - עודכן לשמירת טוקן ב-localStorage
  const login = async (email: string, password: string, rememberMe: boolean = true) => {
    try {
      console.log('🔐 Starting login process...');
      updateAuthState({ ...authState, isLoading: true });
      
      const data = await authEndpoints.login({ email, password });
      console.log('📡 Login response:', data);

      if (data.success) {
        const userData = data.user || { email };
        const normalizedUser = {
          ...userData,
          role: userData?.role || userData?.UserRole || 'user',
          UserRole: userData?.UserRole || userData?.role || 'user'
        };
        
        // ✅ שמירה ב-localStorage - גם user וגם token!
        localStorage.setItem('user', JSON.stringify(normalizedUser));
        
        // ✅ שמירת הטוקן אם קיים בתגובה
        if (data.token) {
          localStorage.setItem('token', data.token);
          console.log('💾 Token saved to localStorage');
        } else if (data.authToken) {
          localStorage.setItem('token', data.authToken);
          console.log('💾 AuthToken saved to localStorage');
        } else {
          console.warn('⚠️ No token received from server - relying on cookies');
        }
        
        updateAuthState({
          isAuthenticated: true,
          isLoading: false,
          user: normalizedUser,
          error: null,
          isInitialized: true
        });
        
        return { success: true };
      } else {
        updateAuthState({
          isAuthenticated: false,
          isLoading: false,
          user: null,
          error: data.message || 'Login failed',
          isInitialized: true
        });
        
        return { 
          success: false, 
          message: data.message || 'Login failed'
        };
      }
    } catch (error: any) {
      console.error('❌ Login error:', error);
      
      // Check if this is an API error with responseData
      if (error.responseData) {
        const errorMessage = error.responseData.message || error.message || 'Login failed';
        console.log('API Error details:', error.responseData);
        
        updateAuthState({
          isAuthenticated: false,
          isLoading: false,
          user: null,
          error: errorMessage,
          isInitialized: true
        });
        
        return { 
          success: false, 
          message: errorMessage,
          details: error.responseData.details 
        };
      }
      
      // Regular error handling
      const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred';
      
      updateAuthState({
        isAuthenticated: false,
        isLoading: false,
        user: null,
        error: errorMessage,
        isInitialized: true
      });
      
      return { success: false, message: errorMessage };
    }
  };

  // ✅ Logout - מחיקה מלאה של הנתונים
  const logout = async () => {
    console.log('👋 Logging out...');
    
    try {
      // ✅ קריאה לשרת למחיקת ה-cookie
      await authEndpoints.logout();
    } catch (error) {
      console.error('Logout API call failed:', error);
      // ממשיכים עם logout גם אם הקריאה נכשלת
    }
    
    // ✅ מחיקת נתונים מ-localStorage
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    
    updateAuthState({
      isAuthenticated: false,
      isLoading: false,
      user: null,
      error: null,
      isInitialized: true
    });
  };

  return {
    ...authState,
    login,
    logout,
    validateAuth
  };
};
