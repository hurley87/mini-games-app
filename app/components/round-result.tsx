'use client';

import { Share2, Home, RotateCcw } from 'lucide-react';

interface RoundResultProps {
  score: number;
  onShare: () => void;
  onPlayAgain: () => void;
  onExit?: () => void;
}

export function RoundResult({
  score,
  onShare,
  onPlayAgain,
  onExit,
}: RoundResultProps) {
  // Determine score tier for different animations/messages
  const getScoreData = (score: number) => {
    if (score >= 100)
      return { tier: 'legendary', emoji: '🔥', message: 'Legendary!' };
    if (score >= 50)
      return { tier: 'amazing', emoji: '⭐', message: 'Amazing!' };
    if (score >= 25)
      return { tier: 'great', emoji: '🎉', message: 'Great job!' };
    if (score >= 10)
      return { tier: 'good', emoji: '👍', message: 'Nice work!' };
    return { tier: 'tryagain', emoji: '💪', message: 'Keep trying!' };
  };

  const scoreData = getScoreData(score);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md">
      <div className="text-center p-8 rounded-3xl bg-black/20 backdrop-blur-xl border border-white/20 shadow-2xl max-w-md w-full mx-4 space-y-8 animate-in fade-in-0 zoom-in-95 duration-500">
        {/* Animated emoji */}
        <div className="text-6xl animate-bounce">{scoreData.emoji}</div>

        {/* Title and score */}
        <div className="space-y-3">
          <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-pink-400 animate-pulse">
            Round Complete!
          </h1>
          <p className="text-lg text-white/80 font-medium">
            {scoreData.message}
          </p>
          <div className="relative">
            <div className="text-4xl font-bold text-white mb-2">
              {score.toLocaleString()}
            </div>
            <div className="text-sm text-white/60">Points</div>
            {/* Sparkle effect for high scores */}
            {score >= 50 && (
              <div className="absolute -top-2 -right-2 text-yellow-400 animate-ping">
                ✨
              </div>
            )}
          </div>
        </div>

        {/* Action buttons */}
        <div className="space-y-4">
          {/* Primary actions */}
          <div className="flex justify-center gap-3">
            <button
              onClick={onShare}
              className="flex items-center gap-2 px-6 py-3 text-sm font-semibold rounded-full bg-purple-500/20 backdrop-blur-sm border border-purple-400/30 text-white hover:bg-purple-400/30 hover:border-purple-300/50 transition-all duration-200 transform hover:scale-105 hover:shadow-lg active:scale-95"
            >
              <Share2 className="w-4 h-4" />
              Share Score
            </button>
            <button
              onClick={onPlayAgain}
              className="flex items-center gap-2 px-6 py-3 text-sm font-semibold rounded-full bg-emerald-500/20 backdrop-blur-sm border border-emerald-400/30 text-white hover:bg-emerald-400/30 hover:border-emerald-300/50 transition-all duration-200 transform hover:scale-105 hover:shadow-lg active:scale-95"
            >
              <RotateCcw className="w-4 h-4" />
              Play Again
            </button>
          </div>

          {/* Exit button */}
          <button
            onClick={onExit}
            className="flex items-center justify-center gap-2 w-full px-4 py-2 text-sm font-medium rounded-full text-white/70 hover:text-white hover:bg-white/10 transition-all duration-200 border border-white/20 hover:border-white/40"
          >
            <Home className="w-4 h-4" />
            Back to Games
          </button>
        </div>

        {/* Fun footer message */}
        <div className="text-xs text-white/50 font-medium">
          {score >= 50 ? "You're on fire! 🔥" : 'Practice makes perfect! 💫'}
        </div>
      </div>
    </div>
  );
}
