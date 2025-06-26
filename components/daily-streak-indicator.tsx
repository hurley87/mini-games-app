'use client';

import { Flame } from 'lucide-react';
import { sdk } from '@farcaster/frame-sdk';
import { useDailyStreak } from '@/hooks/use-daily-streak';

export function DailyStreakIndicator() {
  const { data } = useDailyStreak(true);
  const streak = data?.streak ?? 0;

  const handleShare = async () => {
    try {
      await sdk.actions.composeCast({
        text: `I'm on a ${streak}-day streak at Mini Games!`,
        embeds: ['https://app.minigames.studio'],
      });
    } catch (error) {
      console.error('Failed to share streak:', error);
    }
  };

  return (
    <button
      onClick={handleShare}
      className="flex items-center gap-1 rounded-full bg-white/10 px-2 py-1 text-sm text-white hover:brightness-110 transition-all"
    >
      <Flame className="w-4 h-4 text-orange-400" />
      <span>{streak}</span>
    </button>
  );
}
