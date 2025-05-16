import { NextResponse } from 'next/server';
import { supabaseService } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  // Add CORS headers
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };

  // Handle preflight requests
  if (request.method === 'OPTIONS') {
    return new NextResponse(null, { headers });
  }

  try {
    const { userId, gameId, score } = await request.json();

    if (!userId || !gameId || typeof score !== 'number') {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400, headers }
      );
    }

    // First, save the score to the scores table
    const { error: scoreError } = await supabaseService
      .from('scores')
      .insert([
        {
          user_id: userId,
          game_id: gameId,
          score: 1,
        },
      ]);

    if (scoreError) {
      console.error('Error saving score:', scoreError);
      return NextResponse.json(
        { error: 'Failed to save score' },
        { status: 500, headers }
      );
    }

    // Then, increment the user's points
    try {
      await supabaseService.incrementUserPoints(Number(userId), 1);
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