// apps/web/src/app/api/create-post/[topicName]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '../../auth/verifyAuth';

// Backend API URL - this should be your actual backend server
const BACKEND_API_URL = process.env.API_URL || 'http://localhost:5000';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ topicName: string }> }
) {
  console.log('POST /api/create-post - Request received');
  
  try {
    // Get topic name from URL params
    const { topicName } = await params;
    console.log(`Creating post for topic: ${topicName}`);
    
    // Verify authentication
    const authResult = await verifyAuth(request);
    if (!authResult.isValid) {
      console.log('POST /api/create-post - Unauthorized request');
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get auth token from header to forward to backend
    const authHeader = request.headers.get('Authorization');
    const token = authHeader?.split(' ')[1];
    
    if (!token) {
      console.error('No token found in Authorization header');
      return NextResponse.json({ error: "No token provided" }, { status: 401 });
    }
    
    try {
      // Parse request body
      const body = await request.json().catch(() => ({}));
      
      console.log(`Forwarding request to backend API at: ${BACKEND_API_URL}`);
      
      // Forward the request to the actual backend server
      const backendResponse = await fetch(`${BACKEND_API_URL}/api/post/create/${encodeURIComponent(topicName)}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(body)
      });
      
      if (backendResponse.ok) {
        const data = await backendResponse.json();
        console.log('Successfully retrieved post from backend API');
        return NextResponse.json(data);
      } else {
        const errorText = await backendResponse.text();
        console.error(`Backend API responded with status ${backendResponse.status}:`, errorText);
        
        // Return fallback post instead of error
        return NextResponse.json(getFallbackPost(topicName));
      }
    } catch (backendError) {
      console.error("Error connecting to backend API:", backendError);
      
      // Return fallback post instead of error
      return NextResponse.json(getFallbackPost(topicName));
    }
    
  } catch (error: any) {
    console.error("Error in create-post API route:", error);
    
    // Return fallback post in case of any error
    const { topicName } = await params;
    return NextResponse.json(
      getFallbackPost(topicName), 
      { status: 200 }
    );
  }
}

// Fallback post generation (simple, no AI)
function getFallbackPost(topicName: string): {text: string, requiredWords: string[]} {
  const formattedTopic = topicName
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
  
  const requiredWords = generateRequiredWords(topicName);
  
  return {
    text: `Let's discuss ${formattedTopic}! This is an important topic that affects many aspects of Israeli society and culture. What are your thoughts on this subject? I'd love to hear different perspectives on this.`,
    requiredWords: requiredWords
  };
}

// Helper function to generate required words based on topic
function generateRequiredWords(topicName: string): string[] {
  const lowerTopic = topicName.toLowerCase();
  
  let topicWords: string[] = [];
  
  if (lowerTopic.includes('diplomacy')) {
    topicWords = ['diplomacy', 'peace', 'negotiation', 'agreement', 'international'];
  } else if (lowerTopic.includes('economy')) {
    topicWords = ['startup', 'innovation', 'entrepreneur', 'investment', 'technology'];
  } else if (lowerTopic.includes('innovation')) {
    topicWords = ['technology', 'startup', 'innovation', 'research', 'development'];
  } else if (lowerTopic.includes('history')) {
    topicWords = ['heritage', 'tradition', 'ancient', 'archaeological', 'civilization'];
  } else if (lowerTopic.includes('holocaust')) {
    topicWords = ['remembrance', 'survivor', 'memorial', 'testimony', 'resilience'];
  } else if (lowerTopic.includes('iron') || lowerTopic.includes('sword')) {
    topicWords = ['security', 'defense', 'protection', 'resilience', 'strength'];
  } else if (lowerTopic.includes('society')) {
    topicWords = ['diversity', 'culture', 'community', 'tradition', 'integration'];
  } else {
    // Default words
    topicWords = ['culture', 'heritage', 'history', 'innovation', 'community'];
  }
  
  // Return 5 words
  return topicWords.slice(0, 5);
}