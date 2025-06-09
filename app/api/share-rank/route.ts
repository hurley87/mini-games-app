import { NextResponse } from 'next/server';
import { supabaseService } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const { fid } = await request.json();

    // Validate that FID is provided and is a valid positive integer
    if (
      !fid ||
      isNaN(Number(fid)) ||
      Number(fid) <= 0 ||
      !Number.isInteger(Number(fid))
    ) {
      return NextResponse.json(
        { error: 'Invalid fid - must be a positive integer' },
        { status: 400 }
      );
    }

    const fidNum = Number(fid);

    const player = await supabaseService.getPlayerByFid(fidNum);
    if (!player || player.length === 0) {
      return NextResponse.json(
        { error: 'Player not found - please ensure you are registered' },
        { status: 404 }
      );
    }

    await supabaseService.incrementPlayerPoints(fidNum, 1);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error awarding share points:', error);
    return NextResponse.json(
      { error: 'Failed to award points' },
      { status: 500 }
    );
  }
}
