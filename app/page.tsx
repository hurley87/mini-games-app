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
    return <div>Loading...</div>;
  }

  return (
    <div className="max-w-md mx-auto bg-white min-h-screen flex flex-col">
      <Header />
      <CoinsList />
    </div>
  );
}
