import { NextResponse } from 'next/server';
import { supabaseService } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

// Handle preflight OPTIONS request
export async function OPTIONS() {
  return new Response(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}

export async function POST(request: Request) {
  // Add CORS headers
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };

  try {
    const { fid, coinId, score } = await request.json();

    if (
      !fid ||
      !coinId ||
      typeof score !== 'number' ||
      !Number.isFinite(score) ||
      score <= 0
    ) {
      return NextResponse.json(
        { error: 'Missing required fields or invalid score' },
        { status: 400, headers }
      );
    }

    // First, check if the build exists
    const { data: coinExists, error: coinCheckError } = await supabaseService
      .from('coins')
      .select('id')
      .eq('id', coinId)
      .single();

    if (coinCheckError || !coinExists) {
      console.error('Coin not found:', coinId, coinCheckError);
      return NextResponse.json(
        { error: 'Coin not found' },
        { status: 404, headers }
      );
    }

    // Then, save the score to the scores table
    const { error: scoreError } = await supabaseService.from('scores').insert([
      {
        fid,
        coin_id: coinId,
        score,
      },
    ]);

    if (scoreError) {
      console.error('Error saving score:', scoreError);
      return NextResponse.json(
        { error: 'Failed to save score' },
        { status: 500, headers }
      );
    }

    // Then, increment the player's points
    try {
      await supabaseService.incrementPlayerPoints(Number(fid), score);
    } catch (error) {
      console.error('Error updating points:', error);
      return NextResponse.json(
        { error: 'Failed to update points' },
        { status: 500, headers }
      );
    }

    return NextResponse.json({ success: true }, { headers });
  } catch (error) {
    console.error('Error in award endpoint:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500, headers }
    );
  }
}
