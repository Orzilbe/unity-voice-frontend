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

interface LoginResult {
  success: boolean;
  token?: string;
  message?: string;
  details?: any;
}

interface AuthState {
  isAuthenticated: boolean;
  isLoading: boolean;
  user: User | null;
  error: string | null;
  isInitialized: boolean;
}

// Singleton to broadcast auth state
let listeners: Array<(state: AuthState) => void> = [];
let globalState: AuthState = {
  isAuthenticated: false,
  isLoading: true,
  user: null,
  error: null,
  isInitialized: false
};

const notify = (state: AuthState) => {
  globalState = state;
  listeners.forEach(cb => cb(state));
};

export const useAuth = () => {
  const [authState, setAuthState] = useState(globalState);

  // Subscribe on mount
  useEffect(() => {
    const cb = (s: AuthState) => setAuthState(s);
    listeners.push(cb);
    return () => { listeners = listeners.filter(fn => fn !== cb); };
  }, []);

  const updateAuthState = useCallback((newState: AuthState) => {
    notify(newState);
  }, []);

  // Validate token on startup
  const validateAuth = useCallback(async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      updateAuthState({ isAuthenticated: false, isLoading: false, user: null, error: null, isInitialized: true });
      return;
    }
    try {
      const data = await authEndpoints.validate();
      if (data.success) {
        const user = data.user || JSON.parse(localStorage.getItem('user') || 'null');
        localStorage.setItem('user', JSON.stringify(user));
        updateAuthState({ isAuthenticated: true, isLoading: false, user, error: null, isInitialized: true });
      } else {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        updateAuthState({ isAuthenticated: false, isLoading: false, user: null, error: data.message, isInitialized: true });
      }
    } catch (_) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      updateAuthState({ isAuthenticated: false, isLoading: false, user: null, error: 'Validation error', isInitialized: true });
    }
  }, [updateAuthState]);

  useEffect(() => { validateAuth(); }, [validateAuth]);

  // Login: store token, set user and update state immediately
  const login = async (email: string, password: string): Promise<LoginResult> => {
    updateAuthState({ ...globalState, isLoading: true });
    try {
      const data = await authEndpoints.login({ email, password });
      if (data.success && data.token) {
        localStorage.setItem('token', data.token);
        const user = data.user || { email };
        localStorage.setItem('user', JSON.stringify(user));
        updateAuthState({ isAuthenticated: true, isLoading: false, user, error: null, isInitialized: true });
        return { success: true, token: data.token };
      }
      updateAuthState({ isAuthenticated: false, isLoading: false, user: null, error: data.message || 'Login failed', isInitialized: true });
      return { success: false, message: data.message };
    } catch (e: any) {
      updateAuthState({ isAuthenticated: false, isLoading: false, user: null, error: e.message, isInitialized: true });
      return { success: false, message: e.message };
    }
  };

  // Logout: clear storage and state
  const logout = async () => {
    try { await authEndpoints.logout(); } catch {};
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    updateAuthState({ isAuthenticated: false, isLoading: false, user: null, error: null, isInitialized: true });
  };

  return { ...authState, login, logout, validateAuth };
};
