// unity-voice-frontend/src/middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  // Get token from cookies
  const token = request.cookies.get('auth_token')?.value;
  
  // Define protected and auth routes
  const protectedRoutes = ['/topics', '/profile', '/dashboard', '/hall-of-fame'];
  const authRoutes = ['/login', '/signup'];
  
  const pathname = request.nextUrl.pathname;
  
  // Check if current path is protected
  const isProtectedRoute = protectedRoutes.some(route => 
    pathname.startsWith(route)
  );
  
  const isAuthRoute = authRoutes.some(route => 
    pathname.startsWith(route)
  );
  
  // Log for debugging
  console.log(`[Middleware] Path: ${pathname}, Token: ${token ? 'exists' : 'missing'}`);
  
  // If no token and trying to access protected route, redirect to login
  if (isProtectedRoute && !token) {
    console.log(`[Middleware] Redirecting to login - no token for protected route: ${pathname}`);
    const url = new URL('/login', request.url);
    url.searchParams.set('redirect', pathname);
    return NextResponse.redirect(url);
  }
  
  // If has token and trying to access auth routes, redirect to topics
  if (isAuthRoute && token) {
    console.log(`[Middleware] Redirecting to topics - authenticated user accessing auth route: ${pathname}`);
    return NextResponse.redirect(new URL('/topics', request.url));
  }
  
  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!api|_next/static|_next/image|favicon.ico|public).*)',
  ]
};