// apps/web/src/app/api/tasks/route.ts - תיקון מאוחד
import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { fetchWithAuth } from '../../../lib/fetchWithAuth';
const API_URL = process.env.API_URL || 'https://unity-voice-api-linux-f2hsapgsh3hcgqc0.israelcentral-01.azurewebsites.net/api';
console.log('🔍 API_URL value:', API_URL);

interface TokenPayload {
  id?: string | number;
  userId?: string;
  email: string;
  role?: string;
  iat?: number;
  exp?: number;
}

function getUserIdFromToken(request: NextRequest): { userId: string | null; error?: string } {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return { userId: null, error: 'No valid authorization header' };
    }

    const token = authHeader.split(' ')[1];
    const secret = process.env.JWT_SECRET;
    
    if (!secret) {
      console.error('JWT secret is not defined');
      return { userId: null, error: 'JWT secret not configured' };
    }

    const decoded = jwt.verify(token, secret) as TokenPayload;
    
    // Extract userId from token - try multiple fields
    const userId = decoded.userId || decoded.id?.toString() || null;
    
    if (!userId) {
      return { userId: null, error: 'No userId found in token' };
    }
    
    console.log('✅ Extracted userId from token:', userId);
    return { userId };
  } catch (error) {
    console.error('❌ Error extracting userId from token:', error);
    return { userId: null, error: 'Invalid token' };
  }
}

/**
 * POST /api/tasks - Create a new task
 */
export async function POST(request: NextRequest) {
  try {
    console.log("📋 API Tasks - Creating task");
    
    // Extract userId from JWT token
    const { userId, error } = getUserIdFromToken(request);
    if (!userId) {
      console.error('Authentication failed:', error);
      return NextResponse.json(
        { success: false, error: `Authentication required: ${error}` },
        { status: 401 }
      );
    }

    // Get request body
    const body = await request.json();
    console.log('📝 Original request body:', JSON.stringify(body, null, 2));
    
    // Add UserId to the request body
    const requestWithUserId = {
      ...body,
      UserId: userId
    };
    
    console.log('📝 Request body with UserId:', JSON.stringify(requestWithUserId, null, 2));
    
    // Get authorization header for forwarding
    const authHeader = request.headers.get('Authorization');
    
    // Forward request to backend
    const backendUrl = `${API_URL}/tasks`;
    console.log('🚀 Proxying task creation request to:', backendUrl);
    
    const response = await fetchWithAuth(backendUrl, {
      method: 'POST',
      headers: {
        'Authorization': authHeader || '',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(requestWithUserId)
    });
    
    console.log('📡 Backend response status:', response.status);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Backend tasks API error:', errorText);
      
      let errorData;
      try {
        errorData = JSON.parse(errorText);
      } catch {
        errorData = { error: 'Failed to create task in backend', details: errorText };
      }
      
      return NextResponse.json(
        errorData,
        { status: response.status }
      );
    }
    
    const data = await response.json();
    console.log('✅ Task created successfully:', data);
    return NextResponse.json(data);
  } catch (error) {
    console.error('💥 Error in task creation:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/tasks - Update a task
 */
export async function PUT(request: NextRequest) {
  try {
    console.log("📝 API Tasks - Updating task");
    
    // Verify authentication
    const { userId, error } = getUserIdFromToken(request);
    if (!userId) {
      console.error('Authentication failed:', error);
      return NextResponse.json(
        { success: false, error: `Authentication required: ${error}` },
        { status: 401 }
      );
    }
    
    // Get request body
    const body = await request.json();
    const taskId = body.taskId || body.TaskId;
    
    if (!taskId) {
      return NextResponse.json(
        { success: false, error: 'Task ID is required' },
        { status: 400 }
      );
    }
    
    console.log('📝 Update request body:', JSON.stringify(body, null, 2));
    
    // Get authorization header
    const authHeader = request.headers.get('Authorization');
    
    // Forward request to backend - use PATCH method as that's what backend expects
    const backendUrl = `${API_URL}/tasks/${taskId}`;
    console.log('🚀 Proxying task update request to:', backendUrl);
    
    const response = await fetchWithAuth(backendUrl, {
      method: 'PATCH',
      headers: {
        'Authorization': authHeader || '',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(body)
    });
    
    console.log('📡 Backend response status:', response.status);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Backend task update API error:', errorText);
      
      let errorData;
      try {
        errorData = JSON.parse(errorText);
      } catch {
        errorData = { error: 'Failed to update task in backend', details: errorText };
      }
      
      return NextResponse.json(
        errorData,
        { status: response.status }
      );
    }
    
    const data = await response.json();
    console.log('✅ Task updated successfully:', data);
    return NextResponse.json(data);
  } catch (error) {
    console.error('💥 Error in task update:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/tasks - Get user tasks
 */
export async function GET(request: NextRequest) {
  try {
    console.log("📋 API Tasks - Getting user tasks");
    
    // Verify authentication
    const { userId, error } = getUserIdFromToken(request);
    if (!userId) {
      console.error('Authentication failed:', error);
      return NextResponse.json(
        { success: false, error: `Authentication required: ${error}` },
        { status: 401 }
      );
    }
    
    // Get authorization header
    const authHeader = request.headers.get('Authorization');
    
    // Extract query parameters
    const { searchParams } = new URL(request.url);
    const queryString = searchParams.toString();
    
    // Forward request to backend
    const backendUrl = `${API_URL}/tasks${queryString ? `?${queryString}` : ''}`;
    console.log('🚀 Proxying get tasks request to:', backendUrl);
    
    const response = await fetchWithAuth(backendUrl, {
      method: 'GET',
      headers: {
        'Authorization': authHeader || '',
        'Content-Type': 'application/json'
      }
    });
    
    console.log('📡 Backend response status:', response.status);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Backend get tasks API error:', errorText);
      
      let errorData;
      try {
        errorData = JSON.parse(errorText);
      } catch {
        errorData = { error: 'Failed to fetch tasks from backend', details: errorText };
      }
      
      return NextResponse.json(
        errorData,
        { status: response.status }
      );
    }
    
    const data = await response.json();
    console.log(`✅ Tasks retrieved successfully: ${Array.isArray(data) ? data.length : 'unknown'} tasks`);
    return NextResponse.json(data);
  } catch (error) {
    console.error('💥 Error in get tasks:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}