import { NextResponse } from 'next/server';
import { supabaseService } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

export async function GET(
  request: Request,
  { params }: { params: { fid: string } }
) {
  try {
    const fid = parseInt(params.fid);

    if (isNaN(fid)) {
      return NextResponse.json(
        { error: 'Invalid FID provided' },
        { status: 400 }
      );
    }

    const players = await supabaseService.getPlayerByFid(fid);

    if (!players || players.length === 0) {
      return NextResponse.json({ error: 'Player not found' }, { status: 404 });
    }

    return NextResponse.json(players[0]);
  } catch (error) {
    console.error('Error fetching player:', error);
    return NextResponse.json(
      { error: 'Failed to fetch player' },
      { status: 500 }
    );
  }
}
