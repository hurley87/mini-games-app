import { NextRequest, NextResponse } from 'next/server';
import { supabaseService } from '@/lib/supabase';
import { TOKEN_MULTIPLIER } from '@/lib/config';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const fid = searchParams.get('fid');
    const coinId = searchParams.get('coinId');

    if (!fid || !coinId) {
      return NextResponse.json(
        { error: 'Missing required parameters: fid, coinId' },
        { status: 400 }
      );
    }

    // Fetch pending scores for this player and coin
    const { data: pendingScores, error } = await supabaseService
      .from('scores')
      .select('score')
      .eq('fid', parseInt(fid))
      .eq('coin_id', coinId)
      .eq('status', 'pending');

    if (error) {
      console.error('Error fetching pending scores:', error);
      return NextResponse.json(
        { error: 'Failed to fetch pending rewards' },
        { status: 500 }
      );
    }

    // Calculate total pending score
    const totalPendingScore =
      pendingScores?.reduce((sum, score) => sum + (score.score || 0), 0) || 0;

    // Calculate pending tokens (score * multiplier)
    const pendingTokens = totalPendingScore * TOKEN_MULTIPLIER;

    // Get coin info for symbol
    const { data: coin } = await supabaseService
      .from('coins')
      .select('symbol')
      .eq('id', coinId)
      .single();

    return NextResponse.json({
      totalPendingScore,
      pendingTokens,
      coinId,
      symbol: coin?.symbol || 'UNKNOWN',
    });
  } catch (error) {
    console.error('Error in pending-rewards API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
