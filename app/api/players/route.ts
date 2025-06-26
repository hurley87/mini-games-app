import { NextResponse } from 'next/server';
import { supabaseService } from '@/lib/supabase';
import { SecurityService } from '@/lib/security';

export async function POST(request: Request) {
  try {
    const userData = await request.json();

    let authenticatedFid = userData.fid;

    try {
      authenticatedFid = parseInt(request.headers.get('x-user-fid') || '0');
    } catch (error) {
      console.error('Error requiring auth:', error);
      // return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

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

    // Validate required fields
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
