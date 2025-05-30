// apps/web/src/app/api/tasks/[taskId]/complete/route.ts
import { NextRequest, NextResponse } from 'next/server';

const API_URL = process.env.NEXT_PUBLIC_API_URL;

/**
 * PUT /api/tasks/[taskId]/complete - Proxy to backend for completing tasks
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ taskId: string }> }
) {
  try {
    const resolvedParams = await params;
    const taskId = resolvedParams.taskId;
    
    console.log(`API Tasks - Proxying task completion for taskId: ${taskId}`);
    
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
    console.log('Task completion request body:', JSON.stringify(body, null, 2));
    
    // Forward request to backend
    const backendUrl = `${API_URL}/tasks/${taskId}/complete`;
    console.log('Proxying task completion request to:', backendUrl);
    
    const response = await fetch(backendUrl, {
      method: 'PUT',
      headers: {
        'Authorization': authHeader,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(body)
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('Backend task completion API error:', errorText);
      return NextResponse.json(
        { error: 'Failed to complete task in backend' },
        { status: response.status }
      );
    }
    
    const data = await response.json();
    console.log(`Task ${taskId} completed successfully:`, data);
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error proxying task completion request:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/tasks/[taskId]/complete - Also support POST method for compatibility
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ taskId: string }> }
) {
  // Forward POST requests as PUT to the backend
  return PUT(request, { params });
}