'use client';

import { useState, useEffect, useRef } from 'react';
import { Info } from './info';
import { Game } from './game';
import { RoundResult } from './round-result';
import { GameFinished } from './game-finished';
import { Creator, Coin } from '@/lib/types';
import { ArrowLeft, Clock, Target, Trophy } from 'lucide-react';
import { Button } from './ui/button';
import { trackGameEvent, trackEvent } from '@/lib/posthog';
import { sentryTracker, setSentryTags } from '@/lib/sentry';
import { sdk } from '@farcaster/frame-sdk';
import { usePlayStatus } from '@/hooks/usePlayStatus';
import { LoadingSpinner } from './ui/loading-spinner';

interface GameWrapperProps {
  id: string;
  name: string;
  description: string;
  timeoutSeconds: number;
  coinAddress: string;
  imageUrl?: string;
  symbol: string;
  fid: number;
  creator?: Creator;
  coinId: string;
}

export function GameWrapper({
  id,
  name,
  description,
  timeoutSeconds,
  coinAddress,
  imageUrl,
  symbol,
  fid,
  creator,
  coinId,
}: GameWrapperProps) {
  const [showGame, setShowGame] = useState(false);
  const [showResult, setShowResult] = useState(false);
  const [finalScore, setFinalScore] = useState(0);
  const [currentScore, setCurrentScore] = useState(0);
  const [maxPointsReached, setMaxPointsReached] = useState(false);
  const [remainingTime, setRemainingTime] = useState(timeoutSeconds);
  const [forceGameEnd, setForceGameEnd] = useState(false);
  const gameStartTime = useRef<number | null>(null);
  const [isCreatingScore, setIsCreatingScore] = useState(false);
  const [isScoreCreated, setIsScoreCreated] = useState(false);
  const [gameFinished, setGameFinished] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [reservationId, setReservationId] = useState<string | null>(null);
  const [coin, setCoin] = useState<Coin | null>(null);
  const [coinLoading, setCoinLoading] = useState(true);
  const [walletBalance, setWalletBalance] = useState<number | null>(null);
  const { playStatus } = usePlayStatus();

  console.log('coinId', coinId);

  // Fetch coin data
  useEffect(() => {
    const fetchCoinData = async () => {
      try {
        setCoinLoading(true);
        const response = await fetch(`/api/coins/${coinId}`);
        if (!response.ok) {
          throw new Error('Failed to fetch coin data');
        }
        const coinData = await response.json();
        setCoin(coinData);
      } catch (error) {
        console.error('Error fetching coin data:', error);
        sentryTracker.gameError(
          error instanceof Error
            ? error
            : new Error('Failed to fetch coin data'),
          {
            game_id: id,
            game_name: name,
            coin_address: coinAddress,
            action: 'fetch_coin_data',
          }
        );
      } finally {
        setCoinLoading(false);
      }
    };

    if (coinId) {
      fetchCoinData();
    }
  }, [coinId, id, name, coinAddress]);

  // Fetch game wallet balance once coin data is loaded
  useEffect(() => {
    const fetchWalletBalance = async () => {
      if (!coin?.wallet_address || !coin.coin_address) return;
      try {
        const response = await fetch('/api/wallet-balance', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            coinAddress: coin.coin_address,
            walletAddress: coin.wallet_address,
          }),
        });
        if (!response.ok) {
          throw new Error('Failed to fetch wallet balance');
        }
        const data = await response.json();
        setWalletBalance(parseFloat(data.balance));
      } catch (err) {
        console.error('Error fetching wallet balance:', err);
      }
    };

    fetchWalletBalance();
  }, [coin]);

  const handleScoreUpdate = (score: number) => {
    try {
      setCurrentScore(score);

      // Check if max points reached for the first time
      if (coin?.max_points && score >= coin.max_points && !maxPointsReached) {
        setMaxPointsReached(true);

        // Trigger haptic feedback for success
        try {
          sdk.haptics.impactOccurred('heavy');
        } catch (error) {
          console.error('Error triggering success haptic:', error);
        }
      }
    } catch (error) {
      console.error('Error updating current score:', error);
    }
  };

  const handleRoundComplete = (score: number) => {
    try {
      console.log('🎮 GameWrapper: Round complete with score:', score);

      const sessionTime = gameStartTime.current
        ? Math.round((Date.now() - gameStartTime.current) / 1000)
        : 0;

      setFinalScore(score);
      setShowGame(false);
      setGameFinished(true);

      trackGameEvent.gameComplete(id, name, score, sessionTime);
    } catch (error) {
      sentryTracker.gameError(
        error instanceof Error
          ? error
          : new Error('Failed to track round complete'),
        {
          game_id: id,
          game_name: name,
          coin_address: coinAddress,
          action: 'round_complete',
        }
      );
    }
  };

  // Set Sentry context for this game
  useEffect(() => {
    setSentryTags({
      game_id: id,
      game_name: name,
      coin_address: coinAddress,
      creator_fid: fid.toString(),
    });
  }, [id, name, coinAddress, fid]);

  // Handle game start
  const handleGameStart = async () => {
    try {
      console.log('🎮 GameWrapper: Starting game - clearing all states');

      // Check if play is allowed
      if (playStatus?.reason === 'daily_limit_reached') {
        console.log('🚫 GameWrapper: Cannot start game - daily limit reached');
        return;
      }

      // Reserve a play slot before starting the game
      console.log('🎯 GameWrapper: Reserving play slot...');
      const reserveResponse = await sdk.quickAuth.fetch(
        `${process.env.NEXT_PUBLIC_URL}/api/reserve-play`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            coinId,
          }),
        }
      );

      if (!reserveResponse.ok) {
        const errorData = await reserveResponse.json();
        console.error(
          '🚫 GameWrapper: Failed to reserve play slot:',
          errorData
        );

        if (reserveResponse.status === 429) {
          // Daily limit reached
          setSaveError(errorData.error || 'Daily play limit reached');
        } else {
          setSaveError(errorData.error || 'Failed to start game');
        }
        return;
      }

      const reserveData = await reserveResponse.json();
      const playReservationId = reserveData.reservationId;

      console.log('✅ GameWrapper: Play slot reserved:', playReservationId);
      setReservationId(playReservationId);

      // Clear any conflicting states first
      setShowResult(false);
      setGameFinished(false);
      setIsScoreCreated(false);
      setSaveError(null);
      setIsCreatingScore(false);

      // Reset game state
      gameStartTime.current = Date.now();
      setForceGameEnd(false);
      setFinalScore(0);
      setCurrentScore(0);
      setMaxPointsReached(false);

      // Force a small delay to ensure state cleanup, then show game
      setTimeout(() => {
        console.log('🎮 GameWrapper: Setting showGame to true');
        setShowGame(true);
      }, 10);
    } catch (error) {
      console.error('Failed to start game:', error);
      setSaveError('Failed to start game. Please try again.');
      sentryTracker.gameError(
        error instanceof Error ? error : new Error('Failed to start game'),
        {
          game_id: id,
          game_name: name,
          coin_address: coinAddress,
          action: 'start_game',
        }
      );
    }
  };

  // Handle game exit
  const handleGameExit = async () => {
    try {
      const sessionTime = gameStartTime.current
        ? Math.round((Date.now() - gameStartTime.current) / 1000)
        : 0;

      // Release the play reservation if we have one
      if (reservationId) {
        try {
          console.log(
            '🎯 GameWrapper: Releasing play reservation on exit:',
            reservationId
          );
          await sdk.quickAuth.fetch(
            `${process.env.NEXT_PUBLIC_URL}/api/release-play`,
            {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                coinId,
                reservationId,
              }),
            }
          );
          setReservationId(null);
        } catch (releaseError) {
          console.error('Failed to release play reservation:', releaseError);
          // Non-critical error - reservation will expire automatically
        }
      }

      setShowGame(false);
      setShowResult(false);

      // Track game exit
      trackGameEvent.gameExit(id, name, sessionTime);

      gameStartTime.current = null;
    } catch (error) {
      sentryTracker.gameError(
        error instanceof Error ? error : new Error('Failed to track game exit'),
        {
          game_id: id,
          game_name: name,
          coin_address: coinAddress,
          action: 'exit_game',
        }
      );
    }
  };

  // Handle share functionality
  const handleShare = async () => {
    try {
      const scoreEmoji =
        finalScore >= 50
          ? '🔥'
          : finalScore >= 25
            ? '⭐'
            : finalScore >= 10
              ? '🎉'
              : '🎮';
      const shareText = `${scoreEmoji} Just earned ${(
        finalScore * (coin?.token_multiplier || 1000)
      ).toLocaleString()} $${symbol} tokens playing ${name}!\n\nThink you can beat my score? 🎯`;

      // Use Farcaster SDK to compose cast
      await sdk.actions.composeCast({
        text: shareText,
        embeds: [`${process.env.NEXT_PUBLIC_URL}/coins/${coinId}`],
      });

      // Track share action using custom event
      trackEvent('game_result_shared', {
        game_id: id,
        game_name: name,
        score: finalScore,
        coin_address: coinAddress,
      });
    } catch (error) {
      console.error('Failed to share:', error);
      sentryTracker.gameError(
        error instanceof Error ? error : new Error('Failed to share result'),
        {
          game_id: id,
          game_name: name,
          coin_address: coinAddress,
          action: 'share_result',
        }
      );
    }
  };

  // Handle exit to games list
  const handleExit = () => {
    try {
      // Track exit action
      trackEvent('game_result_exit', {
        game_id: id,
        game_name: name,
        final_score: finalScore,
        coin_address: coinAddress,
      });

      // Navigate to home/games list
      window.location.href = '/';
    } catch (error) {
      sentryTracker.gameError(
        error instanceof Error ? error : new Error('Failed to exit game'),
        {
          game_id: id,
          game_name: name,
          coin_address: coinAddress,
          action: 'exit_result',
        }
      );
    }
  };

  const handleCreateScore = async () => {
    const response = await sdk.quickAuth.fetch(
      `${process.env.NEXT_PUBLIC_URL}/api/award`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          coinId: coinId,
          score: finalScore,
        }),
      }
    );

    if (response.ok) {
      return; // Success case
    }

    // Handle error cases
    let errorMessage: string | null = null;
    try {
      const errorData = await response.json();
      if (errorData.error) {
        errorMessage = errorData.error;
      }
    } catch (e) {
      // JSON parsing failed or no 'error' field in response
      console.error('Could not parse error response:', e);
    }

    if (errorMessage) {
      throw new Error(errorMessage);
    }

    // Fallback to status text if no JSON error message is found
    if (response.status === 404) {
      throw new Error('Award service is unavailable. Please try again later.');
    }

    throw new Error(
      `An unexpected error occurred: ${response.status} ${response.statusText}`
    );
  };

  const handleSaveScore = async () => {
    setIsCreatingScore(true);
    setSaveError(null);
    try {
      await handleCreateScore();
      setIsScoreCreated(true);
      setShowResult(true);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'An unknown error occurred.';
      setSaveError(errorMessage);
      console.error('Failed to save score:', error);
      sentryTracker.gameError(
        error instanceof Error ? error : new Error('Failed to save score'),
        {
          game_id: id,
          game_name: name,
          coin_address: coinAddress,
          action: 'create_score',
        }
      );
    } finally {
      setIsCreatingScore(false);
    }
  };

  // Timer with forced timeout
  useEffect(() => {
    if (!showGame) return;

    setRemainingTime(timeoutSeconds);
    const interval = setInterval(() => {
      setRemainingTime((prev) => {
        const currentTime = prev ?? 0;
        if (currentTime <= 1) {
          // Signal the Game component to end itself
          console.log('⏰ GameWrapper: Time up, signaling game to end');
          setForceGameEnd(true);
          return 0;
        }
        return currentTime - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [showGame, timeoutSeconds, finalScore]);

  // Debug logging for state changes
  useEffect(() => {
    console.log('🎮 GameWrapper State:', {
      showGame,
      showResult,
      gameFinished,
      isCreatingScore,
      isScoreCreated,
      coinLoading,
      hasCoin: !!coin,
    });
  }, [
    showGame,
    showResult,
    gameFinished,
    isCreatingScore,
    isScoreCreated,
    coinLoading,
    coin,
  ]);

  // Show loading state while fetching coin data
  if (coinLoading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="flex flex-col items-center space-y-4">
          <LoadingSpinner />
          <div className="text-white/70">Loading game data...</div>
        </div>
      </div>
    );
  }

  // Show error if coin data failed to load
  if (!coin) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center p-8">
          <div className="text-red-400 font-medium mb-2">Error</div>
          <div className="text-white/70">Failed to load game configuration</div>
        </div>
      </div>
    );
  }

  // Render logic with defensive checks
  // Prioritize showGame when it's true to prevent navigation issues
  if (showGame) {
    console.log('🎮 GameWrapper: Rendering game interface');
    return (
      <div className="flex flex-col h-full relative z-50">
        {/* Left side: Exit button and Timer */}
        <div className="fixed top-4 left-4 z-50 flex items-center gap-3 rounded-full px-4 py-2 shadow-lg bg-black/50 backdrop-blur-sm">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleGameExit}
            className="flex items-center gap-2 text-white/70 hover:brightness-110 transition-all duration-200 p-0 h-auto"
          >
            <ArrowLeft size={18} />
            <span className="text-sm">Exit</span>
          </Button>

          <div className="flex items-center gap-2 text-white/70 border-l border-white/20 pl-3">
            <Clock size={14} />
            <span className="text-sm font-mono">
              {Math.floor((remainingTime ?? 0) / 60)}:
              {((remainingTime ?? 0) % 60).toString().padStart(2, '0')}
            </span>
          </div>
        </div>

        {/* Right side: Points display */}
        <div className="fixed top-4 right-4 z-50 rounded-full px-4 py-2 shadow-lg bg-black/50 backdrop-blur-sm">
          <div className="flex items-center gap-2 text-white">
            <div
              className={`flex items-center gap-2 transition-all duration-300 ${
                maxPointsReached
                  ? 'text-yellow-400 animate-pulse'
                  : 'text-white/70'
              }`}
            >
              {maxPointsReached ? (
                <>
                  <Trophy size={14} className="animate-bounce" />
                  <span className="text-sm font-bold">MAX REACHED! 🎉</span>
                </>
              ) : (
                <>
                  <Target size={14} />
                  <span className="text-sm font-mono">
                    {currentScore.toLocaleString()}/
                    {coin?.max_points?.toLocaleString() || '∞'}
                  </span>
                </>
              )}
            </div>
          </div>
        </div>

        <div className="flex-1">
          <Game
            id={id}
            timeoutSeconds={timeoutSeconds}
            coinAddress={coinAddress}
            coinId={coinId}
            onRoundComplete={handleRoundComplete}
            onScoreUpdate={handleScoreUpdate}
            forceEnd={forceGameEnd}
            hasPlayedBefore={playStatus?.hasPlayed ?? false}
            coin={coin}
          />
        </div>
      </div>
    );
  }

  if (showResult) {
    return (
      <RoundResult
        score={finalScore}
        onShare={handleShare}
        onExit={handleExit}
        symbol={symbol}
        coin={coin}
      />
    );
  }

  if (gameFinished) {
    return (
      <GameFinished
        score={finalScore}
        symbol={symbol}
        onSaveScore={handleSaveScore}
        isSaving={isCreatingScore}
        isSaved={isScoreCreated}
        error={saveError}
        onShare={handleShare}
        onExit={handleExit}
        coin={coin}
      />
    );
  }

  return (
    <Info
      name={name}
      description={description}
      coinAddress={coinAddress}
      imageUrl={imageUrl}
      symbol={symbol}
      fid={fid}
      creator={creator}
      onPlay={handleGameStart}
      coinId={coinId}
      coin={coin}
      walletBalance={walletBalance}
      walletAddress={coin?.wallet_address}
    />
  );
}
