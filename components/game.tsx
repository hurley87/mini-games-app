'use client';

import { useEffect, useState, useRef } from 'react';
import { sdk } from '@farcaster/frame-sdk';
import { useAccount } from 'wagmi';
import { Address, createPublicClient, http } from 'viem';
import { base } from 'viem/chains';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { PREMIUM_THRESHOLD } from '@/lib/config';
import { useMiniApp } from '@/contexts/miniapp-context';

const rpcUrl = process.env.NEXT_PUBLIC_RPC_URL!;

// Create a public client for reading blockchain data
const publicClient = createPublicClient({
  chain: base,
  transport: http(rpcUrl),
});

const ERC20_ABI = [
  {
    name: 'balanceOf',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'account', type: 'address' }],
    outputs: [{ name: 'balance', type: 'uint256' }],
  },
  {
    name: 'decimals',
    type: 'function',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ name: 'decimals', type: 'uint8' }],
  },
] as const;

interface GameProps {
  id: string;
  timeoutSeconds: number;
  coinAddress: string;
  coinId: string;
  onRoundComplete?: (score: number) => void;
  onScoreUpdate?: (score: number) => void;
  forceEnd?: boolean;
  hasPlayedBefore?: boolean;
}

export function Game({
  id,
  timeoutSeconds,
  coinAddress,
  coinId,
  onRoundComplete,
  onScoreUpdate,
  forceEnd = false,
  hasPlayedBefore = false,
}: GameProps) {
  const [loading, setLoading] = useState(true);
  const [isGameOver, setIsGameOver] = useState(false);
  const [hasTokens, setHasTokens] = useState(false);
  const [checkingTokens, setCheckingTokens] = useState(true);
  const [roundScore, setRoundScore] = useState<number | null>(null);
  const [tokenDecimals, setTokenDecimals] = useState<number>(18); // Default to 18, will be fetched
  const { context } = useMiniApp();
  const { address, isConnected } = useAccount();
  const iframeRef = useRef<HTMLIFrameElement | null>(null);
  const roundScoreRef = useRef<number>(0);

  // Define iframeUrl early to avoid declaration order issues
  const fid = context?.user?.fid;
  const iframeUrl = `/api/embed/${id}?fid=${fid}&coinId=${coinId}&coinAddress=${coinAddress}`;

  console.log('GAME');
  console.log('coinId', coinId);

  // Fetch token decimals when component mounts
  useEffect(() => {
    const fetchTokenDecimals = async () => {
      if (!coinAddress) return;

      try {
        const decimals = await publicClient.readContract({
          address: coinAddress as Address,
          abi: ERC20_ABI,
          functionName: 'decimals',
        });
        setTokenDecimals(Number(decimals));
      } catch (error) {
        console.error('Error fetching token decimals:', error);
        // Keep default of 18 if fetch fails
      }
    };

    fetchTokenDecimals();
  }, [coinAddress]);

  useEffect(() => {
    const handleMessage = async (event: MessageEvent) => {
      if (
        event.source !== iframeRef.current?.contentWindow ||
        event.origin !== new URL(iframeUrl, window.location.origin).origin
      ) {
        return;
      }

      if (event.data && event.data.type === 'points-awarded') {
        const score = event.data.score;
        console.log('🎯 Game: Points awarded message received:', score);

        try {
          await sdk.haptics.impactOccurred('medium');
        } catch (error) {
          console.error('Error triggering haptic:', error);
        }

        if (typeof score === 'number') {
          // Accumulate points instead of overwriting
          setRoundScore((prev) => {
            const newScore = (prev || 0) + score;
            roundScoreRef.current = newScore; // Keep ref in sync
            console.log(
              '🎯 Game: Accumulating score from',
              prev,
              'to',
              newScore,
              '(+' + score + ')'
            );
            onScoreUpdate?.(newScore);
            return newScore;
          });
        }
      } else if (event.data && event.data.type === 'game-over') {
        console.log(
          '🏁 Game: Game over message received, final score:',
          roundScore
        );
        setIsGameOver(true);
        const finalScore = roundScore || 0;
        onScoreUpdate?.(finalScore);
        onRoundComplete?.(finalScore);
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [onRoundComplete, onScoreUpdate, iframeUrl, roundScore]);

  // Check token balance
  useEffect(() => {
    const checkTokenBalance = async () => {
      if (!address || !coinAddress) {
        setCheckingTokens(false);
        return;
      }

      try {
        const balance = await publicClient.readContract({
          address: coinAddress as Address,
          abi: ERC20_ABI,
          functionName: 'balanceOf',
          args: [address as Address],
        });

        // Calculate minimum tokens: PREMIUM_THRESHOLD * 10^decimals using BigInt
        // Helper function to calculate 10^n using BigInt
        const powerOfTenBigInt = (exp: number): bigint => {
          if (exp <= 0) return BigInt(1);
          let result = BigInt(1);
          const base = BigInt(10);
          for (let i = 0; i < exp; i++) {
            result *= base;
          }
          return result;
        };

        const minimumTokens =
          BigInt(PREMIUM_THRESHOLD) * powerOfTenBigInt(tokenDecimals);
        const tokenBalance = balance >= minimumTokens;
        setHasTokens(tokenBalance);
      } catch (error) {
        console.error('Error checking token balance:', error);
        setHasTokens(false);
      } finally {
        setCheckingTokens(false);
      }
    };

    if (isConnected && address) {
      checkTokenBalance();
    } else {
      setCheckingTokens(false);
    }
  }, [address, coinAddress, isConnected, tokenDecimals]);

  // Set timeout logic:
  // - First-time players always get 10-second preview (regardless of tokens)
  // - Returning players only get unlimited if they have tokens
  useEffect(() => {
    if (checkingTokens || isGameOver) return; // Wait for all checks to complete

    const shouldApplyTimeout =
      !hasPlayedBefore || (hasPlayedBefore && !hasTokens);

    if (shouldApplyTimeout) {
      console.log('⏰ Game: Setting timeout for', timeoutSeconds, 'seconds');
      const timer = setTimeout(() => {
        console.log('⏰ Game: Timeout reached, ending game');

        // Get current score from ref to avoid dependency issues
        const currentScore = roundScoreRef.current;
        console.log('⏰ Game: Final score at timeout:', currentScore);
        onScoreUpdate?.(currentScore);
        onRoundComplete?.(currentScore);

        setIsGameOver(true);
      }, timeoutSeconds * 1000);

      return () => clearTimeout(timer);
    }
  }, [
    timeoutSeconds,
    hasTokens,
    hasPlayedBefore,
    checkingTokens,
    isGameOver,
    onRoundComplete,
    onScoreUpdate,
  ]);

  // Handle forced game end from GameWrapper
  useEffect(() => {
    if (forceEnd && !isGameOver) {
      console.log('🚨 Game: Forced to end by GameWrapper');

      // Get current score from ref to avoid dependency issues
      const currentScore = roundScoreRef.current;
      console.log('🚨 Game: Final score at forced end:', currentScore);
      onScoreUpdate?.(currentScore);
      onRoundComplete?.(currentScore);

      setIsGameOver(true);
    }
  }, [forceEnd, isGameOver, onRoundComplete, onScoreUpdate]);

  if (!id) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-white/70">Please enter a game id</div>
      </div>
    );
  }

  if (checkingTokens || !fid) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="flex flex-col items-center space-y-4">
          <LoadingSpinner />
          <div className="text-white/70">Loading...</div>
        </div>
      </div>
    );
  }

  // Game over state is now handled by GameWrapper
  if (isGameOver) {
    return null; // Let GameWrapper handle the result display
  }

  return (
    <div className="fixed inset-0 z-40 left-0 w-full h-full bg-black top-0">
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-black">
          <div className="flex flex-col items-center space-y-4">
            <LoadingSpinner />
            <p className="text-white/70">Loading game...</p>
          </div>
        </div>
      )}
      <iframe
        ref={iframeRef}
        src={iframeUrl}
        sandbox="allow-scripts allow-same-origin"
        style={{
          width: '100%',
          height: '100%',
          border: 'none',
        }}
        onLoad={() => setLoading(false)}
      />
    </div>
  );
}
