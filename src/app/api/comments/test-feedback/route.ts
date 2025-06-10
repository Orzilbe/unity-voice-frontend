import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '../../auth/verifyAuth';
import { fetchWithAuth } from '../../../../lib/fetchWithAuth';
export async function POST(request: NextRequest) {
  console.group('POST /api/comments/test-feedback - Frontend Proxy');
  
  try {
    // Verify authentication
    const authResult = await verifyAuth(request);
    if (!authResult.isValid) {
      console.error('Authentication failed');
      console.groupEnd();
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    // Parse request body
    const body = await request.json();
    console.log('Testing feedback for comment length:', body.commentContent?.length || 0);

    // Get the authorization token from the request
    const authHeader = request.headers.get('Authorization');
    if (!authHeader) {
      console.error('No authorization header found');
      console.groupEnd();
      return NextResponse.json({ error: 'No authorization token' }, { status: 401 });
    }

    // Forward the request to the backend
    const backendUrl = process.env.API_URL || process.env.NEXT_PUBLIC_API_URL || 'https://unity-voice-api-linux-f2hsapgsh3hcgqc0.israelcentral-01.azurewebsites.net/api';
    
    const backendResponse = await fetchWithAuth(`${backendUrl}/comments/test-feedback`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': authHeader
      },
      body: JSON.stringify(body)
    });

    const backendData = await backendResponse.json();
    
    if (!backendResponse.ok) {
      console.error('Backend test feedback failed:', backendData);
      console.groupEnd();
      return NextResponse.json(
        backendData, 
        { status: backendResponse.status }
      );
    }

    console.log('Test feedback generated successfully');
    console.groupEnd();
    
    return NextResponse.json(backendData);

  } catch (error) {
    console.error('Error in test feedback proxy:', error);
    console.groupEnd();
    
    return NextResponse.json({
      error: 'Failed to generate test feedback',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}