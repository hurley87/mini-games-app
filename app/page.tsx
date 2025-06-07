'use client';

import { useEffect } from 'react';
import { useAccount } from 'wagmi';
import { Header } from './components/header';
import { useFarcasterContext } from '@/hooks/useFarcasterContext';
import { CoinsList } from './components/coins-list';

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

          console.log('userData', userData);

          // Call the API endpoint to upsert user data
          await fetch('/api/players', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(userData),
          });
        } else {
          console.warn('Missing required user data fields');
        }
      }
    };

    saveUser();
  }, [context]);

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
