'use client';

import { useEffect } from 'react';
import { useAccount } from 'wagmi';
import { useFarcasterContext } from '@/hooks/useFarcasterContext';
import { trackGameEvent, identifyUser, setUserProperties } from '@/lib/posthog';
import { setSentryUser, sentryTracker } from '@/lib/sentry';

export function AppInit() {
  const { context, isReady } = useFarcasterContext({ autoAddFrame: true });
  const { address } = useAccount();

  useEffect(() => {
    const saveUser = async () => {
      if (!context || !address) {
        return;
      }

      const user = context.user;

      if (
        user &&
        user.fid &&
        user.displayName &&
        user.pfpUrl &&
        user.username
      ) {
        const userData = {
          fid: user.fid,
          name: user.displayName,
          pfp: user.pfpUrl,
          username: user.username,
          wallet_address: address,
        };

        trackGameEvent.userLogin(user.fid, user.username, address);

        identifyUser(user.fid.toString(), {
          username: user.username,
          display_name: user.displayName,
          pfp_url: user.pfpUrl,
          wallet_address: address,
        });

        setUserProperties({
          fid: user.fid,
          username: user.username,
          display_name: user.displayName,
          has_wallet: !!address,
        });

        setSentryUser({
          id: user.fid.toString(),
          username: user.username,
          fid: user.fid,
          wallet_address: address,
        });

        const params = new URLSearchParams(window.location.search);
        const sharerFidParam = params.get('fid');

        const sharerFid = sharerFidParam ? Number(sharerFidParam) : null;
        const isValidSharerFid =
          sharerFid &&
          !isNaN(sharerFid) &&
          Number.isInteger(sharerFid) &&
          sharerFid > 0;

        let isNewPlayer = false;
        let playerDataSaved = false;

        try {
          const response = await fetch('/api/players?includeNewFlag=true', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(userData),
          });

          if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
          }

          const result = await response.json();
          isNewPlayer = result.isNew;
          playerDataSaved = true;
        } catch (error) {
          const errorMessage =
            error instanceof Error ? error.message : 'Unknown error';
          trackGameEvent.error('api_error', 'Failed to save user data', {
            error: errorMessage,
          });
          sentryTracker.apiError(
            error instanceof Error ? error : new Error(errorMessage),
            {
              endpoint: '/api/players',
              method: 'POST',
            }
          );
          isNewPlayer = false;
        }

        if (
          isNewPlayer &&
          playerDataSaved &&
          isValidSharerFid &&
          sharerFid !== user.fid
        ) {
          try {
            const response = await fetch('/api/referral', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                sharerFid: sharerFid,
                playerFid: user.fid,
              }),
            });

            if (!response.ok) {
              throw new Error(
                `HTTP ${response.status}: ${response.statusText}`
              );
            }
          } catch (error) {
            const errorMessage =
              error instanceof Error ? error.message : 'Unknown error';
            trackGameEvent.error('api_error', 'Failed to process referral', {
              error: errorMessage,
            });
            sentryTracker.apiError(
              error instanceof Error ? error : new Error(errorMessage),
              {
                endpoint: '/api/referral',
                method: 'POST',
              }
            );
          }
        }
      } else {
        console.warn('Missing required user data fields');
        trackGameEvent.error(
          'authentication_error',
          'Missing required user data fields'
        );
        sentryTracker.authError('Missing required user data fields', {
          fid: user?.fid,
          username: user?.username,
        });
      }
    };

    saveUser().catch((error) => {
      sentryTracker.authError(
        error instanceof Error ? error : new Error('Failed to save user'),
        {
          fid: context?.user?.fid,
          username: context?.user?.username,
        }
      );
    });
  }, [context, address]);

  if (!isReady) {
    return (
      <div className="fixed inset-0 z-50 bg-gray-900 flex items-center justify-center">
        <div className="flex flex-col items-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-2 border-gray-600 border-t-purple-500"></div>
          <div className="text-gray-300">Loading...</div>
        </div>
      </div>
    );
  }

  return null;
}
