// apps/web/src/lib/auth.ts

import jwt from 'jsonwebtoken';
import { authEndpoints } from '../config/api';

interface User {
  id?: string;
  userId?: string;
  email?: string;
  name?: string;
  firstName?: string;
  lastName?: string;
  [key: string]: unknown;
}

interface TokenPayload {
  userId?: string;
  id?: string;
  email?: string;
  [key: string]: unknown;
}

/**
 * Response from login attempt
 */
export interface LoginResponse {
  success: boolean;
  token?: string;
  user?: User;
  message?: string;
  details?: string;
}

export const setAuthToken = (token: string) => {
  if (typeof window !== 'undefined') {
    localStorage.setItem('token', token);
  }
};

/**
 * Retrieves the authentication token from localStorage
 * @returns The authentication token or null if not found
 */
export function getAuthToken(): string | null {
  if (typeof window !== 'undefined') {
    // Get token from localStorage
    const token = localStorage.getItem('token');
    
    // If token exists in localStorage, return it
    if (token) {
      return token;
    }
    
    // Otherwise, check for token in cookies
    const cookies = document.cookie.split(';');
    for (const cookie of cookies) {
      const [name, value] = cookie.trim().split('=');
      if (name === 'token') {
        return value;
      }
    }
  }
  return null;
}
export function storeAuthToken(token: string): void {
  if (typeof window !== 'undefined') {
    // Store in localStorage for JavaScript access
    localStorage.setItem('token', token);
    
    // Also set as a cookie for API requests
    document.cookie = `token=${token};path=/;max-age=86400`;
  }}
export const removeAuthToken = () => {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('token');
  }
};

export async function loginUser(email: string, password: string): Promise<LoginResponse> {
  try {
    // Use external API for login
    const data = await authEndpoints.login({ email, password });

    // If login was successful, store the token
    if (data.success && data.token) {
      storeAuthToken(data.token);
    }

    // Ensure response follows consistent format
    return {
      success: data.success || false,
      token: data.token,
      user: data.user,
      message: data.message,
      details: data.details
    };
  } catch (error) {
    console.error('Login service error:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : 'An unexpected error occurred'
    };
  }
}

/**
 * אימות ובדיקת תוקף של טוקן אימות
 * @param token טוקן האימות לבדיקה
 * @returns נתוני המשתמש אם הטוקן תקף, אחרת null
 */
export function verifyAuthToken(token: string): TokenPayload | null {
  try {
    // בדיקה אם יש טוקן
    if (!token) {
      return null;
    }

    // פענוח הטוקן
    const secret = process.env.JWT_SECRET || 'your-fallback-secret'; // ודא שיש לך מפתח סודי אמיתי בהגדרות הסביבה
    const decoded = jwt.verify(token, secret) as TokenPayload;
    
    // החזרת נתוני המשתמש
    return decoded;
  } catch (error) {
    console.error('Token verification failed:', error);
    return null;
  }
}