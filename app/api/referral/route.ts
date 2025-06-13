import { NextResponse } from 'next/server';
import { supabaseService } from '@/lib/supabase';
import { FarcasterAuth } from '@/lib/auth';
import { SecurityService } from '@/lib/security';
import { RateLimiter } from '@/lib/rate-limit';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    // 1. Verify authentication (optional until SDK is upgraded to 0.0.61+)
    let authenticatedFid: number | undefined;
    try {
      authenticatedFid = await FarcasterAuth.requireAuth(request);
    } catch (error) {
      console.warn(
        'Authentication failed (optional until SDK upgrade):',
        error
      );
      // TODO: Make authentication mandatory when SDK is upgraded to 0.0.61+
    }

    const { sharerFid, playerFid } = await request.json();

    // 2. If authenticated, the authenticated user should be the new player (playerFid)
    if (authenticatedFid && Number(playerFid) !== authenticatedFid) {
      console.error('FID mismatch:', {
        requested: playerFid,
        authenticated: authenticatedFid,
      });
      return NextResponse.json(
        { error: 'Unauthorized: FID mismatch' },
        { status: 403 }
      );
    }

    // 3. Validate that both FIDs are provided and are valid positive integers
    if (
      !sharerFid ||
      !playerFid ||
      isNaN(Number(sharerFid)) ||
      isNaN(Number(playerFid)) ||
      Number(sharerFid) <= 0 ||
      Number(playerFid) <= 0 ||
      !Number.isInteger(Number(sharerFid)) ||
      !Number.isInteger(Number(playerFid))
    ) {
      return NextResponse.json(
        { error: 'Invalid sharerFid or playerFid - must be positive integers' },
        { status: 400 }
      );
    }

    const sharerFidNum = Number(sharerFid);
    const playerFidNum = Number(playerFid);

    // 4. Prevent self-referral
    if (sharerFidNum === playerFidNum) {
      return NextResponse.json(
        { error: 'Cannot refer yourself' },
        { status: 400 }
      );
    }

    // 5. Check rate limit for referrals from this player
    const rateLimitResult = await RateLimiter.checkRateLimit(
      `referral:${playerFidNum}`,
      1, // Only 1 referral per player (they can only be referred once)
      86400 * 365 // 1 year window (effectively permanent)
    );

    if (!rateLimitResult.success) {
      return NextResponse.json(
        { error: 'This player has already been referred' },
        { status: 429 }
      );
    }

    // 6. Verify both FIDs exist on Farcaster
    const [sharerExists, playerExists] = await Promise.all([
      SecurityService.verifyFidExists(sharerFidNum),
      SecurityService.verifyFidExists(playerFidNum),
    ]);

    if (!sharerExists) {
      console.error(
        'Invalid sharer FID - does not exist on Farcaster:',
        sharerFidNum
      );
      return NextResponse.json(
        { error: 'Invalid sharer FID' },
        { status: 400 }
      );
    }

    if (!playerExists) {
      console.error(
        'Invalid player FID - does not exist on Farcaster:',
        playerFidNum
      );
      return NextResponse.json(
        { error: 'Invalid player FID' },
        { status: 400 }
      );
    }

    // 7. Verify sharer exists in our system
    const sharer = await supabaseService.getPlayerByFid(sharerFidNum);
    if (!sharer || sharer.length === 0) {
      return NextResponse.json({ error: 'Sharer not found' }, { status: 404 });
    }

    // 8. Verify referred player exists (they should since /api/players was called first)
    const referredPlayer = await supabaseService.getPlayerByFid(playerFidNum);
    if (!referredPlayer || referredPlayer.length === 0) {
      return NextResponse.json(
        { error: 'Referred player not found' },
        { status: 404 }
      );
    }

    // 9. Check daily points limit for the sharer (referral gives 5 points)
    const dailyLimitResult = await RateLimiter.checkDailyPointsLimit(
      sharerFidNum,
      5,
      10000 // 10,000 points per day limit
    );

    if (!dailyLimitResult.success) {
      return NextResponse.json(
        {
          error: 'Sharer has reached daily points limit',
          limit: dailyLimitResult.limit,
          remaining: dailyLimitResult.remaining,
          resetAt: dailyLimitResult.reset,
        },
        { status: 429 }
      );
    }

    // 10. Award referral points to the sharer using the FID
    await supabaseService.incrementPlayerPoints(Number(sharer[0].fid), 5);

    return NextResponse.json({
      awarded: true,
      pointsAwarded: 5,
      sharerDailyPointsRemaining: dailyLimitResult.remaining,
    });
  } catch (error) {
    console.error('Error processing referral:', error);
    return NextResponse.json(
      { error: 'Failed to process referral' },
      { status: 500 }
    );
  }
}
