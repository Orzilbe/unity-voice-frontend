// unity-voice-frontend/src/app/api/auth/login/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { fetchWithAuth } from '../../../../lib/fetchWithAuth';

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        { success: false, message: 'Email and password are required' },
        { status: 400 }
      );
    }

    const apiUrl = `${process.env.NEXT_PUBLIC_API_URL}/auth/login`;
    console.log('Attempting login at:', apiUrl);

    const response = await fetchWithAuth(apiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });

    const contentType = response.headers.get('content-type') || '';
    if (!contentType.includes('application/json')) {
      const text = await response.text();
      console.error('Non-JSON response from login API:', text);
      return NextResponse.json(
        { success: false, message: 'Invalid response from authentication server' },
        { status: 500 }
      );
    }

    const data = await response.json();
    if (!response.ok) {
      return NextResponse.json(
        { success: false, message: data.message || 'Login failed' },
        { status: response.status }
      );
    }

    // מחזירים ללקוח רק JSON עם הטוקן והמשתמש
    return NextResponse.json(
      { success: true, token: data.token, user: data.user },
      { status: 200 }
    );

  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { success: false, message: error instanceof Error ? error.message : 'Login failed' },
      { status: 500 }
    );
  }
}
