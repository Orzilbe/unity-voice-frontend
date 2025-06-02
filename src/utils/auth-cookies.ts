// apps/web/src/utils/auth-cookies.ts

/**
 * Set authentication token in both localStorage and cookies
 * @param token - JWT token
 * @param rememberMe - If true, cookie persists for 7 days, otherwise session only
 */
export function setAuthToken(token: string, rememberMe: boolean = true) {
  // Save to localStorage
  localStorage.setItem('token', token);
  
  // Save to cookie
  if (rememberMe) {
    // Cookie expires in 7 days
    const maxAge = 7 * 24 * 60 * 60; // 7 days in seconds
    document.cookie = `auth_token=${token}; path=/; max-age=${maxAge}; SameSite=Strict; Secure`;
  } else {
    // Session cookie (expires when browser closes)
    document.cookie = `auth_token=${token}; path=/; SameSite=Strict; Secure`;
  }
}

/**
 * Set user data in localStorage
 * @param user - User object
 */
export function setUserData(user: any) {
  localStorage.setItem('user', JSON.stringify(user));
}

/**
 * Get authentication token from localStorage or cookies
 * @returns token or null
 */
export function getAuthToken(): string | null {
  // First try localStorage
  const localToken = localStorage.getItem('token');
  if (localToken) return localToken;
  
  // Fallback to cookie
  const cookies = document.cookie.split(';');
  for (const cookie of cookies) {
    const [name, value] = cookie.trim().split('=');
    if (name === 'auth_token') {
      return value;
    }
  }
  return null;
}

/**
 * Clear all authentication data
 */
export function clearAuthData() {
  // Clear localStorage
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  
  // Clear cookie by setting expiration to past date
  document.cookie = 'auth_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Strict; Secure';
}

/**
 * Check if user is authenticated
 * @returns boolean
 */
export function isAuthenticated(): boolean {
  return getAuthToken() !== null;
}