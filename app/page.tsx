'use client';

import { useMiniKit, useAddFrame } from '@coinbase/onchainkit/minikit';
import { useEffect } from 'react';
import { useAccount, useConnect } from 'wagmi';
import { Header } from './components/header';
import { BuildsView } from './components/BuildsView';

export default function App() {
  const { setFrameReady, isFrameReady, context } = useMiniKit();
  const { address } = useAccount();
  const { isConnected } = useAccount();
  const { connectors, connect } = useConnect();

  console.log('address', address);
  console.log('isConnected', isConnected);

  const addFrame = useAddFrame();

  useEffect(() => {
    if (!isFrameReady) {
      setFrameReady();
    }
  }, [setFrameReady, isFrameReady]);

  useEffect(() => {
    if (!context?.client?.added) {
      (async () => {
        await addFrame();
      })();
    }
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

  return (
    <div className="max-w-md mx-auto bg-white min-h-screen flex flex-col">
      <Header />
      <div className="container mx-auto px-4 py-12 max-w-6xl pt-20">
        {!isConnected ? (
          <div className="flex flex-col items-center justify-center space-y-12">
            <div className="space-y-4 text-center">
              <h1 className="text-5xl font-light tracking-tight">
                Play Mini Games
              </h1>
              <p className="text-xl text-gray-600 max-w-2xl font-light">
                Connect your wallet to start your gaming adventure
              </p>
            </div>

            <button
              onClick={() => connect({ connector: connectors[0] })}
              className="px-8 py-4 text-base font-medium bg-gray-900 text-white rounded-full hover:bg-gray-800 transition-colors duration-200 shadow-sm hover:shadow-md"
            >
              Connect Wallet
            </button>

            <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-8 w-full">
              <div className="p-8 rounded-2xl bg-white border border-gray-200 hover:border-gray-300 transition-all duration-300 shadow-sm hover:shadow-md">
                <h3 className="text-xl font-medium mb-3">Play Games</h3>
                <p className="text-gray-600 leading-relaxed">
                  Access exclusive mini-games in the Farcaster ecosystem
                </p>
              </div>
              <div className="p-8 rounded-2xl bg-white border border-gray-200 hover:border-gray-300 transition-all duration-300 shadow-sm hover:shadow-md">
                <h3 className="text-xl font-medium mb-3">Earn Rewards</h3>
                <p className="text-gray-600 leading-relaxed">
                  Win prizes and collect unique digital assets
                </p>
              </div>
              <div className="p-8 rounded-2xl bg-white border border-gray-200 hover:border-gray-300 transition-all duration-300 shadow-sm hover:shadow-md">
                <h3 className="text-xl font-medium mb-3">Join Community</h3>
                <p className="text-gray-600 leading-relaxed">
                  Connect with other players and share your achievements
                </p>
              </div>
            </div>
          </div>
        ) : (
          <BuildsView />
        )}
      </div>
    </div>
  );
}
