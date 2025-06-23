import { NextResponse } from 'next/server';
import { supabaseService } from '@/lib/supabase';
import { SecurityService } from '@/lib/security';
import { RateLimiter } from '@/lib/rate-limit';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    // 1. Verify authentication
    let authenticatedFid: number | undefined;
    try {
      authenticatedFid = parseInt(request.headers.get('x-user-fid') || '0');
    } catch (error) {
      console.warn('Authentication failed:', error);
    }

    const { fid } = await request.json();

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

    // 3. Validate that FID is provided and is a valid positive integer
    if (
      !fid ||
      isNaN(Number(fid)) ||
      Number(fid) <= 0 ||
      !Number.isInteger(Number(fid))
    ) {
      return NextResponse.json(
        { error: 'Invalid fid - must be a positive integer' },
        { status: 400 }
      );
    }

    const fidNum = Number(fid);

    // 4. Check rate limit for sharing
    const rateLimitResult = await RateLimiter.checkRateLimit(
      `share-rank:${fidNum}`,
      10, // 10 shares per hour max
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
    const fidExists = await SecurityService.verifyFidExists(fidNum.toString());
    if (!fidExists) {
      console.error('Invalid FID - does not exist on Farcaster:', fidNum);
      return NextResponse.json({ error: 'Invalid FID' }, { status: 400 });
    }

    // 6. Check if player exists in our system
    const player = await supabaseService.getPlayerByFid(fidNum);
    if (!player || player.length === 0) {
      return NextResponse.json(
        { error: 'Player not found - please ensure you are registered' },
        { status: 404 }
      );
    }

    // 7. Check daily points limit (sharing gives 1 point)
    const dailyLimitResult = await RateLimiter.checkDailyPointsLimit(
      fidNum,
      1,
      10000 // 10,000 points per day limit
    );

    if (!dailyLimitResult.success) {
      return NextResponse.json(
        {
          error: 'Daily points limit exceeded',
          limit: dailyLimitResult.limit,
          remaining: dailyLimitResult.remaining,
          resetAt: dailyLimitResult.reset,
        },
        { status: 429 }
      );
    }

    // 8. Award the point
    await supabaseService.incrementPlayerPoints(fidNum, 1);

    return NextResponse.json({
      success: true,
      pointsAwarded: 1,
      dailyPointsRemaining: dailyLimitResult.remaining,
    });
  } catch (error) {
    console.error('Error awarding share points:', error);
    return NextResponse.json(
      { error: 'Failed to award points' },
      { status: 500 }
    );
  }
}
