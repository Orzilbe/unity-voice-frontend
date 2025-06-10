// unity-voice-frontend/src/app/api/quiz/complete/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '../../auth/verifyAuth';
import { fetchWithAuth } from '../../../../lib/fetchWithAuth';
interface CompleteQuizRequest {
  taskId: string;
  topicName: string;
  level: string;
  finalScore: number;
  duration: number;
  correctAnswers: number;
  totalQuestions: number;
}

/**
 * Complete quiz and prepare next task - POST /api/quiz/complete
 * This route acts as a proxy to the backend API
 */
export async function POST(request: NextRequest) {
  console.group('POST /api/quiz/complete (Frontend Proxy)');
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
    let body: CompleteQuizRequest;
    try {
      body = await request.json();
      console.log('Request body:', JSON.stringify(body));
    } catch (parseError) {
      console.error('Failed to parse request body:', parseError);
      console.groupEnd();
      return NextResponse.json({ error: 'Invalid request body format' }, { status: 400 });
    }
    
    const { taskId, topicName, level, finalScore, duration, correctAnswers, totalQuestions } = body;
    
    // Validate required fields
    if (!taskId || !topicName || !level || finalScore === undefined) {
      console.error('Missing required fields');
      console.groupEnd();
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Check if passing score (60%)
    const passingPercentage = (correctAnswers / totalQuestions) * 100;
    const isPassing = passingPercentage >= 60;
    
    if (!isPassing) {
      console.log(`Quiz not passed: ${passingPercentage}% (need 60%)`);
      console.groupEnd();
      return NextResponse.json({ 
        success: false,
        error: 'Quiz not passed',
        percentage: passingPercentage,
        message: 'Need at least 60% to continue'
      }, { status: 400 });
    }

    // Get the authorization token from the request
    const authHeader = request.headers.get('Authorization');
    if (!authHeader) {
      console.error('No authorization header found');
      console.groupEnd();
      return NextResponse.json({ error: 'No authorization token' }, { status: 401 });
    }

    // Forward the request to the backend
    console.log('Forwarding request to backend...');
    const backendUrl = process.env.NEXT_PUBLIC_API_URL;
    
    const backendResponse = await fetchWithAuth(`${backendUrl}/quiz/complete`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': authHeader
      },
      body: JSON.stringify(body)
    });

    const backendData = await backendResponse.json();
    
    if (!backendResponse.ok) {
      console.error('Backend request failed:', backendData);
      console.groupEnd();
      return NextResponse.json(
        backendData, 
        { status: backendResponse.status }
      );
    }

    console.log('Backend request successful');
    console.groupEnd();
    
    return NextResponse.json(backendData);

  } catch (error) {
    console.error('Error in frontend proxy:', error);
    console.groupEnd();
    
    // If it's a network error to the backend, provide a helpful message
    if (error instanceof Error && error.message.includes('fetch')) {
      return NextResponse.json({
        error: 'Backend service unavailable',
        details: 'Could not connect to backend API',
        backendUrl: process.env.API_URL || 'https://unity-voice-api-linux-f2hsapgsh3hcgqc0.israelcentral-01.azurewebsites.net/api'
      }, { status: 503 });
    }
    
    return NextResponse.json({
      error: 'An error occurred in the frontend proxy',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}