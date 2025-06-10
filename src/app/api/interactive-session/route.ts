// unity-voice-frontend/src/app/api/interactive-session/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { fetchWithAuth } from '../../../lib/fetchWithAuth';
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://unity-voice-backend-production-46a1.up.railway.app/api';

export async function POST(request: NextRequest) {
  try {
    console.log("🔍 API Interactive Session - Starting");
    console.log("🔍 API_URL:", API_URL);
    
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.error("❌ No auth header");
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }
    
    const body = await request.json();
    console.log('🔍 Request body:', JSON.stringify(body, null, 2));
    
    // וידוא שיש את השדות הנדרשים
    if (!body.SessionId || !body.TaskId) {
      console.error("❌ Missing fields:", { SessionId: !!body.SessionId, TaskId: !!body.TaskId });
      return NextResponse.json(
        { error: 'SessionId and TaskId are required' },
        { status: 400 }
      );
    }
    
    const backendUrl = `${API_URL}/interactive-sessions`;
    console.log('🔍 Proxying to:', backendUrl);
    
    const response = await fetchWithAuth(backendUrl, {
      method: 'POST',
      headers: {
        'Authorization': authHeader,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(body)
    });
    
    console.log('🔍 Backend response status:', response.status);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Backend error:', errorText);
      return NextResponse.json(
        { error: 'Failed to create interactive session', details: errorText },
        { status: response.status }
      );
    }
    
    const data = await response.json();
    console.log('✅ Session created:', data);
    return NextResponse.json(data);
  } catch (error) {
    console.error('❌ Error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown' },
      { status: 500 }
    );
  }
}