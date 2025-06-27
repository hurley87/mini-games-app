/* eslint-disable react/no-unknown-property */
import { ImageResponse } from '@vercel/og';
import { supabaseService } from '@/lib/supabase';
import { NextRequest } from 'next/server';

export const runtime = 'edge';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ coinId: string }> }
) {
  try {
    const { coinId } = await params;
    
    if (!coinId) {
      return new Response('Missing coinId parameter', { status: 400 });
    }

    // Fetch coin data
    const coin = await supabaseService.getCoinById(coinId);
    
    if (!coin) {
      return new Response('Coin not found', { status: 404 });
    }

    // Calculate max earning potential
    const maxEarn = coin.max_points && coin.token_multiplier 
      ? coin.max_points * coin.token_multiplier 
      : null;

    return new ImageResponse(
      <div
        style={{
          height: '100%',
          width: '100%',
          display: 'flex',
          position: 'relative',
          backgroundImage: coin.image ? `url(${coin.image})` : 'linear-gradient(45deg, #000, #222)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      >
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: 'linear-gradient(to top, rgba(0,0,0,0.8) 0%, transparent 40%, transparent 60%, rgba(0,0,0,0.3) 100%)',
            }}
          />
          
          <div
            style={{
              position: 'absolute',
              top: 32,
              left: 32,
              right: 32,
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'flex-start',
            }}
          >
            {coin.duration != null && (
              <div
                style={{
                  backgroundColor: 'rgba(0,0,0,0.6)',
                  borderRadius: 16,
                  padding: '12px 20px',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                }}
              >
                <div
                  style={{
                    color: 'rgba(255,255,255,0.8)',
                    fontSize: 18,
                    fontWeight: 500,
                    marginBottom: 4,
                  }}
                >
                  Duration
                </div>
                <div
                  style={{
                    color: 'white',
                    fontSize: 22,
                    fontWeight: 'bold',
                  }}
                >
                  {coin.duration}s
                </div>
              </div>
            )}

            {coin.premium_threshold != null && (
              <div
                style={{
                  backgroundColor: 'rgba(0,0,0,0.6)',
                  borderRadius: 16,
                  padding: '12px 20px',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                }}
              >
                <div
                  style={{
                    color: 'rgba(255,255,255,0.8)',
                    fontSize: 18,
                    fontWeight: 500,
                    marginBottom: 4,
                  }}
                >
                  Premium
                </div>
                <div
                  style={{
                    color: 'white',
                    fontSize: 22,
                    fontWeight: 'bold',
                  }}
                >
                  {coin.premium_threshold.toLocaleString()}
                </div>
              </div>
            )}
          </div>

          <div
            style={{
              position: 'absolute',
              bottom: 80,
              left: 32,
              right: 32,
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'flex-end',
            }}
          >
            {maxEarn != null && (
              <div
                style={{
                  backgroundColor: 'rgba(0,0,0,0.6)',
                  borderRadius: 16,
                  padding: '12px 20px',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                }}
              >
                <div
                  style={{
                    color: 'rgba(255,255,255,0.8)',
                    fontSize: 18,
                    fontWeight: 500,
                    marginBottom: 4,
                  }}
                >
                  Max Earn
                </div>
                <div
                  style={{
                    color: '#10b981',
                    fontSize: 22,
                    fontWeight: 'bold',
                  }}
                >
                  {maxEarn.toLocaleString()} {coin.symbol ? `$${coin.symbol}` : ''}
                </div>
              </div>
            )}

            {coin.token_multiplier != null && (
              <div
                style={{
                  backgroundColor: 'rgba(0,0,0,0.6)',
                  borderRadius: 16,
                  padding: '12px 20px',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                }}
              >
                <div
                  style={{
                    color: 'rgba(255,255,255,0.8)',
                    fontSize: 18,
                    fontWeight: 500,
                    marginBottom: 4,
                  }}
                >
                  Multiplier
                </div>
                <div
                  style={{
                    color: '#a855f7',
                    fontSize: 22,
                    fontWeight: 'bold',
                  }}
                >
                  {coin.token_multiplier}x
                </div>
              </div>
            )}
          </div>

          {coin.name && (
            <div
              style={{
                position: 'absolute',
                bottom: 32,
                left: 32,
                right: 32,
                display: 'flex',
                justifyContent: 'center',
              }}
            >
              <div
                style={{
                  color: 'white',
                  fontSize: 32,
                  fontWeight: 'bold',
                  textAlign: 'center',
                  textShadow: '0 2px 4px rgba(0,0,0,0.8)',
                }}
              >
                {coin.name}
              </div>
            </div>
          )}
        </div>,
      {
        width: 1200,
        height: 1200,
      }
    );
  } catch (error) {
    console.error('Error generating OG image:', error);
    return new Response('Failed to generate image', { status: 500 });
  }
}