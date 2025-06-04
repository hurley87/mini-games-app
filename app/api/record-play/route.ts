import { NextRequest, NextResponse } from 'next/server';
import { supabaseService } from '@/lib/supabase';

export async function POST(request: NextRequest) {
  try {
    const { fid, gameId, coinAddress } = await request.json();

    if (!fid || !gameId || !coinAddress) {
      return NextResponse.json(
        { error: 'Missing required fields: fid, gameId, coinAddress' },
        { status: 400 }
      );
    }

    // Record the game play
    const gamePlay = await supabaseService.recordGamePlay({
      fid,
      game_id: gameId,
      coin_address: coinAddress,
    });

    return NextResponse.json({
      success: true,
      gamePlay,
    });
  } catch (error) {
    console.error('Error recording game play:', error);
    return NextResponse.json(
      { error: 'Failed to record game play' },
      { status: 500 }
    );
  }
}
