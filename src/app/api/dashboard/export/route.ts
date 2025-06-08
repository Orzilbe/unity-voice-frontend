// apps/web/src/app/api/dashboard/export/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { fetchWithAuth } from '../../../../lib/fetchWithAuth';
const API_URL = process.env.NEXT_PUBLIC_API_URL;

/**
 * GET /api/dashboard/export - Proxy to backend for data export
 */
export async function GET(request: NextRequest) {
  try {
    console.log("API Dashboard Export - Proxying to backend");
    
    // Get token from Authorization header
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }
    
    // Forward request to backend
    const backendUrl = `${API_URL}/dashboard/export`;
    console.log('Proxying data export request to:', backendUrl);
    
    const response = await fetchWithAuth(backendUrl, {
      method: 'GET',
      headers: {
        'Authorization': authHeader,
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('Backend data export API error:', errorText);
      return NextResponse.json(
        { error: 'Failed to export data from backend' },
        { status: response.status }
      );
    }
    
    const data = await response.json();
    console.log(`Data export retrieved successfully`);
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error proxying data export request:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}