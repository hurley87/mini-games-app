import { NextResponse } from 'next/server';
import { supabaseService } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const { fid } = await request.json();

    if (fid === null || fid === undefined) {
      return NextResponse.json({ error: 'Missing fid' }, { status: 400 });
    }

    const fidNum = parseInt(fid as string, 10);
    if (isNaN(fidNum) || fidNum < 0) {
      return NextResponse.json(
        { error: 'Invalid fid - must be a non-negative number' },
        { status: 400 }
      );
    }

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
