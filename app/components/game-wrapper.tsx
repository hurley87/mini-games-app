'use client';

import { useState, useEffect, useRef } from 'react';
import { Info } from './info';
import { Game } from './game';
import { RoundResult } from './round-result';
import { getCoin } from '@zoralabs/coins-sdk';
import { base } from 'viem/chains';
import { ZoraCoinData, Creator } from '@/lib/types';
import { ArrowLeft, Clock } from 'lucide-react';
import { Button } from './ui/button';
import { trackGameEvent, trackEvent } from '@/lib/posthog';
import { sentryTracker, setSentryTags } from '@/lib/sentry';
import { sdk } from '@farcaster/frame-sdk';

interface GameWrapperProps {
  id: string;
  name: string;
  description: string;
  timeoutSeconds?: number;
  coinAddress: string;
  imageUrl?: string;
  symbol: string;
  zoraData?: ZoraCoinData;
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
  zoraData,
  fid,
  creator,
  coinId,
}: GameWrapperProps) {
  const [showGame, setShowGame] = useState(false);
  const [showResult, setShowResult] = useState(false);
  const [finalScore, setFinalScore] = useState(0);
  const [fetchedZoraData, setFetchedZoraData] = useState<
    ZoraCoinData | undefined
  >(zoraData);
  const [isLoadingZoraData, setIsLoadingZoraData] = useState(false);
  const [remainingTime, setRemainingTime] = useState(timeoutSeconds);
  const [forceGameEnd, setForceGameEnd] = useState(false);
  const gameStartTime = useRef<number | null>(null);

  const handleRoundComplete = (score: number) => {
    try {
      console.log('🎮 GameWrapper: Round complete with score:', score);

      const sessionTime = gameStartTime.current
        ? Math.round((Date.now() - gameStartTime.current) / 1000)
        : 0;

      setFinalScore(score);
      setShowGame(false);
      setShowResult(true);

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

  // Fetch Zora data if not provided
  useEffect(() => {
    async function fetchZoraCoinData() {
      if (fetchedZoraData || !coinAddress) return;

      setIsLoadingZoraData(true);
      try {
        const response = await getCoin({
          address: coinAddress,
          chain: base.id,
        });

        const zoraCoin = response.data?.zora20Token;
        if (zoraCoin) {
          setFetchedZoraData({
            volume24h: zoraCoin.volume24h,
            marketCap: zoraCoin.marketCap,
            uniqueHolders: zoraCoin.uniqueHolders,
          });
        }
      } catch (error) {
        console.error(
          `Failed to fetch Zora data for coin ${coinAddress}:`,
          error
        );

        trackGameEvent.error('zora_fetch_error', 'Failed to fetch Zora data', {
          coin_address: coinAddress,
          coin_name: name,
          error: error instanceof Error ? error.message : 'Unknown error',
        });

        sentryTracker.web3Error(
          error instanceof Error
            ? error
            : new Error('Failed to fetch Zora data'),
          {
            action: 'fetch_zora_data',
            coin_address: coinAddress,
          }
        );
      } finally {
        setIsLoadingZoraData(false);
      }
    }

    fetchZoraCoinData();
  }, [coinAddress, fetchedZoraData, name]);

  // Handle game start
  const handleGameStart = () => {
    try {
      gameStartTime.current = Date.now();
      setShowGame(true);
      setForceGameEnd(false); // Reset force end flag
      setFinalScore(0); // Reset score

      // Track game start
      trackGameEvent.gameStart(id, name, coinAddress);
    } catch (error) {
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
      const shareText = `${scoreEmoji} Just scored ${finalScore} points playing ${name}!\n\nThink you can beat my score? 🎯`;

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
  }, [showGame, timeoutSeconds, finalScore, id, name]);

  if (isLoadingZoraData) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="flex flex-col items-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-2 border-gray-600 border-t-purple-500"></div>
          <div className="text-white/70">Loading...</div>
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
      />
    );
  }

  if (showGame) {
    return (
      <div className="flex flex-col h-full">
        <header className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between p-2 backdrop-blur-md bg-black/20 border-b border-white/20 shadow-xl">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleGameExit}
            className="flex items-center gap-2 text-white/70 hover:brightness-110 transition-all duration-200"
          >
            <ArrowLeft size={20} />
            <span>Exit</span>
          </Button>

          {timeoutSeconds && (
            <div className="flex items-center gap-2 text-white/70">
              <Clock size={16} />
              <span className="text-sm font-mono">
                {Math.floor(remainingTime / 60)}:
                {(remainingTime % 60).toString().padStart(2, '0')}
              </span>
            </div>
          )}
        </header>
        <div className="flex-1 pt-16">
          <Game
            id={id}
            timeoutSeconds={timeoutSeconds}
            coinAddress={coinAddress}
            coinId={coinId}
            onRoundComplete={handleRoundComplete}
            forceEnd={forceGameEnd}
          />
        </div>
      </div>
    );
  }

  return (
    <Info
      id={id}
      name={name}
      description={description}
      coinAddress={coinAddress}
      imageUrl={imageUrl}
      symbol={symbol}
      zoraData={fetchedZoraData}
      fid={fid}
      creator={creator}
      onPlay={handleGameStart}
      coinId={coinId}
    />
  );
}
