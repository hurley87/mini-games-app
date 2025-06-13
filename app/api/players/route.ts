import { NextResponse } from 'next/server';
import { supabaseService } from '@/lib/supabase';
import { FarcasterAuth } from '@/lib/auth';
import { SecurityService } from '@/lib/security';
import { RateLimiter } from '@/lib/rate-limit';

export async function POST(request: Request) {
  try {
    // 1. Verify authentication (optional until SDK is upgraded to 0.0.61+)
    let authenticatedFid: number | undefined;
    try {
      authenticatedFid = await FarcasterAuth.requireAuth(request);
      console.log('authenticatedFid', authenticatedFid);
    } catch (error) {
      console.warn(
        'Authentication failed (optional until SDK upgrade):',
        error
      );
      // TODO: Make authentication mandatory when SDK is upgraded to 0.0.61+
    }

    const userData = await request.json();
    if (process.env.NODE_ENV !== 'production') {
      console.log('userData', userData);
    }

    // 2. If authenticated, verify the FID matches
    if (authenticatedFid && Number(userData.fid) !== authenticatedFid) {
      console.error('FID mismatch:', {
        requested: userData.fid,
        authenticated: authenticatedFid,
      });
      return NextResponse.json(
        { error: 'Unauthorized: FID mismatch' },
        { status: 403 }
      );
    }

    // 3. Check rate limit
    const rateLimitResult = await RateLimiter.checkRateLimit(
      `players:${authenticatedFid}`,
      10, // 10 requests per hour (player creation should be rare)
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

    // 4. Validate required fields
    if (
      !userData.fid ||
      !userData.name ||
      !userData.pfp ||
      !userData.username ||
      !userData.wallet_address
    ) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // 5. Verify FID exists on Farcaster
    const fidExists = await SecurityService.verifyFidExists(userData.fid);
    if (!fidExists) {
      console.error('Invalid FID - does not exist on Farcaster:', userData.fid);
      return NextResponse.json({ error: 'Invalid FID' }, { status: 400 });
    }

    // 6. Check if we need to return new player flag
    const url = new URL(request.url);
    const includeNewFlag = url.searchParams.get('includeNewFlag') === 'true';
    console.log('includeNewFlag', includeNewFlag);

    if (includeNewFlag) {
      const result = await supabaseService.upsertPlayerWithNewFlag(userData);
      return NextResponse.json({
        data: result.data,
        isNew: result.isNew,
      });
    } else {
      const data = await supabaseService.upsertPlayer(userData);
      return NextResponse.json(data);
    }
  } catch (error) {
    console.error('Error upserting user:', error);
    return NextResponse.json(
      { error: 'Failed to upsert user' },
      { status: 500 }
    );
  }
}
