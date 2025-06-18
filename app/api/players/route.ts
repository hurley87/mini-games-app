import { NextResponse } from 'next/server';
import { supabaseService } from '@/lib/supabase';
import { FarcasterAuth } from '@/lib/auth';
import { SecurityService } from '@/lib/security';
import { RateLimiter } from '@/lib/rate-limit';

export async function POST(request: Request) {
  try {
    const authenticatedFid = await FarcasterAuth.requireAuth(request);

    const userData = await request.json();

    // Verify the FID from the request body matches the authenticated FID
    if (Number(userData.fid) !== authenticatedFid) {
      console.error('FID mismatch:', {
        requested: userData.fid,
        authenticated: authenticatedFid,
      });
      return NextResponse.json(
        { error: 'Unauthorized: FID mismatch' },
        { status: 403 }
      );
    }

    // Check rate limit
    const rateLimitResult = await RateLimiter.checkRateLimit(
      `players:${authenticatedFid}`,
      10, // 10 requests per hour
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

    // Validate required fields
    if (
      !userData.fid ||
      !userData.name ||
      !userData.pfp ||
      !userData.username
    ) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Verify FID exists on Farcaster
    const fidExists = await SecurityService.verifyFidExists(userData.fid);
    if (!fidExists) {
      console.error('Invalid FID - does not exist on Farcaster:', userData.fid);
      return NextResponse.json({ error: 'Invalid FID' }, { status: 400 });
    }

    const url = new URL(request.url);
    const includeNewFlag = url.searchParams.get('includeNewFlag') === 'true';

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
    if ((error as Error).message.includes('Unauthorized')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    console.error('Error creating player:', error);
    return NextResponse.json(
      { error: 'Failed to create player' },
      { status: 500 }
    );
  }
}
