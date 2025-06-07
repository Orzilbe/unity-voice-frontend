// unity-voice-frontend/src/middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Protected routes that require authentication
const protectedRoutes = [
  '/topics',
  '/topics/',
  '/dashboard',
  '/profile',
  '/user-profile'
];

// Routes that should redirect authenticated users away
const authRoutes = ['/login', '/register', '/signup'];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // ✅ קריאת authToken מcookies
  const token = request.cookies.get('authToken')?.value;
  
  console.log(`[Middleware] Path: ${pathname}, Token: ${token ? 'present' : 'missing'}`);
  
  // Check if the current path is a protected route
  const isProtectedRoute = protectedRoutes.some(route => 
    pathname.startsWith(route)
  );
  
  // Check if the current path is an auth route
  const isAuthRoute = authRoutes.some(route => 
    pathname.startsWith(route)
  );
  
  // If trying to access protected route without token
  if (isProtectedRoute && !token) {
    console.log(`[Middleware] Redirecting to login - no token for protected route: ${pathname}`);
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }
  
  // If trying to access auth routes with valid token, redirect to topics
  if (isAuthRoute && token) {
    console.log(`[Middleware] Redirecting authenticated user from ${pathname} to /topics`);
    return NextResponse.redirect(new URL('/topics', request.url));
  }
  
  // Allow the request to continue
  return NextResponse.next();
}

// Configure which paths the middleware should run on
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder files
     */
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\.png$|.*\\.jpg$|.*\\.jpeg$|.*\\.gif$|.*\\.svg$).*)',
  ],
};