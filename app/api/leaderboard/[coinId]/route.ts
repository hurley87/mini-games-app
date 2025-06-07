import { NextResponse } from 'next/server';
import { supabaseService } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ coinId: string }> }
) {
  try {
    const { coinId } = await params;
    const url = new URL(request.url);
    const limit = url.searchParams.get('limit');

    if (!coinId) {
      return NextResponse.json(
        { error: 'Coin ID is required' },
        { status: 400 }
      );
    }

    const leaderboard = await supabaseService.getCoinLeaderboard(
      coinId,
      limit ? parseInt(limit) : undefined
    );

    return NextResponse.json(leaderboard);
  } catch (error) {
    console.error('Error fetching coin leaderboard:', error);
    return NextResponse.json(
      { error: 'Failed to fetch coin leaderboard' },
      { status: 500 }
    );
  }
}
