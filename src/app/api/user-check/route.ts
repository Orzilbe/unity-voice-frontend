// apps/web/src/app/api/user-check/route.ts
import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';

/**
 * API לבדיקת אימות משתמש
 * GET /api/user-check
 */
export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('Authorization');
    if (!authHeader) {
      return NextResponse.json({ isAuthenticated: false }, { status: 401 });
    }
    
    const token = authHeader.replace('Bearer ', '');
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'default_secret') as { userId?: string; id?: string };
    
    if (decoded.userId || decoded.id) {
      return NextResponse.json({ isAuthenticated: true, userId: decoded.userId || decoded.id });
    }
    
    return NextResponse.json({ isAuthenticated: false }, { status: 401 });
  } catch {
    return NextResponse.json({ isAuthenticated: false }, { status: 401 });
  }
}