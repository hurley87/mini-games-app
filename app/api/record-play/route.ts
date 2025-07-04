import { NextRequest, NextResponse } from 'next/server';
import { supabaseService } from '@/lib/supabase';
import { SecurityService } from '@/lib/security';
import { RateLimiter } from '@/lib/rate-limit';

export async function POST(request: NextRequest) {
  try {
    // 1. Verify authentication (optional until SDK is upgraded to 0.0.61+)
    let authenticatedFid: number | undefined;
    try {
      authenticatedFid = parseInt(request.headers.get('x-user-fid') || '0');
    } catch (error) {
      console.warn(
        'Authentication failed (optional until SDK upgrade):',
        error
      );
      // TODO: Make authentication mandatory when SDK is upgraded to 0.0.61+
    }

    const { fid, gameId, coinAddress } = await request.json();
    console.log('fid', fid);

    // 2. If authenticated, verify the FID matches
    if (authenticatedFid && Number(fid) !== authenticatedFid) {
      console.error('FID mismatch:', {
        requested: fid,
        authenticated: authenticatedFid,
      });
      return NextResponse.json(
        { error: 'Unauthorized: FID mismatch' },
        { status: 403 }
      );
    }

    // 3. Basic validation
    if (!fid || !gameId || !coinAddress) {
      return NextResponse.json(
        { error: 'Missing required fields: fid, gameId, coinAddress' },
        { status: 400 }
      );
    }

    // 4. Check rate limit
    const rateLimitResult = await RateLimiter.checkRateLimit(
      `record-play:${fid}`,
      100, // 100 game plays per hour max
      3600 // 1 hour window
    );

    if (!rateLimitResult.success) {
      return NextResponse.json(
        {
          error: 'Rate limit exceeded',
          retryAfter: rateLimitResult.reset,
        },
        { status: 429 }
      );
    }

    // 5. Verify FID exists on Farcaster
    const fidExists = await SecurityService.verifyFidExists(fid);
    if (!fidExists) {
      console.error('Invalid FID - does not exist on Farcaster:', fid);
      return NextResponse.json({ error: 'Invalid FID' }, { status: 400 });
    }

    // 5.5 Ensure the player exists in the database to prevent FK violations
    const existingPlayer = await supabaseService.getPlayerByFid(fid);
    if (!existingPlayer || existingPlayer.length === 0) {
      console.error('Player not found in database:', fid);
      return NextResponse.json(
        {
          error:
            'Player profile not found. Please create a player profile before recording gameplay.',
        },
        { status: 400 }
      );
    }

    // 6. Record the game play with current timestamp
    const gamePlay = await supabaseService.recordGamePlay({
      fid,
      game_id: gameId,
      coin_address: coinAddress,
      created_at: new Date().toISOString(),
    });

    return NextResponse.json({
      success: true,
      gamePlay,
    });
  } catch (error) {
    console.error('Error recording game play:', error);
    return NextResponse.json(
      { error: 'Failed to record game play' },
      { status: 500 }
    );
  }
}
