'use client';

import { useState, useEffect } from 'react';
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
  DrawerFooter,
  DrawerTrigger,
} from '@/app/components/ui/drawer';
import { Button } from '@/app/components/ui/button';
import {
  PlayCircle,
  Coins,
  Trophy,
  Sparkles,
  ArrowRight,
  CheckCircle,
  Zap,
  Users,
} from 'lucide-react';
import { PREMIUM_THRESHOLD } from '@/lib/config';

const WELCOME_STORAGE_KEY = 'mini-games-welcome-seen';

interface WelcomeDialogProps {
  trigger?: React.ReactNode;
  onClose?: () => void;
}

export function WelcomeDialog({ trigger, onClose }: WelcomeDialogProps) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    // Only auto-open if no manual trigger is provided
    if (!trigger) {
      // Check if user has seen the welcome screen
      const hasSeenWelcome = localStorage.getItem(WELCOME_STORAGE_KEY);
      if (!hasSeenWelcome) {
        // Small delay to ensure smooth loading
        const timer = setTimeout(() => setOpen(true), 500);
        return () => clearTimeout(timer);
      }
    }
  }, [trigger]);

  const handleClose = () => {
    if (!trigger) {
      localStorage.setItem(WELCOME_STORAGE_KEY, 'true');
    }
    setOpen(false);
    onClose?.();
  };

  const handleOpenChange = (isOpen: boolean) => {
    if (isOpen) {
      setOpen(true);
    } else {
      handleClose();
    }
  };

  const content = (
    <DrawerContent className="max-h-[90vh] bg-gradient-to-b from-black via-zinc-900 to-black border-white/20">
      <DrawerHeader className="text-center pb-6">
        <DrawerTitle className="text-2xl font-bold text-white mb-2">
          Welcome to Mini Games Studio! 🎮
        </DrawerTitle>
        <DrawerDescription className="text-white/70 text-base">
          Play onchain games, earn tokens, and compete with the Farcaster
          community
        </DrawerDescription>
      </DrawerHeader>

      <div className="px-6 pb-6 space-y-6 overflow-y-auto max-h-[60vh]">
        {/* How It Works */}
        <section>
          <h3 className="text-lg font-bold text-white mb-3 flex items-center gap-2">
            <PlayCircle className="w-5 h-5 text-purple-400" />
            How It Works
          </h3>
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <div className="w-7 h-7 rounded-full bg-purple-500/20 flex items-center justify-center flex-shrink-0">
                <span className="text-sm font-bold text-purple-400">1</span>
              </div>
              <div>
                <p className="text-sm text-white/80">
                  <span className="font-semibold text-white">
                    Choose a game
                  </span>{' '}
                  from our collection of mini games
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-7 h-7 rounded-full bg-blue-500/20 flex items-center justify-center flex-shrink-0">
                <span className="text-sm font-bold text-blue-400">2</span>
              </div>
              <div>
                <p className="text-sm text-white/80">
                  <span className="font-semibold text-white">
                    Play & compete
                  </span>{' '}
                  to climb the leaderboard
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-7 h-7 rounded-full bg-emerald-500/20 flex items-center justify-center flex-shrink-0">
                <span className="text-sm font-bold text-emerald-400">3</span>
              </div>
              <div>
                <p className="text-sm text-white/80">
                  <span className="font-semibold text-white">Earn tokens</span>{' '}
                  sent directly to your wallet
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Key Features */}
        <section>
          <h3 className="text-lg font-bold text-white mb-3 flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-yellow-400" />
            Key Features
          </h3>
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-white/5 rounded-lg p-3 border border-white/10">
              <Coins className="w-5 h-5 text-emerald-400 mb-1" />
              <p className="text-xs font-medium text-white">Zora Tokens</p>
              <p className="text-xs text-white/60">Trade on Base</p>
            </div>
            <div className="bg-white/5 rounded-lg p-3 border border-white/10">
              <Trophy className="w-5 h-5 text-yellow-400 mb-1" />
              <p className="text-xs font-medium text-white">Leaderboards</p>
              <p className="text-xs text-white/60">Compete globally</p>
            </div>
            <div className="bg-white/5 rounded-lg p-3 border border-white/10">
              <Zap className="w-5 h-5 text-purple-400 mb-1" />
              <p className="text-xs font-medium text-white">Instant Play</p>
              <p className="text-xs text-white/60">No downloads</p>
            </div>
            <div className="bg-white/5 rounded-lg p-3 border border-white/10">
              <Users className="w-5 h-5 text-blue-400 mb-1" />
              <p className="text-xs font-medium text-white">Social</p>
              <p className="text-xs text-white/60">Share & compete</p>
            </div>
          </div>
        </section>

        {/* Premium Access */}
        <section>
          <h3 className="text-lg font-bold text-white mb-3 flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-yellow-400" />
            Premium Access
          </h3>
          <div className="bg-gradient-to-br from-yellow-900/20 to-orange-900/20 rounded-lg p-4 border border-yellow-500/20">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-white">
                  Free Play
                </span>
                <span className="text-xs text-white/70">Limited daily</span>
              </div>

              <div className="border-t border-white/10 pt-3">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-white">
                    Premium Play
                  </span>
                  <span className="text-xs font-bold text-yellow-400">
                    Unlimited
                  </span>
                </div>
                <p className="text-xs text-white/80 mb-2">
                  Hold{' '}
                  <span className="font-bold text-yellow-400">
                    {PREMIUM_THRESHOLD.toLocaleString('en-US')}
                  </span>{' '}
                  tokens of any game for:
                </p>
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-3 h-3 text-emerald-400" />
                    <span className="text-xs text-white/80">
                      Unlimited plays
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-3 h-3 text-emerald-400" />
                    <span className="text-xs text-white/80">
                      Priority access
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-3 h-3 text-emerald-400" />
                    <span className="text-xs text-white/80">
                      Exclusive tournaments
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>

      <DrawerFooter>
        <DrawerClose asChild>
          <Button className="bg-purple-600 hover:bg-purple-700 text-white font-semibold py-3 rounded-full transition-colors flex items-center justify-center gap-2">
            {trigger ? 'Got It' : 'Start Playing'}
            <ArrowRight className="w-4 h-4" />
          </Button>
        </DrawerClose>
      </DrawerFooter>
    </DrawerContent>
  );

  if (trigger) {
    return (
      <Drawer open={open} onOpenChange={handleOpenChange}>
        <DrawerTrigger asChild>{trigger}</DrawerTrigger>
        {content}
      </Drawer>
    );
  }

  return (
    <Drawer open={open} onOpenChange={handleOpenChange}>
      {content}
    </Drawer>
  );
}
