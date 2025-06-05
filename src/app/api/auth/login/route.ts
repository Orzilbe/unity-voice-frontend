// unity-voice-frontend/src/app/api/auth/login/route.ts
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate required fields
    if (!body.email || !body.password) {
      return NextResponse.json(
        { success: false, message: 'Email and password are required' },
        { status: 400 }
      );
    }
    
    const apiUrl = `${process.env.NEXT_PUBLIC_API_URL}/auth/login`;
    console.log('Attempting login at:', apiUrl);
    
    // Forward login request to backend
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: body.email,
        password: body.password
      })
    });

    // Check if response is JSON
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      const data = await response.json();
      
      if (response.ok) {
        // Set auth cookie
        const cookieOptions = {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'lax' as const,
          maxAge: 7 * 24 * 60 * 60, // 7 days
          path: '/'
        };

        const response = NextResponse.json({
          success: true,
          token: data.token,
          user: data.user
        });

        response.cookies.set('auth_token', data.token, cookieOptions);
        return response;
      } else {
        return NextResponse.json(
          { 
            success: false,
            message: data.message || 'Login failed'
          },
          { status: response.status }
        );
      }
    } else {
      // Handle non-JSON response
      const textResponse = await response.text();
      console.error('Non-JSON response from login API:', textResponse.substring(0, 200));
      
      return NextResponse.json(
        {
          success: false,
          message: 'Invalid response from authentication server'
        },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      {
        success: false,
        message: error instanceof Error ? error.message : 'Login failed'
      },
      { status: 500 }
    );
  }
}