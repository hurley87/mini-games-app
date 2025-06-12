'use client';

import { useCoinLeaderboard } from '@/hooks/useCoinLeaderboard';
import { useFarcasterContext } from '@/hooks/useFarcasterContext';
import { Trophy, Medal, Crown, Share2 } from 'lucide-react';
import { sdk } from '@farcaster/frame-sdk';
import { LoadingSpinner } from '@/components/ui/loading-spinner';

interface CoinLeaderboardProps {
  coinId: string;
  symbol: string;
  limit?: number;
}

export function CoinLeaderboard({
  coinId,
  symbol,
  limit = 10,
}: CoinLeaderboardProps) {
  const { leaderboard, isLoading, error } = useCoinLeaderboard(coinId, limit);
  const { context } = useFarcasterContext();

  const handleViewProfile = async (fid: number) => {
    try {
      await sdk.actions.viewProfile({ fid });
    } catch (error) {
      console.error('Failed to view profile:', error);
    }
  };

  const handleShareLeaderboard = async () => {
    try {
      const topPlayer = leaderboard[0];
      const shareText = `🏆 Check out the ${symbol} leaderboard!\n\n🥇 ${topPlayer.name || topPlayer.username} leads with ${topPlayer.total_score.toLocaleString()} points\n\nThink you can beat them? Join the competition! 🎮`;

      await sdk.actions.composeCast({
        text: shareText,
        embeds: [`https://app.minigames.studio/coins/${coinId}`],
      });
    } catch (error) {
      console.error('Failed to share leaderboard:', error);
    }
  };

  const getRankIcon = (rank: number) => {
    if (rank === 1) return <Crown className="w-5 h-5 text-yellow-400" />;
    if (rank === 2) return <Medal className="w-5 h-5 text-gray-300" />;
    if (rank === 3) return <Medal className="w-5 h-5 text-amber-600" />;
    return <Trophy className="w-4 h-4 text-gray-500" />;
  };

  const getRankStyles = (rank: number, isCurrentUser: boolean) => {
    let baseStyles =
      'flex items-center gap-4 p-4 hover:brightness-110 transition-all duration-200';

    if (isCurrentUser) {
      baseStyles += ' bg-purple-900/30 border-l-4 border-purple-500';
    }

    if (rank === 1)
      return (
        baseStyles + ' bg-gradient-to-r from-yellow-900/20 to-yellow-800/20'
      );
    if (rank === 2)
      return baseStyles + ' bg-gradient-to-r from-gray-900/20 to-gray-800/20';
    if (rank === 3)
      return baseStyles + ' bg-gradient-to-r from-amber-900/20 to-amber-800/20';

    return baseStyles;
  };

  const getRankDisplay = (rank: number) => {
    if (rank === 1) return '🥇';
    if (rank === 2) return '🥈';
    if (rank === 3) return '🥉';
    return `#${rank}`;
  };

  if (isLoading) {
    return (
      <div className="p-6 border-t border-gray-700">
        <div className="flex items-center justify-center py-8">
          <LoadingSpinner className="h-8 w-8" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 border-t border-gray-700">
        <h2 className="text-lg font-semibold text-white mb-3">
          🏆 Leaderboard
        </h2>
        <div className="text-center py-4">
          <p className="text-red-400 text-sm">Failed to load leaderboard</p>
        </div>
      </div>
    );
  }

  if (!leaderboard || leaderboard.length === 0) {
    return (
      <div className="p-6 border-t border-gray-700">
        <h2 className="text-lg font-semibold text-white mb-3">
          🏆 Leaderboard
        </h2>
        <div className="text-center py-8">
          <Trophy className="w-12 h-12 text-gray-600 mx-auto mb-3" />
          <p className="text-white/70 text-sm">No players yet</p>
          <p className="text-white/60 text-xs mt-1">
            Be the first to play and earn points!
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 border-t border-gray-700">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-white flex items-center gap-2">
          <Trophy className="w-5 h-5 text-yellow-400" />
          Leaderboard
        </h2>
        <button
          onClick={handleShareLeaderboard}
          className="flex items-center gap-1 px-3 py-2 text-xs bg-white/10 backdrop-blur border border-white/20 rounded-2xl text-white hover:brightness-110 transition-all duration-200"
          title="Share leaderboard"
        >
          <Share2 className="w-3 h-3" />
          Share
        </button>
      </div>

      <div className="bg-black/20 backdrop-blur rounded-2xl overflow-hidden border border-white/20 shadow-xl">
        <div className="divide-y divide-gray-700">
          {leaderboard.map((player) => {
            const isCurrentUser = context?.user?.fid === player.fid;

            return (
              <div
                key={player.fid}
                className={getRankStyles(player.rank, isCurrentUser)}
              >
                {/* Rank */}
                <div className="flex items-center justify-center w-10 h-10 rounded-full bg-white/10 text-sm font-bold">
                  {getRankDisplay(player.rank)}
                </div>

                {/* Profile Picture */}
                <div className="relative">
                  <img
                    src={player.pfp || '/default-avatar.svg'}
                    alt={`${player.username || player.name}'s avatar`}
                    className="w-12 h-12 rounded-full object-cover border-2 border-gray-600"
                    onError={(e) => {
                      e.currentTarget.src = '/default-avatar.svg';
                    }}
                  />
                  {player.rank <= 3 && (
                    <div className="absolute -top-1 -right-1">
                      {getRankIcon(player.rank)}
                    </div>
                  )}
                </div>

                {/* Player Info */}
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-white truncate flex items-center gap-2">
                    <button
                      onClick={() => handleViewProfile(player.fid)}
                      className="text-white hover:text-blue-400 transition-colors truncate text-left"
                      title="View profile"
                    >
                      {player.name || player.username}
                    </button>
                  </div>
                  {player.name && player.username && (
                    <button
                      onClick={() => handleViewProfile(player.fid)}
                      className="text-sm text-white/70 hover:brightness-110 transition-all duration-200 truncate text-left block"
                      title="View profile"
                    >
                      @{player.username}
                    </button>
                  )}
                </div>

                {/* Score */}
                <div className="text-right">
                  <div className="font-bold text-lg text-white">
                    {player.total_score.toLocaleString()}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {leaderboard.length >= (limit || 10) && (
        <div className="text-center mt-4">
          <p className="text-xs text-white/60">
            Showing top {limit || 10} players
          </p>
        </div>
      )}
    </div>
  );
}
