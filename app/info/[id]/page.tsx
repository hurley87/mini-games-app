import { GameWrapper } from '@/app/components/game-wrapper';
import { supabaseService } from '@/lib/supabase';
import { Metadata } from 'next';

interface InfoPageProps {
  params: Promise<{
    id: string;
  }>;
}

export const dynamic = 'force-dynamic';

const appUrl = 'https://app.minigames.studio';

export async function generateMetadata({
  params,
}: InfoPageProps): Promise<Metadata> {
  const { id } = await params;
  const coin = await supabaseService.getCoinById(id);
  const buildId = coin.build_id;
  const build = await supabaseService.getBuildById(buildId);

  try {
    const frame = {
      version: 'next',
      imageUrl: coin.image || `${appUrl}/logo.png`,
      button: {
        title: `Play ${coin.name}`,
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
        description: build.tutorial || 'An exciting mini game to!',
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
        title: 'View Game',
        action: {
          type: 'launch_frame',
          name: 'Game Not Found',
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

export default async function InfoPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const coin = await supabaseService.getCoinById(id);
  const coinAddress = coin.coin_address;
  const buildId = coin.build_id;
  console.log('buildId', buildId);
  const build = await supabaseService.getBuildById(buildId);

  console.log('build', build);

  return (
    <GameWrapper
      id={buildId}
      name={coin.name}
      description={build.tutorial || 'An exciting mini to play!'}
      coinAddress={coinAddress}
    />
  );
}
