// apps/web/src/app/api/tasks/completed-flashcard/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '../../auth/verifyAuth';
import { fetchWithAuth } from '../../../../lib/fetchWithAuth';
/**
 * מחפש את משימת הכרטיסיות האחרונה שהושלמה
 * GET /api/tasks/completed-flashcard?topicName=xxx&level=xxx&userId=xxx
 */
export async function GET(request: NextRequest) {
  console.log('🔍 GET /api/tasks/completed-flashcard - Frontend proxy');
  
  try {
    // Verify authentication
    const authResult = await verifyAuth(request);
    if (!authResult.isValid) {
      console.error('Authentication failed');
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    // Get query parameters
    const { searchParams } = new URL(request.url);
    const topicName = searchParams.get('topicName');
    const level = searchParams.get('level');
    const userId = searchParams.get('userId');

    console.log('📋 Query parameters:', { topicName, level, userId });

    if (!topicName || !level || !userId) {
      return NextResponse.json({ 
        success: false,
        error: 'topicName, level, and userId are required' 
      }, { status: 400 });
    }

    // Get the authorization token from the request
    const authHeader = request.headers.get('Authorization');
    if (!authHeader) {
      console.error('No authorization header found');
      return NextResponse.json({ error: 'No authorization token' }, { status: 401 });
    }

    // Forward the request to the backend
    console.log('🔗 Forwarding request to backend...');
    const backendUrl = process.env.NEXT_PUBLIC_API_URL || process.env.API_URL || 'https://unity-voice-backend-production-46a1.up.railway.app/api';
    
    const params = new URLSearchParams({
      topicName: topicName,
      level: level,
      userId: userId
    });

    const backendResponse = await fetchWithAuth(`${backendUrl}/tasks/completed-flashcard?${params.toString()}`, {
      method: 'GET',
      headers: {
        'Authorization': authHeader,
        'Content-Type': 'application/json'
      }
    });

    console.log('📡 Backend response status:', backendResponse.status);

    if (!backendResponse.ok) {
      const errorText = await backendResponse.text();
      console.error('❌ Backend request failed:', errorText);
      
      // Try to parse as JSON, fallback to text
      let errorData;
      try {
        errorData = JSON.parse(errorText);
      } catch {
        errorData = { error: errorText || 'Backend request failed' };
      }
      
      return NextResponse.json(
        errorData, 
        { status: backendResponse.status }
      );
    }

    const backendData = await backendResponse.json();
    console.log('✅ Backend request successful:', backendData);
    
    return NextResponse.json(backendData);

  } catch (error) {
    console.error('💥 Error in frontend proxy:', error);
    
    // If it's a network error to the backend, provide a helpful message
    if (error instanceof Error && error.message.includes('fetch')) {
      return NextResponse.json({
        success: false,
        error: 'Backend service unavailable',
        details: 'Could not connect to backend API',
        backendUrl: process.env.NEXT_PUBLIC_API_URL || process.env.API_URL || 'https://unity-voice-backend-production-46a1.up.railway.app/api'
      }, { status: 503 });
    }
    
    return NextResponse.json({
      success: false,
      error: 'An error occurred in the frontend proxy',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}