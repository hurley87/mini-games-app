'use client';

import { useEffect, useState } from 'react';
import { Leaderboard } from '@/components/leaderboard';
import { Header } from '@/components/header';
import { BottomNav } from '@/components/bottom-nav';
import { trackGameEvent } from '@/lib/posthog';
import { usePlayerStats } from '@/hooks/usePlayerStats';
import { Share2 } from 'lucide-react';
import { sdk } from '@farcaster/frame-sdk';
import { useMiniApp } from '@/contexts/miniapp-context';

export default function LeaderboardPage() {
  const { context } = useMiniApp();
  const { playerStats } = usePlayerStats();
  const [isSharing, setIsSharing] = useState(false);
  const [lastShareTime, setLastShareTime] = useState<number | null>(null);

  const handleShareRank = async () => {
    if (!playerStats || isSharing) return;

    // Prevent rapid sharing (cooldown of 30 seconds)
    const now = Date.now();
    if (lastShareTime && now - lastShareTime < 30000) {
      console.log('Share cooldown active');
      return;
    }

    setIsSharing(true);

    try {
      const rank = playerStats.rank;
      const rankEmoji =
        rank === 1 ? '🥇' : rank === 2 ? '🥈' : rank === 3 ? '🥉' : `#${rank}`;

      const shareText = `${rankEmoji} I'm ranked ${rank} on the Mini Games leaderboard with ${playerStats.points.toLocaleString()} points!`;

      // Attempt to share via Farcaster
      await sdk.actions.composeCast({
        text: shareText,
        embeds: ['https://app.minigames.studio/leaderboard'],
      });

      // Set cooldown immediately after successful Farcaster share to prevent spam
      setLastShareTime(now);

      // Try to award points, but don't reset cooldown if this fails
      if (context?.user?.fid) {
        try {
          const response = await fetch('/api/share-rank', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ fid: context.user.fid }),
          });

          if (!response.ok) {
            console.error('Failed to award share points:', response.statusText);
          }
        } catch (pointsError) {
          console.error('Error awarding share points:', pointsError);
          // Don't re-throw - we've already shared successfully and set cooldown
        }
      }
    } catch (error) {
      console.error('Failed to share rank:', error);
      // Don't award points if share failed
    } finally {
      setIsSharing(false);
    }
  };
  useEffect(() => {
    // Track leaderboard view
    trackGameEvent.leaderboardView();
  }, []);

  return (
    <div className="max-w-lg mx-auto min-h-screen flex flex-col bg-gradient-to-b from-black via-zinc-900 to-black text-white">
      <Header />
      <div className="px-4 pt-20 pb-24">
        <div className="text-center mb-8">
          <h1 className="text-xl font-bold text-white mb-2">Player Rankings</h1>
          <p className="text-white/70">
            See how you stack up against other players
          </p>
          {playerStats && context?.user?.fid && (
            <button
              onClick={handleShareRank}
              disabled={isSharing}
              className={`mt-4 inline-flex items-center gap-1 px-3 py-2 text-xs rounded-2xl text-white transition-all duration-200 border border-white/20 backdrop-blur ${
                isSharing
                  ? 'bg-white/10 cursor-not-allowed opacity-50'
                  : 'bg-white/10 hover:brightness-110'
              }`}
            >
              <Share2
                className={`w-3 h-3 ${isSharing ? 'animate-spin' : ''}`}
              />
              {isSharing ? 'Sharing...' : 'Share My Rank'}
            </button>
          )}
        </div>

        <div className="space-y-6">
          {/* Top 10 Leaderboard */}
          <div>
            <h2 className="text-sm font-semibold text-white mb-4">
              Top 5 Players
            </h2>
            <Leaderboard limit={5} />
          </div>
          {/* Full Leaderboard */}
          <div>
            <h2 className="text-sm font-semibold text-white mb-4">
              All Players
            </h2>
            <Leaderboard />
          </div>
        </div>
      </div>
      <BottomNav />
    </div>
  );
}
