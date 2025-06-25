'use client';

import { useSignIn } from '@/hooks/use-sign-in';
import { useMiniApp } from '@/contexts/miniapp-context';
import type { ReactNode } from 'react';
import { LoadingSpinner } from './ui/loading-spinner';
import { useState, useEffect } from 'react';
import { DailyStreakDialog } from './daily-streak-dialog';

interface AppInitProps {
  children: ReactNode;
}

export function AppInit({ children }: AppInitProps) {
  const { context } = useMiniApp();
  const [hasInitialized, setHasInitialized] = useState(false);
  const [streak, setStreak] = useState<{ streak: number; claimed: boolean } | null>(null);
  const { isLoading, error, user } = useSignIn({
    autoSignIn: true,
    onSuccess: (user) => {
      console.log('User signed in successfully:', user.username);
    },
  });

  // Set initialized state after first render to prevent flash
  useEffect(() => {
    const timer = setTimeout(() => setHasInitialized(true), 100);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    const fetchStreak = async () => {
      try {
        const res = await fetch('/api/daily-streak', { method: 'POST' });
        if (res.ok) {
          const data = await res.json();
          setStreak(data);
        }
      } catch (err) {
        console.error('Failed to fetch daily streak', err);
      }
    };

    if (user && !streak) {
      fetchStreak();
    }
  }, [user, streak]);

  console.log('user', user);

  // Show loading state during initialization or while signing in
  if (!hasInitialized || isLoading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="flex flex-col items-center space-y-4">
          <LoadingSpinner />
          <div className="text-white/70">Loading...</div>
        </div>
      </div>
    );
  }

  // Show error state if sign-in failed
  if (error) {
    console.error('Sign-in error:', error);
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-white/70">Error signing in.</div>
      </div>
    );
  }

  // Only show the "Farcaster only" message if we're sure there's no user and not in a Farcaster context
  if (!user && !context?.user?.fid) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-white/70">
          The games are only available to users on Farcaster.
        </div>
      </div>
    );
  }

  return (
    <>
      {children}
      {streak && !streak.claimed && (
        <DailyStreakDialog
          streak={streak.streak}
          onClaim={async () => {
            try {
              await fetch('/api/daily-streak', { method: 'PUT' });
              setStreak({ ...streak, claimed: true });
            } catch (err) {
              console.error('Failed to claim streak', err);
            }
          }}
        />
      )}
    </>
  );
}
