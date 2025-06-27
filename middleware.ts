import * as jose from 'jose';
import { NextRequest, NextResponse } from 'next/server';

export const config = {
  matcher: ['/api/:path*'],
};

export default async function middleware(req: NextRequest) {
  // Skip auth check for sign-in endpoint
  if (
    req.nextUrl.pathname === '/api/auth/sign-in' ||
    req.nextUrl.pathname === '/api/distributor' ||
    req.nextUrl.pathname === '/api/check-play-status' ||
    req.nextUrl.pathname.startsWith('/api/og') ||
    req.nextUrl.pathname.startsWith('/api/coins') ||
    req.nextUrl.pathname.startsWith('/api/builds') ||
    req.nextUrl.pathname.includes('/api/webhook')
  ) {
    return NextResponse.next();
  }

  // Get token from auth_token cookie
  const token = req.cookies.get('auth_token')?.value;

  if (!token) {
    return NextResponse.json(
      { error: 'Authentication required' },
      { status: 401 }
    );
  }

  try {
    const secret = new TextEncoder().encode(process.env.JWT_SECRET);
    // Verify the token using jose
    const { payload } = await jose.jwtVerify(token, secret);

    // Clone the request headers to add user info
    const requestHeaders = new Headers(req.headers);
    requestHeaders.set('x-user-fid', payload.fid as string);

    // Return response with modified headers
    return NextResponse.next({
      request: {
        headers: requestHeaders,
      },
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
  }
}
