'use client';

import { Sparkles, Trophy } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { trackGameEvent } from '@/lib/posthog';

export function BottomNav() {
  const pathname = usePathname();

  const handleGamesNavigation = () => {
    trackGameEvent.navigationClick('games', 'bottom_nav');
  };

  const handleLeaderboardNavigation = () => {
    trackGameEvent.navigationClick('leaderboard', 'bottom_nav');
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-black/20 backdrop-blur-md border-t border-white/20 shadow-xl">
      <div className="max-w-lg mx-auto flex items-center justify-around py-6">
        <Link
          href="/"
          onClick={handleGamesNavigation}
          className={`flex flex-col items-center gap-1 px-4 py-2 rounded-2xl transition-all duration-200 ${
            pathname === '/'
              ? 'bg-purple-600/20 text-purple-400'
              : 'text-white/70 hover:text-white hover:brightness-110'
          }`}
        >
          <Sparkles className="w-5 h-5" />
          <span className="text-xs font-medium">Games</span>
        </Link>

        <Link
          href="/leaderboard"
          onClick={handleLeaderboardNavigation}
          className={`flex flex-col items-center gap-1 px-4 py-2 rounded-2xl transition-all duration-200 ${
            pathname === '/leaderboard'
              ? 'bg-purple-600/20 text-purple-400'
              : 'text-white/70 hover:text-white hover:brightness-110'
          }`}
        >
          <Trophy className="w-5 h-5" />
          <span className="text-xs font-medium">Leaderboard</span>
        </Link>
      </div>
    </nav>
  );
}
