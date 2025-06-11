'use client';

import { useEffect, useState } from 'react';
import { RoundResult } from './round-result';
import { sdk } from '@farcaster/frame-sdk';
import { BuyCoinButton } from './BuyCoinButton';
import { useAccount, useConnect } from 'wagmi';
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
  const { context, isReady } = useFarcasterContext({
    disableNativeGestures: true,
  });
  const { address, isConnected } = useAccount();
  const { connectors, connect } = useConnect();

  useEffect(() => {
    const handleMessage = async (event: MessageEvent) => {
      console.log('event', event);
      if (event.data && event.data.type === 'points-awarded') {
        const score = event.data.score;
        console.log('score', score);
        try {
          await sdk.haptics.impactOccurred('medium');
        } catch (error) {
          console.error('Error triggering haptic:', error);
        }

        if (typeof score === 'number') {
          setRoundScore(score);
          setIsGameOver(true);
          onRoundComplete?.(score);
        }
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [onRoundComplete]);

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
  }, [context?.user?.fid, id, coinAddress, address, isReady]);

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

        const tokenBalance = balance > BigInt(0);
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
  }, [address, coinAddress, isConnected]);

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
  ]);

  if (!id) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-white/70">Please enter a game id</div>
      </div>
    );
  }

  const fid = context?.user?.fid;

  const iframeUrl = `/api/embed/${id}?fid=${fid}&coinId=${coinId}`;

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

  if (isGameOver) {
    if (roundScore !== null) {
      const handleShare = async () => {
        try {
          await sdk.actions.composeCast({
            text: `I scored ${roundScore} points!`,
            embeds: [`https://app.minigames.studio/coins/${coinId}`],
          });
        } catch (error) {
          console.error('Failed to share score:', error);
        }
      };

      return (
        <RoundResult
          score={roundScore}
          onShare={handleShare}
          onPlayAgain={() => {
            setRoundScore(null);
            setIsGameOver(false);
          }}
        />
      );
    }

    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm">
        <div className="text-center p-8 rounded-2xl bg-black/80 backdrop-blur border border-white/20 shadow-xl max-w-md w-full mx-4">
          <h1 className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-pink-500 mb-4">
            Game Over
          </h1>
          <p className="text-xl text-white/70 mb-4">{`Time's up!`}</p>

          {!hasPlayedBefore ? (
            // First-time player - encourage them to get tokens for full access
            <div className="space-y-4">
              <p className="text-sm text-green-400 mb-2">
                🎉 Thanks for trying the game!
              </p>
              <p className="text-sm text-amber-400 mb-4">
                Want unlimited access? Get tokens to play without time limits!
              </p>
              {!isConnected ? (
                <button
                  onClick={() => connect({ connector: connectors[0] })}
                  className="w-full py-3 px-6 text-lg font-semibold rounded-2xl bg-purple-600 text-white hover:brightness-110 transition-all duration-200"
                >
                  Connect Wallet
                </button>
              ) : (
                <BuyCoinButton
                  coinAddress={coinAddress}
                  symbol=""
                  onSuccess={() => {
                    // Recheck both play status and token balance after purchase
                    setCheckingTokens(true);
                    setCheckingPlayStatus(true);
                    setIsGameOver(false);
                  }}
                />
              )}
            </div>
          ) : hasTokens ? (
            // Returning player with tokens - unlimited play
            <div className="space-y-4">
              <p className="text-sm text-purple-400">
                🎮 You own tokens for this game!
              </p>
              <button
                onClick={() => setIsGameOver(false)}
                className="w-full py-3 px-6 text-lg font-semibold rounded-full bg-emerald-600 text-white hover:brightness-110 transition-all duration-200"
              >
                Play Again
              </button>
            </div>
          ) : (
            // Returning player without tokens - needs to buy
            <div className="space-y-4">
              <p className="text-sm text-amber-400 mb-4">
                You need tokens to continue playing this game.
              </p>
              {!isConnected ? (
                <button
                  onClick={() => connect({ connector: connectors[0] })}
                  className="w-full py-3 px-6 text-lg font-semibold rounded-full bg-purple-600 text-white hover:brightness-110 transition-all duration-200"
                >
                  Connect Wallet
                </button>
              ) : (
                <BuyCoinButton
                  coinAddress={coinAddress}
                  symbol=""
                  onSuccess={() => {
                    // Recheck token balance after purchase
                    setCheckingTokens(true);
                    setIsGameOver(false);
                  }}
                />
              )}
            </div>
          )}
        </div>
      </div>
    );
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
