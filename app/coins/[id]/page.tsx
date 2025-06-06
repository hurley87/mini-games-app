import { GameWrapper } from '@/app/components/game-wrapper';
import { supabaseService } from '@/lib/supabase';
import { Metadata } from 'next';

interface TokenPageProps {
  params: Promise<{
    id: string;
  }>;
}

export const dynamic = 'force-dynamic';

const appUrl = 'https://app.minigames.studio';

export async function generateMetadata({
  params,
}: TokenPageProps): Promise<Metadata> {
  const { id } = await params;
  const coin = await supabaseService.getCoinById(id);

  try {
    const frame = {
      version: 'next',
      imageUrl: coin.image || `${appUrl}/logo.png`,
      button: {
        title: `Play ${coin.name}, Earn $${coin.symbol}`,
        action: {
          type: 'launch_frame',
          name: coin.name,
          url: `${appUrl}/info/${id}`,
          splashImageUrl: `${appUrl}/splash.jpg`,
          splashBackgroundColor: '#000000',
        },
      },
    };

    return {
      title: `${coin.name}`,
      openGraph: {
        title: `${coin.name}`,
        description: 'View your game details.',
      },
      other: {
        'fc:frame': JSON.stringify(frame),
      },
    };
  } catch (error) {
    // Return a default frame for non-existent tokens
    console.error('Error fetching token metadata:', error);
    const frame = {
      version: 'next',
      imageUrl: `${appUrl}/splash.jpg`,
      button: {
        title: 'View Token',
        action: {
          type: 'launch_frame',
          name: 'Token Not Found',
          url: `${appUrl}/info/${id}`,
          splashImageUrl: `${appUrl}/splash.jpg`,
          splashBackgroundColor: '#000000',
        },
      },
    };

    return {
      title: `Game #${id} Not Found`,
      openGraph: {
        title: `Game #${id} Not Found`,
        description: 'This game does not exist or has been burned.',
      },
      other: {
        'fc:frame': JSON.stringify(frame),
      },
    };
  }
}

export default async function GamePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const coin = await supabaseService.getCoinById(id);
  const coinAddress = coin.coin_address;
  const buildId = coin.build_id;
  const build = await supabaseService.getBuildById(buildId);

  // Fetch creator information
  let creator = null;
  try {
    const creatorResult = await supabaseService.getCreatorByFID(coin.fid);
    creator = creatorResult[0] || null;
  } catch (error) {
    console.error(`Failed to fetch creator for coin ${coin.fid}:`, error);
  }

  return (
    <GameWrapper
      id={buildId}
      symbol={coin.symbol}
      name={coin.name}
      description={build.tutorial || 'An exciting game to play!'}
      coinAddress={coinAddress}
      imageUrl={coin.image}
      zoraData={coin.zoraData}
      fid={coin.fid}
      creator={creator}
      coinId={coin.id}
    />
  );
}
