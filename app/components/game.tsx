'use client';

import { useEffect, useState } from 'react';
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
}

export function Game({ id, timeoutSeconds = 10, coinAddress }: GameProps) {
  const [loading, setLoading] = useState(true);
  const [isGameOver, setIsGameOver] = useState(false);
  const [hasTokens, setHasTokens] = useState(false);
  const [checkingTokens, setCheckingTokens] = useState(true);
  const [hasPlayedBefore, setHasPlayedBefore] = useState(false);
  const [checkingPlayStatus, setCheckingPlayStatus] = useState(true);
  const { context, isReady } = useFarcasterContext({
    disableNativeGestures: true,
  });
  const { address, isConnected } = useAccount();
  const { connectors, connect } = useConnect();

  console.log('address', address);

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
            gameId: id,
            coinAddress,
            walletAddress: address,
          }),
        });

        if (response.ok) {
          const status = await response.json();
          setHasPlayedBefore(status.hasPlayed);
          console.log('Play status check:', { hasPlayed: status.hasPlayed });
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
        console.log('Token balance check:', {
          balance: balance.toString(),
          hasTokens: tokenBalance,
        });
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
    if (checkingTokens || checkingPlayStatus) return; // Wait for all checks to complete

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
  ]);

  if (!id) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-gray-300">Please enter a game id</div>
      </div>
    );
  }

  const fid = context?.user?.fid;

  // Debug logs
  console.log('Game ID:', id);

  const iframeUrl = `/api/embed/${id}?fid=${fid}&buildId=${id}`;
  console.log('Iframe URL:', iframeUrl);

  if (!isReady || checkingTokens || checkingPlayStatus) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="flex flex-col items-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-2 border-gray-600 border-t-purple-500"></div>
          <div className="text-gray-300">Loading...</div>
        </div>
      </div>
    );
  }

  if (isGameOver) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm">
        <div className="text-center p-8 rounded-2xl bg-gray-800/80 border border-gray-700 max-w-md w-full mx-4">
          <h1 className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-pink-500 mb-4">
            Game Over
          </h1>
          <p className="text-xl text-gray-300 mb-4">{`Time's up!`}</p>

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
                  className="w-full py-3 px-6 text-lg font-semibold rounded-xl bg-purple-600 hover:bg-purple-700 text-white transition-colors"
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
                className="w-full py-3 px-6 text-lg font-semibold rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white transition-colors"
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
                  className="w-full py-3 px-6 text-lg font-semibold rounded-xl bg-purple-600 hover:bg-purple-700 text-white transition-colors"
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
    <div className="fixed inset-0 z-50 left-0 w-full h-full bg-gray-900 top-12">
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-900">
          <div className="flex flex-col items-center space-y-4">
            <div className="animate-spin rounded-full h-12 w-12 border-2 border-gray-600 border-t-purple-500"></div>
            <p className="text-gray-300">Loading game...</p>
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
