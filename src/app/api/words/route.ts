// apps/web/src/app/api/words/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { fetchWithAuth } from '../../../lib/fetchWithAuth';
const API_URL = process.env.API_URL || 'https://unity-voice-backend-production-46a1.up.railway.app/api';

/**
 * GET /api/words - Proxy to backend for fetching words by topic and level
 */
export async function GET(request: NextRequest) {
  try {
    console.log("🔍 Words API - Proxying to backend");
    
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }
    
    const { searchParams } = new URL(request.url);
    const queryString = searchParams.toString();
    
    const backendUrl = `${API_URL}/words${queryString ? `?${queryString}` : ''}`;
    console.log('🎯 Proxying words request to:', backendUrl);
    
    const response = await fetchWithAuth(backendUrl, {
      method: 'GET',
      headers: {
        'Authorization': authHeader,
        'Content-Type': 'application/json'
      }
    });
    
    console.log('📡 Backend response status:', response.status);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Backend words API error:', errorText);
      return NextResponse.json(
        { error: 'Failed to fetch words from backend' },
        { status: response.status }
      );
    }
    
    const data = await response.json();
    console.log('✅ Words fetched successfully:', data?.length || 'unknown count');
    return NextResponse.json(data);
  } catch (error) {
    console.error('💥 Error in words API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}