import { supabaseService } from '@/lib/supabase';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const searchParams = request.nextUrl.searchParams;
  const fid = searchParams.get('fid');
  const coinId = searchParams.get('coinId');
  const coinAddress = searchParams.get('coinAddress');

  if (process.env.NODE_ENV !== 'production') {
    console.log('id', id);
    console.log('fid', fid);
    console.log('coinId', coinId);
    console.log('coinAddress', coinAddress);
  }

  if (!id) {
    return NextResponse.json({ error: 'Missing build ID' }, { status: 400 });
  }

  if (!fid) {
    return NextResponse.json({ error: 'Missing FID' }, { status: 400 });
  }

  if (!coinId) {
    return NextResponse.json({ error: 'Missing coinId' }, { status: 400 });
  }

  try {
    const build = await supabaseService.getBuildById(id);

    if (!build) {
      return NextResponse.json({ error: 'Build not found' }, { status: 404 });
    }

    if (process.env.NODE_ENV !== 'production') {
      console.log('process.env.NEXT_PUBLIC_URL', process.env.NEXT_PUBLIC_URL);
    }

    const injectedScript = `
    <script>
      window.awardPoints = async function(score) {
        try {
            if (window.parent && window.parent !== window) {
              window.parent.postMessage({ type: 'points-awarded', score }, '*');
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
