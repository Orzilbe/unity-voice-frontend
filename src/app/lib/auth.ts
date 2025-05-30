// apps/web/src/lib/auth.ts
import { User } from '../../types';
import { authEndpoints, healthCheck } from '../../config/api';

interface LoginResponse {
  success: boolean;
  token?: string;
  user?: User;
  message?: string;
  details?: unknown;
}

/**
 * Login user with email and password
 */
export async function loginUser(email: string, password: string): Promise<LoginResponse> {
  try {
    // Use external API for login
    const data = await authEndpoints.login({ email, password });

    // Check if login was successful - backend returns token and user on success
    const isSuccess = !!(data.token && data.user);

    // Ensure response follows consistent format
    return {
      success: isSuccess,
      token: data.token,
      user: data.user,
      message: data.message,
      details: data.details
    };
  } catch (error: any) {
    console.error('Login service error:', error);
    
    // Check if error has responseData from the backend
    if (error.responseData) {
      return {
        success: false,
        message: error.responseData.message || error.message,
        details: error.responseData.details || error.responseData
      };
    }
    
    return {
      success: false,
      message: error instanceof Error ? error.message : 'An unexpected error occurred'
    };
  }
}

/**
 * Check if the API is reachable
 */
export async function checkApiHealth(): Promise<{
  isReachable: boolean;
  details: unknown;
}> {
  try {
    // Use external API for health check
    const data = await healthCheck();
    
    return {
      isReachable: data.status === 'online' || data.status === 'healthy',
      details: data
    };
  } catch (error) {
    return {
      isReachable: false,
      details: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

export function getAuthToken(): string | null {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('token');
  }
  return null;
}

export async function validateToken(): Promise<{
  isValid: boolean;
  user?: User;
}> {
  try {
    // קבלת הטוקן מה-localStorage
    const token = localStorage.getItem('token');
    
    if (!token) {
      return { isValid: false };
    }
    
    // Use external API for token validation
    const data = await authEndpoints.validate(token);
    
    return {
      isValid: data.success || false,
      user: data.user
    };
  } catch (error) {
    console.error('Token validation error:', error);
    return { isValid: false };
  }
}

/**
 * שמירת טוקן האימות במערכת
 */
export function saveAuthToken(token: string, user: User): void {
  if (typeof window !== 'undefined') {
    // שמירה בלוקל סטורג'
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(user));
    
    // שמירה בעוגיות
    document.cookie = `auth_token=${token}; path=/; max-age=604800`; // תוקף של שבוע
  }
}

/**
 * מחיקת טוקן האימות מהמערכת (לוגאאוט)
 */
export function clearAuthToken(): void {
  if (typeof window !== 'undefined') {
    // מחיקה מלוקל סטורג'
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    
    // מחיקה מעוגיות
    document.cookie = "auth_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
  }
}