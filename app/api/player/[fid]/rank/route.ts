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

    const playerRank = await supabaseService.getPlayerRankByFid(fid);

    if (!playerRank) {
      return NextResponse.json({ error: 'Player not found' }, { status: 404 });
    }

    return NextResponse.json(playerRank);
  } catch (error) {
    console.error('Error fetching player rank:', error);
    return NextResponse.json(
      { error: 'Failed to fetch player rank' },
      { status: 500 }
    );
  }
}
