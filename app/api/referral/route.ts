import { NextResponse } from 'next/server';
import { supabaseService } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const { sharerFid, playerFid } = await request.json();

    // Validate that both FIDs are provided and are valid positive integers
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

    // Prevent self-referral
    if (sharerFidNum === playerFidNum) {
      return NextResponse.json(
        { error: 'Cannot refer yourself' },
        { status: 400 }
      );
    }

    // Verify sharer exists
    const sharer = await supabaseService.getPlayerByFid(sharerFidNum);
    if (!sharer || sharer.length === 0) {
      return NextResponse.json({ error: 'Sharer not found' }, { status: 404 });
    }

    // Verify referred player exists (they should since /api/players was called first)
    const referredPlayer = await supabaseService.getPlayerByFid(playerFidNum);
    if (!referredPlayer || referredPlayer.length === 0) {
      return NextResponse.json(
        { error: 'Referred player not found' },
        { status: 404 }
      );
    }

    // Award referral points to the sharer using the FID
    await supabaseService.incrementPlayerPoints(Number(sharer[0].fid), 5);

    return NextResponse.json({ awarded: true });
  } catch (error) {
    console.error('Error processing referral:', error);
    return NextResponse.json(
      { error: 'Failed to process referral' },
      { status: 500 }
    );
  }
}
