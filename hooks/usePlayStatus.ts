import { useState, useCallback } from 'react';
import { useAccount } from 'wagmi';
import { useMiniApp } from '@/contexts/miniapp-context';

export type PlayStatus = {
  canPlay: boolean;
  reason:
    | 'first_time'
    | 'daily_free'
    | 'has_tokens'
    | 'wait_for_free'
    | 'no_wallet'
    | 'balance_check_failed';
  hasPlayed: boolean;
  tokenBalance: string;
  nextFreePlayTime?: string;
};

export function usePlayStatus() {
  const [playStatus, setPlayStatus] = useState<PlayStatus | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { address } = useAccount();
  const { context } = useMiniApp();

  const checkPlayStatus = useCallback(
    async (coinId: string, coinAddress: string) => {
      if (!context?.user?.fid) {
        setError('User not authenticated');
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        const response = await fetch('/api/check-play-status', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            fid: context.user.fid,
            coinId,
            coinAddress,
            walletAddress: address,
          }),
        });

        if (!response.ok) {
          throw new Error('Failed to check play status');
        }

        const status: PlayStatus = await response.json();
        setPlayStatus(status);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
        setPlayStatus(null);
      } finally {
        setIsLoading(false);
      }
    },
    [context?.user?.fid, address]
  );

  const recordPlay = useCallback(
    async (gameId: string, coinAddress: string) => {
      if (!context?.user?.fid) {
        setError('User not authenticated');
        return false;
      }

      try {
        const response = await fetch('/api/record-play', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            fid: context.user.fid,
            gameId,
            coinAddress,
          }),
        });

        if (!response.ok) {
          throw new Error('Failed to record play');
        }

        return true;
      } catch (err) {
        console.error('Error recording play:', err);
        setError(err instanceof Error ? err.message : 'Failed to record play');
        return false;
      }
    },
    [context?.user?.fid]
  );

  const reset = useCallback(() => {
    setPlayStatus(null);
    setError(null);
    setIsLoading(false);
  }, []);

  return {
    playStatus,
    isLoading,
    error,
    checkPlayStatus,
    recordPlay,
    reset,
  };
}
