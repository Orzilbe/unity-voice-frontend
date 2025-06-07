// unity-voice-frontend/src/app/api/comments/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '../auth/verifyAuth';

export async function POST(request: NextRequest) {
  console.group('POST /api/comments/submit (Frontend Proxy)');
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
      console.log('Request body:', JSON.stringify(body));
    } catch (parseError) {
      console.error('Failed to parse request body:', parseError);
      console.groupEnd();
      return NextResponse.json({ error: 'Invalid request body format' }, { status: 400 });
    }

    // Get the authorization token from the request
    const authHeader = request.headers.get('Authorization');
    if (!authHeader) {
      console.error('No authorization header found');
      console.groupEnd();
      return NextResponse.json({ error: 'No authorization token' }, { status: 401 });
    }

    // If we have taskId but no PostID, try to get PostID from the task
    if (body.taskId && !body.PostID) {
      console.log('Getting PostID from taskId...');
      
      const backendUrl = process.env.API_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
      
      try {
        const taskResponse = await fetch(`${backendUrl}/post-task/${body.taskId}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': authHeader
          }
        });

        if (taskResponse.ok) {
          const taskData = await taskResponse.json();
          if (taskData.postData && taskData.postData.PostID) {
            body.PostID = taskData.postData.PostID;
            console.log('Found PostID:', body.PostID);
          }
        }
      } catch (taskError) {
        console.warn('Could not get PostID from task:', taskError);
      }
    }

    // Forward the request to the backend
    console.log('Forwarding comment submission to backend...');
    const backendUrl = process.env.API_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
    
    const backendResponse = await fetch(`${backendUrl}/comments`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': authHeader
      },
      body: JSON.stringify(body)
    });

    console.log('🔄 Backend response status:', backendResponse.status); // ← הוסף את זה
    
    const backendData = await backendResponse.json();
    console.log('📊 Backend response data:', JSON.stringify(backendData, null, 2)); // ← הוסף את זה
    
    if (!backendResponse.ok) {
      console.error('Backend comment submission failed:', backendData);
      console.groupEnd();
      return NextResponse.json(
        backendData, 
        { status: backendResponse.status }
      );
    }

    console.log('✅ Comment submission successful - returning data to frontend');
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