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
      // Import the Farcaster SDK
      let sdkModule;
      
      async function loadSDK() {
        if (!sdkModule) {
          sdkModule = await import('https://esm.sh/@farcaster/frame-sdk@latest');
        }
        return sdkModule.sdk;
      }
      
      window.awardPoints = async function(score) {
        try {
          // Load SDK and get authentication token
          const sdk = await loadSDK();

          const headers = { 
            'Content-Type': 'application/json'
          };
          
          const response = await sdk.quickAuth.fetch('${process.env.NEXT_PUBLIC_URL}/api/award', {
            method: 'POST',
            headers: headers,
            body: JSON.stringify({
              fid: ${fid},
              coinId: '${coinId}',
              score: score
            })
          });
          
          if (!response.ok) {
            const errorData = await response.json();
            console.error('Failed to award points:', errorData);
            
            // Show user-friendly error messages
            if (response.status === 429) {
              alert('You have reached your daily points limit. Try again tomorrow!');
            } else if (response.status === 401) {
              alert('Please sign in to earn points.');
            } else {
              alert('Failed to award points. Please try again.');
            }
          } else {
            const data = await response.json();
            if (window.parent && window.parent !== window) {
              window.parent.postMessage({ type: 'points-awarded', score }, '*');
            }
            
            // Show remaining daily points if available
            if (data.dailyPointsRemaining !== undefined) {
              console.log('Daily points remaining:', data.dailyPointsRemaining);
            }
          }
        } catch (error) {
          console.error('Error awarding points:', error);
          alert('Network error. Please check your connection and try again.');
        }
      };
      
      // Override game over to ensure game is recorded before awarding points
      const originalGameOver = window.gameOver;
      window.gameOver = async function() {
        // Record that the game was played
        try {
          const sdk = await loadSDK();
          
          const headers = { 
            'Content-Type': 'application/json'
          };
          
          if (authToken) {
            headers['Authorization'] = 'Bearer ' + authToken;
          }
          
          await sdk.quickAuth.fetch('${process.env.NEXT_PUBLIC_URL}/api/record-play', {
            method: 'POST',
            headers: headers,
            body: JSON.stringify({
              fid: ${fid},
              gameId: '${coinId}',
              coinAddress: '${coinAddress || ''}'
            })
          });
        } catch (error) {
          console.error('Failed to record game play:', error);
        }
        
        // Call original game over if it exists
        if (originalGameOver && typeof originalGameOver === 'function') {
          originalGameOver();
        }
        
        // Notify parent that game is over
        if (window.parent && window.parent !== window) {
          window.parent.postMessage({ type: 'game-over' }, '*');
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
