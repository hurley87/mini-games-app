'use client';

import { Share2 } from 'lucide-react';

interface RoundResultProps {
  score: number;
  onShare: () => void;
  onPlayAgain: () => void;
}

export function RoundResult({ score, onShare, onPlayAgain }: RoundResultProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm">
      <div className="text-center p-8 rounded-2xl bg-black/80 backdrop-blur border border-white/20 shadow-xl max-w-md w-full mx-4 space-y-6">
        <div>
          <h1 className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-pink-500 mb-2">
            Round Complete
          </h1>
          <p className="text-xl text-white/70">Score: {score}</p>
        </div>
        <div className="flex justify-center gap-3">
          <button
            onClick={onShare}
            className="flex items-center gap-2 px-4 py-3 text-sm font-semibold rounded-full bg-purple-600 text-white hover:brightness-110 transition-all duration-200"
          >
            <Share2 className="w-4 h-4" />
            Share
          </button>
          <button
            onClick={onPlayAgain}
            className="px-4 py-3 text-sm font-semibold rounded-full bg-emerald-600 text-white hover:brightness-110 transition-all duration-200"
          >
            Play Again
          </button>
        </div>
      </div>
    </div>
  );
}
