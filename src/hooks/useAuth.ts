// unity-voice-frontend/src/hooks/useAuth.ts
import { useState, useEffect, useCallback } from 'react';
import { authEndpoints } from '../config/api';
import { setAuthToken, setUserData, getAuthToken, clearAuthData } from '../utils/auth-cookies';

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

  // Token validation
  const validateAuth = useCallback(async () => {
    console.log('🔍 Starting auth validation...');
    
    const token = getAuthToken();
    if (!token) {
      console.log('❌ No token found');
      updateAuthState({
        isAuthenticated: false,
        isLoading: false,
        user: null,
        error: null,
        isInitialized: true
      });
      return false;
    }

    console.log('✅ Token found, validating...');

    try {
      const data = await authEndpoints.validate(token);
      console.log('📡 Validation response:', data);

      if (data.success || data.valid) {
        let userData = data.user;
        
        // Get stored user data if needed
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
        clearAuthData();
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
      
      // Try localStorage fallback
      const storedUser = localStorage.getItem('user');
      if (storedUser && token) {
        try {
          const userData = JSON.parse(storedUser);
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
      clearAuthData();
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

  const login = async (email: string, password: string, rememberMe: boolean = true) => {
    try {
      console.log('🔐 Starting login process...');
      updateAuthState({ ...authState, isLoading: true });
      
      const data = await authEndpoints.login({ email, password });
      console.log('📡 Login response:', data);

      if (data.token) {
        const userData = data.user || { email };
        const normalizedUser = {
          ...userData,
          role: userData?.role || userData?.UserRole || 'user',
          UserRole: userData?.UserRole || userData?.role || 'user'
        };
        
        // Save auth data
        setAuthToken(data.token, rememberMe);
        setUserData(normalizedUser);
        
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
          error: data.message || 'Login failed - No token received',
          isInitialized: true
        });
        
        return { 
          success: false, 
          message: data.message || 'Login failed - No token received'
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

  const logout = () => {
    console.log('👋 Logging out...');
    clearAuthData();
    
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