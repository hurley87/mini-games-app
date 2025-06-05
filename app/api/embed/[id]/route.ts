import { supabaseService } from '@/lib/supabase';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  // Parse URL manually
  const url = new URL(request.url);
  const userId = url.searchParams.get('userId');
  const buildId = url.searchParams.get('buildId');

  // Debug logs
  console.log('API Route - Full URL:', request.url);
  console.log('API Route - Params:', params);
  console.log('API Route - URL Search Params:', url.searchParams.toString());
  console.log('API Route - userId:', userId);
  console.log('API Route - buildId:', buildId);

  // Validate required parameters
  if (!userId || !buildId) {
    return NextResponse.json(
      { error: 'Missing required parameters: userId and buildId are required' },
      { status: 400 }
    );
  }

  try {
    const build = await supabaseService.getBuildById(id);

    if (!build) {
      return NextResponse.json({ error: 'Build not found' }, { status: 404 });
    }

    console.log('process.env.NEXT_PUBLIC_URL', process.env.NEXT_PUBLIC_URL);

    const injectedScript = `
    <script>
      window.awardPoints = async function(score) {
        try {
          const response = await fetch('${process.env.NEXT_PUBLIC_URL}/api/award', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              userId: '${userId}',
              buildId: '${buildId}',
              score: score
            })
          });
          if (!response.ok) {
            console.error('Failed to award points:', await response.text());
          }
        } catch (error) {
          console.error('Error awarding points:', error);
        }
      };
    </script>
  `;

    const html = build.html.replace('</body>', `${injectedScript}</body>`);

    return new Response(html, {
      headers: { 'Content-Type': 'text/html' },
    });
  } catch (error) {
    console.error('Error fetching game:', error);
    return NextResponse.json(
      { error: 'Failed to fetch game' },
      { status: 500 }
    );
  }
}
