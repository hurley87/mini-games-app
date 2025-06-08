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

    // Check if referred player already exists
    const existingPlayer = await supabaseService.getPlayerByFid(Number(playerFid));

    if (existingPlayer && existingPlayer.length > 0) {
      return NextResponse.json({ awarded: false });
    }

    // Fetch sharer to get internal id
    const sharer = await supabaseService.getPlayerByFid(Number(sharerFid));
    const sharerId = sharer?.[0]?.id;
    if (!sharerId) {
      return NextResponse.json({ error: 'Sharer not found' }, { status: 404 });
    }

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
