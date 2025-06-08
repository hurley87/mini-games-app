'use client';

import { useEffect } from 'react';
import { useAccount } from 'wagmi';
import { Header } from './components/header';
import { useFarcasterContext } from '@/hooks/useFarcasterContext';
import { CoinsList } from './components/coins-list';
import { trackGameEvent, identifyUser, setUserProperties } from '@/lib/posthog';
import { setSentryUser, sentryTracker } from '@/lib/sentry';

export default function App() {
  const { context, isReady } = useFarcasterContext({
    autoAddFrame: true,
  });
  const { address } = useAccount();

  useEffect(() => {
    const saveUser = async () => {
      if (context) {
        const user = context.user;

        // Only proceed if user exists and all required fields are present
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

          const params = new URLSearchParams(window.location.search);
          const sharerFidParam = params.get('fid');
          let isNewPlayer = false;

          try {
            const existsRes = await fetch(`/api/player/${user.fid}/rank`);
            if (existsRes.status === 404) {
              isNewPlayer = true;
            }
          } catch (error) {
            console.error('Failed to check player existence:', error);
          }

          console.log('userData', userData);

          // Track user login event
          trackGameEvent.userLogin(user.fid, user.username, address);

          // Identify user in PostHog
          identifyUser(user.fid.toString(), {
            username: user.username,
            display_name: user.displayName,
            pfp_url: user.pfpUrl,
            wallet_address: address,
          });

          // Set user properties
          setUserProperties({
            fid: user.fid,
            username: user.username,
            display_name: user.displayName,
            has_wallet: !!address,
          });

          // Set Sentry user context
          setSentryUser({
            id: user.fid.toString(),
            username: user.username,
            fid: user.fid,
            wallet_address: address,
          });

          // Call the API endpoint to upsert user data
          try {
            await fetch('/api/players', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify(userData),
            });

            if (
              isNewPlayer &&
              sharerFidParam &&
              Number(sharerFidParam) !== user.fid
            ) {
              await fetch('/api/referral', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  sharerFid: Number(sharerFidParam),
                  playerFid: user.fid,
                }),
              });
            }
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
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="flex flex-col items-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-2 border-gray-600 border-t-purple-500"></div>
          <div className="text-gray-300">Loading...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto bg-gray-900 min-h-screen flex flex-col">
      <Header />
      <CoinsList />
    </div>
  );
}
