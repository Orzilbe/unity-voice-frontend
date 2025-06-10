// unity-voice-frontend/src/app/api/question/[questionId]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { fetchWithAuth } from '../../../../lib/fetchWithAuth';
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://unity-voice-api-linux-f2hsapgsh3hcgqc0.israelcentral-01.azurewebsites.net/api';
/**
 * PATCH /api/question/[questionId] - Proxy to backend for updating questions
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ questionId: string }> }
) {
  try {
    const resolvedParams = await params;
    const questionId = resolvedParams.questionId;
    
    console.log(`API Question Update - Proxying question update for questionId: ${questionId}`);
    console.log("🔍 API_URL:", API_URL); // 🔧 הוספת לוג
    
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
    console.log('Question update request body:', JSON.stringify(body, null, 2));
    
    // Forward request to backend
    const backendUrl = `${API_URL}/questions/${questionId}`;
    console.log('Proxying question update request to:', backendUrl);
    
    const response = await fetchWithAuth(backendUrl, {
      method: 'PATCH',
      headers: {
        'Authorization': authHeader,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(body)
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('Backend question update API error:', errorText);
      return NextResponse.json(
        { error: 'Failed to update question in backend' },
        { status: response.status }
      );
    }
    
    const data = await response.json();
    console.log(`Question ${questionId} updated successfully:`, data);
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error proxying question update request:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}