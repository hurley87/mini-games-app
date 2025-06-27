import { NextResponse } from 'next/server';
import { supabaseService } from '@/lib/supabase';
import { RateLimiter } from '@/lib/rate-limit';
import { SecurityService } from '@/lib/security';
import { fetchUser } from '@/lib/neynar';

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

    const { coinId, score } = await request.json();

    // 3. Basic input validation
    if (
      !authenticatedFid ||
      !coinId ||
      typeof score !== 'number' ||
      !Number.isFinite(score) ||
      score < 0
    ) {
      return NextResponse.json(
        { error: 'Missing required fields or invalid score' },
        { status: 400, headers }
      );
    }

    // 4. Verify FID exists on Farcaster
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

    // Check user's Farcaster score
    const user = await fetchUser(authenticatedFid.toString());
    if (!user || user.score < 0.3) {
      return NextResponse.json(
        { error: "User's Farcaster score is too low to earn points." },
        { status: 403, headers }
      );
    }

    // 4.5 Ensure the player exists in the database to prevent FK violations
    const existingPlayer =
      await supabaseService.getPlayerByFid(authenticatedFid);
    if (!existingPlayer || existingPlayer.length === 0) {
      console.error('Player not found in database:', authenticatedFid);
      return NextResponse.json(
        {
          error:
            'Player profile not found. Please register before earning points.',
        },
        { status: 404, headers }
      );
    }

    // 5. Check general rate limit
    const rateLimitResult = await RateLimiter.checkRateLimit(
      `award:${authenticatedFid}`,
      50, // 50 requests per hour
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

    // 7. Verify the game exists and get coin data
    // Try to find by ID first, then by coin_address if that fails
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

    // 7.5. Check daily play limit before any state changes
    const maxAllowedPlays = coin.max_plays || 3;
    const currentDailyPlays = await supabaseService.getDailyPlayCount(
      authenticatedFid,
      coinId
    );

    if (currentDailyPlays >= maxAllowedPlays) {
      return NextResponse.json(
        {
          error: 'Daily play limit exceeded for this game',
          limit: maxAllowedPlays,
          remaining: Math.max(0, maxAllowedPlays - currentDailyPlays),
          currentPlays: currentDailyPlays,
        },
        { status: 429, headers }
      );
    }

    // 8. Check daily points limit before any database writes
    const dailyLimitResult = await RateLimiter.checkDailyPointsLimit(
      authenticatedFid,
      score,
      1000 // 1,000 points per day limit
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

    // 9. Increment the player's points
    try {
      await supabaseService.incrementPlayerPoints(
        Number(authenticatedFid),
        score
      );
    } catch (error) {
      // Points increment failed
      console.error('Error updating points:', {
        error,
        authenticatedFid,
        score,
      });

      return NextResponse.json(
        { error: 'Failed to update points' },
        { status: 500, headers }
      );
    }

    // 10. After successful points award, increment daily play count
    const playCountResult =
      await supabaseService.incrementDailyPlayCountIfAllowed(
        authenticatedFid,
        coinId,
        maxAllowedPlays
      );

    if (!playCountResult.success) {
      console.error(
        'Failed to increment play count after successful point award:',
        {
          authenticatedFid,
          coinId,
          playCountResult,
        }
      );
      // Note: Points were already awarded, so we don't return an error here
      // This is a logging issue that should be monitored
    }

    // 11. Save the score to the scores table (after successful point increment)
    const { error: scoreError } = await supabaseService.from('scores').insert([
      {
        fid: authenticatedFid,
        coin_id: coinId,
        score,
        created_at: new Date().toISOString(),
      },
    ]);

    if (scoreError) {
      // This is a non-critical error, as the user has received their points.
      // We should log it for monitoring.
      console.error('Failed to save score log after awarding points:', {
        scoreError,
        fid: authenticatedFid,
        coinId,
        score,
      });
    }

    // 12. Record the game play (after successful score save) - only for first-time players
    const gamePlay = await supabaseService.getGamePlayRecord(
      authenticatedFid,
      coinId
    );
    console.log('gamePlay', gamePlay);
    if (!gamePlay) {
      try {
        await supabaseService.recordGamePlay({
          fid: authenticatedFid,
          game_id: coinId,
          coin_address: coin.coin_address,
          created_at: new Date().toISOString(),
        });
      } catch (error) {
        console.error('Failed to record game play (non-critical):', error);
        // This is non-critical - user has already received points and score was saved
      }
    }

    // Calculate final play count values
    const finalCurrentPlays = playCountResult.success
      ? playCountResult.currentPlays
      : currentDailyPlays + 1; // If increment failed, estimate the count
    const finalPlaysRemaining = Math.max(
      0,
      maxAllowedPlays - finalCurrentPlays
    );

    return NextResponse.json(
      {
        success: true,
        score,
        dailyPointsRemaining: dailyLimitResult.remaining,
        playsRemaining: finalPlaysRemaining,
        maxDailyPlays: maxAllowedPlays,
        currentDailyPlays: finalCurrentPlays,
        playRecorded: playCountResult.success,
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
    console.error('Error in award endpoint:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500, headers }
    );
  }
}
