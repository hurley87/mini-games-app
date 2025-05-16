import { supabaseService } from '@/lib/supabase';
import { Metadata } from 'next';
import Link from 'next/link';

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
  const game = await supabaseService.getGameById(id);

  try {
    const frame = {
      version: 'next',
      imageUrl: game.image || `${appUrl}/logo.png`,
      button: {
        title: `Play ${game.name}`,
        action: {
          type: 'launch_frame',
          name: game.name,
          url: `${appUrl}/info/${id}`,
          splashImageUrl: `${appUrl}/splash.jpg`,
          splashBackgroundColor: '#000000',
        },
      },
    };

    return {
      title: `${game.name}`,
      openGraph: {
        title: `${game.name}`,
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
  const game = await supabaseService.getGameById(id);
  return (
    <div className='flex flex-col items-center justify-center h-screen w-screen relative z-50'>
      <div className='flex flex-col items-center justify-center h-screen w-screen relative z-50 max-w-lg mx-auto gap-4 p-4'>
        <h1 className='text-2xl font-bold'>{game.name}</h1>
        <p className='text-sm text-gray-500 text-center'>{game.description}</p>
        <Link href="/games/d87ab2c1-94ca-49e1-8bd7-756bf848f2a6">
          <button className='bg-white text-black py-2 text-2xl rounded-full px-10'>Play</button>
        </Link>
      </div>
    </div>
  );
}