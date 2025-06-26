import { GameWrapper } from '@/components/game-wrapper';
import { supabaseService } from '@/lib/supabase';
import { Metadata } from 'next';

interface TokenPageProps {
  params: Promise<{
    id: string;
  }>;
}

const appUrl = process.env.NEXT_PUBLIC_URL!;

export async function generateMetadata({
  params,
}: TokenPageProps): Promise<Metadata> {
  const { id } = await params;
  const coin = await supabaseService.getCoinById(id);

  // Ensure all URLs are absolute for Farcaster frames
  const imageUrl = coin.image?.startsWith('http')
    ? coin.image
    : `${appUrl}/logo.png`;

  const frame = {
    version: 'next',
    imageUrl,
    button: {
      title: `Play ${coin.name}, Earn $${coin.symbol}`,
      action: {
        type: 'launch_frame',
        name: coin.name,
        url: `${appUrl}/coins/${id}`,
        splashImageUrl: `${appUrl}/splash.png`,
        splashBackgroundColor: '#000000',
      },
    },
  };

  return {
    title: `${coin.name}`,
    openGraph: {
      title: `${coin.name}`,
      description: coin.description,
      images: [
        {
          url: imageUrl,
        },
      ],
    },
    other: {
      'fc:frame': JSON.stringify(frame),
    },
  };
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
    <div>
      <GameWrapper
        id={buildId}
        symbol={coin.symbol}
        name={coin.name}
        description={build.tutorial || 'An exciting game to play!'}
        coinAddress={coinAddress}
        imageUrl={coin.image}
        fid={coin.fid}
        creator={creator}
        coinId={coin.id}
        timeoutSeconds={coin.duration || 10}
      />
    </div>
  );
}
