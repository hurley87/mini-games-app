'use client';

import { useEffect } from 'react';
import confetti from 'canvas-confetti';
import { Button } from './ui/button';

interface DailyStreakDialogProps {
  streak: number;
  onClaim: () => void;
}

export function DailyStreakDialog({ streak, onClaim }: DailyStreakDialogProps) {
  useEffect(() => {
    confetti({ particleCount: 100, spread: 70 });
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md">
      <div className="mx-4 w-full max-w-md space-y-6 rounded-3xl border border-white/20 bg-black/20 p-8 text-center shadow-2xl backdrop-blur-xl animate-in fade-in-0 zoom-in-95 duration-500">
        <h1 className="text-3xl font-bold bg-gradient-to-r from-orange-400 to-yellow-400 bg-clip-text text-transparent">
          {`Day ${streak} Streak!`}
        </h1>
        <Button onClick={onClaim} className="w-full rounded-full bg-purple-600 text-white hover:bg-purple-700">
          Claim Streak
        </Button>
      </div>
    </div>
  );
}
