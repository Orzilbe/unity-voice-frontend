// apps/web/src/app/api/tasks/route.ts
import { NextRequest, NextResponse } from 'next/server';

const API_URL = process.env.API_URL || 'http://localhost:5000/api';
console.log('🔍 API_URL value:', API_URL);
/**
 * POST /api/tasks - Proxy to backend for creating tasks
 */
export async function POST(request: NextRequest) {
  try {
    console.log("API Tasks - Proxying task creation to backend");
    
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
    console.log('Request body:', JSON.stringify(body, null, 2));
    
    // Forward request to backend
    const backendUrl = `${API_URL}/tasks`;
    console.log('Proxying task creation request to:', backendUrl);
    
    const response = await fetch(backendUrl, {
      method: 'POST',
      headers: {
        'Authorization': authHeader,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(body)
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('Backend tasks API error:', errorText);
      return NextResponse.json(
        { error: 'Failed to create task in backend' },
        { status: response.status }
      );
    }
    
    const data = await response.json();
    console.log(`Task created successfully:`, data);
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error proxying task creation request:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/tasks - Proxy to backend for updating tasks
 */
export async function PUT(request: NextRequest) {
  try {
    console.log("API Tasks - Proxying task update to backend");
    
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
    const taskId = body.taskId || body.TaskId;
    
    if (!taskId) {
      return NextResponse.json(
        { error: 'Task ID is required' },
        { status: 400 }
      );
    }
    
    // Forward request to backend - use PATCH method as that's what backend expects
    const backendUrl = `${API_URL}/tasks/${taskId}`;
    console.log('Proxying task update request to:', backendUrl);
    
    const response = await fetch(backendUrl, {
      method: 'PATCH',
      headers: {
        'Authorization': authHeader,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(body)
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('Backend task update API error:', errorText);
      return NextResponse.json(
        { error: 'Failed to update task in backend' },
        { status: response.status }
      );
    }
    
    const data = await response.json();
    console.log(`Task updated successfully:`, data);
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error proxying task update request:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/tasks - Proxy to backend for fetching user tasks
 */
export async function GET(request: NextRequest) {
  try {
    console.log("API Tasks - Proxying get tasks to backend");
    
    // Get token from Authorization header
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }
    
    // Extract query parameters
    const { searchParams } = new URL(request.url);
    const queryString = searchParams.toString();
    
    // Forward request to backend
    const backendUrl = `${API_URL}/tasks${queryString ? `?${queryString}` : ''}`;
    console.log('Proxying get tasks request to:', backendUrl);
    
    const response = await fetch(backendUrl, {
      method: 'GET',
      headers: {
        'Authorization': authHeader,
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('Backend get tasks API error:', errorText);
      return NextResponse.json(
        { error: 'Failed to fetch tasks from backend' },
        { status: response.status }
      );
    }
    
    const data = await response.json();
    console.log(`Tasks retrieved successfully: ${Array.isArray(data) ? data.length : 'unknown'} tasks`);
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error proxying get tasks request:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}