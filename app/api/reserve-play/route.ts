import { NextResponse } from 'next/server';
import { supabaseService } from '@/lib/supabase';
import { RateLimiter } from '@/lib/rate-limit';
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
    let coin = null;
    let coinCheckError = null;

    // First try to find by ID
    const { data: coinById, error: idError } = await supabaseService
      .from('coins')
      .select('id, coin_address, max_plays')
      .eq('id', coinId)
      .single();

    if (coinById) {
      coin = coinById;
    } else {
      // If not found by ID, try by coin_address
      const { data: coinByAddress, error: addressError } = await supabaseService
        .from('coins')
        .select('id, coin_address, max_plays')
        .eq('coin_address', coinId)
        .single();

      if (coinByAddress) {
        coin = coinByAddress;
      } else {
        coinCheckError = addressError || idError;
      }
    }

    if (!coin) {
      console.error('Coin not found by ID or address:', coinId, coinCheckError);
      return NextResponse.json(
        { error: 'Coin not found' },
        { status: 404, headers }
      );
    }

    // Reserve a play slot
    const maxDailyPlays = coin.max_plays || 3; // Default to 3 if not set
    const reservationResult = await RateLimiter.reserveDailyPlaySlot(
      authenticatedFid,
      coinId,
      maxDailyPlays
    );

    if (!reservationResult.success) {
      return NextResponse.json(
        {
          error: 'Daily play limit exceeded for this game',
          limit: reservationResult.limit,
          remaining: reservationResult.remaining,
          resetAt: reservationResult.reset,
        },
        { status: 429, headers }
      );
    }

    return NextResponse.json(
      {
        success: true,
        reservationId: reservationResult.reservationId,
        limit: reservationResult.limit,
        remaining: reservationResult.remaining,
        resetAt: reservationResult.reset,
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
