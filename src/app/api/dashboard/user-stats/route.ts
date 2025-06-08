// apps/web/src/app/api/dashboard/user-stats/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { fetchWithAuth } from '../../../../lib/fetchWithAuth';
const API_URL = process.env.NEXT_PUBLIC_API_URL;

/**
 * GET /api/dashboard/user-stats - Proxy to backend for user statistics
 */
export async function GET(request: NextRequest) {
  try {
    console.log("API Dashboard User Stats - Proxying to backend");
    
    // Get token from Authorization header
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }
    
    // Forward request to backend
    const backendUrl = `${API_URL}/dashboard/user-stats`;
    console.log('Proxying user stats request to:', backendUrl);
    
    const response = await fetchWithAuth(backendUrl, {
      method: 'GET',
      headers: {
        'Authorization': authHeader,
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('Backend user stats API error:', errorText);
      return NextResponse.json(
        { error: 'Failed to fetch user stats from backend' },
        { status: response.status }
      );
    }
    
    const data = await response.json();
    console.log(`User stats retrieved successfully:`, data);
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error proxying user stats request:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}