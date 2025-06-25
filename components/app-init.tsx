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
  const [streak, setStreak] = useState<{
    streak: number;
    claimed: boolean;
    fid?: number; // Track which FID this streak belongs to
  } | null>(null);
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
      if (!context?.user?.fid) {
        setStreak({ streak: 0, claimed: true, fid: undefined });
        return;
      }

      try {
        const res = await fetch('/api/daily-streak', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'x-user-fid': context.user.fid.toString(),
          },
        });
        if (res.ok) {
          const data = await res.json();
          setStreak({ ...data, fid: context.user.fid });
        } else {
          console.error(
            'Failed to fetch daily streak:',
            res.status,
            res.statusText
          );
          // Set a default streak to prevent infinite loop
          setStreak({ streak: 0, claimed: true, fid: context.user.fid });
        }
      } catch (err) {
        console.error('Failed to fetch daily streak', err);
        // Set a default streak to prevent infinite loop
        setStreak({ streak: 0, claimed: true, fid: context.user.fid });
      }
    };

    // Fetch streak if we have a user and either:
    // 1. No streak data yet, or
    // 2. The current streak belongs to a different FID
    if (
      user &&
      context?.user?.fid &&
      (!streak || streak.fid !== context?.user?.fid)
    ) {
      fetchStreak();
    }
  }, [user, streak, context?.user?.fid]);

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
            if (!context?.user?.fid) {
              console.error('No user FID available for claiming streak');
              return;
            }

            try {
              const response = await fetch('/api/daily-streak', {
                method: 'PUT',
                headers: {
                  'Content-Type': 'application/json',
                  'x-user-fid': context.user.fid.toString(),
                },
              });

              if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                console.error(
                  'Failed to claim streak:',
                  response.status,
                  response.statusText,
                  errorData
                );
                return;
              }

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
