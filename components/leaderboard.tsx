'use client';

import { useEffect, useState } from 'react';
import { PlayerRank } from '@/lib/supabase';
import { sdk } from '@farcaster/frame-sdk';

interface LeaderboardProps {
  limit?: number;
  showCurrentPlayer?: boolean;
  currentPlayerFid?: number;
}

export function Leaderboard({
  limit,
  showCurrentPlayer = false,
  currentPlayerFid,
}: LeaderboardProps) {
  const [leaderboard, setLeaderboard] = useState<PlayerRank[]>([]);
  const [currentPlayerRank, setCurrentPlayerRank] = useState<PlayerRank | null>(
    null
  );
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const handleViewProfile = async (fid: number) => {
    try {
      await sdk.actions.viewProfile({ fid });
    } catch (error) {
      console.error('Failed to view profile:', error);
    }
  };

  useEffect(() => {
    const fetchLeaderboard = async () => {
      try {
        setIsLoading(true);

        // Fetch leaderboard
        const response = await fetch('/api/leaderboard');
        if (!response.ok) throw new Error('Failed to fetch leaderboard');

        const data = await response.json();
        const displayData = limit ? data.slice(0, limit) : data;
        setLeaderboard(displayData);

        // Fetch current player rank if needed
        if (showCurrentPlayer && currentPlayerFid) {
          const playerResponse = await fetch(
            `/api/player/${currentPlayerFid}/rank`
          );
          if (playerResponse.ok) {
            const playerData = await playerResponse.json();
            setCurrentPlayerRank(playerData);
          }
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Something went wrong');
      } finally {
        setIsLoading(false);
      }
    };

    fetchLeaderboard();
  }, [limit, showCurrentPlayer, currentPlayerFid]);

  const getRankDisplay = (rank: number) => {
    if (rank === 1) return '🥇';
    if (rank === 2) return '🥈';
    if (rank === 3) return '🥉';
    return `#${rank}`;
  };

  const getRankStyles = (rank: number) => {
    if (rank === 1)
      return 'bg-gradient-to-r from-yellow-400 to-yellow-600 text-white';
    if (rank === 2)
      return 'bg-gradient-to-r from-gray-300 to-gray-500 text-white';
    if (rank === 3)
      return 'bg-gradient-to-r from-amber-600 to-amber-800 text-white';
    return 'bg-white/10 text-white/80';
  };

  if (isLoading) {
    return (
      <div className="w-full bg-black/20 backdrop-blur rounded-2xl shadow-xl p-6 border border-white/20">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-white/20 rounded w-1/3"></div>
          {[...Array(5)].map((_, i) => (
            <div key={i} className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-white/20 rounded-full"></div>
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-white/20 rounded w-1/2"></div>
                <div className="h-3 bg-white/20 rounded w-1/4"></div>
              </div>
              <div className="h-6 bg-white/20 rounded w-16"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full bg-black/20 backdrop-blur rounded-2xl shadow-xl p-6 border border-white/20">
        <div className="text-center py-8">
          <div className="text-red-400 text-lg font-medium">
            Failed to load leaderboard
          </div>
          <div className="text-white/70 text-sm mt-2">{error}</div>
        </div>
      </div>
    );
  }

  const isCurrentPlayerInTop =
    currentPlayerRank &&
    leaderboard.some((player) => player.fid === currentPlayerRank.fid);

  return (
    <div className="w-full bg-black/20 backdrop-blur rounded-2xl shadow-xl overflow-hidden border border-white/20">
      {/* Leaderboard List */}
      <div className="divide-y divide-gray-700">
        {leaderboard.map((player) => (
          <div
            key={player.fid}
            className={`flex items-center gap-4 p-4 hover:brightness-110 transition-all duration-200 ${
              currentPlayerFid === player.fid
                ? 'bg-purple-900/30 border-l-4 border-purple-500'
                : ''
            }`}
          >
            {/* Rank */}
            <div
              className={`flex items-center justify-center w-12 h-8 rounded-full text-sm font-bold ${getRankStyles(player.rank)}`}
            >
              {getRankDisplay(player.rank)}
            </div>

            {/* Profile Picture */}
            <div className="relative">
              <img
                src={player.pfp || '/default-avatar.svg'}
                alt={`${player.username || player.name}'s avatar`}
                className="w-12 h-12 rounded-full object-cover border-2 border-white/20"
                onError={(e) => {
                  e.currentTarget.src = '/default-avatar.svg';
                }}
              />
              {player.rank <= 3 && (
                <div className="absolute -top-1 -right-1 w-6 h-6 bg-black/50 rounded-full flex items-center justify-center shadow-sm border border-white/20">
                  <span className="text-xs">{getRankDisplay(player.rank)}</span>
                </div>
              )}
            </div>

          {/* Player Info */}
          <div className="flex-1 min-w-0">
            <div className="font-semibold text-white truncate">
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

            {/* Points */}
            <div className="text-right">
              <div className="font-bold text-lg text-white">
                {player.points.toLocaleString()}
              </div>
              <div className="text-xs text-white/70">points</div>
            </div>
          </div>
        ))}
      </div>

      {/* Current Player Section (if not in top list) */}
      {showCurrentPlayer && currentPlayerRank && !isCurrentPlayerInTop && (
        <>
          <div className="border-t-2 border-dashed border-white/20 my-2"></div>
          <div className="px-4 pb-4">
            <div className="text-xs text-white/70 mb-2 text-center">
              Your Rank
            </div>
            <div className="flex items-center gap-4 p-3 bg-purple-900/20 rounded-lg border border-purple-500/30">
              {/* Rank */}
              <div className="flex items-center justify-center w-12 h-8 rounded-full text-sm font-bold bg-purple-600 text-white">
                #{currentPlayerRank.rank}
              </div>

              {/* Profile Picture */}
              <img
                src={currentPlayerRank.pfp || '/default-avatar.svg'}
                alt={`${currentPlayerRank.username || currentPlayerRank.name}'s avatar`}
                className="w-12 h-12 rounded-full object-cover border-2 border-purple-400"
                onError={(e) => {
                  e.currentTarget.src = '/default-avatar.svg';
                }}
              />

              {/* Player Info */}
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-white truncate">
                  <button
                    onClick={() => handleViewProfile(currentPlayerRank.fid)}
                    className="text-white hover:text-blue-400 transition-colors truncate text-left"
                    title="View profile"
                  >
                    {currentPlayerRank.name || currentPlayerRank.username}
                  </button>
                </div>
                {currentPlayerRank.name && currentPlayerRank.username && (
                  <button
                    onClick={() => handleViewProfile(currentPlayerRank.fid)}
                    className="text-sm text-white/70 hover:brightness-110 transition-all duration-200 truncate text-left block"
                    title="View profile"
                  >
                    @{currentPlayerRank.username}
                  </button>
                )}
              </div>

              {/* Points */}
              <div className="text-right">
                <div className="font-bold text-lg text-white">
                  {currentPlayerRank.points.toLocaleString()}
                </div>
                <div className="text-xs text-white/70">points</div>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Empty State */}
      {leaderboard.length === 0 && (
        <div className="text-center py-12">
          <div className="text-white/70 text-lg">No players found</div>
          <div className="text-white/60 text-sm mt-2">
            Start playing to appear on the leaderboard!
          </div>
        </div>
      )}
    </div>
  );
}
