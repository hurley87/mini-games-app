import { NextRequest, NextResponse } from 'next/server';
import { sdk } from '@farcaster/frame-sdk';

export async function middleware(request: NextRequest) {
  // Skip middleware for API routes, static files, and public assets
  if (
    request.nextUrl.pathname.startsWith('/api/') ||
    request.nextUrl.pathname.startsWith('/_next/') ||
    request.nextUrl.pathname.startsWith('/public/') ||
    request.nextUrl.pathname.includes('.')
  ) {
    return NextResponse.next();
  }

  // Skip auth check for public pages
  const publicPaths = ['/login', '/', '/info'];
  if (publicPaths.includes(request.nextUrl.pathname)) {
    return NextResponse.next();
  }

  try {
    // Check if user is authenticated by validating Farcaster context
    const authHeader = request.headers.get('Authorization');
    const farcasterUser = request.headers.get('X-Farcaster-User');
    
    // If no auth info is present, redirect to home
    if (!authHeader && !farcasterUser) {
      return NextResponse.redirect(new URL('/', request.url));
    }

    // Allow the request to proceed
    return NextResponse.next();
  } catch (error) {
    console.error('Middleware auth error:', error);
    // On error, redirect to home
    return NextResponse.redirect(new URL('/', request.url));
  }
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public (public files)
     */
    '/((?!api|_next/static|_next/image|favicon.ico|public).*)',
  ],
};