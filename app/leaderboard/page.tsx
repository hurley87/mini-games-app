'use client';

import { useEffect } from 'react';
import { Leaderboard } from '@/components/leaderboard';
import { Header } from '@/app/components/header';
import { trackGameEvent } from '@/lib/posthog';
import { useFarcasterContext } from '@/hooks/useFarcasterContext';
import { usePlayerStats } from '@/hooks/usePlayerStats';
import { Share2 } from 'lucide-react';
import { sdk } from '@farcaster/frame-sdk';

export default function LeaderboardPage() {
  const { context } = useFarcasterContext();
  const { playerStats } = usePlayerStats();

  const handleShareRank = async () => {
    if (!playerStats) return;
    try {
      const rank = playerStats.rank;
      const rankEmoji =
        rank === 1 ? '🥇' : rank === 2 ? '🥈' : rank === 3 ? '🥉' : `#${rank}`;

      const shareText = `${rankEmoji} I'm ranked ${rank} on the Mini Games leaderboard with ${playerStats.points.toLocaleString()} points!`;

      await sdk.actions.composeCast({
        text: shareText,
        embeds: ['https://app.minigames.studio/leaderboard'],
      });

      if (context?.user?.fid) {
        await fetch('/api/share-rank', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ fid: context.user.fid }),
        });
      }
    } catch (error) {
      console.error('Failed to share rank:', error);
    }
  };
  useEffect(() => {
    // Track leaderboard view
    trackGameEvent.leaderboardView();
  }, []);

  return (
    <div className="max-w-lg mx-auto bg-gray-900 min-h-screen flex flex-col">
      <Header />
      <div className="px-4 pt-20 pb-8">
        <div className="text-center mb-8">
          <h1 className="text-xl font-bold text-white mb-2">Player Rankings</h1>
          <p className="text-gray-400">
            See how you stack up against other players
          </p>
          {playerStats && context?.user?.fid && (
            <button
              onClick={handleShareRank}
              className="mt-4 inline-flex items-center gap-1 px-3 py-2 text-xs bg-gray-700 hover:bg-gray-600 text-white rounded-md"
            >
              <Share2 className="w-3 h-3" />
              Share My Rank
            </button>
          )}
        </div>

        <div className="space-y-6">
          {/* Top 10 Leaderboard */}
          <div>
            <h2 className="text-sm font-semibold text-gray-200 mb-4">
              Top 5 Players
            </h2>
            <Leaderboard limit={5} />
          </div>
          {/* Full Leaderboard */}
          <div>
            <h2 className="text-sm font-semibold text-gray-200 mb-4">
              All Players
            </h2>
            <Leaderboard />
          </div>
        </div>
      </div>
    </div>
  );
}
