// apps/web/src/app/api/words/learned/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { fetchWithAuth } from '../../../../lib/fetchWithAuth';
const API_URL = process.env.NEXT_PUBLIC_API_URL;

/**
 * GET /api/words/learned - Proxy to backend for fetching learned words
 */
export async function GET(request: NextRequest) {
  try {
    // Get token from Authorization header
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { message: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    // Extract query parameters
    const { searchParams } = new URL(request.url);
    const queryString = searchParams.toString();
    
    // Forward request to backend
    const backendUrl = `${API_URL}/words/learned${queryString ? `?${queryString}` : ''}`;
    console.log('Proxying learned words request to:', backendUrl);
    
    const response = await fetchWithAuth(backendUrl, {
      method: 'GET',
      headers: {
        'Authorization': authHeader,
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('Backend learned words API error:', errorText);
      return NextResponse.json(
        { error: 'Failed to fetch learned words from backend' },
        { status: response.status }
      );
    }
    
    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error proxying learned words request:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}