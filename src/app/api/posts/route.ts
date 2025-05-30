// apps/web/src/app/api/posts/route.ts
import { NextRequest, NextResponse } from 'next/server';

const API_URL = process.env.NEXT_PUBLIC_API_URL;

/**
 * POST /api/posts - Proxy to backend for creating posts
 */
export async function POST(request: NextRequest) {
  try {
    console.log("API Posts - Proxying post creation to backend");
    
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
    const backendUrl = `${API_URL}/posts`;
    console.log('Proxying post creation request to:', backendUrl);
    
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
      console.error('Backend posts API error:', errorText);
      return NextResponse.json(
        { error: 'Failed to create post in backend' },
        { status: response.status }
      );
    }
    
    const data = await response.json();
    console.log(`Post created successfully:`, data);
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error proxying post creation request:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/posts - Proxy to backend for fetching posts
 */
export async function GET(request: NextRequest) {
  try {
    console.log("API Posts - Proxying get posts to backend");
    
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
    const backendUrl = `${API_URL}/posts${queryString ? `?${queryString}` : ''}`;
    console.log('Proxying get posts request to:', backendUrl);
    
    const response = await fetch(backendUrl, {
      method: 'GET',
      headers: {
        'Authorization': authHeader,
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('Backend get posts API error:', errorText);
      return NextResponse.json(
        { error: 'Failed to fetch posts from backend' },
        { status: response.status }
      );
    }
    
    const data = await response.json();
    console.log(`Posts retrieved successfully: ${Array.isArray(data) ? data.length : 'single post'}`);
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error proxying get posts request:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}