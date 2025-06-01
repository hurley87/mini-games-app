import { Game } from '@/app/components/game';
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
  const build = await supabaseService.getBuildById(id);

  try {
    const frame = {
      version: 'next',
      imageUrl: build.image || `${appUrl}/logo.png`,
      button: {
        title: `Play ${build.name}`,
        action: {
          type: 'launch_frame',
          name: build.name,
          url: `${appUrl}/info/${id}`,
          splashImageUrl: `${appUrl}/splash.jpg`,
          splashBackgroundColor: '#000000',
        },
      },
    };

    return {
      title: `${build.name}`,
      openGraph: {
        title: `${build.name}`,
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
  const build = await supabaseService.getBuildById(id);
  const coinAddress = build.coin_address;

  return (
    <div className="">
      <Game id={id} coinAddress={coinAddress} />
    </div>
  );
}
