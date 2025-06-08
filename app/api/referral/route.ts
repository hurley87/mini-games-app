import { NextResponse } from 'next/server';
import { supabaseService } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const { sharerFid, playerFid } = await request.json();

    if (!sharerFid || !playerFid) {
      return NextResponse.json(
        { error: 'Missing sharerFid or playerFid' },
        { status: 400 }
      );
    }

    // Prevent self-referral
    if (sharerFid === playerFid) {
      return NextResponse.json(
        { error: 'Cannot refer yourself' },
        { status: 400 }
      );
    }

    // Fetch sharer to get internal id
    const sharer = await supabaseService.getPlayerByFid(Number(sharerFid));
    const sharerId = sharer?.[0]?.id;
    if (!sharerId) {
      return NextResponse.json({ error: 'Sharer not found' }, { status: 404 });
    }

    // Verify referred player exists (they should since /api/players was called first)
    const referredPlayer = await supabaseService.getPlayerByFid(
      Number(playerFid)
    );
    if (!referredPlayer || referredPlayer.length === 0) {
      return NextResponse.json(
        { error: 'Referred player not found' },
        { status: 404 }
      );
    }

    // Award referral points to the sharer
    await supabaseService.incrementPlayerPoints(sharerId, 5);

    return NextResponse.json({ awarded: true });
  } catch (error) {
    console.error('Error processing referral:', error);
    return NextResponse.json(
      { error: 'Failed to process referral' },
      { status: 500 }
    );
  }
}
