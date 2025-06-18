'use client';

import { useState, useEffect } from 'react';
import { useFarcasterContext } from '@/hooks/useFarcasterContext';
import { usePlayStatus } from '@/hooks/usePlayStatus';
import { useAccount, useConnect } from 'wagmi';
import { Creator } from '@/lib/types';
import { Coins, Share2 } from 'lucide-react';
import {
  formatTokenBalance,
  handleViewCoin,
  formatTimeUntil,
} from '@/lib/utils';
import { sdk } from '@farcaster/frame-sdk';
import { Header } from './header';
import { CoinLeaderboard } from './coin-leaderboard';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { PREMIUM_THRESHOLD, TOKEN_MULTIPLIER } from '@/lib/config';
import { BottomNav } from './bottom-nav';

interface InfoProps {
  name: string;
  description: string;
  coinAddress: string;
  imageUrl?: string; // Optional game image
  symbol: string;
  fid: number;
  creator?: Creator;
  onPlay: () => void;
  coinId: string;
}

export function Info({
  name,
  description,
  coinAddress,
  imageUrl,
  symbol,
  fid,
  creator,
  onPlay,
  coinId,
}: InfoProps) {
  const { isReady } = useFarcasterContext({ autoAddFrame: true });
  const { playStatus, isLoading, error, checkPlayStatus } = usePlayStatus();
  const [hasCheckedStatus, setHasCheckedStatus] = useState(false);
  const { isConnected, address } = useAccount();
  const { connectors, connect } = useConnect();

  const handleSwap = async () => {
    await sdk.actions.swapToken({
      sellToken: '0x0000000000000000000000000000000000000000',
      buyToken: `eip155:8453/erc20:${coinAddress}`,
    });
  };

  useEffect(() => {
    console.log('INFO');
    console.log('coinId', coinId);
    console.log('coinAddress', coinAddress);
    console.log('hasCheckedStatus', hasCheckedStatus);
    console.log('isReady', isReady);

    if (isReady && !hasCheckedStatus && coinId && coinAddress) {
      checkPlayStatus(coinId, coinAddress);
      setHasCheckedStatus(true);
    }
  }, [isReady, hasCheckedStatus, coinId, coinAddress, checkPlayStatus]);

  // Re-check play status when wallet connection changes
  useEffect(() => {
    if (
      isReady &&
      hasCheckedStatus &&
      coinId &&
      coinAddress &&
      playStatus &&
      !playStatus.canPlay
    ) {
      console.log('Wallet connection changed - re-checking play status');
      console.log('isConnected:', isConnected);
      console.log('address:', address);
      checkPlayStatus(coinId, coinAddress);
    }
  }, [
    isConnected,
    address,
    isReady,
    hasCheckedStatus,
    coinId,
    coinAddress,
    checkPlayStatus,
    playStatus,
  ]);

  const handleViewProfile = async () => {
    try {
      await sdk.actions.viewProfile({ fid });
    } catch (error) {
      console.error('Failed to view profile:', error);
    }
  };

  const handleShare = async () => {
    try {
      const tokenBalance = formatTokenBalance(playStatus?.tokenBalance);

      const shareText = `🎮 Playing ${name}!\n\n💰 ${tokenBalance} $${symbol} tokens\n\nJoin me in this epic mini game! 🚀`;

      await sdk.actions.composeCast({
        text: shareText,
        embeds: [`https://app.minigames.studio/coins/${coinId}`],
      });
    } catch (error) {
      console.error('Failed to share:', error);
    }
  };

  const handleViewCoinClick = async () => {
    await handleViewCoin(coinAddress, {
      element: 'coin_info',
      page: 'game_info',
    });
  };

  if (!name) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center p-4">
        <div className="bg-black/20 backdrop-blur rounded-2xl shadow-xl p-8 text-center max-w-md border border-white/20">
          <div className="text-white/70">Please enter a game name</div>
        </div>
      </div>
    );
  }

  if (!description) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center p-4">
        <div className="bg-black/20 backdrop-blur rounded-2xl shadow-xl p-8 text-center max-w-md border border-white/20">
          <div className="text-white/70">Please enter a game description</div>
        </div>
      </div>
    );
  }

  if (!isReady || isLoading || !hasCheckedStatus) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center p-4">
        <div className="bg-black/20 backdrop-blur rounded-2xl shadow-xl p-8 text-center max-w-md border border-white/20">
          <div className="flex flex-col items-center space-y-4">
            <LoadingSpinner className="h-8 w-8" />
            <div className="text-white/70">Loading...</div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center p-4">
        <div className="bg-black/20 backdrop-blur rounded-2xl shadow-xl p-8 text-center max-w-md border border-white/20">
          <div className="text-red-400 font-medium">Error</div>
          <div className="text-white/70 mt-2">{error}</div>
        </div>
      </div>
    );
  }

  if (!playStatus) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center p-4">
        <div className="bg-black/20 backdrop-blur rounded-2xl shadow-xl p-8 text-center max-w-md border border-white/20">
          <div className="text-white/70">Unable to check play status</div>
        </div>
      </div>
    );
  }

  // Show different UI based on play status
  if (!playStatus.canPlay) {
    return (
      <div className="min-h-screen bg-black">
        <div className="max-w-lg mx-auto bg-gradient-to-b from-black via-zinc-900 to-black pb-24">
          {/* Header with app icon and basic info */}
          <div className="p-6 border-b border-white/20">
            <div className="flex items-start space-x-4">
              {/* App Icon */}
              <div className="w-24 h-24 rounded-2xl overflow-hidden shadow-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center flex-shrink-0">
                {imageUrl ? (
                  <img
                    src={imageUrl}
                    alt={name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <svg
                    className="w-12 h-12 text-white"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z"
                      clipRule="evenodd"
                    />
                  </svg>
                )}
              </div>

              {/* App Info */}
              <div className="flex-1 min-w-0">
                {/* creator */}
                <div
                  onClick={handleViewProfile}
                  className="flex items-center gap-1 mb-1 cursor-pointer"
                >
                  <div className="w-8 h-8 rounded-full bg-white/10 overflow-hidden cursor-pointer">
                    {creator?.pfp ? (
                      <img
                        src={creator.pfp}
                        alt={`${creator.username || 'Creator'} profile`}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center">
                        <span className="text-white text-sm font-bold">
                          {creator?.username?.charAt(0)?.toUpperCase() || 'C'}
                        </span>
                      </div>
                    )}
                  </div>
                  <p className="text-sm font-medium text-white">
                    {creator?.username || `Creator ${fid}`}
                  </p>
                </div>
                <h1 className="text-2xl font-bold text-white leading-tight">
                  {name}
                </h1>

                <p
                  className="text-sm text-purple-400 mt-1 cursor-pointer"
                  onClick={handleViewCoinClick}
                >
                  ${symbol}
                </p>
              </div>
            </div>
          </div>

          {/* Description */}
          <div className="p-6 border-t border-white/20">
            <h2 className="text-lg font-semibold text-white mb-3">
              About this game
            </h2>
            <p className="text-sm text-white/70 leading-relaxed">
              {description}
            </p>
          </div>

          {/* Warning/Status Section */}
          {playStatus.reason === 'wait_for_free' && (
            <div className="p-6 bg-amber-900/30 border-b border-amber-700/30">
              <div className="flex items-start space-x-3">
                <div className="w-6 h-6 rounded-full bg-amber-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <svg
                    className="w-4 h-4 text-amber-400"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-amber-200">
                    Premium Access Required
                  </h3>
                  <p className="text-xs text-amber-300 mt-1">
                    You need at least {PREMIUM_THRESHOLD.toLocaleString()}{' '}
                    {symbol} tokens or wait{' '}
                    {formatTimeUntil(playStatus.nextFreePlayTime!)} for your
                    next free play.
                  </p>
                </div>
              </div>
            </div>
          )}

          {playStatus.reason === 'no_wallet' && (
            <div className="p-6 bg-blue-900/30 border-b border-blue-700/30">
              <div className="flex items-start space-x-3">
                <div className="w-6 h-6 rounded-full bg-blue-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <svg
                    className="w-4 h-4 text-blue-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                    />
                  </svg>
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-blue-200">
                    Connect Wallet
                  </h3>
                  <p className="text-xs text-blue-300 mt-1">
                    Connect your wallet to check token ownership and continue
                    playing.
                  </p>
                </div>
              </div>
            </div>
          )}

          {playStatus.reason === 'balance_check_failed' && (
            <div className="p-6 bg-red-900/30 border-b border-red-700/30">
              <div className="flex items-start space-x-3">
                <div className="w-6 h-6 rounded-full bg-red-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <svg
                    className="w-4 h-4 text-red-400"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-red-200">
                    Verification Failed
                  </h3>
                  <p className="text-xs text-red-300 mt-1">
                    Unable to verify token ownership. Please try again.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Action Button */}
          <div className="p-6 pt-0">
            {!isConnected ? (
              <button
                onClick={() => connect({ connector: connectors[0] })}
                className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-full transition-colors text-lg"
              >
                Connect Wallet
              </button>
            ) : (
              <div className="flex flex-col gap-4">
                <button
                  onClick={handleSwap}
                  className="px-4 py-4 rounded-full font-semibold shadow-xl shadow-purple-500/20 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white transition-all duration-200 text-lg w-full"
                >
                  Get {PREMIUM_THRESHOLD.toLocaleString()} ${symbol}
                </button>
                <div className="bg-gradient-to-r from-purple-900/40 to-blue-900/40 p-4 rounded-lg border border-purple-500/20">
                  <h3 className="text-sm font-semibold text-purple-200 mb-2">
                    🎮 Unlock Unlimited Access
                  </h3>
                  <p className="text-xs text-white/70 leading-relaxed mb-3">
                    Hold {PREMIUM_THRESHOLD.toLocaleString()} ${symbol} tokens
                    to enjoy unlimited gameplay with no waiting periods or
                    restrictions.
                  </p>
                  <div className="flex items-center gap-2 text-xs text-purple-300">
                    <span className="w-1.5 h-1.5 bg-purple-400 rounded-full"></span>
                    <span>Unlimited plays</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-purple-300">
                    <span className="w-1.5 h-1.5 bg-purple-400 rounded-full"></span>
                    <span>No cooldown periods</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-purple-300">
                    <span className="w-1.5 h-1.5 bg-purple-400 rounded-full"></span>
                    <span>Premium player status</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Coin Leaderboard */}
          <CoinLeaderboard coinId={coinId} symbol={symbol} limit={10} />
        </div>
        <BottomNav />
      </div>
    );
  }

  // Player can play - show the normal play button
  return (
    <div className="min-h-screen bg-black">
      <Header />
      <div className="max-w-lg mx-auto bg-gradient-to-b from-black via-zinc-900 to-black pt-14 pb-24">
        {/* Header with app icon and basic info */}
        <div className="p-6 border-b border-white/20">
          <div className="flex items-start space-x-4">
            {/* App Icon */}
            <div className="w-24 h-24 rounded-2xl overflow-hidden shadow-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center flex-shrink-0">
              {imageUrl ? (
                <img
                  src={imageUrl}
                  alt={name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <svg
                  className="w-12 h-12 text-white"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z"
                    clipRule="evenodd"
                  />
                </svg>
              )}
            </div>

            {/* App Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1 mb-1">
                <div
                  onClick={handleViewProfile}
                  className="w-8 h-8 rounded-full bg-white/10 overflow-hidden cursor-pointer"
                >
                  {creator?.pfp ? (
                    <img
                      src={creator.pfp}
                      alt={`${creator.username || 'Creator'} profile`}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center">
                      <span className="text-white text-sm font-bold">
                        {creator?.username?.charAt(0)?.toUpperCase() || 'C'}
                      </span>
                    </div>
                  )}
                </div>
                <p className="text-sm font-medium text-white">
                  {creator?.username || `Creator ${fid}`}
                </p>
              </div>
              <h1 className="text-2xl font-bold text-white leading-tight">
                {name}
              </h1>
              <p
                className="text-sm text-purple-400 mt-1 cursor-pointer"
                onClick={handleViewCoinClick}
              >
                ${symbol}
              </p>
            </div>
          </div>
        </div>

        {/* Description */}
        {!isConnected ? (
          <div className="py-6">
            <button
              onClick={() => connect({ connector: connectors[0] })}
              className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-full transition-colors text-lg"
            >
              Connect Wallet
            </button>
          </div>
        ) : (
          <div className="p-6 border-t border-white/20 flex flex-col gap-6 items-center">
            <p className="text-sm text-white/70 leading-relaxed">
              {description}
            </p>
            <button
              onClick={onPlay}
              className="w-full bg-purple-600 text-white px-4 py-4 rounded-full font-semibold shadow-xl shadow-purple-500/20 hover:brightness-110 transition-all duration-200 text-lg"
            >
              PLAY
            </button>
          </div>
        )}

        {/* Status indicators */}
        {(!playStatus.hasPlayed || playStatus.reason === 'daily_free') &&
          playStatus.reason !== 'has_tokens' && (
            <div className="p-6 bg-green-900/30 border-b border-green-700/30">
              <div className="flex items-start space-x-3">
                <div className="w-6 h-6 rounded-full bg-green-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <svg
                    className="w-4 h-4 text-green-400"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-green-200">
                    Free Trial Available
                  </h3>
                  <p className="text-xs text-green-300 mt-1">
                    {playStatus.reason === 'daily_free'
                      ? 'Your daily free play is ready!'
                      : 'Play for free on your first attempt!'}
                  </p>
                </div>
              </div>
            </div>
          )}

        {playStatus.reason === 'has_tokens' && (
          <div className="p-6 bg-blue-900/30 border-b border-blue-700/30">
            <div className="flex items-start space-x-3">
              <div className="w-6 h-6 rounded-full bg-blue-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                <svg
                  className="w-4 h-4 text-blue-400"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <div className="flex-1">
                <h3 className="text-sm font-semibold text-blue-200">
                  Premium Player
                </h3>
                <p className="text-xs text-blue-300 mt-1">
                  You own ${symbol} tokens - enjoy unlimited access!
                </p>

                {/* Player Stats */}
                <div className="flex items-center gap-4 mt-3">
                  {/* Token Balance */}
                  <div className="flex items-center gap-1.5">
                    <Coins className="w-4 h-4 text-blue-400" />
                    <div className="text-xs">
                      <span className="text-blue-300 font-medium">
                        {formatTokenBalance(playStatus.tokenBalance)} ${symbol}
                      </span>
                    </div>
                  </div>

                  {/* Share Button */}
                  <button
                    onClick={handleShare}
                    className="flex items-center justify-center gap-2 py-1 px-3 bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium rounded-full transition-colors"
                  >
                    <Share2 className="w-3.5 h-3.5" />
                    Share
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Rewards & Configuration Section */}
        <div className="p-6 bg-gradient-to-r from-yellow-900/20 to-orange-900/20 border-b border-yellow-700/30">
          <div className="flex items-start space-x-3">
            <div className="w-6 h-6 rounded-full bg-yellow-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
              <Coins className="w-4 h-4 text-yellow-400" />
            </div>
            <div className="flex-1">
              <h3 className="text-sm font-semibold text-yellow-200 mb-3">
                Settings
              </h3>

              {/* Environment Variables */}
              <div className="space-y-2 text-xs">
                <div className="flex justify-between items-center py-1 px-2 bg-black/20 rounded">
                  <span className="text-yellow-300/70">Token Multiplier:</span>
                  <span className="text-yellow-200 font-mono">
                    {TOKEN_MULTIPLIER.toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between items-center py-1 px-2 bg-black/20 rounded">
                  <span className="text-yellow-300/70">Premium Threshold:</span>
                  <span className="text-yellow-200 font-mono">
                    {PREMIUM_THRESHOLD.toLocaleString()} ${symbol}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Coin Leaderboard */}
        <CoinLeaderboard coinId={coinId} symbol={symbol} limit={10} />
      </div>
      <BottomNav />
    </div>
  );
}
