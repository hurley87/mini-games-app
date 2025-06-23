import { useState, useEffect, useCallback } from 'react';
import { useMiniApp } from '@/contexts/miniapp-context';

interface PlayerStats {
  points: number;
  rank: number;
  name?: string;
  username?: string;
  pfp?: string;
}

export function usePlayerStats() {
  const [playerStats, setPlayerStats] = useState<PlayerStats | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { context } = useMiniApp();

  const fetchPlayerStats = useCallback(async () => {
    if (!context?.user?.fid) {
      setPlayerStats(null);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/player/${context.user.fid}/rank`);

      if (!response.ok) {
        if (response.status === 404) {
          // Player not found, set default values
          setPlayerStats({
            points: 0,
            rank: 0,
            name: context.user.displayName,
            username: context.user.username,
            pfp: context.user.pfpUrl,
          });
          return;
        }
        throw new Error('Failed to fetch player stats');
      }

      const data = await response.json();
      setPlayerStats(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      setPlayerStats(null);
    } finally {
      setIsLoading(false);
    }
  }, [
    context?.user?.fid,
    context?.user?.displayName,
    context?.user?.username,
    context?.user?.pfpUrl,
  ]);

  useEffect(() => {
    if (context?.user?.fid) {
      fetchPlayerStats();
    }
  }, [fetchPlayerStats]);

  return {
    playerStats,
    isLoading,
    error,
    refetch: fetchPlayerStats,
  };
}
