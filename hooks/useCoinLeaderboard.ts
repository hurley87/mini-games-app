import { useState, useEffect, useCallback } from 'react';

export interface CoinLeaderboardEntry {
  fid: number;
  username: string;
  name?: string;
  pfp?: string;
  total_score: number;
  rank: number;
  play_count: number;
}

export function useCoinLeaderboard(coinId: string, limit?: number) {
  const [leaderboard, setLeaderboard] = useState<CoinLeaderboardEntry[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchCoinLeaderboard = useCallback(async () => {
    if (!coinId) return;

    setIsLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams();
      if (limit) params.set('limit', limit.toString());

      const response = await fetch(`/api/leaderboard/${coinId}?${params}`);

      if (!response.ok) {
        throw new Error('Failed to fetch coin leaderboard');
      }

      const data = await response.json();
      setLeaderboard(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      setLeaderboard([]);
    } finally {
      setIsLoading(false);
    }
  }, [coinId, limit]);

  useEffect(() => {
    fetchCoinLeaderboard();
  }, [fetchCoinLeaderboard]);

  return {
    leaderboard,
    isLoading,
    error,
    refetch: fetchCoinLeaderboard,
  };
}
