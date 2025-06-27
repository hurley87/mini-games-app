/* eslint-disable react/no-unknown-property */
import { env } from '@/lib/env';

import { ImageResponse } from 'next/og';
import { supabaseService } from '@/lib/supabase';

// Force dynamic rendering to ensure fresh image generation on each request
export const dynamic = 'force-dynamic';
export const revalidate = 0;

// Define the dimensions for the generated OpenGraph image (3:2 aspect ratio)
const size = {
  width: 1200,
  height: 800,
};

/**
 * GET handler for generating dynamic OpenGraph images for coins
 * @param request - The incoming HTTP request
 * @param params - Route parameters containing the coinId
 * @returns ImageResponse - A dynamically generated image for OpenGraph
 */
export async function GET(
  request: Request,
  {
    params,
  }: {
    params: Promise<{
      coinId: string;
    }>;
  }
) {
  try {
    // Extract the coinId from the route parameters
    const { coinId } = await params;

    if (!coinId) {
      return new Response('Missing coinId parameter', { status: 400 });
    }

    // Fetch coin data
    const coin = await supabaseService.getCoinById(coinId);

    if (!coin) {
      return new Response('Coin not found', { status: 404 });
    }

    // Get the application's base URL from environment variables
    const appUrl = env.NEXT_PUBLIC_URL;

    // Use image URLs directly to avoid caching large base64 data
    let backgroundImage: string;
    try {
      if (coin.image) {
        backgroundImage = coin.image;
      } else {
        // Try to get image from associated build
        const build = await supabaseService.getBuildById(coin.build_id);
        if (build?.image) {
          backgroundImage = build.image;
        } else if (appUrl) {
          backgroundImage = `${appUrl}/logo.png`;
        } else {
          // Fall back to gradient if no appUrl is available
          backgroundImage = 'linear-gradient(45deg, #000, #222)';
        }
      }
    } catch (error) {
      console.error(
        'Failed to get image URLs, using gradient fallback:',
        error
      );
      backgroundImage = 'linear-gradient(45deg, #000, #222)';
    }

    // Calculate max earning potential
    const maxEarn =
      coin.max_points != null && coin.token_multiplier != null
        ? coin.max_points * coin.token_multiplier
        : null;

    // Generate and return the image response with the composed elements
    return new ImageResponse(
      (
        <div
          style={{
            height: '100%',
            width: '100%',
            display: 'flex',
            position: 'relative',
            backgroundImage:
              backgroundImage.startsWith('http') ||
              backgroundImage.startsWith('data:')
                ? `url(${backgroundImage})`
                : backgroundImage,
            backgroundSize: '100% 100%',
            backgroundRepeat: 'no-repeat',
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
              background:
                'linear-gradient(to top, rgba(0,0,0,0.8) 0%, transparent 40%, transparent 60%, rgba(0,0,0,0.3) 100%)',
            }}
          />

          {/* Centered text showing combined earning and duration info */}
          {(maxEarn != null || coin.duration != null) && (
            <div
              style={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                textAlign: 'center',
              }}
            >
              <div
                style={{
                  backgroundColor: 'rgba(0,0,0,0.7)',
                  borderRadius: 24,
                  padding: '32px 48px',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: 8,
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    color: '#ffffff',
                    fontSize: 56,
                    fontWeight: 900,
                    textAlign: 'center',
                    lineHeight: 1.1,
                  }}
                >
                  {maxEarn != null && coin.duration != null
                    ? `Earn ${maxEarn.toLocaleString()}${
                        coin.symbol ? ` $${coin.symbol}` : ''
                      } in ${coin.duration}s`
                    : maxEarn != null
                      ? `Earn ${maxEarn.toLocaleString()}${
                          coin.symbol ? ` $${coin.symbol}` : ''
                        }`
                      : coin.duration != null
                        ? `Play for ${coin.duration}s`
                        : ''}
                </div>
              </div>
            </div>
          )}
        </div>
      ),
      {
        ...size,
      }
    );
  } catch (e) {
    // Log and handle any errors during image generation
    console.log(`Failed to generate coin OG image:`, e);
    console.log('request', request);
    return new Response(`Failed to generate coin OG image`, {
      status: 500,
    });
  }
}
