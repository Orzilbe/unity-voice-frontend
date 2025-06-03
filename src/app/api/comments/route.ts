// apps/web/src/app/api/comments/route.ts
import { NextRequest, NextResponse } from 'next/server';

const API_URL = process.env.NEXT_PUBLIC_API_URL;

/**
 * POST /api/comments - Proxy to backend for creating comments
 */
export async function POST(request: NextRequest) {
  try {
    console.log("API Comments - Proxying comment creation to backend");
    
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
    const backendUrl = `${API_URL}/comments`;
    console.log('Proxying comment creation request to:', backendUrl);
    
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
      console.error('Backend comments API error:', errorText);
      return NextResponse.json(
        { error: 'Failed to create comment in backend' },
        { status: response.status }
      );
    }
    
    const data = await response.json();
    console.log(`Comment created successfully:`, data);
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error proxying comment creation request:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/comments - Proxy to backend for fetching comments
 */
export async function GET(request: NextRequest) {
  try {
    console.log("API Comments - Proxying get comments to backend");
    
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
    const backendUrl = `${API_URL}/comments${queryString ? `?${queryString}` : ''}`;
    console.log('Proxying get comments request to:', backendUrl);
    
    const response = await fetch(backendUrl, {
      method: 'GET',
      headers: {
        'Authorization': authHeader,
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('Backend get comments API error:', errorText);
      return NextResponse.json(
        { error: 'Failed to fetch comments from backend' },
        { status: response.status }
      );
    }
    
    const data = await response.json();
    console.log(`Comments retrieved successfully: ${Array.isArray(data) ? data.length : 'single comment'}`);
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error proxying get comments request:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/comments - Proxy to backend for updating comments
 */
export async function PATCH(request: NextRequest) {
  try {
    console.log("API Comments - Proxying comment update to backend");
    
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
    const commentId = body.commentId || body.CommentID;
    
    if (!commentId) {
      return NextResponse.json(
        { error: 'Comment ID is required' },
        { status: 400 }
      );
    }
    
    // Forward request to backend
    const backendUrl = `${API_URL}/comments/${commentId}`;
    console.log('Proxying comment update request to:', backendUrl);
    
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
      console.error('Backend comment update API error:', errorText);
      return NextResponse.json(
        { error: 'Failed to update comment in backend' },
        { status: response.status }
      );
    }
    
    const data = await response.json();
    console.log(`Comment updated successfully:`, data);
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error proxying comment update request:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}