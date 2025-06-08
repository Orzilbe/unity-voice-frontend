export async function fetchWithAuth(
    input: RequestInfo,
    options: RequestInit = {}
  ): Promise<Response> {
    const defaultOptions: RequestInit = {
      credentials: 'include', // ✅ שולח את authToken אוטומטית
      headers: {
        'Content-Type': 'application/json',
        ...(options.headers || {})
      },
      ...options
    };
  
    return fetch(input, defaultOptions);
  }
  