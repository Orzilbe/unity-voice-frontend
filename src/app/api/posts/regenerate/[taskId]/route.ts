//unity-voice-frontend/src/app/api/posts/regenerate/[taskId]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '../../../auth/verifyAuth';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ taskId: string }> }
) {
  console.group('POST /api/posts/regenerate/[taskId] - Frontend Proxy');
  
  try {
    // Get task ID from URL params
    const { taskId } = await params;
    console.log(`Regenerating post for taskId: ${taskId}`);
    
    // Verify authentication
    const authResult = await verifyAuth(request);
    if (!authResult.isValid) {
      console.error('Authentication failed');
      console.groupEnd();
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    // Get the authorization token from the request
    const authHeader = request.headers.get('Authorization');
    if (!authHeader) {
      console.error('No authorization header found');
      console.groupEnd();
      return NextResponse.json({ error: 'No authorization token' }, { status: 401 });
    }

    // 🔥 FIXED: Construct backend URL properly
    const baseUrl = process.env.API_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
    
    // Remove trailing /api if it exists to avoid duplication
    const cleanBaseUrl = baseUrl.replace(/\/api\/?$/, '');
    const backendUrl = `${cleanBaseUrl}/api/post/regenerate/${encodeURIComponent(taskId)}`;
    
    console.log(`Forwarding regeneration request to: ${backendUrl}`);
    
    const backendResponse = await fetch(backendUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': authHeader
      }
    });

    console.log('Backend regeneration response status:', backendResponse.status);
    
    if (!backendResponse.ok) {
      const backendData = await backendResponse.json();
      console.error('Backend regeneration failed:', backendData);
      console.groupEnd();
      return NextResponse.json(
        backendData, 
        { status: backendResponse.status }
      );
    }

    const backendData = await backendResponse.json();
    console.log('Successfully regenerated post');
    console.groupEnd();
    
    return NextResponse.json(backendData);

  } catch (error) {
    console.error('Error in post regeneration proxy:', error);
    console.groupEnd();
    
    return NextResponse.json({
      error: 'Failed to regenerate post',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}