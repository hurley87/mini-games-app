'use client';

import { useSignIn } from '@/hooks/use-sign-in';
import type { ReactNode } from 'react';
import { LoadingSpinner } from './ui/loading-spinner';

interface AppInitProps {
  children: ReactNode;
}

export function AppInit({ children }: AppInitProps) {
  const { isLoading, error, user } = useSignIn({
    autoSignIn: true,
    onSuccess: (user) => {
      console.log('User signed in successfully:', user.username);
    },
  });

  console.log('user', user);

  // Show loading state while signing in
  if (isLoading) {
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

  if (!isLoading && !user) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-white/70">
          The games are only available to users on Farcaster.
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
