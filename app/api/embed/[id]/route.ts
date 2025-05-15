import supabase from '@/lib/supabase';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  
  // Parse URL manually
  const url = new URL(request.url);
  const userId = url.searchParams.get('userId');
  const gameId = url.searchParams.get('gameId');

  // Debug logs
  console.log('API Route - Full URL:', request.url);
  console.log('API Route - Params:', params);
  console.log('API Route - URL Search Params:', url.searchParams.toString());
  console.log('API Route - userId:', userId);
  console.log('API Route - gameId:', gameId);

  // Validate required parameters
  if (!userId || !gameId) {
    return NextResponse.json(
      { error: 'Missing required parameters: userId and gameId are required' },
      { status: 400 }
    );
  }

  const { data: game, error } = await supabase
    .from('games')
    .select('react_code')
    .eq('id', id)
    .single();

  if (error || !game) {
    return NextResponse.json({ error: 'Game not found' }, { status: 404 });
  }

  const injectedScript = `
  <script>
    window.awardPoints = async function(score) {
      await fetch('/api/award', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: '${userId}',
          gameId: '${gameId}',
          score: score
        })
      });
    };
  </script>
`;

  const html = game.react_code.replace('</body>', `${injectedScript}</body>`);

  console.log('html', html);

  return new Response(html, {
    headers: { 'Content-Type': 'text/html' },
  });
} 