import { NextResponse } from 'next/server';
import { supabaseService } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const leaderboard = await supabaseService.getPlayerLeaderboard();
    return NextResponse.json(leaderboard);
  } catch (error) {
    console.error('Error fetching leaderboard:', error);
    return NextResponse.json(
      { error: 'Failed to fetch leaderboard' },
      { status: 500 }
    );
  }
}
