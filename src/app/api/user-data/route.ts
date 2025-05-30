// apps/web/src/app/api/user-data/route.ts
import { NextRequest, NextResponse } from 'next/server';

const API_URL = process.env.NEXT_PUBLIC_API_URL;
/**
 * GET /api/user-data - Proxy to backend for fetching user data with statistics
 */
export async function GET(request: NextRequest) {
  try {
    // Get token from Authorization header
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { message: 'Unauthorized - Invalid token' },
        { status: 401 }
      );
    }
    
    // Forward request to backend
    const backendUrl = `${API_URL}/user-profile/data`;
    console.log('Proxying user data request to:', backendUrl);
    
    const response = await fetch(backendUrl, {
      method: 'GET',
      headers: {
        'Authorization': authHeader,
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('Backend user data API error:', errorText);
      
      // Fallback to mock data if backend fails
      const mockUserData = {
        currentLevel: "Beginner",
        currentLevelPoints: 0,
        Score: 0,
        completedTasksCount: 0,
        CreationDate: new Date().toISOString(),
        nextLevel: "Intermediate",
        pointsToNextLevel: 100,
        FirstName: '',
        LastName: '',
        Email: '',
        totalActivities: 0
      };
      
      return NextResponse.json(mockUserData);
    }
    
    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error proxying user data request:', error);
    
    // Fallback to mock data if everything fails
    const mockUserData = {
      currentLevel: "Beginner",
      currentLevelPoints: 0,
      Score: 0,
      completedTasksCount: 0,
      CreationDate: new Date().toISOString(),
      nextLevel: "Intermediate",
      pointsToNextLevel: 100,
      FirstName: '',
      LastName: '',
      Email: '',
      totalActivities: 0
    };
    
    return NextResponse.json(mockUserData);
  }
}