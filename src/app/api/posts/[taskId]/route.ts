// unity-voice-frontend/src/app/api/posts/[taskId]/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '../../auth/verifyAuth';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ taskId: string }> }
) {
  try {
    // Verify authentication
    const authResult = await verifyAuth(request);
    if (!authResult.isValid) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const { taskId } = await params;
    
    if (!taskId) {
      return NextResponse.json({ error: 'Task ID is required' }, { status: 400 });
    }

    console.log(`📡 Proxying post-task request to backend for taskId: ${taskId}`);

    // Get the authorization token from the request
    const authHeader = request.headers.get('Authorization');
    if (!authHeader) {
      return NextResponse.json({ error: 'No authorization token' }, { status: 401 });
    }

    // Forward the request to the backend
    const backendUrl = process.env.API_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
    const targetUrl = `${backendUrl}/post-task/${taskId}`;
    
    console.log(`🎯 Forwarding to: ${targetUrl}`);

    const backendResponse = await fetch(targetUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': authHeader
      }
    });

    const backendData = await backendResponse.json();
    
    if (!backendResponse.ok) {
      console.error('❌ Backend request failed:', backendData);
      return NextResponse.json(
        backendData, 
        { status: backendResponse.status }
      );
    }

    console.log('✅ Post task data retrieved successfully');
    return NextResponse.json(backendData);

  } catch (error) {
    console.error('❌ Error in post-task proxy:', error);
    return NextResponse.json({
      error: 'Failed to fetch post task data',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}