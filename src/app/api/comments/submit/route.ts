// unity-voice-frontend/src/app/api/comments/submit/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '../../auth/verifyAuth';

export async function POST(request: NextRequest) {
  console.group('POST /api/comments/submit - Frontend Proxy');
  console.log('Request received at:', new Date().toISOString());
  
  try {
    // Verify authentication
    const authResult = await verifyAuth(request);
    if (!authResult.isValid) {
      console.error('Authentication failed');
      console.groupEnd();
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    // Parse request body
    let body;
    try {
      body = await request.json();
      console.log('Request body keys:', Object.keys(body));
      console.log('TaskId provided:', body.taskId ? '✅' : '❌');
      console.log('Comment content length:', body.commentContent?.length || 0);
    } catch (parseError) {
      console.error('Failed to parse request body:', parseError);
      console.groupEnd();
      return NextResponse.json({ error: 'Invalid request body format' }, { status: 400 });
    }

    // Validate required fields
    if (!body.taskId) {
      console.error('No taskId provided');
      console.groupEnd();
      return NextResponse.json({ error: 'TaskId is required' }, { status: 400 });
    }

    if (!body.commentContent?.trim()) {
      console.error('No comment content provided');
      console.groupEnd();
      return NextResponse.json({ error: 'Comment content is required' }, { status: 400 });
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
    const backendUrl = `${cleanBaseUrl}/api/comments`;
    
    console.log(`Forwarding comment submission to: ${backendUrl}`);
    
    const backendResponse = await fetch(backendUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': authHeader
      },
      body: JSON.stringify(body)
    });

    console.log('Backend response status:', backendResponse.status);
    
    const backendData = await backendResponse.json();
    console.log('Backend response success:', backendData.success ? '✅' : '❌');
    
    if (!backendResponse.ok) {
      console.error('Backend comment submission failed:', backendData);
      console.groupEnd();
      return NextResponse.json(
        backendData, 
        { status: backendResponse.status }
      );
    }

    console.log('Comment submission successful');
    console.groupEnd();
    
    return NextResponse.json(backendData);

  } catch (error) {
    console.error('Error in comment submission proxy:', error);
    console.groupEnd();
    
    return NextResponse.json({
      error: 'Failed to submit comment',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}