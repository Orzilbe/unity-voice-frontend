// apps/web/src/app/api/words/to-task/route.ts

import { NextRequest, NextResponse } from 'next/server';

// Use consistent environment variable (prefer API_URL for backend communication)
const API_URL = process.env.API_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

console.log('🔍 Words-to-task API_URL value:', API_URL);

/**
 * POST /api/words/to-task - Proxy to backend for adding words to task
 */
export async function POST(request: NextRequest) {
  try {
    console.log('🚀 Words-to-task API - Processing request');
    
    // Get token from Authorization header
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.log('❌ Missing or invalid authorization header');
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }
    
    // Get request body
    const body = await request.json();
    console.log('📋 Request body:', JSON.stringify(body, null, 2));
    
    // Validate required fields
    if (!body.taskId || !Array.isArray(body.wordIds) || body.wordIds.length === 0) {
      console.log('❌ Missing required fields');
      return NextResponse.json(
        { error: 'taskId and wordIds array are required' },
        { status: 400 }
      );
    }
    
    // Forward request to backend
    const backendUrl = `${API_URL}/words/to-task`;
    console.log('🎯 Proxying to backend URL:', backendUrl);
    
    const response = await fetch(backendUrl, {
      method: 'POST',
      headers: {
        'Authorization': authHeader,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(body)
    });
    
    console.log('📡 Backend response status:', response.status);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Backend words to task API error:', errorText);
      return NextResponse.json(
        { error: 'Failed to add words to task in backend', details: errorText },
        { status: response.status }
      );
    }
    
    const data = await response.json();
    console.log('✅ Successfully added words to task:', data);
    return NextResponse.json(data);
    
  } catch (error) {
    console.error('💥 Error in words-to-task API:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}