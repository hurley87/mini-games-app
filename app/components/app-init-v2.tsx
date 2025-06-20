'use client';

import { useEffect } from 'react';
import { useAccount } from 'wagmi';
import { useAuthContext } from '@/lib/auth-context';
import { useUpdateUser } from '@/lib/auth';
import {
  trackGameEvent,
  identifyUser,
  setUserProperties,
  trackEvent,
} from '@/lib/posthog';
import { setSentryUser, sentryTracker } from '@/lib/sentry';
import { LoadingSpinner } from '@/components/ui/loading-spinner';

export function AppInitV2() {
  const { user, isAuthenticated, isLoading, error } = useAuthContext();
  const { address } = useAccount();
  const updateUserMutation = useUpdateUser();

  // Update user with wallet address when it becomes available
  useEffect(() => {
    if (isAuthenticated && user && address && !user.wallet_address) {
      updateUserMutation.mutate({
        ...user,
        wallet_address: address,
      });
    }
  }, [isAuthenticated, user, address, updateUserMutation]);

  // Analytics and monitoring setup
  useEffect(() => {
    if (isAuthenticated && user) {
      // PostHog identification
      identifyUser(user.fid.toString(), {
        username: user.username,
        display_name: user.displayName,
        pfp_url: user.pfpUrl,
        wallet_address: address,
      });

      // Sentry user context
      setSentryUser({
        id: user.fid.toString(),
        username: user.username,
        fid: user.fid,
        wallet_address: address,
      });

      // Track login event
      trackGameEvent.userLogin(user.fid, user.username, address);

      // Set user properties
      setUserProperties({
        fid: user.fid,
        username: user.username,
        display_name: user.displayName,
        has_wallet: !!address,
        is_new_player: false, // This would come from the API response
      });
    }
  }, [isAuthenticated, user, address]);

  // Handle auth errors
  useEffect(() => {
    if (error) {
      console.error('Authentication error:', error);
      trackEvent('auth_error', {
        error: error,
      });
      sentryTracker.authError(error, {
        fid: user?.fid,
        username: user?.username,
      });
    }
  }, [error, user]);

  if (isLoading) {
    return (
      <div className="fixed inset-0 z-50 bg-black flex items-center justify-center">
        <div className="flex flex-col items-center space-y-4">
          <LoadingSpinner />
          <div className="text-white/70">Loading...</div>
        </div>
      </div>
    );
  }

  return null;
}