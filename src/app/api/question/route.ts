// apps/web/src/app/api/question/route.ts
import { NextRequest, NextResponse } from 'next/server';

const API_URL = process.env.NEXT_PUBLIC_API_URL;

/**
 * POST /api/question - Proxy to backend for creating questions
 */
export async function POST(request: NextRequest) {
  try {
    console.log("API Question - Proxying question creation to backend");
    
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
    const backendUrl = `${API_URL}/questions`;
    console.log('Proxying question creation request to:', backendUrl);
    
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
      console.error('Backend questions API error:', errorText);
      return NextResponse.json(
        { error: 'Failed to create question in backend' },
        { status: response.status }
      );
    }
    
    const data = await response.json();
    console.log(`Question created successfully:`, data);
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error proxying question creation request:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}