'use client';

import { useEffect, useState, useRef } from 'react';
import { sdk } from '@farcaster/frame-sdk';
import { useAccount } from 'wagmi';
import { useFarcasterContext } from '@/hooks/useFarcasterContext';
import { Address, createPublicClient, http } from 'viem';
import { base } from 'viem/chains';

// Create a public client for reading blockchain data
const publicClient = createPublicClient({
  chain: base,
  transport: http(),
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
  timeoutSeconds?: number;
  coinAddress: string;
  coinId: string;
  onRoundComplete?: (score: number) => void;
}

export function Game({
  id,
  timeoutSeconds = 10,
  coinAddress,
  coinId,
  onRoundComplete,
}: GameProps) {
  const [loading, setLoading] = useState(true);
  const [isGameOver, setIsGameOver] = useState(false);
  const [hasTokens, setHasTokens] = useState(false);
  const [checkingTokens, setCheckingTokens] = useState(true);
  const [hasPlayedBefore, setHasPlayedBefore] = useState(false);
  const [checkingPlayStatus, setCheckingPlayStatus] = useState(true);
  const [roundScore, setRoundScore] = useState<number | null>(null);
  const [tokenDecimals, setTokenDecimals] = useState<number>(18); // Default to 18, will be fetched
  const { context, isReady } = useFarcasterContext({
    disableNativeGestures: true,
  });
  const { address, isConnected } = useAccount();
  const iframeRef = useRef<HTMLIFrameElement | null>(null);

  // Define iframeUrl early to avoid declaration order issues
  const fid = context?.user?.fid;
  const iframeUrl = `/api/embed/${id}?fid=${fid}&coinId=${coinId}`;

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
        try {
          await sdk.haptics.impactOccurred('medium');
        } catch (error) {
          console.error('Error triggering haptic:', error);
        }

        if (typeof score === 'number') {
          setRoundScore(score);
        }
      } else if (event.data && event.data.type === 'game-over') {
        setIsGameOver(true);
        onRoundComplete?.(roundScore || 0);
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [onRoundComplete, iframeUrl, roundScore]);

  // Check if player has played this game before
  useEffect(() => {
    const checkPlayStatus = async () => {
      if (!context?.user?.fid) {
        setCheckingPlayStatus(false);
        return;
      }

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

        if (response.ok) {
          const status = await response.json();
          setHasPlayedBefore(status.hasPlayed);
        }
      } catch (error) {
        console.error('Error checking play status:', error);
      } finally {
        setCheckingPlayStatus(false);
      }
    };

    if (isReady && context?.user?.fid) {
      checkPlayStatus();
    }
  }, [context?.user?.fid, id, coinId, coinAddress, address, isReady]);

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

        // Calculate minimum tokens: 0.001 * 10^decimals using BigInt to avoid floating-point precision issues
        // 0.001 = 1 / 1000, so we need 10^(decimals-3) tokens
        const exponent = tokenDecimals - 3;

        // Helper function to calculate 10^n using BigInt to maintain precision for high decimals
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
          exponent >= 0
            ? powerOfTenBigInt(exponent) // For decimals >= 3
            : BigInt(1); // For decimals < 3, minimum is 1 unit

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
    if (checkingTokens || checkingPlayStatus || isGameOver) return; // Wait for all checks to complete

    const shouldApplyTimeout =
      !hasPlayedBefore || (hasPlayedBefore && !hasTokens);

    if (shouldApplyTimeout) {
      const timer = setTimeout(() => {
        setIsGameOver(true);
        onRoundComplete?.(roundScore || 0);
      }, timeoutSeconds * 1000);

      return () => clearTimeout(timer);
    }
  }, [
    timeoutSeconds,
    hasTokens,
    hasPlayedBefore,
    checkingTokens,
    checkingPlayStatus,
    isGameOver,
    onRoundComplete,
    roundScore,
  ]);

  if (!id) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-white/70">Please enter a game id</div>
      </div>
    );
  }

  if (!isReady || checkingTokens || checkingPlayStatus) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="flex flex-col items-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-2 border-gray-600 border-t-purple-500"></div>
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
    <div className="fixed inset-0 z-50 left-0 w-full h-full bg-black top-12">
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-black">
          <div className="flex flex-col items-center space-y-4">
            <div className="animate-spin rounded-full h-12 w-12 border-2 border-gray-600 border-t-purple-500"></div>
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
