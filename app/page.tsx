'use client';

import { sdk } from '@farcaster/frame-sdk';
import { useEffect, useState } from 'react';
import { useAccount } from 'wagmi';
import { Header } from './components/header';
import { BuildsView } from './components/BuildsView';

export default function App() {
  const [isReady, setIsReady] = useState(false);
  const [context, setContext] = useState<any>(null);
  const { address } = useAccount();
  const { isConnected } = useAccount();

  console.log('address', address);
  console.log('isConnected', isConnected);

  useEffect(() => {
    const initializeFrame = async () => {
      try {
        // Get context from SDK
        const frameContext = sdk.context;
        setContext(frameContext);

        // Mark frame as ready
        await sdk.actions.ready();
        setIsReady(true);
      } catch (error) {
        console.error('Failed to initialize frame:', error);
      }
    };

    initializeFrame();
  }, []);

  useEffect(() => {
    const handleAddFrame = async () => {
      if (context && !context.client?.added) {
        try {
          await sdk.actions.addFrame();
        } catch (error) {
          console.error('Failed to add frame:', error);
        }
      }
    };

    handleAddFrame();
  }, [context]);

  useEffect(() => {
    const saveUser = async () => {
      if (context) {
        console.log('context', context);
        const user = context.user;
        console.log('user', user);

        // Only proceed if all required fields are present
        if (user.fid && user.displayName && user.pfpUrl && user.username) {
          const userData = {
            fid: user.fid,
            name: user.displayName,
            pfp: user.pfpUrl,
            username: user.username,
          };
          console.log('userData', userData);

          // Call the API endpoint to upsert user data
          await fetch('/api/users', {
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
      <div className="container mx-auto px-4 py-12 max-w-6xl pt-20">
        <BuildsView />
      </div>
    </div>
  );
}
