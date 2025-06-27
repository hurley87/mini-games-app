import { NextResponse } from 'next/server';
import { supabaseService } from '@/lib/supabase';
import { SecurityService } from '@/lib/security';

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

    const { coinId } = await request.json();

    // Basic input validation
    if (!authenticatedFid || !coinId) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400, headers }
      );
    }

    // Verify FID exists on Farcaster
    const fidExists = await SecurityService.verifyFidExists(
      authenticatedFid.toString()
    );
    if (!fidExists) {
      console.error(
        'Invalid FID - does not exist on Farcaster:',
        authenticatedFid
      );
      return NextResponse.json(
        { error: 'Invalid FID' },
        { status: 400, headers }
      );
    }

    // Verify the game exists and get coin data
    const coin = await supabaseService.getCoinById(coinId);
    if (!coin) {
      console.error('Coin not found:', coinId);
      return NextResponse.json(
        { error: 'Coin not found' },
        { status: 404, headers }
      );
    }

    // Check database-based daily play limit
    const currentDailyPlays = await supabaseService.getDailyPlayCount(
      authenticatedFid,
      coinId
    );
    const maxDailyPlays = coin.max_plays || 3; // Default to 3 if not set

    if (currentDailyPlays >= maxDailyPlays) {
      return NextResponse.json(
        {
          error: 'Daily play limit exceeded for this game',
          limit: maxDailyPlays,
          remaining: 0,
          currentPlays: currentDailyPlays,
          resetAt: Date.now() + 86400 * 1000, // 24 hours from now
        },
        { status: 429, headers }
      );
    }

    // Generate a simple reservation ID for backward compatibility
    // This is now just a token for the client, not used for Redis tracking
    const reservationId = `db-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;

    const playsRemaining = maxDailyPlays - currentDailyPlays;

    return NextResponse.json(
      {
        success: true,
        reservationId, // For backward compatibility
        limit: maxDailyPlays,
        remaining: playsRemaining,
        currentPlays: currentDailyPlays,
        resetAt: Date.now() + 86400 * 1000, // 24 hours from now
        message: 'Database-based play tracking (Redis-free)',
      },
      { headers }
    );
  } catch (error) {
    if ((error as Error).message.includes('Unauthorized')) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401, headers }
      );
    }
    console.error('Error in reserve-play endpoint:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500, headers }
    );
  }
}
