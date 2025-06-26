import { useState, useCallback, useRef, useEffect } from 'react';
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
    | 'balance_check_failed'
    | 'daily_limit_reached';
  hasPlayed: boolean;
  tokenBalance: string;
  nextFreePlayTime?: string;
  dailyPlaysRemaining?: number;
  maxDailyPlays?: number;
  currentDailyPlays?: number;
};

export function usePlayStatus() {
  const [playStatus, setPlayStatus] = useState<PlayStatus | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { address } = useAccount();
  const { context } = useMiniApp();
  const retryTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const currentParamsRef = useRef<{
    coinId: string;
    coinAddress: string;
    fid: number;
    walletAddress: string | undefined;
  } | null>(null);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current);
      }
    };
  }, []);

  const checkPlayStatus = useCallback(
    async (coinId: string, coinAddress: string, retryCount = 0) => {
      if (!context?.user?.fid) {
        setError(
          "User not authenticated - Please make sure you're logged in to Farcaster"
        );
        return;
      }

      // Store current parameters for potential retry
      currentParamsRef.current = {
        coinId,
        coinAddress,
        fid: context.user.fid,
        walletAddress: address,
      };

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

        console.log('response', response);

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          const errorMessage = errorData.error || 'Failed to check play status';

          // Provide more specific error messages
          if (response.status === 401) {
            throw new Error('Authentication required - Please sign in again');
          } else if (response.status === 500) {
            throw new Error('Server error - Please try again in a moment');
          } else {
            throw new Error(errorMessage);
          }
        }

        const status: PlayStatus = await response.json();
        setPlayStatus(status);
        setIsLoading(false);
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : 'Unknown error occurred';
        console.error('Play status check failed:', err);

        // Auto-retry once for network errors
        if (
          retryCount === 0 &&
          (errorMessage.includes('fetch') || errorMessage.includes('network'))
        ) {
          console.log('Retrying play status check...');
          // Clear any existing timeout
          if (retryTimeoutRef.current) {
            clearTimeout(retryTimeoutRef.current);
          }
          // Store timeout for cleanup and use current parameters to avoid stale closure
          retryTimeoutRef.current = setTimeout(() => {
            retryTimeoutRef.current = null;
            const params = currentParamsRef.current;
            if (
              params &&
              context?.user?.fid === params.fid &&
              address === params.walletAddress
            ) {
              checkPlayStatus(params.coinId, params.coinAddress, 1);
            }
          }, 1000);
          // Don't set loading to false when retrying
          return;
        }

        setError(errorMessage);
        setPlayStatus(null);
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
    // Clear any pending retry timeout
    if (retryTimeoutRef.current) {
      clearTimeout(retryTimeoutRef.current);
      retryTimeoutRef.current = null;
    }
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
