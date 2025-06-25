import { Header } from '@/components/header';
import { CoinsList } from '@/components/coins-list';
import { BottomNav } from '@/components/bottom-nav';
import type { Metadata } from 'next';

export async function generateMetadata(): Promise<Metadata> {
  const URL = process.env.NEXT_PUBLIC_URL;

  const frame = {
    version: 'next',
    imageUrl: 'https://app.minigames.studio/hero.png',
    button: {
      title: `Launch Mini Games`,
      action: {
        type: 'launch_frame',
        name: 'Mini Games',
        url: URL,
        splashImageUrl: 'https://app.minigames.studio/splash.png',
        splashBackgroundColor: '#000000',
      },
    },
  };

  return {
    title: 'Mini Games',
    description: 'Play Mini Games',
    other: {
      'fc:frame': JSON.stringify(frame),
    },
  };
}

export default function Page() {
  return (
    <div className="max-w-lg mx-auto min-h-screen flex flex-col bg-gradient-to-b from-black via-zinc-900 to-black text-white pb-20">
      <Header />
      <CoinsList />
      <BottomNav />
    </div>
  );
}
