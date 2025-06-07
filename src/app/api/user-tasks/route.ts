// unity-voice-frontend/src/app/api/user-tasks/route.ts
import { NextRequest, NextResponse } from 'next/server';

const API_URL = process.env.NEXT_PUBLIC_API_URL;

/**
 * GET /api/user-tasks - Proxy to backend for fetching user tasks
 */
export async function GET(request: NextRequest) {
  try {
    console.log('API User Tasks - Proxying get user tasks to backend');
    
    // Get token from Authorization header
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }
    
    // Extract query parameters
    const { searchParams } = new URL(request.url);
    const queryString = searchParams.toString();
    
    // Forward request to backend tasks endpoint
    const backendUrl = `${API_URL}/tasks${queryString ? `?${queryString}` : ''}`;
    console.log('Proxying user tasks request to:', backendUrl);
    
    const response = await fetch(backendUrl, {
      method: 'GET',
      headers: {
        'Authorization': authHeader,
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('Backend user tasks API error:', errorText);
      return NextResponse.json(
        { error: 'Failed to fetch user tasks from backend' },
        { status: response.status }
      );
    }
    
    const data = await response.json();
    console.log(`User tasks retrieved successfully: ${Array.isArray(data) ? data.length : 'unknown'} tasks`);
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error proxying user tasks request:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
