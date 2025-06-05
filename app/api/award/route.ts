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
    const { userId, buildId, score } = await request.json();

    console.log('userId', userId);
    console.log('buildId', buildId);
    console.log('score', score);

    if (!userId || !buildId || typeof score !== 'number') {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400, headers }
      );
    }

    // First, check if the build exists
    const { data: buildExists, error: buildCheckError } = await supabaseService
      .from('builds')
      .select('id')
      .eq('id', buildId)
      .single();

    if (buildCheckError || !buildExists) {
      console.error('Build not found:', buildId, buildCheckError);
      return NextResponse.json(
        { error: 'Build not found' },
        { status: 404, headers }
      );
    }

    // Then, save the score to the scores table
    const { error: scoreError } = await supabaseService.from('scores').insert([
      {
        fid: userId,
        build_id: buildId,
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

    // Then, increment the player's points
    try {
      await supabaseService.incrementPlayerPoints(Number(userId), 1);
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
