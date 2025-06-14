import { useState, useEffect, useCallback } from 'react';
import { useFarcasterContext } from './useFarcasterContext';

export interface PendingRewards {
  totalPendingScore: number;
  pendingTokens: number;
  coinId: string;
  symbol: string;
}

export function usePendingRewards(coinId: string, symbol: string) {
  const [pendingRewards, setPendingRewards] = useState<PendingRewards | null>(
    null
  );
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { context } = useFarcasterContext();

  const fetchPendingRewards = useCallback(async () => {
    if (!context?.user?.fid || !coinId) return;

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(
        `/api/pending-rewards?fid=${context.user.fid}&coinId=${coinId}`
      );

      if (!response.ok) {
        throw new Error('Failed to fetch pending rewards');
      }

      const data = await response.json();
      setPendingRewards(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      setPendingRewards(null);
    } finally {
      setIsLoading(false);
    }
  }, [context?.user?.fid, coinId]);

  useEffect(() => {
    fetchPendingRewards();
  }, [fetchPendingRewards]);

  return {
    pendingRewards,
    isLoading,
    error,
    refetch: fetchPendingRewards,
  };
}
