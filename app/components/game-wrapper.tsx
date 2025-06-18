'use client';

import { useState, useEffect, useRef } from 'react';
import { Info } from './info';
import { Game } from './game';
import { RoundResult } from './round-result';
import { GameFinished } from './game-finished';
import { Creator } from '@/lib/types';
import { ArrowLeft, Clock } from 'lucide-react';
import { Button } from './ui/button';
import { trackGameEvent, trackEvent } from '@/lib/posthog';
import { sentryTracker, setSentryTags } from '@/lib/sentry';
import { sdk } from '@farcaster/frame-sdk';
import { TOKEN_MULTIPLIER } from '@/lib/config';
import { usePlayStatus } from '@/hooks/usePlayStatus';

interface GameWrapperProps {
  id: string;
  name: string;
  description: string;
  timeoutSeconds?: number;
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
  timeoutSeconds = 10,
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
  const [remainingTime, setRemainingTime] = useState(timeoutSeconds);
  const [forceGameEnd, setForceGameEnd] = useState(false);
  const gameStartTime = useRef<number | null>(null);
  const [isCreatingScore, setIsCreatingScore] = useState(false);
  const [isScoreCreated, setIsScoreCreated] = useState(false);
  const [gameFinished, setGameFinished] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const { playStatus } = usePlayStatus();

  console.log('coinId', coinId);

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
  const handleGameStart = () => {
    try {
      gameStartTime.current = Date.now();
      setForceGameEnd(false);
      setFinalScore(0);
      setShowGame(true);
    } catch (error) {
      console.error('Failed to start game:', error);
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
  const handleGameExit = () => {
    try {
      const sessionTime = gameStartTime.current
        ? Math.round((Date.now() - gameStartTime.current) / 1000)
        : 0;

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
        finalScore * TOKEN_MULTIPLIER
      ).toLocaleString()} $${symbol} tokens playing ${name}!\n\nThink you can beat my score? 🎯`;

      // Use Farcaster SDK to compose cast
      await sdk.actions.composeCast({
        text: shareText,
        embeds: [window.location.href],
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

  // Timer with forced timeout after 10 seconds
  useEffect(() => {
    if (!showGame || !timeoutSeconds) return;

    setRemainingTime(timeoutSeconds);
    const interval = setInterval(() => {
      setRemainingTime((prev) => {
        if (prev <= 1) {
          // Signal the Game component to end itself
          console.log('⏰ GameWrapper: Time up, signaling game to end');
          setForceGameEnd(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [showGame, timeoutSeconds, finalScore]);

  if (showResult) {
    return (
      <RoundResult
        score={finalScore}
        onShare={handleShare}
        onExit={handleExit}
        symbol={symbol}
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
      />
    );
  }

  if (showGame) {
    return (
      <div className="flex flex-col h-full relative z-50">
        <div className="fixed top-4 left-4 z-50 flex items-center gap-3 rounded-full px-4 py-2 shadow-lg">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleGameExit}
            className="flex items-center gap-2 text-white/70 hover:brightness-110 transition-all duration-200 p-0 h-auto"
          >
            <ArrowLeft size={18} />
            <span className="text-sm">Exit</span>
          </Button>

          {timeoutSeconds && (
            <div className="flex items-center gap-2 text-white/70 border-l border-white/20 pl-3">
              <Clock size={14} />
              <span className="text-sm font-mono">
                {Math.floor(remainingTime / 60)}:
                {(remainingTime % 60).toString().padStart(2, '0')}
              </span>
            </div>
          )}
        </div>
        <div className="flex-1">
          <Game
            id={id}
            timeoutSeconds={timeoutSeconds}
            coinAddress={coinAddress}
            coinId={coinId}
            onRoundComplete={handleRoundComplete}
            forceEnd={forceGameEnd}
            hasPlayedBefore={playStatus?.hasPlayed ?? false}
          />
        </div>
      </div>
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
    />
  );
}
