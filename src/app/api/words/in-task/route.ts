// apps/web/src/app/api/words/in-task/route.ts
import { NextRequest, NextResponse } from 'next/server';

// Use consistent environment variable
const API_URL = process.env.API_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

console.log('🔍 Words in-task API_URL value:', API_URL);

/**
 * GET /api/words/in-task - Proxy to backend for getting words in task
 */
export async function GET(request: NextRequest) {
  try {
    console.log('🚀 Words in-task API - Processing GET request');
    
    // Get token from Authorization header
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.log('❌ Missing or invalid authorization header');
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }
    
    // Get taskId from URL parameters
    const { searchParams } = new URL(request.url);
    const taskId = searchParams.get('taskId');
    
    console.log('📋 Request params:', { taskId });
    
    // Validate required fields
    if (!taskId) {
      console.log('❌ Missing taskId parameter');
      return NextResponse.json(
        { error: 'taskId parameter is required' },
        { status: 400 }
      );
    }
    
    // Forward request to backend
    const backendUrl = `${API_URL}/words/in-task?taskId=${encodeURIComponent(taskId)}`;
    console.log('🎯 Proxying to backend URL:', backendUrl);
    
    const response = await fetch(backendUrl, {
      method: 'GET',
      headers: {
        'Authorization': authHeader,
        'Content-Type': 'application/json'
      }
    });
    
    console.log('📡 Backend response status:', response.status);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Backend words in-task API error:', errorText);
      return NextResponse.json(
        { error: 'Failed to get words for task from backend', details: errorText },
        { status: response.status }
      );
    }
    
    const data = await response.json();
    console.log('✅ Successfully retrieved words for task:', {
      taskId,
      wordCount: data.count || (Array.isArray(data.data) ? data.data.length : 0)
    });
    
    return NextResponse.json(data);
    
  } catch (error) {
    console.error('💥 Error in words in-task API:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}