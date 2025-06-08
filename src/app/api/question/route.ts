// unity-voice-frontend/src/app/api/question/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { fetchWithAuth } from '../../../lib/fetchWithAuth';
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

export async function POST(request: NextRequest) {
  console.log("🟢 Question API called");
  
  try {
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }
    
    const body = await request.json();
    console.log('🟢 Question body:', body);
    
    const backendUrl = `${API_URL}/questions`;
    console.log('🟢 Calling:', backendUrl);
    
    const response = await fetchWithAuth(backendUrl, {
      method: 'POST',
      headers: {
        'Authorization': authHeader,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(body)
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('🔴 Backend error:', errorText);
      return NextResponse.json({ error: errorText }, { status: response.status });
    }
    
    const data = await response.json();
    console.log('🟢 Success:', data);
    return NextResponse.json(data);
  } catch (error) {
    console.error('🔴 Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}