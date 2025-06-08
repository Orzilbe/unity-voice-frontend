// unity-voice-frontend/src/app/api/analyze-conversation/route.ts
import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { fetchWithAuth } from '../../../lib/fetchWithAuth';

// API URL for the backend
const API_URL = process.env.NEXT_PUBLIC_API_URL;

interface MessageInput {
  role: 'user' | 'assistant';
  content: string;
}

interface ConversationInput {
  text: string;
  topicName: string;
  level: number;
  previousMessages?: MessageInput[];
}

// Function to validate auth token
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

export async function POST(request: NextRequest) {
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
    
    // Parse the request body
    const body: ConversationInput = await request.json();
    const { text, topicName, level, previousMessages = [] } = body;
    
    // Validate inputs
    if (!text || !topicName) {
      return NextResponse.json(
        { error: "Missing required fields: text and topicName" },
        { status: 400 }
      );
    }
    
    console.log(`Analyzing conversation: topic=${topicName}, level=${level}, text length=${text.length}`);
    
    // Forward request to backend API
    try {
      const backendResponse = await fetchWithAuth(`${API_URL}/conversation-analysis/analyze`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          text,
          topicName,
          level: parseInt(level?.toString() || '1'),
          previousMessages
        })
      });
      
      if (backendResponse.ok) {
        const data = await backendResponse.json();
        console.log('Backend analysis successful');
        return NextResponse.json(data.data || data);
      } else {
        const errorText = await backendResponse.text();
        console.error('Backend analysis failed:', errorText);
        throw new Error(`Backend error: ${backendResponse.status}`);
      }
    } catch (backendError) {
      console.error("Error connecting to backend API:", backendError);
      
      // Return a fallback response
      return NextResponse.json({
        text: "I understand what you're saying. Thank you for sharing your thoughts!",
        feedback: "Good effort! Keep practicing your conversation skills.",
        usedWords: [],
        nextQuestion: `Can you tell me more about your thoughts on ${topicName}?`,
        score: 200,
        pronunciationTips: [],
        grammarTips: [],
        suggestions: ["Try to elaborate more on your ideas"]
      });
    }
    
  } catch (error: unknown) {
    console.error("Error in analyze-conversation API:", error);
    return NextResponse.json(
      { 
        error: "Failed to analyze conversation",
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}