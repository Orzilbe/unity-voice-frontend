// apps/web/src/app/api/user/update-score/route.ts
import { NextRequest, NextResponse } from 'next/server';

const API_URL = process.env.NEXT_PUBLIC_API_URL;

/**
 * POST /api/user/update-score - עדכון ניקוד המשתמש
 */
export async function POST(request: NextRequest) {
  try {
    console.log("API Update Score - Proxying to backend");
    
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
    console.log('Update score request body:', body);
    
    // Validate scoreToAdd
    const { scoreToAdd } = body;
    if (typeof scoreToAdd !== 'number' || scoreToAdd < 0) {
      return NextResponse.json(
        { error: 'Invalid score value' },
        { status: 400 }
      );
    }
    
    // Forward request to backend
    const backendUrl = `${API_URL}/user/update-score`;
    console.log('Proxying update score request to:', backendUrl);
    
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
      console.error('Backend update score API error:', errorText);
      return NextResponse.json(
        { error: 'Failed to update score in backend' },
        { status: response.status }
      );
    }
    
    const data = await response.json();
    console.log(`Score updated successfully:`, data);
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error proxying update score request:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}