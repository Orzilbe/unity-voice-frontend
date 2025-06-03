// apps/web/src/app/api/interactive-session/route.ts
import { NextRequest, NextResponse } from 'next/server';

const API_URL = process.env.NEXT_PUBLIC_API_URL;

/**
 * POST /api/interactive-session - Proxy to backend for creating interactive sessions
 */
export async function POST(request: NextRequest) {
  try {
    console.log("API Interactive Session - Proxying session creation to backend");
    
    // Get token from Authorization header
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }
    
    // Get request body
    const body = await request.json();
    console.log('Request body:', JSON.stringify(body, null, 2));
    
    // Forward request to backend
    const backendUrl = `${API_URL}/interactive-sessions`;
    console.log('Proxying interactive session creation request to:', backendUrl);
    
    const response = await fetch(backendUrl, {
      method: 'POST',
      headers: {
        'Authorization': authHeader,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(body)
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('Backend interactive session API error:', errorText);
      return NextResponse.json(
        { error: 'Failed to create interactive session in backend' },
        { status: response.status }
      );
    }
    
    const data = await response.json();
    console.log(`Interactive session created successfully:`, data);
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error proxying interactive session creation request:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}