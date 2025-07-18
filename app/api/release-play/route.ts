import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

// Add CORS headers for preflight requests
export async function OPTIONS() {
  return new Response(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}

export async function POST(request: Request) {
  // Add CORS headers
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  };

  try {
    // Get authenticated FID from middleware-set header
    const authenticatedFid = parseInt(request.headers.get('x-user-fid') || '0');

    const { coinId, reservationId } = await request.json();

    // Basic input validation
    if (!authenticatedFid || !coinId || !reservationId) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400, headers }
      );
    }

    // Since we're using database-based tracking, there's nothing to release
    // This endpoint is kept for backward compatibility with existing clients
    console.log('Release play called (no-op with database tracking):', {
      fid: authenticatedFid,
      coinId,
      reservationId,
    });

    return NextResponse.json(
      {
        success: true,
        released: true,
        message: 'Database-based tracking - no reservation to release',
      },
      { headers }
    );
  } catch (error) {
    console.error('Error in release-play endpoint:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500, headers }
    );
  }
}
