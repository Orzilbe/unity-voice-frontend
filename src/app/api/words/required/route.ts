// unity-voice-frontend/src/app/api/words/required/route.ts
import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { fetchWithAuth } from '../../../../lib/fetchWithAuth';
const API_URL = process.env.NEXT_PUBLIC_API_URL;

function validateToken(token: string): { isValid: boolean; userId: string } {
  try {
    const secret = process.env.JWT_SECRET || 'default_secret';
    const decoded = jwt.verify(token, secret) as { id?: string; userId?: string; sub?: string };
    const userId = decoded.id || decoded.userId || decoded.sub;
    
    return { isValid: !!userId, userId: userId || '' };
  } catch (error) {
    console.error('Error validating token:', error);
    return { isValid: false, userId: '' };
  }
}

export async function GET(request: NextRequest) {
  try {
    // Get authorization token from headers
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    
    const token = authHeader.substring(7);
    const authResult = validateToken(token);
    
    if (!authResult.isValid) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

    // Get query parameters
    const { searchParams } = new URL(request.url);
    const topic = searchParams.get('topic');
    const level = searchParams.get('level');

    if (!topic) {
      return NextResponse.json(
        { error: "Topic parameter is required" },
        { status: 400 }
      );
    }

    console.log(`Fetching required words for topic: ${topic}, level: ${level}`);

    try {
      // Forward request to backend to get learned words from flashcards
      const backendResponse = await fetchWithAuth(`${API_URL}/words/required?topic=${encodeURIComponent(topic)}&level=${level || '1'}&userId=${authResult.userId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (backendResponse.ok) {
        const data = await backendResponse.json();
        console.log('Backend required words successful');
        return NextResponse.json(data);
      } else {
        console.error('Backend required words failed:', backendResponse.status);
        throw new Error(`Backend error: ${backendResponse.status}`);
      }
    } catch (backendError) {
      console.error("Error connecting to backend API:", backendError);
      
      // Return fallback words based on topic
      const fallbackWords = getFallbackWords(topic);
      return NextResponse.json({
        success: true,
        data: fallbackWords,
        source: 'fallback'
      });
    }

  } catch (error: unknown) {
    console.error("Error in required words API:", error);
    return NextResponse.json(
      { 
        error: "Failed to fetch required words",
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// Fallback words for different topics
function getFallbackWords(topic: string): string[] {
  const topicWords: Record<string, string[]> = {
    'History and Heritage': ['culture', 'tradition', 'heritage', 'ancient', 'historical', 'legacy', 'monument', 'civilization'],
    'Innovation and Technology': ['technology', 'innovation', 'development', 'research', 'solution', 'advancement', 'digital', 'breakthrough'],
    'Economy and Entrepreneurship': ['business', 'market', 'growth', 'investment', 'entrepreneurship', 'startup', 'economy', 'financial'],
    'Diplomacy and International Relations': ['relations', 'cooperation', 'negotiation', 'partnership', 'dialogue', 'diplomacy', 'international', 'agreement'],
    'Environment and Sustainability': ['environment', 'sustainability', 'renewable', 'green', 'conservation', 'climate', 'natural', 'ecological'],
    'Society and Culture': ['society', 'community', 'cultural', 'social', 'diversity', 'integration', 'values', 'identity']
  };

  // Find matching topic or use default
  const matchingTopic = Object.keys(topicWords).find(key => 
    topic.toLowerCase().includes(key.toLowerCase()) || 
    key.toLowerCase().includes(topic.toLowerCase())
  );

  if (matchingTopic) {
    return topicWords[matchingTopic];
  }

  // Default words if no specific topic match
  return ['important', 'example', 'experience', 'opinion', 'interesting', 'development', 'opportunity', 'challenge'];
}