// apps/web/src/app/api/tasks/[taskId]/duration/route.ts
import { NextRequest, NextResponse } from 'next/server';

const API_URL = process.env.NEXT_PUBLIC_API_URL;

/**
 * PATCH /api/tasks/[taskId]/duration - Proxy to backend for updating task duration
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ taskId: string }> }
) {
  try {
    const resolvedParams = await params;
    const taskId = resolvedParams.taskId;
    
    console.log(`API Tasks - Proxying task duration update for taskId: ${taskId}`);
    
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
    console.log('Task duration update request body:', JSON.stringify(body, null, 2));
    
    // Validate required fields
    if (body.duration === undefined) {
      return NextResponse.json(
        { message: 'Duration is required' },
        { status: 400 }
      );
    }
    
    // Forward request to backend
    const backendUrl = `${API_URL}/tasks/${taskId}`;
    console.log('Proxying task duration update request to:', backendUrl);
    
    const response = await fetch(backendUrl, {
      method: 'PATCH',
      headers: {
        'Authorization': authHeader,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        DurationTask: body.duration,
        TaskScore: body.score || 100
      })
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('Backend task duration API error:', errorText);
      return NextResponse.json(
        { error: 'Failed to update task duration in backend' },
        { status: response.status }
      );
    }
    
    const data = await response.json();
    console.log(`Task ${taskId} duration updated successfully:`, data);
    return NextResponse.json({
      message: 'Task duration updated successfully',
      ...data
    });
  } catch (error) {
    console.error('Error proxying task duration update request:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}