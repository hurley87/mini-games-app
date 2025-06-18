'use client';

import { useEffect, useRef } from 'react';
import { useAccount } from 'wagmi';
import { useFarcasterContext } from '@/hooks/useFarcasterContext';
import {
  trackGameEvent,
  identifyUser,
  setUserProperties,
  trackEvent,
} from '@/lib/posthog';
import { setSentryUser, sentryTracker } from '@/lib/sentry';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { sdk } from '@farcaster/frame-sdk';

export function AppInit() {
  const { context, isReady } = useFarcasterContext({ autoAddFrame: true });

  console.log('context', context);
  console.log('isReady', isReady);

  const { address } = useAccount();

  console.log('address', address);

  // Avoid triggering the saveUser routine multiple times which can lead to 429 errors
  // Keep track of the last user that was persisted so we do not spam the endpoint
  const hasPersistedRef = useRef<{
    fid: number;
    wallet: string;
  } | null>(null);

  useEffect(() => {
    const saveUser = async () => {
      // Ensure we have the required data before continuing
      if (!context?.user) {
        return;
      }

      // Skip if this user/wallet combination has already been persisted in this session
      if (
        hasPersistedRef.current?.fid === context.user.fid &&
        hasPersistedRef.current?.wallet === address
      ) {
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
          const response = await sdk.quickAuth.fetch(
            '/api/players?includeNewFlag=true',
            {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify(userData),
            }
          );

          console.log('response', response);

          if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
          }

          const result = await response.json();
          isNewPlayer = result.isNew;
          playerDataSaved = true;

          // Update user properties with new player status
          setUserProperties({
            fid: user.fid,
            username: user.username,
            display_name: user.displayName,
            has_wallet: !!address,
            is_new_player: isNewPlayer,
          });
        } catch (error) {
          if (
            error instanceof TypeError &&
            error.message.includes('Load failed')
          ) {
            const errorMessage = `Farcaster authentication failed. This may be due to a network issue or a browser extension blocking the request. Please check your connection and try again. Details: ${error.message}`;
            console.error(errorMessage);
            trackEvent('farcaster_auth_failed', {
              fid: user.fid,
              wallet_address: address,
              error: error.message,
            });
            sentryTracker.authError(errorMessage, {
              fid: user?.fid,
              username: user?.username,
            });
          } else if (
            error instanceof Error &&
            (error.message.includes('SignIn.RejectedByUser') ||
              error.message.includes('user_rejected_request'))
          ) {
            trackEvent('sign_in_rejected', {
              fid: user.fid,
              wallet_address: address,
            });
          } else {
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
          }
          isNewPlayer = false;
        }

        // Mark as persisted to avoid duplicate requests regardless of success or failure
        hasPersistedRef.current = {
          fid: user.fid,
          wallet: address || '',
        };

        console.log('isNewPlayer', isNewPlayer);
        console.log('playerDataSaved', playerDataSaved);
        console.log('isValidSharerFid', isValidSharerFid);

        if (isNewPlayer && playerDataSaved && isValidSharerFid) {
          if (sharerFid !== user.fid) {
            try {
              const response = await sdk.quickAuth.fetch('/api/referral', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  sharerFid: sharerFid,
                  playerFid: user.fid,
                }),
              });

              if (response.ok) {
                // Track successful referral
                trackEvent('referral_success', {
                  sharer_fid: sharerFid,
                  player_fid: user.fid,
                });
              } else {
                const errorData = await response.json();
                throw new Error(errorData.error || `HTTP ${response.status}`);
              }
            } catch (error) {
              const errorMessage =
                error instanceof Error ? error.message : 'Unknown error';
              trackGameEvent.error(
                'referral_error',
                'Failed to process referral',
                {
                  error: errorMessage,
                  sharer_fid: sharerFid,
                  player_fid: user.fid,
                }
              );
              sentryTracker.apiError(
                error instanceof Error ? error : new Error(errorMessage),
                {
                  endpoint: '/api/referral',
                  method: 'POST',
                }
              );
            }
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

    if (context) {
      saveUser();
    }
  }, [context, address]);

  if (!isReady) {
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
