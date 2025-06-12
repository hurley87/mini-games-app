import { NextResponse } from 'next/server';
import { supabaseService } from '@/lib/supabase';
import { FarcasterAuth } from '@/lib/auth';
import { RateLimiter } from '@/lib/rate-limit';
import { SecurityService } from '@/lib/security';

export const dynamic = 'force-dynamic';

// Add CORS headers for preflight requests
export async function OPTIONS(request: Request) {
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
      // For now, continue without authentication but with stricter validation
    }

    const { fid, coinId, score } = await request.json();

    // 2. If authenticated, verify the FID matches
    if (authenticatedFid && fid !== authenticatedFid) {
      console.error('FID mismatch:', {
        requested: fid,
        authenticated: authenticatedFid,
      });
      return NextResponse.json(
        { error: 'Unauthorized: FID mismatch' },
        { status: 403, headers }
      );
    }

    // 3. Basic input validation
    if (
      !fid ||
      !coinId ||
      typeof score !== 'number' ||
      !Number.isFinite(score) ||
      score <= 0
    ) {
      return NextResponse.json(
        { error: 'Missing required fields or invalid score' },
        { status: 400, headers }
      );
    }

    // 4. Verify FID exists on Farcaster
    const fidExists = await SecurityService.verifyFidExists(fid);
    if (!fidExists) {
      console.error('Invalid FID - does not exist on Farcaster:', fid);
      return NextResponse.json(
        { error: 'Invalid FID' },
        { status: 400, headers }
      );
    }

    // 5. Check general rate limit
    const rateLimitResult = await RateLimiter.checkRateLimit(
      `award:${fid}`,
      60, // 60 requests per hour
      3600 // 1 hour window
    );

    if (!rateLimitResult.success) {
      return NextResponse.json(
        {
          error: 'Rate limit exceeded',
          retryAfter: rateLimitResult.reset,
        },
        {
          status: 429,
          headers: {
            ...headers,
            'X-RateLimit-Limit': rateLimitResult.limit.toString(),
            'X-RateLimit-Remaining': rateLimitResult.remaining.toString(),
            'X-RateLimit-Reset': rateLimitResult.reset.toString(),
          },
        }
      );
    }

    // 6. Validate score for the specific game
    const isValidScore = await SecurityService.validateScore(score, coinId);
    if (!isValidScore) {
      return NextResponse.json(
        { error: 'Invalid score for this game' },
        { status: 400, headers }
      );
    }

    // 7. Check daily points limit
    const dailyLimitResult = await RateLimiter.checkDailyPointsLimit(
      fid,
      score,
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
        { status: 429, headers }
      );
    }

    // 8. Verify the game exists
    const { data: coinExists, error: coinCheckError } = await supabaseService
      .from('coins')
      .select('id')
      .eq('id', coinId)
      .single();

    if (coinCheckError || !coinExists) {
      console.error('Coin not found:', coinId, coinCheckError);
      return NextResponse.json(
        { error: 'Coin not found' },
        { status: 404, headers }
      );
    }

    // 9. Verify the player has actually played the game
    const hasPlayed = await SecurityService.verifyGamePlay(fid, coinId);
    if (!hasPlayed) {
      console.error('Player has not played this game:', { fid, coinId });
      return NextResponse.json(
        { error: 'Must play the game before earning points' },
        { status: 400, headers }
      );
    }

    // 10. Save the score to the scores table
    const { error: scoreError } = await supabaseService.from('scores').insert([
      {
        fid,
        coin_id: coinId,
        score,
        created_at: new Date().toISOString(),
      },
    ]);

    if (scoreError) {
      console.error('Error saving score:', scoreError);
      return NextResponse.json(
        { error: 'Failed to save score' },
        { status: 500, headers }
      );
    }

    // 11. Increment the player's points
    try {
      await supabaseService.incrementPlayerPoints(Number(fid), score);
    } catch (error) {
      console.error('Error updating points:', error);
      return NextResponse.json(
        { error: 'Failed to update points' },
        { status: 500, headers }
      );
    }

    return NextResponse.json(
      {
        success: true,
        score,
        dailyPointsRemaining: dailyLimitResult.remaining,
      },
      { headers }
    );
  } catch (error) {
    console.error('Error in award endpoint:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500, headers }
    );
  }
}
