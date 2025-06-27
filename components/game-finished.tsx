'use client';

import { Button } from './ui/button';
import { Trophy, Loader2 } from 'lucide-react';
import { RoundResult } from './round-result';
import { Coin } from '@/lib/types';

interface GameFinishedProps {
  score: number;
  symbol: string;
  onSaveScore: () => void;
  isSaving: boolean;
  isSaved: boolean;
  error?: string | null;
  onShare: () => void;
  onExit: () => void;
  coin: Coin;
}

export function GameFinished({
  score,
  symbol,
  onSaveScore,
  isSaving,
  isSaved,
  error,
  onShare,
  onExit,
  coin,
}: GameFinishedProps) {
  if (error) {
    return (
      <RoundResult
        score={score}
        symbol={symbol}
        onShare={onShare}
        onExit={onExit}
        error={error}
        coin={coin}
      />
    );
  }

  if (isSaved) {
    return (
      <RoundResult
        score={score}
        symbol={symbol}
        onShare={onShare}
        onExit={onExit}
        coin={coin}
      />
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md">
      <div className="mx-4 w-full max-w-md space-y-8 rounded-3xl border border-white/20 bg-black/20 p-8 text-center shadow-2xl backdrop-blur-xl animate-in fade-in-0 zoom-in-95 duration-500">
        <div className="mx-auto w-fit animate-bounce text-6xl">
          <Trophy className="h-16 w-16 text-yellow-400" />
        </div>

        <div className="space-y-3">
          <h1 className="animate-pulse bg-gradient-to-r from-yellow-400 to-amber-400 bg-clip-text text-3xl font-bold text-transparent">
            Round Complete!
          </h1>
          <div className="relative">
            <div className="mb-2 text-4xl font-bold text-white">
              {score.toLocaleString()}
            </div>
            <div className="text-sm text-white/60">Points</div>
          </div>
        </div>

        <div className="space-y-4">
          <Button
            onClick={onSaveScore}
            disabled={isSaving || isSaved}
            className="flex w-full transform items-center justify-center gap-2 rounded-full border border-purple-400/30 bg-purple-500/20 px-6 py-4 text-lg font-semibold text-white backdrop-blur-sm transition-all duration-200 hover:scale-105 hover:border-purple-300/50 hover:bg-purple-400/30 hover:shadow-lg active:scale-95 disabled:scale-100 disabled:border-gray-500/30 disabled:bg-gray-800 disabled:text-gray-400 disabled:shadow-none disabled:hover:scale-100 disabled:hover:bg-gray-800"
          >
            {isSaving ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" />
                Saving...
              </>
            ) : (
              'Save Score'
            )}
          </Button>
        </div>

        <div className="text-sm font-medium text-white/50">
          Save your score to get{' '}
          <span className="font-bold text-white">
            {(score * coin.token_multiplier).toLocaleString()} ${symbol}
          </span>{' '}
          tokens.
        </div>
      </div>
    </div>
  );
}
